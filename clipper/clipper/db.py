"""SQLite state: sources, clips, posts, metrics, experiment arms."""
from __future__ import annotations

import json
import sqlite3
import time
from contextlib import contextmanager

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY, url TEXT, title TEXT, platform TEXT, streamer_id TEXT,
  language TEXT, duration REAL, status TEXT, created_at REAL
);
CREATE TABLE IF NOT EXISTS clips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT, streamer_id TEXT, source_language TEXT,
  account TEXT, language TEXT,
  start REAL, end REAL, signal_score REAL, virality REAL,
  title TEXT, description TEXT, hashtags TEXT, hook TEXT,
  arms TEXT, path TEXT, long_path TEXT, agent_json TEXT,
  status TEXT DEFAULT 'rendered', created_at REAL
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clip_id INTEGER, account TEXT, platform TEXT, remote_id TEXT, url TEXT,
  posted_at REAL, status TEXT
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT UNIQUE, kind TEXT, streamer_id TEXT,
  campaign_id TEXT, priority REAL, status TEXT DEFAULT 'pending', note TEXT,
  created_at REAL, updated_at REAL
);
CREATE TABLE IF NOT EXISTS metrics (
  post_id INTEGER, fetched_at REAL, views INTEGER, likes INTEGER,
  comments INTEGER, shares INTEGER, raw TEXT
);
"""


@contextmanager
def connect():
    con = sqlite3.connect(settings()["database"])
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    for table, col, typ in (("clips", "campaign_id", "TEXT"), ("posts", "submitted", "REAL")):
        cols = {r[1] for r in con.execute(f"PRAGMA table_info({table})")}
        if col not in cols:
            con.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typ}")
    try:
        yield con
        con.commit()
    finally:
        con.close()


def upsert_source(src, status="new"):
    with connect() as con:
        con.execute(
            "INSERT OR REPLACE INTO sources VALUES (?,?,?,?,?,?,?,?,?)",
            (src.id, src.url, src.title, src.platform, src.streamer_id,
             src.language, src.duration, status, time.time()),
        )


def source_seen(source_id: str) -> bool:
    with connect() as con:
        r = con.execute("SELECT status FROM sources WHERE id=?", (source_id,)).fetchone()
        return bool(r and r["status"] == "done")


def insert_clip(**kw) -> int:
    kw.setdefault("created_at", time.time())
    for k in ("arms", "agent_json", "hashtags"):
        if k in kw and not isinstance(kw[k], str):
            kw[k] = json.dumps(kw[k], ensure_ascii=False)
    cols = ",".join(kw)
    q = ",".join("?" for _ in kw)
    with connect() as con:
        cur = con.execute(f"INSERT INTO clips ({cols}) VALUES ({q})", tuple(kw.values()))
        return cur.lastrowid


def enqueue(url: str, kind: str, priority: float, streamer_id: str | None = None,
            campaign_id: str | None = None) -> bool:
    with connect() as con:
        if con.execute("SELECT 1 FROM sources WHERE url=? AND status='done'", (url,)).fetchone():
            return False
        cur = con.execute("INSERT OR IGNORE INTO jobs (url, kind, streamer_id, campaign_id, priority, status, "
                          "created_at, updated_at) VALUES (?,?,?,?,?, 'pending', ?, ?)",
                          (url, kind, streamer_id, campaign_id, priority, time.time(), time.time()))
        return cur.rowcount > 0


def next_job():
    with connect() as con:
        r = con.execute("SELECT * FROM jobs WHERE status='pending' ORDER BY priority DESC, created_at ASC "
                        "LIMIT 1").fetchone()
        if r:
            con.execute("UPDATE jobs SET status='running', updated_at=? WHERE id=?", (time.time(), r["id"]))
        return dict(r) if r else None


def finish_job(job_id: int, status: str, note: str = ""):
    with connect() as con:
        con.execute("UPDATE jobs SET status=?, note=?, updated_at=? WHERE id=?",
                    (status, note[:500], time.time(), job_id))


def pending_jobs() -> int:
    with connect() as con:
        return con.execute("SELECT COUNT(*) FROM jobs WHERE status='pending'").fetchone()[0]
