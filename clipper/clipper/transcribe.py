"""Speech -> text with word timestamps (for captions + for the AI agent's context).

Order of preference:
  1. faster-whisper (local, free, word-level timestamps — best captions)
  2. YouTube auto-captions json3 (free, already timed, slightly worse)
"""
from __future__ import annotations

import json
from pathlib import Path

from .models import Segment, Word

_MODEL = None


def whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except ImportError:
        return False


def transcribe(media: str | Path, language: str | None = None, model_size: str = "small") -> list[Segment]:
    global _MODEL
    from faster_whisper import WhisperModel
    if _MODEL is None:
        from .config import settings
        threads = int(settings()["render"].get("threads", 2))
        _MODEL = WhisperModel(model_size, device="auto", compute_type="int8", cpu_threads=threads)
    segs, _ = _MODEL.transcribe(str(media), language=language, word_timestamps=True,
                                vad_filter=True, beam_size=1)
    out = []
    for s in segs:
        words = [Word(w.start, w.end, w.word.strip()) for w in (s.words or [])]
        out.append(Segment(s.start, s.end, s.text.strip(), words))
    return out


def parse_json3(path: str | Path) -> list[Segment]:
    data = json.loads(Path(path).read_text())
    out = []
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs:
            continue
        t0 = ev.get("tStartMs", 0) / 1000
        dur = ev.get("dDurationMs", 0) / 1000
        words = []
        for sg in segs:
            txt = (sg.get("utf8") or "").strip()
            if not txt:
                continue
            ws = t0 + sg.get("tOffsetMs", 0) / 1000
            words.append(Word(ws, ws + 0.4, txt))
        for a, b in zip(words, words[1:]):
            a.end = min(a.end, b.start) if b.start > a.start else a.end
        text = " ".join(w.text for w in words)
        if text:
            out.append(Segment(t0, t0 + dur, text, words))
    return out


def shift(segments: list[Segment], start: float, end: float) -> list[Segment]:
    """Segments inside [start, end], re-timed so 0 = start."""
    out = []
    for s in segments:
        if s.end < start or s.start > end:
            continue
        ws = [Word(max(0, w.start - start), max(0, w.end - start), w.text)
              for w in s.words if start <= w.start <= end]
        out.append(Segment(max(0, s.start - start), min(end, s.end) - start, s.text, ws))
    return out
