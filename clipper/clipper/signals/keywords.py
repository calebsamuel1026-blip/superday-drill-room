"""Transcript keyword signal: what the STREAMER says ("NO WAY", "bro what", "kkkk", screams)."""
from __future__ import annotations

import re

import numpy as np

from ..models import Segment

PATTERNS = {
    "en": r"\b(no way|what the|oh my god|bro what|are you kidding|let'?s go+|holy|run|he'?s dead|i'?m dead|chat\b|clip (it|that))",
    "es": r"\b(no mames|qu[eé] (pas[oó]|es esto)|madre m[ií]a|hostia|vamos+|corre|no puede ser|chat\b|clip(ea|eal)o)",
    "pt": r"\b(meu deus|caralho|n[aã]o acredito|socorro|bora+|corre|que isso|chat\b|clipa|vai pro corte)",
}


def keyword_curve(segments: list[Segment], duration: float, language: str | None) -> np.ndarray:
    n = int(duration) + 1
    y = np.zeros(n)
    pats = [PATTERNS[language]] if language in PATTERNS else list(PATTERNS.values())
    rx = re.compile("|".join(pats), re.I)
    for s in segments:
        hits = len(rx.findall(s.text))
        letters = [c for c in s.text if c.isalpha()]
        shout = letters and sum(c.isupper() for c in letters) / len(letters) > 0.7
        if hits or shout or "!" in s.text:
            a, b = int(s.start), int(s.end) + 1
            y[max(0, a):min(n, b)] += hits + (1 if shout else 0) + 0.3 * s.text.count("!")
    sd = float(y.std()) or 1.0
    return (y - y.mean()) / sd
