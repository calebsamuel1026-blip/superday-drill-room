"""Fuse all signals into ranked candidate moments with clip boundaries."""
from __future__ import annotations

import numpy as np

from .config import settings
from .models import ChatMessage, Moment, Segment
from .signals.chat import chat_curve, dominant_tags


def _align(curve: np.ndarray | None, n: int) -> np.ndarray:
    if curve is None:
        return np.zeros(n)
    if len(curve) >= n:
        return curve[:n]
    return np.pad(curve, (0, n - len(curve)))


def find_moments(duration: float, chat: list[ChatMessage] | None = None,
                 audio_z: np.ndarray | None = None, heat_z: np.ndarray | None = None,
                 kw_z: np.ndarray | None = None, language: str | None = None,
                 segments: list[Segment] | None = None, limit: int | None = None) -> list[Moment]:
    cfg = settings()["detection"]
    w = cfg["weights"]
    n = int(duration) + 1
    delay = int(cfg["chat_delay_seconds"])

    chat_z = np.zeros(n)
    tags = None
    mps = np.zeros(n)
    if chat:
        z, _, tags, mps = chat_curve(chat, duration, language, cfg["smooth_seconds"],
                                     cfg["baseline_window_seconds"])
        # shift chat back in time: chat reacts AFTER the moment
        chat_z = np.concatenate([z[delay:], np.zeros(delay)])[:n]

    a = _align(audio_z, n)
    h = _align(heat_z, n)
    k = _align(kw_z, n)
    fused = (w["chat"] * np.clip(chat_z, -2, 12) + w["audio"] * np.clip(a, -2, 6)
             + w["heatmap"] * np.clip(h, -2, 6) + w["keywords"] * np.clip(k, -2, 6))
    active = sum(1 for c, wt in ((chat, w["chat"]), (audio_z, w["audio"]),
                                 (heat_z, w["heatmap"]), (kw_z, w["keywords"])) if c is not None)
    if active == 0:
        return []

    # smooth fused curve a little so a single noisy second doesn't win
    fused = np.convolve(fused, np.ones(3) / 3, mode="same")

    # threshold: spike_z on chat alone, scaled when we only have weaker signals
    thr = cfg["spike_z"] * (w["chat"] if chat else max(w["audio"], w["heatmap"]))
    gap = cfg["min_gap_seconds"]
    order = np.argsort(-fused)
    picked: list[int] = []
    for i in order:
        if fused[i] < thr * 0.6 and picked:
            break
        if any(abs(i - p) < gap for p in picked):
            continue
        picked.append(int(i))
        if len(picked) >= (limit or max(3, int(cfg["candidates_per_hour"] * duration / 3600) + 3)):
            break

    moments = []
    for p in picked:
        # onset = walk back while the curve is still clearly above baseline
        s = p
        while s > 0 and fused[s - 1] > 0.8 and p - s < 40:
            s -= 1
        e = p
        while e < n - 1 and fused[e + 1] > 1.2 and e - p < 20:
            e += 1
        start = max(0.0, s - cfg["pre_roll_seconds"])
        end = min(duration, e + cfg["post_roll_seconds"])
        if end - start < cfg["min_clip_seconds"]:
            pad = (cfg["min_clip_seconds"] - (end - start)) / 2
            start, end = max(0.0, start - pad), min(duration, end + pad)
        if end - start > cfg["max_clip_seconds"]:
            start = max(0.0, p - cfg["max_clip_seconds"] * 0.7)
            end = min(duration, start + cfg["max_clip_seconds"])

        sig = {
            "fused": round(float(fused[p]), 2),
            "chat_z": round(float(chat_z[p]), 2),
            "audio_z": round(float(a[p]), 2),
            "heatmap_z": round(float(h[p]), 2),
            "keyword_z": round(float(k[p]), 2),
        }
        sample = []
        if chat:
            lo, hi = p + delay - 4, p + delay + 10
            sample = [m.text for m in chat if lo <= m.t <= hi][:60]
            sig["chat_tags"] = dominant_tags(tags, lo, hi)
            sig["msgs_per_sec_peak"] = float(mps[max(0, p + delay - 3):p + delay + 8].max(initial=0))
            sig["msgs_per_sec_baseline"] = round(float(np.median(mps[max(0, p - 300):max(1, p - 20)])), 2)
        text = ""
        if segments:
            text = " ".join(sg.text for sg in segments if sg.end >= start and sg.start <= end)
        moments.append(Moment(start=round(start, 2), end=round(end, 2), peak=float(p),
                              score=float(fused[p]), signals=sig, chat_sample=sample,
                              transcript=text))
    moments.sort(key=lambda m: -m.score)
    return moments
