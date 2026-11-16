"""Find the streamer's face cam so we can build the standard TikTok clip layout:
cam on top, gameplay underneath.

Samples ~12 frames of the clip at low resolution and runs OpenCV's built-in face
detector (no downloads, ~0.5s per clip on CPU). Decides the layout:
  split      a small face in a fixed spot  -> face-cam overlay on gameplay (most streams)
  full_face  a big face                     -> camera IS the stream (IRL / just chatting): track the face
  none       no stable face                 -> gameplay only: blur-fill layout
"""
from __future__ import annotations

import subprocess

import numpy as np

SAMPLE_W = 640


def _frames(video: str, start: float, end: float, n: int = 12):
    import cv2  # noqa: F401
    dur = max(0.5, end - start)
    out = []
    for i in range(n):
        t = start + dur * (i + 0.5) / n
        p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1",
                            "-vf", f"scale={SAMPLE_W}:-2", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                           capture_output=True)
        if not p.stdout:
            continue
        h = len(p.stdout) // SAMPLE_W
        if h > 0:
            out.append(np.frombuffer(p.stdout[: SAMPLE_W * h], dtype=np.uint8).reshape(h, SAMPLE_W))
    return out


def detect(video: str, start: float, end: float, top_aspect: float = 1080 / 760) -> dict:
    """Returns {"layout": split|full_face|none, "cam": {x,y,w,h} fractions, "face_cx": fraction}."""
    import cv2
    frames = _frames(video, start, end)
    if not frames:
        return {"layout": "none"}
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    H, W = frames[0].shape
    boxes = []
    for f in frames:
        faces = det.detectMultiScale(f, scaleFactor=1.15, minNeighbors=6, minSize=(max(18, W // 40),) * 2)
        if len(faces):
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3])        # biggest face in the frame
            boxes.append((x + w / 2, y + h / 2, w, h))
    if len(boxes) < max(3, len(frames) * 0.4):
        return {"layout": "none"}
    b = np.array(boxes)
    cx, cy, fw, fh = np.median(b, axis=0)
    spread = float(np.median(np.abs(b[:, 0] - cx))) / W
    if fh / H > 0.22:                         # camera fills the frame
        return {"layout": "full_face", "face_cx": float(cx / W)}
    if spread > 0.05:                         # face jumping around -> not a fixed cam overlay
        return {"layout": "none"}
    # face-cam overlay: take a box around the face with the top panel's aspect ratio
    cw = min(W, fw * 3.4)
    ch = cw / top_aspect
    if ch > H * 0.6:
        ch = H * 0.6
        cw = ch * top_aspect
    x0 = float(np.clip(cx - cw / 2, 0, W - cw))
    y0 = float(np.clip(cy - ch * 0.45, 0, H - ch))
    return {"layout": "split", "cam": {"x": x0 / W, "y": y0 / H, "w": cw / W, "h": ch / H}}
