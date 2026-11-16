"""Dead-air removal ("jump cuts"): drop pauses longer than ~0.7s so the clip never drags.
Uses ffmpeg's silencedetect on just the clip's audio (fast). Returns the ranges to KEEP.
"""
from __future__ import annotations

import re
import subprocess


def keep_ranges(video: str, start: float, end: float, noise_db: float = -35.0, min_silence: float = 0.7,
                pad: float = 0.12, protect: tuple[float, float] | None = None,
                min_keep: float = 12.0) -> list[tuple[float, float]]:
    """Ranges relative to `start`. `protect` (relative) is never cut (e.g. the peak reaction)."""
    p = subprocess.run(["ffmpeg", "-v", "info", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(video),
                        "-vn", "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", p.stderr)]
    total = end - start
    cuts = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else total
        a, b = max(0.0, s + pad), min(total, e - pad)
        if protect and not (b <= protect[0] or a >= protect[1]):
            continue
        if b - a >= 0.3:
            cuts.append((a, b))
    keep, t = [], 0.0
    for a, b in cuts:
        if a > t:
            keep.append((t, a))
        t = b
    if t < total:
        keep.append((t, total))
    keep = [(a, b) for a, b in keep if b - a > 0.15]
    removed = total - sum(b - a for a, b in keep)
    kept = total - removed
    if not keep or removed < 0.8 or len(keep) > 14 or kept < min_keep:   # not worth it / too choppy / too short
        return [(0.0, total)]
    return keep


def remap(t: float, keep: list[tuple[float, float]]) -> float | None:
    """Original (relative) time -> time in the cut clip, None if it was removed."""
    acc = 0.0
    for a, b in keep:
        if a <= t <= b:
            return acc + (t - a)
        acc += b - a
    return None
