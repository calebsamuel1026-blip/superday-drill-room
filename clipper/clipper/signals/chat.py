"""Chat-spike detector: "when chat goes crazy, something happened".

Each message contributes 1.0 plus bonuses for hype vocabulary (KEKW, kkkkk, jajaja,
CLIP IT...), ALL CAPS, emote spam and stretched letters. The weighted count is binned
per second, smoothed, and compared against a rolling robust baseline (median + MAD),
so a 40k-viewer xQc chat and a 2k-viewer chat are both measured against their own
"normal". The output is a per-second z-score curve plus per-second tag counts.
"""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

import numpy as np

from ..config import lexicon
from ..models import ChatMessage

_STRETCH = re.compile(r"(.)\1{3,}")


@dataclass
class _Rule:
    weight: float
    tag: str
    phrase: str | None = None
    regex: re.Pattern | None = None


def _rules(language: str | None) -> list[_Rule]:
    lx = lexicon()
    groups = ["common"] + ([language] if language in lx else ["en", "es", "pt"])
    rules = []
    for g in groups:
        for r in lx.get(g, []):
            if r.get("regex"):
                rules.append(_Rule(r["weight"], r["tag"], regex=re.compile(r["token"], re.I)))
            else:
                rules.append(_Rule(r["weight"], r["tag"], phrase=r["token"].upper()))
    return rules


def score_message(text: str, rules: list[_Rule]) -> tuple[float, list[str]]:
    t = text.strip()
    if not t:
        return 0.0, []
    up = t.upper()
    tokens = re.findall(r"[\w:?+'’]+|[^\w\s]", up)
    token_set = set(tokens)
    padded = f" {' '.join(tokens)} "
    w, tags = 1.0, []
    for r in rules:
        hit = False
        if r.regex is not None:
            hit = any(r.regex.search(tok) for tok in tokens) or bool(r.regex.search(t))
        elif " " in r.phrase:
            hit = f" {r.phrase} " in padded
        else:
            hit = r.phrase in token_set or (not r.phrase.isalnum() and r.phrase in t)
        if hit:
            w += r.weight
            tags.append(r.tag)
    letters = [c for c in t if c.isalpha()]
    if len(letters) >= 4 and sum(c.isupper() for c in letters) / len(letters) > 0.8:
        w += 0.5                                   # SCREAMING
    if _STRETCH.search(t):
        w += 0.5                                   # noooooo / kkkkkkk
    if len(tokens) >= 3 and len(token_set) == 1:
        w += 0.4                                   # emote wall "KEKW KEKW KEKW"
    return min(w, 6.0), tags


def robust_z(x: np.ndarray, window: int) -> np.ndarray:
    """z-score of each point vs the rolling median/MAD of the preceding `window` points."""
    n = len(x)
    z = np.zeros(n)
    if n == 0:
        return z
    global_med = float(np.median(x))
    global_mad = float(np.median(np.abs(x - global_med))) or 1.0
    for i in range(n):
        lo = max(0, i - window)
        ref = x[lo:i] if i - lo >= 30 else x[: max(window, 30)]
        med = float(np.median(ref)) if len(ref) else global_med
        mad = float(np.median(np.abs(ref - med))) if len(ref) else global_mad
        mad = max(mad, 0.15 * global_mad, 0.5)
        z[i] = (x[i] - med) / (1.4826 * mad)
    return z


def chat_curve(messages: list[ChatMessage], duration: float, language: str | None,
               smooth: int = 4, baseline: int = 300):
    """Returns (z_curve, raw_curve, tags_per_second, messages_per_second)."""
    n = int(duration) + 1
    raw = np.zeros(n)
    count = np.zeros(n)
    tags: list[Counter] = [Counter() for _ in range(n)]
    rules = _rules(language)
    # one chatter spamming counts once per second (we want MANY people reacting, not one bot)
    per_author: dict[tuple[int, str], float] = {}
    for m in messages:
        i = int(m.t)
        if 0 <= i < n:
            w, tg = score_message(m.text, rules)
            key = (i, m.author or f"anon{id(m)}")
            prev = per_author.get(key)
            if prev is None:
                raw[i] += w
                per_author[key] = w
            elif w > prev:
                raw[i] += w - prev
                per_author[key] = w
            count[i] += 1
            tags[i].update(tg)
    if smooth > 1:
        k = np.ones(smooth) / smooth
        sm = np.convolve(raw, k, mode="same")
    else:
        sm = raw
    return robust_z(sm, baseline), sm, tags, count


def dominant_tags(tags: list[Counter], start: int, end: int, top: int = 3) -> list[str]:
    c = Counter()
    for i in range(max(0, start), min(len(tags), end)):
        c.update(tags[i])
    return [t for t, _ in c.most_common(top)]
