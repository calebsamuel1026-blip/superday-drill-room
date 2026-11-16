"""Vertical 9:16 render: layout + burned karaoke captions + hook text + watermark."""
from __future__ import annotations

import subprocess
from pathlib import Path

from .config import settings
from .models import Segment

CAPTION_STYLES = {
    # name: (primary, highlight, outline, box, size_mult, y_from_bottom)
    "karaoke_yellow": ("&H00FFFFFF", "&H0000E5FF", "&H00000000", False, 1.0, 640),
    "white_box":      ("&H00FFFFFF", "&H00FFFFFF", "&H00000000", True, 0.85, 560),
    "big_center":     ("&H00FFFFFF", "&H0045E04A", "&H00000000", False, 1.2, 860),
}


def _ts(t: float) -> str:
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _esc(s: str) -> str:
    return s.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def _chunks_from_words(segments: list[Segment], per: int = 3):
    for s in segments:
        ws = [w for w in s.words if w.text.strip()]
        if not ws:
            continue
        for i in range(0, len(ws), per):
            yield ws[i:i + per]


def _chunks_from_lines(segments: list[Segment], lines: list[str], per: int = 3):
    """Translated lines have no word timings: spread their words evenly over the segment."""
    from .models import Word
    for s, line in zip(segments, lines):
        words = line.split()
        if not words:
            continue
        dur = max(0.3, s.end - s.start)
        step = dur / len(words)
        timed = [Word(s.start + i * step, s.start + (i + 1) * step, w) for i, w in enumerate(words)]
        for i in range(0, len(timed), per):
            yield timed[i:i + per]


def build_ass(path: Path, segments: list[Segment], clip_len: float, hook: str | None,
              handle: str | None, caption_style: str = "karaoke_yellow",
              translated: list[str] | None = None) -> Path:
    cfg = settings()["render"]
    W, H = cfg["width"], cfg["height"]
    prim, hi, outl, box, mult, ybot = CAPTION_STYLES.get(caption_style, CAPTION_STYLES["karaoke_yellow"])
    size = int(cfg["caption_size"] * mult)
    font = cfg["caption_font"]
    border = 3 if box else 1
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},{prim},{hi},{outl},&H80000000,-1,0,0,0,100,100,0,0,{border},{8 if not box else 18},{3 if not box else 0},2,60,60,{ybot},1
Style: Hook,{font},{int(cfg['caption_size']*0.95)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,3,22,0,8,70,70,210,1
Style: Mark,{font},34,&H50FFFFFF,&H50FFFFFF,&H90000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,3,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    if hook:
        ev.append(f"Dialogue: 2,{_ts(0)},{_ts(cfg['hook_seconds'])},Hook,,0,0,0,,{{\\fad(0,250)\\1c&H00101010&\\3c&H0000E5FF&}}{_esc(hook.upper())}")
    if handle:
        ev.append(f"Dialogue: 0,{_ts(0)},{_ts(clip_len)},Mark,,0,0,0,,{_esc(handle)}")
    chunks = _chunks_from_lines(segments, translated) if translated else _chunks_from_words(segments)
    for ch in chunks:
        c_start, c_end = ch[0].start, max(ch[-1].end, ch[0].start + 0.35)
        for j, w in enumerate(ch):
            ws = w.start
            we = ch[j + 1].start if j + 1 < len(ch) else c_end
            if we <= ws:
                continue
            parts = []
            for k, w2 in enumerate(ch):
                t = _esc(w2.text.upper())
                parts.append(f"{{\\c{hi}\\fscx108\\fscy108}}{t}{{\\c{prim}\\fscx100\\fscy100}}" if k == j else t)
            pop = "{\\t(0,80,\\fscx104\\fscy104)\\t(80,160,\\fscx100\\fscy100)}" if j == 0 else ""
            ev.append(f"Dialogue: 1,{_ts(ws)},{_ts(we)},Cap,,0,0,0,,{pop}{' '.join(parts)}")
        _ = c_start
    path.write_text(head + "\n".join(ev) + "\n", encoding="utf-8")
    return path


def _filter(layout: str, facecam: dict | None) -> str:
    cfg = settings()["render"]
    W, H = cfg["width"], cfg["height"]
    if layout == "facecam_split" and facecam:
        # facecam box given as fractions of the source frame: {x, y, w, h}
        fx, fy, fw, fh = (facecam[k] for k in ("x", "y", "w", "h"))
        top_h = int(H * 0.38)
        return (f"[0:v]split=2[a][b];"
                f"[a]crop=iw*{fw}:ih*{fh}:iw*{fx}:ih*{fy},scale={W}:{top_h}:force_original_aspect_ratio=increase,crop={W}:{top_h}[cam];"
                f"[b]crop=ih*{W}/{H - top_h}:ih,scale={W}:{H - top_h}[game];"
                f"[cam][game]vstack=inputs=2,setsar=1[v0]")
    # blur_fill: full 16:9 frame centered (slightly zoomed), blurred copy as background
    return (f"[0:v]split=2[bg][fg];"
            f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.08[bgb];"
            f"[fg]scale={int(W * 1.18)}:-2,crop={W}:ih[fgs];"
            f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2-40,setsar=1[v0]")


def render_clip(src_video: str | Path, out_path: str | Path, start: float, end: float,
                ass_path: Path | None, layout: str | None = None, facecam: dict | None = None) -> Path:
    """`start`/`end` are relative to src_video."""
    cfg = settings()["render"]
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fc = _filter(layout or cfg["layout"], facecam)
    last = "[v0]"
    if ass_path:
        p = str(ass_path).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
        fc += f";{last}ass='{p}'[vout]"
        last = "[vout]"
    # audio: loudness-normalise so quiet streamers aren't drowned by louder Shorts
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(src_video),
           "-filter_complex", fc, "-map", last, "-map", "0:a?",
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
           "-r", str(cfg["fps"]), "-c:v", "libx264", "-preset", cfg["preset"], "-crf", str(cfg["crf"]),
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out_path)]
    subprocess.run(cmd, check=True)
    return out_path
