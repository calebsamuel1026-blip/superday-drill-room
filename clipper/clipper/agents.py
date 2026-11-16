"""The 24/7 agent team. `python -m clipper autopilot` starts the supervisor, which runs:

  SCOUT    (light)  finds work: who's live on GTA 6, new VODs, campaign videos, reaction videos
                    when queues run low -> puts jobs in the queue (sqlite `jobs` table).
                    Starts a LIVE agent per live top streamer (max autopilot.live_max_concurrent).
  CLIPPER  (heavy)  takes the highest-priority job, downloads only the needed sections, asks the
                    Claude agent to pick + package moments, renders clips for every account.
                    ONE job at a time, low CPU priority, 2 threads, pauses while your computer is busy.
  POSTER   (light)  posts to every connected account at the max safe cadence, pulls metrics,
                    runs the daily learning pass.
  LIVE x0-2         real-time chat-spike clipping for streamers who are live right now.

The supervisor restarts any agent that dies. Logs: logs/<agent>.log
"""
from __future__ import annotations

import os
import subprocess
import sys
import time
import traceback
from datetime import datetime

from .config import ROOT, settings

LOG_DIR = ROOT / "logs"
ROLES = ("scout", "clipper", "poster")


def log(role: str, msg: str):
    LOG_DIR.mkdir(exist_ok=True)
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S} [{role}] {msg}"
    print(line, flush=True)
    with open(LOG_DIR / "autopilot.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def _cfg() -> dict:
    from .autopilot import _cfg as base
    return base()


def _safe(role: str, name: str, fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except Exception as e:  # noqa: BLE001
        log(role, f"{name} ERROR {e}")
        with open(LOG_DIR / "errors.log", "a", encoding="utf-8") as f:
            f.write(f"--- {datetime.now()} {role}/{name}\n{traceback.format_exc()}\n")


def _lower_priority(niceness: int):
    try:
        os.nice(niceness)                     # macOS / Linux
    except (AttributeError, OSError):
        try:                                  # Windows
            import psutil
            psutil.Process().nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
        except Exception:  # noqa: BLE001
            pass


def system_load() -> float:
    """0..1 share of all CPU cores in use (1-minute average)."""
    try:
        return os.getloadavg()[0] / (os.cpu_count() or 1)
    except (AttributeError, OSError):
        try:
            import psutil
            return psutil.cpu_percent(interval=1) / 100
        except Exception:  # noqa: BLE001
            return 0.0


# ─────────────────────────── SCOUT ───────────────────────────

def scout():
    from . import campaigns, db
    from .autopilot import LiveManager, queue_sizes
    from .cli import campaign_discover, cmd_discover, cmd_seed
    cfg = _cfg()
    live = LiveManager()
    last = {"live": 0.0, "vod": 0.0, "seed": 0.0}
    log("scout", "started")
    try:
        while True:
            now = time.time()
            if now - last["live"] >= cfg["live_check_minutes"] * 60:
                last["live"] = now
                _safe("scout", "live", live.check, cfg)
            if now - last["vod"] >= cfg["vod_every_minutes"] * 60:
                last["vod"] = now
                n = 0
                for c in campaigns.active():
                    for v in _safe("scout", "campaign", campaign_discover, c) or []:
                        n += db.enqueue(v["url"], "campaign", 100 + 10 * float(c.get("cpm_usd") or 0),
                                        campaign_id=c["id"])
                for v in _safe("scout", "discover", cmd_discover, 8, True) or []:
                    n += db.enqueue(v["url"], "vod", 50 + 3 * v["priority"], streamer_id=v["streamer"])
                log("scout", f"queued {n} new VOD/campaign jobs")
            q = queue_sizes()
            low = [a for a, k in q.items() if k < cfg["seed_when_queue_below"]]
            if low and db.pending_jobs() < 3 and now - last["seed"] >= cfg["seed_every_minutes"] * 60:
                last["seed"] = now
                langs = sorted({settings()["accounts"][a]["language"] for a in low})
                picks = _safe("scout", "seed", cmd_seed, langs, 6, True, cfg["seed_videos_per_run"]) or []
                n = sum(db.enqueue(v["url"], "seed", 10 + st.get("priority", 5), streamer_id=st["id"])
                        for st, v in picks)
                log("scout", f"queue low {q} -> queued {n} reaction videos ({langs})")
            time.sleep(60)
    finally:
        live.stop()


# ─────────────────────────── CLIPPER ───────────────────────────

def clipper():
    from . import db
    from .pipeline import process_url
    cfg = _cfg()
    _lower_priority(int(cfg.get("niceness", 15)))
    log("clipper", "started (low priority, one job at a time)")
    while True:
        while system_load() > float(cfg.get("polite_max_load", 0.6)):
            time.sleep(30)                    # you're using the computer -> wait
        job = db.next_job()
        if not job:
            time.sleep(30)
            continue
        log("clipper", f"job {job['id']} [{job['kind']}] {job['url']}")
        t0 = time.time()
        try:
            ids = process_url(job["url"], max_clips=3 if job["kind"] == "seed" else 6,
                              campaign_id=job["campaign_id"], streamer_id=job["streamer_id"])
            db.finish_job(job["id"], "done", f"{len(ids or [])} clips")
            log("clipper", f"job {job['id']} done: {len(ids or [])} clips in {time.time() - t0:.0f}s")
        except Exception as e:  # noqa: BLE001
            db.finish_job(job["id"], "failed", str(e))
            log("clipper", f"job {job['id']} FAILED {str(e)[:150]}")
            with open(LOG_DIR / "errors.log", "a", encoding="utf-8") as f:
                f.write(f"--- {datetime.now()} clipper job {job['id']}\n{traceback.format_exc()}\n")


# ─────────────────────────── POSTER ───────────────────────────

def poster():
    from .pipeline import have_agent
    from .poster import collect_metrics, post
    cfg = _cfg()
    last = {"metrics": 0.0, "learn": time.time()}
    log("poster", "started")
    while True:
        now = time.time()
        _safe("poster", "post", post)
        if now - last["metrics"] >= cfg["metrics_every_minutes"] * 60:
            last["metrics"] = now
            _safe("poster", "metrics", collect_metrics)
        if have_agent() and now - last["learn"] >= cfg["learn_every_hours"] * 3600:
            last["learn"] = now
            _safe("poster", "learn", subprocess.run, [sys.executable, "-m", "clipper", "learn"], cwd=str(ROOT))
        time.sleep(5 * 60)


# ─────────────────────────── SUPERVISOR ───────────────────────────

def supervisor():
    from .pipeline import have_agent
    LOG_DIR.mkdir(exist_ok=True)
    log("supervisor", "starting agent team: " + ", ".join(ROLES)
        + ("" if have_agent() else "  (no ANTHROPIC_API_KEY: signal-only ranking)"))
    procs: dict[str, subprocess.Popen] = {}
    restarts: dict[str, list[float]] = {r: [] for r in ROLES}
    try:
        while True:
            for role in ROLES:
                p = procs.get(role)
                if p and p.poll() is None:
                    continue
                if p:
                    log("supervisor", f"{role} exited ({p.returncode}) — restarting")
                restarts[role] = [t for t in restarts[role] if time.time() - t < 600] + [time.time()]
                if len(restarts[role]) > 5:
                    log("supervisor", f"{role} keeps crashing — waiting 5 min (see logs/{role}.log)")
                    time.sleep(300)
                    restarts[role] = []
                out = open(LOG_DIR / f"{role}.log", "a", encoding="utf-8")
                procs[role] = subprocess.Popen([sys.executable, "-m", "clipper", "agent", role],
                                               cwd=str(ROOT), stdout=out, stderr=subprocess.STDOUT)
            time.sleep(20)
    except KeyboardInterrupt:
        log("supervisor", "stopping agents")
    finally:
        for p in procs.values():
            p.terminate()


def run_role(role: str):
    {"scout": scout, "clipper": clipper, "poster": poster}[role]()
