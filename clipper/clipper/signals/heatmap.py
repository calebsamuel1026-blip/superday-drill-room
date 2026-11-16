"""YouTube "Most replayed" heatmap (yt-dlp `heatmap` field) as a per-second curve.

Viewers rewinding to a spot is a strong, already-validated signal that the moment is good.
"""
from __future__ import annotations

import numpy as np


def heatmap_curve(heatmap: list[dict] | None, duration: float) -> np.ndarray | None:
    if not heatmap:
        return None
    n = int(duration) + 1
    y = np.zeros(n)
    for seg in heatmap:
        a, b = int(seg["start_time"]), int(np.ceil(seg["end_time"]))
        y[max(0, a):min(n, b)] = float(seg["value"])
    mu, sd = float(y.mean()), float(y.std()) or 1.0
    return (y - mu) / sd
