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
    "karaoke_green":  ("&H00FFFFFF", "&H0000FF39", "&H00000000", False, 1.0, 640),
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


def caption_y(layout: dict | None) -> int:
    """Where captions sit: at the seam between cam and gameplay (split), else lower-middle."""
    cfg = settings()["render"]
    H = cfg["height"]
    if layout and layout.get("layout") == "split":
        return int(H * cfg.get("split_top_ratio", 0.40)) + 10
    return int(H * 0.66)


def build_ass(path: Path, segments: list[Segment], clip_len: float, hook: str | None,
              handle: str | None, caption_style: str = "karaoke_yellow",
              translated: list[str] | None = None, cap_y: int | None = None,
              keep: list[tuple[float, float]] | None = None) -> Path:
    """TikTok clip-page style: 1-3 word ALL-CAPS captions, heavy black outline, active word highlighted,
    white-box hook title at the top (TikTok native text look), small handle watermark."""
    from .edit.jumpcut import remap
    cfg = settings()["render"]
    W, H = cfg["width"], cfg["height"]
    prim, hi, outl, box, mult, _ = CAPTION_STYLES.get(caption_style, CAPTION_STYLES["karaoke_yellow"])
    size = int(cfg["caption_size"] * mult)
    font = cfg["caption_font"]
    y = cap_y or int(H * 0.66)
    border = 3 if box else 1
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},{prim},{hi},{outl},&H90000000,-1,0,0,0,100,100,1,0,{border},{9 if not box else 18},{4 if not box else 0},5,50,50,0,1
Style: Hook,{font},{int(cfg['caption_size'] * 0.72)},&H00000000,&H00000000,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,20,0,8,90,90,150,1
Style: Mark,{font},34,&H50FFFFFF,&H50FFFFFF,&H90000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,3,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    out_len = sum(b - a for a, b in keep) if keep else clip_len
    ev = []
    if hook:
        hs = cfg["hook_seconds"] if cfg["hook_seconds"] > 0 else out_len
        ev.append(f"Dialogue: 2,{_ts(0)},{_ts(hs)},Hook,,0,0,0,,{{\\fad(120,200)}}{_esc(hook)}")
    if handle:
        ev.append(f"Dialogue: 0,{_ts(0)},{_ts(out_len)},Mark,,0,0,0,,{_esc(handle)}")
    chunks = _chunks_from_lines(segments, translated) if translated else _chunks_from_words(segments)
    for ch in chunks:
        c_end = max(ch[-1].end, ch[0].start + 0.35)
        for j, w in enumerate(ch):
            ws, we = w.start, (ch[j + 1].start if j + 1 < len(ch) else c_end)
            if keep:
                ws2, we2 = remap(ws, keep), remap(min(we, ws + 0.8), keep)
                if ws2 is None:
                    continue
                ws, we = ws2, (we2 if we2 is not None and we2 > ws2 else ws2 + 0.3)
            if we <= ws:
                continue
            parts = []
            for k, w2 in enumerate(ch):
                t = _esc(w2.text.upper())
                parts.append(f"{{\\c{hi}\\fscx110\\fscy110}}{t}{{\\c{prim}\\fscx100\\fscy100}}" if k == j else t)
            pop = "\\t(0,70,\\fscx106\\fscy106)\\t(70,140,\\fscx100\\fscy100)" if j == 0 else ""
            ev.append(f"Dialogue: 1,{_ts(ws)},{_ts(we)},Cap,,0,0,0,,{{\\an5\\pos({W // 2},{y}){pop}}}{' '.join(parts)}")
    path.write_text(head + "\n".join(ev) + "\n", encoding="utf-8")
    return path


def _layout_filter(src: str, layout: dict | None) -> str:
    """[src] -> [v0] at WxH. Layouts match what big clip pages post."""
    cfg = settings()["render"]
    W, H = cfg["width"], cfg["height"]
    kind = (layout or {}).get("layout", "none")
    if kind == "split" and layout.get("cam"):
        c = layout["cam"]
        top_h = int(H * cfg.get("split_top_ratio", 0.40)) // 2 * 2
        game_h = H - top_h
        return (f"{src}split=2[a][b];"
                f"[a]crop=iw*{c['w']:.4f}:ih*{c['h']:.4f}:iw*{c['x']:.4f}:ih*{c['y']:.4f},"
                f"scale={W}:{top_h}:force_original_aspect_ratio=increase,crop={W}:{top_h}[cam];"
                f"[b]crop=min(iw\\,ih*{W / game_h:.4f}):ih,scale={W}:{game_h}:force_original_aspect_ratio=increase,"
                f"crop={W}:{game_h}[game];"
                f"[cam][game]vstack=inputs=2,setsar=1[v0]")
    if kind == "full_face":
        fx = float(layout.get("face_cx", 0.5))
        return (f"{src}crop=ih*9/16:ih:max(0\\,min(iw-ih*9/16\\,iw*{fx:.4f}-ih*9/32)):0,"
                f"scale={W}:{H},setsar=1[v0]")
    return (f"{src}split=2[bg][fg];"
            f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.08[bgb];"
            f"[fg]scale={int(W * 1.18)}:-2,crop={W}:ih[fgs];"
            f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2-40,setsar=1[v0]")


def render_clip(src_video: str | Path, out_path: str | Path, start: float, end: float,
                ass_path: Path | None, layout: dict | str | None = None, facecam: dict | None = None,
                keep: list[tuple[float, float]] | None = None, zoom_at: float | None = None,
                title_png: Path | None = None) -> Path:
    """`start`/`end` relative to src_video. `keep` = ranges (relative to start) after dead-air removal.
    `zoom_at` = output-time of the peak reaction -> 1.3s punch-in zoom."""
    cfg = settings()["render"]
    W, H = cfg["width"], cfg["height"]
    if isinstance(layout, str) or layout is None:          # legacy callers
        layout = {"layout": "split", "cam": facecam} if (layout == "facecam_split" and facecam) else {"layout": "none"}
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    parts = []
    total = end - start
    if keep and (len(keep) > 1 or keep[0][0] > 0.01 or keep[0][1] < total - 0.05):
        for i, (a, b) in enumerate(keep):
            parts.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}];"
                         f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[a{i}];")
        parts.append("".join(f"[v{i}][a{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=1:a=1[vc][ac];")
        vsrc, asrc = "[vc]", "[ac]"
    else:
        vsrc, asrc = "[0:v]", "[0:a]"
    fc = "".join(parts) + _layout_filter(vsrc, layout)
    last = "[v0]"
    if zoom_at is not None and cfg.get("zoom_punch", True):
        z0 = max(0.0, zoom_at - 0.15)
        fc += (f";{last}zoompan=z='if(between(it,{z0:.2f},{z0 + 1.3:.2f}),1.12,1)'"
               f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={cfg['fps']}[vz]")
        last = "[vz]"
    inputs = ["-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(src_video)]
    if title_png:
        # headline at the top, inside TikTok's safe zone (clear of the top bar + right-side buttons)
        out_len = sum(b - a for a, b in keep) if keep else total
        hs = cfg["hook_seconds"] if cfg["hook_seconds"] > 0 else out_len + 1
        inputs += ["-loop", "1", "-t", f"{out_len + 1:.2f}", "-i", str(title_png)]
        fc += f";{last}[1:v]overlay=(W-w)/2:{cfg.get('title_y', 230)}:enable='lt(t,{hs:.2f})':shortest=1[vt]"
        last = "[vt]"
    if ass_path:
        p = str(ass_path).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
        fontsdir = (Path(__file__).resolve().parent.parent / "fonts")
        fd = f":fontsdir='{str(fontsdir).replace(':', chr(92) + ':')}'" if fontsdir.exists() else ""
        fc += f";{last}ass='{p}'{fd}[vout]"
        last = "[vout]"
    fc += f";{asrc}loudnorm=I=-14:TP=-1.5:LRA=11[aout]"
    cmd = ["ffmpeg", "-v", "error", "-y", *inputs,
           "-filter_complex", fc, "-map", last, "-map", "[aout]",
           "-threads", str(cfg.get("threads", 2)),
           "-r", str(cfg["fps"]), "-c:v", "libx264", "-preset", cfg["preset"], "-crf", str(cfg["crf"]),
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out_path)]
    subprocess.run(cmd, check=True)
    return out_path
