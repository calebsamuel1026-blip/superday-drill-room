"""A/B testing with Thompson sampling.

Every rendered clip gets one value for each factor (hook style, caption style, length,
title style). After 48h we mark a post a "win" if its views beat the account's median.
Each (account, factor, value) keeps a Beta(wins+1, losses+1) posterior; new clips sample
from it, so winners get used more automatically while losers still get occasional tests.
The same machinery ranks STREAMERS per account (which creators to clip more).
"""
from __future__ import annotations

import json
import random
import statistics
import time

from .config import settings
from .db import connect

WINDOW = 48 * 3600


def _outcomes(account: str):
    """[(arms_dict, streamer_id, win_bool)] for this account's posts older than 48h with metrics."""
    rows = []
    with connect() as con:
        q = """SELECT p.id, c.arms, c.streamer_id, p.posted_at,
                      (SELECT views FROM metrics m WHERE m.post_id=p.id ORDER BY fetched_at DESC LIMIT 1) AS views
               FROM posts p JOIN clips c ON c.id=p.clip_id
               WHERE p.account=? AND p.status='posted'"""
        for r in con.execute(q, (account,)):
            if r["views"] is None or time.time() - r["posted_at"] < WINDOW:
                continue
            rows.append((json.loads(r["arms"] or "{}"), r["streamer_id"], r["views"]))
    if not rows:
        return []
    med = statistics.median(v for _, _, v in rows)
    return [(a, s, v > med) for a, s, v in rows]


def _posterior(account: str, factor: str):
    stats: dict[str, list[int]] = {}
    for arms, _, win in _outcomes(account):
        v = arms.get(factor)
        if v is None:
            continue
        stats.setdefault(v, [0, 0])[0 if win else 1] += 1
    return stats


def choose_arms(account: str) -> dict:
    factors = settings()["experiments"]["factors"]
    arms = {}
    for f, values in factors.items():
        st = _posterior(account, f)
        best, best_draw = None, -1.0
        for v in values:
            w, l = st.get(v, [0, 0])
            draw = random.betavariate(w + 1, l + 1)
            if draw > best_draw:
                best, best_draw = v, draw
        arms[f] = best
    return arms


def streamer_priority(account: str) -> dict[str, float]:
    st: dict[str, list[int]] = {}
    for _, s, win in _outcomes(account):
        st.setdefault(s or "unknown", [0, 0])[0 if win else 1] += 1
    return {s: random.betavariate(w + 1, l + 1) for s, (w, l) in st.items()}


def report(account: str) -> dict:
    out = {}
    for f in settings()["experiments"]["factors"]:
        out[f] = {v: {"wins": w, "losses": l, "win_rate": round(w / max(1, w + l), 2)}
                  for v, (w, l) in _posterior(account, f).items()}
    st: dict[str, list[int]] = {}
    for _, s, win in _outcomes(account):
        st.setdefault(s or "unknown", [0, 0])[0 if win else 1] += 1
    out["streamers"] = {s: {"wins": w, "losses": l} for s, (w, l) in st.items()}
    return out


HOOK_TEMPLATES = {   # fallback headlines when the AI agent isn't available
    "question": {"en": ["Wait for the end 😭", "Chat wasn't ready for this 💀", "How did this even happen 😭"],
                 "es": ["Espera al final 😭", "El chat no estaba listo 💀", "¿Cómo pasó esto? 😭"],
                 "pt": ["Espera o final 😭", "O chat não tava pronto 💀", "Como isso aconteceu? 😭"]},
    "shock": {"en": ["He did NOT expect this 😭", "Bro got DESTROYED 💀", "Chat couldn't believe this 😭"],
              "es": ["NO se lo esperaba 😭", "Lo DESTRUYERON 💀", "El chat no lo podía creer 😭"],
              "pt": ["Ele NÃO esperava isso 😭", "Ele foi DESTRUÍDO 💀", "O chat não acreditou 😭"]},
}
