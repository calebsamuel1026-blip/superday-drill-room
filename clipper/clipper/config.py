"""Loads config/settings.yaml and config/streamers.yaml."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"
SECRETS_DIR = ROOT / "secrets"


@lru_cache
def settings() -> dict:
    path = Path(os.environ.get("CLIPPER_SETTINGS", CONFIG_DIR / "settings.yaml"))
    data = yaml.safe_load(path.read_text())
    for key in ("workdir", "outdir", "database"):
        p = Path(data[key])
        data[key] = str(p if p.is_absolute() else ROOT / p)
    Path(data["workdir"]).mkdir(parents=True, exist_ok=True)
    Path(data["outdir"]).mkdir(parents=True, exist_ok=True)
    return data


@lru_cache
def streamers() -> dict[str, dict]:
    """Persona knowledge base keyed by streamer id."""
    path = CONFIG_DIR / "streamers.yaml"
    data = yaml.safe_load(path.read_text()) or {}
    out = {}
    for s in data.get("streamers", []):
        out[s["id"]] = s
    return out


_TAGMAP = {"hype": ("hype", 1.1), "laughter": ("laugh", 1.3), "rage_fail": ("fail", 0.8), "shock": ("shock", 1.2)}


@lru_cache
def lexicon() -> dict[str, list]:
    """Hand-tuned config/hype_lexicon.yaml + vocabulary from the streamer research file."""
    lx = yaml.safe_load((CONFIG_DIR / "hype_lexicon.yaml").read_text())
    research = ROOT / "data" / "research" / "streamers_research.yaml"
    if research.exists():
        extra = (yaml.safe_load(research.read_text()) or {}).get("chat_lexicon") or {}
        for lang in ("en", "es", "pt"):
            have = {r["token"].upper() for g in ("common", lang) for r in lx.get(g, [])}
            for cat, toks in (extra.get(lang) or {}).items():
                tag, w = _TAGMAP.get(cat, ("hype", 1.0))
                for t in toks or []:
                    t = str(t).split(" (")[0].strip()       # drop "(MX)" style notes
                    if t and t.upper() not in have and len(t) > 1:
                        lx.setdefault(lang, []).append({"token": t, "weight": w, "tag": tag})
                        have.add(t.upper())
    return lx


def streamer_for_url(url: str) -> dict | None:
    u = url.lower()
    for s in streamers().values():
        for h in (s.get("handles") or {}).values():
            if h and str(h).lower().lstrip("@") in u:
                return s
    return None
