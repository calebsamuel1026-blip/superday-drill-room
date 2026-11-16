"""Posting queue + metrics collection."""
from __future__ import annotations

import json
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from . import experiments
from .config import SECRETS_DIR, settings
from .db import connect


def _posted_today(con, account: str, platform: str, tz: str) -> int:
    start = datetime.now(ZoneInfo(tz)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    return con.execute("SELECT COUNT(*) FROM posts WHERE account=? AND platform=? AND posted_at>=? "
                       "AND status='posted'", (account, platform, start)).fetchone()[0]


def _in_window(acc: dict, tolerance_min: int = 25) -> bool:
    now = datetime.now(ZoneInfo(acc["timezone"]))
    for w in acc.get("post_windows_local", []):
        hh, mm = map(int, w.split(":"))
        t = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        for cand in (t, t - timedelta(days=1), t + timedelta(days=1)):
            if abs((now - cand).total_seconds()) <= tolerance_min * 60:
                return True
    return False


def next_clip(con, account: str, platform: str):
    prio = experiments.streamer_priority(account)
    rows = con.execute(
        "SELECT * FROM clips c WHERE account=? AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.clip_id=c.id "
        "AND p.platform=?) AND created_at > ? ORDER BY virality DESC LIMIT 50",
        (account, platform, time.time() - 4 * 86400)).fetchall()   # clips go stale fast
    if not rows:
        return None
    # freshness matters: decay virality by age (half-life 18h), boost streamers that win on this account
    def key(r):
        age_h = (time.time() - r["created_at"]) / 3600
        return r["virality"] * 0.5 ** (age_h / 18) * (0.6 + 0.8 * prio.get(r["streamer_id"], 0.5))
    return max(rows, key=key)


def post(account: str | None = None, now: bool = False, dry_run: bool = False):
    cfg = settings()
    for name, acc in cfg["accounts"].items():
        if account and name != account:
            continue
        if not now and not _in_window(acc):
            continue
        for platform in acc["platforms"]:
            with connect() as con:
                if _posted_today(con, name, platform, acc["timezone"]) >= acc["max_posts_per_day"][platform]:
                    continue
                clip = next_clip(con, name, platform)
            if not clip:
                print(f"[{name}/{platform}] queue empty")
                continue
            tags = json.loads(clip["hashtags"] or "[]")
            print(f"[{name}/{platform}] posting clip {clip['id']}: {clip['title']}")
            if dry_run:
                continue
            try:
                if platform == "youtube":
                    if not (SECRETS_DIR / f"youtube_token_{name}.json").exists():
                        print("   no YouTube token — run: python -m clipper auth youtube --account", name)
                        continue
                    from .publish import youtube
                    res = youtube.upload(name, clip["path"], clip["title"], clip["description"], tags, acc["language"])
                elif platform == "tiktok":
                    if not (SECRETS_DIR / f"tiktok_token_{name}.json").exists():
                        print("   no TikTok token — run: python -m clipper auth tiktok --account", name)
                        continue
                    from .publish import tiktok
                    res = tiktok.upload(name, clip["long_path"] or clip["path"], f"{clip['title']} {' '.join(tags)}")
                else:
                    continue
                status = "posted"
            except Exception as e:  # noqa: BLE001
                print("   FAILED:", e)
                res, status = {"id": None, "url": None}, "failed"
            with connect() as con:
                con.execute("INSERT INTO posts (clip_id, account, platform, remote_id, url, posted_at, status) "
                            "VALUES (?,?,?,?,?,?,?)", (clip["id"], name, platform, res["id"], res.get("url"),
                                                      time.time(), status))
            print("  ->", status, res.get("url") or res.get("id"))


def collect_metrics():
    with connect() as con:
        rows = con.execute("SELECT id, account, platform, remote_id FROM posts WHERE status='posted' "
                           "AND remote_id IS NOT NULL AND posted_at > ?", (time.time() - 14 * 86400,)).fetchall()
    by = {}
    for r in rows:
        by.setdefault((r["account"], r["platform"]), []).append(r)
    for (acc, plat), rs in by.items():
        try:
            if plat == "youtube":
                from .publish import youtube
                st = youtube.stats(acc, [r["remote_id"] for r in rs])
            else:
                from .publish import tiktok
                # publish_id -> real video id once the user/TikTok has published it
                for r in rs:
                    if str(r["remote_id"]).startswith("v_"):
                        try:
                            ids = tiktok.status(acc, r["remote_id"]).get("publicaly_available_post_id") or []
                        except Exception:  # noqa: BLE001
                            ids = []
                        if ids:
                            with connect() as con:
                                con.execute("UPDATE posts SET remote_id=? WHERE id=?", (str(ids[0]), r["id"]))
                with connect() as con:
                    rs = con.execute("SELECT id, remote_id FROM posts WHERE id IN (%s)" %
                                     ",".join(str(r["id"]) for r in rs)).fetchall()
                st = tiktok.stats(acc, [r["remote_id"] for r in rs if not str(r["remote_id"]).startswith("v_")])
        except Exception as e:  # noqa: BLE001
            print(f"[{acc}/{plat}] metrics failed: {e}")
            continue
        with connect() as con:
            for r in rs:
                m = st.get(r["remote_id"])
                if m:
                    con.execute("INSERT INTO metrics VALUES (?,?,?,?,?,?,?)",
                                (r["id"], time.time(), m["views"], m["likes"], m["comments"], m["shares"],
                                 json.dumps(m)))
        print(f"[{acc}/{plat}] updated {len(st)} posts")
