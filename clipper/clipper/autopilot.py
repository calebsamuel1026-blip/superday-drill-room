"""Fully automatic mode — one command, runs forever on your computer:

    python -m clipper autopilot          (or double-click start.command / start.bat)

Every few minutes it decides what to do:
  * LIVE      top streamers who are live right now on Twitch get a live chat-spike clipper
              (separate process each, max `live_max_concurrent`), so launch-night moments are
              clipped within ~2 minutes.
  * VODS      new GTA 6 VODs/videos from all streamers in config/streamers.yaml are clipped.
  * CAMPAIGNS joined + active paid campaigns are clipped first.
  * SEED      if an account's queue of unposted clips is running low, it tops it up with
              existing GTA 6 reaction videos (so the accounts keep posting before campaigns).
  * POST      posts inside each account's posting windows, following the ramp-up cadence.
  * METRICS   pulls views every hour; LEARN rewrites streamer notes from results once a day.
Everything is logged to logs/autopilot.log. Ctrl+C to stop; it resumes where it left off.
"""
from __future__ import annotations

import subprocess
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path

from .config import ROOT, settings, streamers

LOG_DIR = ROOT / "logs"


def log(msg: str):
    LOG_DIR.mkdir(exist_ok=True)
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    print(line, flush=True)
    with open(LOG_DIR / "autopilot.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def _cfg() -> dict:
    d = {"cycle_minutes": 10, "vod_every_minutes": 30, "seed_every_minutes": 60, "metrics_every_minutes": 60,
         "learn_every_hours": 24, "live_check_minutes": 5, "live_max_concurrent": 2, "live_top_streamers": 15,
         "seed_when_queue_below": 6, "vods_per_cycle": 4, "seed_videos_per_run": 6}
    d.update(settings().get("autopilot") or {})
    return d


def queue_sizes() -> dict[str, int]:
    from .db import connect
    out = {a: 0 for a in settings()["accounts"]}
    with connect() as con:
        for r in con.execute("SELECT account, COUNT(*) n FROM clips c WHERE NOT EXISTS "
                             "(SELECT 1 FROM posts p WHERE p.clip_id=c.id) AND created_at > ? GROUP BY account",
                             (time.time() - 4 * 86400,)):
            out[r["account"]] = r["n"]
    return out


def is_live(channel: str) -> bool:
    import yt_dlp
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(f"https://www.twitch.tv/{channel}", download=False)
        return bool(info.get("is_live")) and _is_gta6_stream(info)
    except Exception:  # noqa: BLE001  (offline -> yt-dlp raises)
        return False


def _is_gta6_stream(info: dict) -> bool:
    from .sources.youtube import is_gta6
    text = " ".join(str(info.get(k) or "") for k in ("title", "description", "categories", "tags"))
    games = [g.lower() for g in settings()["game_filter"].get("twitch_game_names", [])]
    return is_gta6(text) or any(g in text.lower() for g in games)


class LiveManager:
    def __init__(self):
        self.procs: dict[str, subprocess.Popen] = {}

    def reap(self):
        for ch, p in list(self.procs.items()):
            if p.poll() is not None:
                log(f"[live] {ch} watcher ended (code {p.returncode})")
                del self.procs[ch]

    def check(self, cfg: dict):
        self.reap()
        accs_langs = {a["language"] for a in settings()["accounts"].values()}
        cands = sorted([s for s in streamers().values() if (s.get("handles") or {}).get("twitch")
                        and s["language"] in accs_langs], key=lambda s: -s.get("priority", 5))
        for s in cands[:cfg["live_top_streamers"]]:
            ch = s["handles"]["twitch"]
            if ch in self.procs or len(self.procs) >= cfg["live_max_concurrent"]:
                continue
            if is_live(ch):
                log(f"[live] {s['name']} is LIVE playing GTA 6 -> starting live clipper")
                LOG_DIR.mkdir(exist_ok=True)
                out = open(LOG_DIR / f"live_{ch}.log", "a")
                self.procs[ch] = subprocess.Popen([sys.executable, "-m", "clipper", "watch", ch],
                                                  cwd=str(ROOT), stdout=out, stderr=subprocess.STDOUT)

    def stop(self):
        for p in self.procs.values():
            p.terminate()


def _safe(name: str, fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except Exception as e:  # noqa: BLE001  — never let one failure kill the autopilot
        log(f"[{name}] ERROR {e}")
        with open(LOG_DIR / "errors.log", "a", encoding="utf-8") as f:
            f.write(f"--- {datetime.now()} {name}\n{traceback.format_exc()}\n")


def run():
    from .cli import cmd_campaigns, cmd_discover, cmd_seed
    from .pipeline import have_agent, process_url
    from .poster import collect_metrics, post
    cfg = _cfg()
    log("autopilot started" + ("" if have_agent() else "  (no ANTHROPIC_API_KEY: signal-only ranking)"))
    live = LiveManager()
    last = {"vod": 0.0, "seed": 0.0, "metrics": 0.0, "learn": time.time(), "live": 0.0}
    try:
        while True:
            now = time.time()
            if now - last["live"] >= cfg["live_check_minutes"] * 60:
                last["live"] = now
                _safe("live", live.check, cfg)

            if now - last["vod"] >= cfg["vod_every_minutes"] * 60:
                last["vod"] = now
                _safe("campaigns", cmd_campaigns, "run", None)
                found = _safe("discover", cmd_discover, quiet=True) or []
                for v in sorted(found, key=lambda v: -v["priority"])[:cfg["vods_per_cycle"]]:
                    log(f"[vod] {v['streamer']}: {v['title'][:70]}")
                    _safe("vod", process_url, v["url"], streamer_id=v["streamer"])

            q = queue_sizes()
            low = [a for a, n in q.items() if n < cfg["seed_when_queue_below"]]
            if low and now - last["seed"] >= cfg["seed_every_minutes"] * 60:
                last["seed"] = now
                langs = sorted({settings()["accounts"][a]["language"] for a in low})
                log(f"[seed] queue low for {low} {q} -> clipping GTA 6 reaction videos ({langs})")
                _safe("seed", cmd_seed, langs, 6, False, cfg["seed_videos_per_run"])

            _safe("post", post)

            if now - last["metrics"] >= cfg["metrics_every_minutes"] * 60:
                last["metrics"] = now
                _safe("metrics", collect_metrics)

            if have_agent() and now - last["learn"] >= cfg["learn_every_hours"] * 3600:
                last["learn"] = now
                _safe("learn", subprocess.run, [sys.executable, "-m", "clipper", "learn"], cwd=str(ROOT))

            log(f"[cycle] queue={queue_sizes()} live={list(live.procs)}")
            time.sleep(cfg["cycle_minutes"] * 60)
    except KeyboardInterrupt:
        log("autopilot stopped")
    finally:
        live.stop()


if __name__ == "__main__":
    run()
