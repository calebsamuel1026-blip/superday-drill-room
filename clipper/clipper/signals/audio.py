"""Audio excitement: loudness per second (screams, explosions, music drops)."""
from __future__ import annotations

import subprocess

import numpy as np

from .chat import robust_z

SR = 8000


def loudness_curve(video_path: str, duration: float, baseline: int = 300) -> np.ndarray:
    """Per-second RMS loudness in dB, converted to a robust z-score."""
    cmd = ["ffmpeg", "-v", "error", "-i", video_path, "-vn", "-ac", "1", "-ar", str(SR),
           "-f", "s16le", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = int(duration) + 1
    db = np.full(n, -60.0)
    i = 0
    while True:
        buf = proc.stdout.read(SR * 2)
        if not buf:
            break
        x = np.frombuffer(buf, dtype=np.int16).astype(np.float32) / 32768.0
        if i < n:
            rms = float(np.sqrt(np.mean(x * x))) if len(x) else 0.0
            db[i] = 20 * np.log10(max(rms, 1e-4))
        i += 1
    proc.wait()
    # also reward sudden jumps (a scream after silence is more "clip" than a constant shout)
    jump = np.clip(np.diff(db, prepend=db[0]), 0, None)
    return robust_z(db + 0.5 * jump, baseline)
