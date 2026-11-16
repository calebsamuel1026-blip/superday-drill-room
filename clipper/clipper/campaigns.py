"""Paid clipping campaigns (Content Rewards, Vyro, streamer clipper networks, ...).

A campaign = someone pays per 1k views for clips of THEIR content, under THEIR rules.
config/campaigns.yaml lists the ones we've joined. For each campaign the pipeline:
  - pulls content from the campaign's source channels (any game/topic, not just GTA 6)
  - gives the AI agent the campaign brief (what the creator wants, banned topics)
  - enforces the rules on every clip: required hashtags/@mentions/caption text, length limits
  - routes clips to the accounts allowed for that campaign
  - tracks which posts still need to be SUBMITTED on the campaign site, and estimates earnings

Campaign platforms have no public posting/submission API, so submission is a checklist:
`python -m clipper campaigns submissions` prints every posted link you still need to paste in.
"""
from __future__ import annotations

import contextvars
import time
from datetime import date
from pathlib import Path

import yaml

from .config import CONFIG_DIR, settings

CURRENT: contextvars.ContextVar[dict | None] = contextvars.ContextVar("campaign", default=None)


def load() -> dict[str, dict]:
    path = CONFIG_DIR / "campaigns.yaml"
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text()) or {}
    return {c["id"]: c for c in data.get("campaigns", []) if c.get("id")}


def active() -> list[dict]:
    today = date.today().isoformat()
    out = []
    for c in load().values():
        if c.get("status") != "active" or not c.get("joined", False):
            continue
        if c.get("ends") and str(c["ends"]) < today:
            continue
        out.append(c)
    return sorted(out, key=lambda c: -(c.get("cpm_usd") or 0))


def brief(c: dict) -> str:
    r = c.get("rules") or {}
    lines = [f"PAID CAMPAIGN: {c.get('title')} by {c.get('creator')} on {c.get('platform')} "
             f"(${c.get('cpm_usd')}/1k views). Clips must follow the creator's brief.",
             f"Creator brief: {c.get('brief') or '(none)'}",
             "This content may not be GTA: only mention GTA 6 if it is actually in the clip; otherwise build the "
             "title around the creator's name and the moment. Write packaging only for the target languages."]
    if r.get("other"):
        lines.append("Rules: " + "; ".join(r["other"]))
    if r.get("avoid"):
        lines.append("Never clip: " + "; ".join(r["avoid"]))
    if r.get("min_seconds") or r.get("max_seconds"):
        lines.append(f"Length must be {r.get('min_seconds', 0)}-{r.get('max_seconds', 180)}s.")
    return "\n".join(lines)


_BETTING = ("stake", "bet", "casino", "gambl", "aposta", "apuesta", "slots", "roobet", "rainbet")


def is_betting(c: dict) -> bool:
    blob = " ".join(str(c.get(k) or "") for k in ("title", "creator", "brief", "notes")).lower()
    return any(w in blob for w in _BETTING)


def accounts_for(c: dict, default: list[str]) -> list[str]:
    allowed = c.get("accounts")
    out = [a for a in default if a in allowed] if allowed else list(default)
    langs = c.get("languages")
    accs = settings()["accounts"]
    if langs:
        out = [a for a in out if accs[a]["language"] in langs]
    if is_betting(c):
        # Brazil (CONAR + betting ad rules): no gambling promos on the PT-BR account
        out = [a for a in out if accs[a]["language"] != "pt"]
    return out


def clamp_length(c: dict, a: float, b: float, peak: float, duration: float) -> tuple[float, float]:
    r = c.get("rules") or {}
    lo, hi = r.get("min_seconds"), r.get("max_seconds")
    if hi and b - a > hi:
        a = max(a, peak - hi * 0.7)
        b = a + hi
    if lo and b - a < lo:
        pad = lo - (b - a)
        a = max(0.0, a - pad * 0.6)
        b = min(duration, a + lo)
    return a, b


DISCLOSURE = {"en": "#ad", "es": "#publicidad", "pt": "#publi"}


def apply_rules(c: dict, title: str, description: str, hashtags: list[str],
                language: str = "en") -> tuple[str, str, list[str]]:
    r = c.get("rules") or {}
    tags = list(hashtags)
    for t in r.get("required_hashtags") or []:
        t = t if t.startswith("#") else f"#{t}"
        if t.lower() not in (x.lower() for x in tags):
            tags.insert(0, t)
    extra = []
    for m in r.get("required_mentions") or []:
        m = m if m.startswith("@") else f"@{m}"
        if m.lower() not in (title + description).lower():
            extra.append(m)
    for s in r.get("caption_must_include") or []:
        if s.lower() not in (title + description).lower():
            extra.append(s)
    if c.get("disclosure", True):
        tags = [t for t in tags if t.lower() not in ("#ad",)]
        # paid promo must be disclosed (+ turn on the platform's paid-partnership toggle when posting)
        extra.append(r.get("disclosure_text") or DISCLOSURE.get(language, "#ad"))
    if extra:
        description = (description + "\n" + " ".join(extra)).strip()
    return title, description, tags


# ─────────────────────────── tracking ───────────────────────────

def submissions(campaign_id: str | None = None) -> list[dict]:
    from .db import connect
    with connect() as con:
        q = ("SELECT p.id, p.url, p.remote_id, p.platform, p.account, p.posted_at, p.submitted, c.campaign_id, c.title, "
             "(SELECT views FROM metrics m WHERE m.post_id=p.id ORDER BY fetched_at DESC LIMIT 1) views "
             "FROM posts p JOIN clips c ON c.id=p.clip_id WHERE c.campaign_id IS NOT NULL AND p.status='posted'")
        rows = [dict(r) for r in con.execute(q)]
    return [r for r in rows if not campaign_id or r["campaign_id"] == campaign_id]


def mark_submitted(post_id: int):
    from .db import connect
    with connect() as con:
        con.execute("UPDATE posts SET submitted=? WHERE id=?", (time.time(), post_id))


def earnings() -> dict[str, dict]:
    camps = load()
    out: dict[str, dict] = {}
    for r in submissions():
        c = camps.get(r["campaign_id"], {})
        e = out.setdefault(r["campaign_id"], {"posts": 0, "submitted": 0, "views": 0, "est_usd": 0.0})
        e["posts"] += 1
        e["submitted"] += 1 if r["submitted"] else 0
        v = r["views"] or 0
        e["views"] += v
        if r["submitted"] and v >= (c.get("min_payout_views") or 0):
            pay = v / 1000 * (c.get("cpm_usd") or 0)
            if c.get("max_payout_usd"):
                pay = min(pay, c["max_payout_usd"])
            e["est_usd"] += pay
    for e in out.values():
        e["est_usd"] = round(e["est_usd"], 2)
    return out


def import_research(path: Path | None = None) -> int:
    """Copies campaigns from data/research/campaigns.yaml into config/campaigns.yaml (keeps your edits)."""
    from .config import ROOT
    src = path or ROOT / "data" / "research" / "campaigns.yaml"
    if not src.exists():
        return 0
    data = yaml.safe_load(src.read_text())
    found = data if isinstance(data, list) else data.get("campaigns", [])
    cfg_path = CONFIG_DIR / "campaigns.yaml"
    cur = yaml.safe_load(cfg_path.read_text()) if cfg_path.exists() else {}
    cur = cur or {}
    have = {c["id"] for c in cur.get("campaigns", [])}
    added = 0
    for c in found:
        if c.get("id") and c["id"] not in have:
            c.setdefault("joined", False)
            c.setdefault("accounts", list(settings()["accounts"]))
            cur.setdefault("campaigns", []).append(c)
            added += 1
    header = cfg_path.read_text().split("campaigns:")[0] if cfg_path.exists() else ""
    cfg_path.write_text(header + yaml.safe_dump({"campaigns": cur.get("campaigns", [])}, allow_unicode=True,
                                                sort_keys=False, width=110))
    return added
