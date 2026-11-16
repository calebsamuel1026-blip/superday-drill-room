"""Top headline in TikTok's native text style: black bold text on a white rounded box,
with REAL color emoji (libass can only draw emoji in black & white, so the headline is
drawn as a PNG with Pillow and overlaid by ffmpeg).

Emoji font, first one found: fonts/ folder -> Apple Color Emoji (macOS) -> Segoe UI Emoji
(Windows) -> Noto Color Emoji (Linux / downloaded by setup).
"""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
FONTS = ROOT / "fonts"

TEXT_FONTS = [FONTS / "Montserrat-Black.ttf", FONTS / "Montserrat-ExtraBold.ttf",
              Path("/System/Library/Fonts/Supplemental/Arial Black.ttf"),       # macOS
              Path("C:/Windows/Fonts/ariblk.ttf"),                               # Windows
              Path("/usr/share/fonts/opentype/inter/Inter-Black.otf"),
              Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")]
EMOJI_FONTS = [(FONTS / "NotoColorEmoji.ttf", 109),
               (Path("/System/Library/Fonts/Apple Color Emoji.ttc"), 160),
               (Path("C:/Windows/Fonts/seguiemj.ttf"), 109),
               (Path("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"), 109)]

_EMOJI = re.compile("([\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]+)")


def _first(paths):
    for p in paths:
        p0 = p[0] if isinstance(p, tuple) else p
        if Path(p0).exists():
            return p
    return None


def _emoji_img(seq: str, size: int) -> Image.Image | None:
    found = _first(EMOJI_FONTS)
    if not found:
        return None
    path, native = found
    try:
        f = ImageFont.truetype(str(path), native)
        im = Image.new("RGBA", (native * 2 * max(1, len(seq)), native * 2), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, 0), seq, font=f, embedded_color=True)
        bb = im.getbbox()
        if not bb:
            return None
        im = im.crop(bb)
        return im.resize((max(1, int(im.width * size / im.height)), size), Image.LANCZOS)
    except OSError:
        return None


def render_title(text: str, out_png: Path, max_width: int = 940, font_size: int = 62) -> Path:
    tf = _first(TEXT_FONTS)
    font = ImageFont.truetype(str(tf), font_size) if tf else ImageFont.load_default(font_size)
    # tokens: words and emoji sequences
    tokens = []
    for part in _EMOJI.split(text.strip()):
        if not part:
            continue
        if _EMOJI.fullmatch(part):
            tokens.append(("e", part.replace("\uFE0F", "")))
        else:
            tokens += [("w", w) for w in part.split()]
    space = font.getlength(" ")
    eh = int(font_size * 1.05)

    def width(tok):
        if tok[0] == "w":
            return font.getlength(tok[1])
        im = _emoji_img(tok[1], eh)
        return im.width if im else 0

    lines, cur, cur_w = [], [], 0.0
    for tok in tokens:
        w = width(tok)
        add = w + (space if cur else 0)
        if cur and cur_w + add > max_width:
            lines.append(cur)
            cur, cur_w = [tok], w
        else:
            cur.append(tok)
            cur_w += add
    if cur:
        lines.append(cur)
    line_h = int(font_size * 1.28)
    pad_x, pad_y = 34, 22
    widths = [sum(width(t) for t in ln) + space * (len(ln) - 1) for ln in lines]
    W = int(max(widths or [10]) + pad_x * 2)
    H = int(line_h * len(lines) + pad_y * 2)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W - 1, H - 1), radius=26, fill=(255, 255, 255, 255))
    y = pad_y
    for ln, lw in zip(lines, widths):
        x = (W - lw) / 2
        for i, tok in enumerate(ln):
            if i:
                x += space
            if tok[0] == "w":
                d.text((x, y + (line_h - font_size) / 2 - font_size * 0.08), tok[1], font=font, fill=(10, 10, 10, 255))
                x += font.getlength(tok[1])
            else:
                im = _emoji_img(tok[1], eh)
                if im:
                    img.alpha_composite(im, (int(x), int(y + (line_h - eh) / 2)))
                    x += im.width
        y += line_h
    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png)
    return out_png
