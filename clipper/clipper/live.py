"""LIVE mode: watch a Twitch channel's chat in real time, clip the second it explodes.

    python -m clipper watch kaicenat

Keeps a rolling 10-minute recording of the stream; computes the same chat-spike score as
VOD mode every 2 seconds; on a spike waits for the reaction to finish, cuts the buffer and
runs the clip through the agent + renderer for every matching account. Clips are ready
~1-2 minutes after the moment — before most clippers have even downloaded the VOD.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np

from .config import settings, streamers
from .models import ChatMessage
from .signals.chat import _rules, robust_z, score_message
from .sources.twitch import HlsBuffer, LiveChat


def _find_streamer(channel: str) -> dict | None:
    for s in streamers().values():
        if (s.get("handles") or {}).get("twitch", "").lower() == channel.lower():
            return s
    return None


def watch(channel: str, cooldown: int = 75, dry_run: bool = False):
    from .pipeline import process_local
    cfg = settings()["detection"]
    st = _find_streamer(channel)
    lang = (st or {}).get("language")
    rules = _rules(lang)
    work = Path(settings()["workdir"]) / f"live_{channel}"
    chat = LiveChat(channel)
    chat.start()
    buf = None
    if not dry_run:
        buf = HlsBuffer(f"https://www.twitch.tv/{channel}", work / "buffer")
        buf.start()
    print(f"[live] watching #{channel} (streamer={st and st['id']}, lang={lang}). Ctrl+C to stop.")
    t0 = time.time()
    last_clip = 0.0
    try:
        while True:
            time.sleep(2)
            if buf and buf.proc and buf.proc.poll() is not None:
                print("\n[live] stream ended — stopping watcher")
                break
            now = time.time()
            msgs = [m for m in list(chat.messages) if m[0] >= now - 900]
            n = int(now - max(t0, now - 900)) + 1
            if n < 120 or not msgs:
                continue
            base = now - n + 1
            curve = np.zeros(n)
            seen = set()
            for ts, author, text in msgs:
                i = int(ts - base)
                if 0 <= i < n and (i, author) not in seen:
                    seen.add((i, author))
                    curve[i] += score_message(text, rules)[0]
            sm = np.convolve(curve, np.ones(cfg["smooth_seconds"]) / cfg["smooth_seconds"], mode="same")
            z = robust_z(sm, cfg["baseline_window_seconds"])
            cur = float(z[-6:-2].max())
            mps = len([m for m in msgs if m[0] >= now - 5]) / 5
            print(f"\r[live] chat z={cur:5.1f}  msgs/s={mps:5.1f}   ", end="", flush=True)
            if cur < cfg["spike_z"] or now - last_clip < cooldown:
                continue
            # spike! let the reaction play out, then cut
            peak_wall = now - 4
            print(f"\n[live] SPIKE z={cur:.1f} at {time.strftime('%H:%M:%S')} — waiting for reaction to finish")
            time.sleep(cfg["post_roll_seconds"] + 4)
            last_clip = time.time()
            event = peak_wall - cfg["chat_delay_seconds"]
            a, b = event - cfg["pre_roll_seconds"] - 6, time.time()
            sample = [(ts - a, au, tx) for ts, au, tx in chat.messages if a <= ts <= b]
            stamp = time.strftime("%Y%m%d_%H%M%S")
            if dry_run:
                print(f"[live] (dry run) would clip {b - a:.0f}s; sample: {[s[2] for s in sample[-8:]]}")
                continue
            out = work / f"live_{stamp}.mp4"
            try:
                buf.cut(a, b, out)
            except Exception as e:  # noqa: BLE001
                print("[live] cut failed:", e)
                continue
            chat_file = out.with_suffix(".chat.jsonl")
            chat_file.write_text("".join(json.dumps(ChatMessage(t, au, tx).__dict__, ensure_ascii=False) + "\n"
                                         for t, au, tx in sample))
            process_local(str(out), str(chat_file), st and st["id"], lang,
                          title=f"{channel} live {stamp}", max_clips=1)
    except KeyboardInterrupt:
        pass
    finally:
        chat.stop.set()
        if buf:
            buf.close()
