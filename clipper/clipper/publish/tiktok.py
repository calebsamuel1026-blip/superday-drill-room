"""TikTok Content Posting API — one OAuth token per language account.

Setup: developers.tiktok.com -> create app -> add products "Login Kit" + "Content Posting API"
-> scopes user.info.basic, video.upload, video.publish, video.list -> redirect URI
(e.g. https://localhost:8723/callback) -> put client_key/secret/redirect_uri in secrets/tiktok_app.json.
Then: python -m clipper auth tiktok --account en

Modes:
  inbox  -> video lands in the TikTok app's inbox/drafts; you tap "post" (works for unaudited apps,
            and lets you add a trending sound in-app, which helps reach).
  direct -> posts straight to the profile. Unaudited apps are limited to SELF_ONLY (private) until
            TikTok approves the app's audit.
"""
from __future__ import annotations

import json
import os
import secrets as pysecrets
import time
import urllib.parse
from pathlib import Path

import requests

from ..config import SECRETS_DIR, settings

API = "https://open.tiktokapis.com"
SCOPES = "user.info.basic,video.upload,video.publish,video.list"


def _app() -> dict:
    return json.loads((SECRETS_DIR / "tiktok_app.json").read_text())


def _tok_path(account: str) -> Path:
    return SECRETS_DIR / f"tiktok_token_{account}.json"


def authorize(account: str):
    app = _app()
    state = pysecrets.token_urlsafe(12)
    url = ("https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
        "client_key": app["client_key"], "scope": SCOPES, "response_type": "code",
        "redirect_uri": app["redirect_uri"], "state": state}))
    print("Open this URL logged in as the", account, "TikTok account:\n", url)
    redirected = input("Paste the full URL you were redirected to: ").strip()
    q = urllib.parse.parse_qs(urllib.parse.urlparse(redirected).query)
    if q.get("state", [""])[0] != state:
        raise SystemExit("state mismatch")
    r = requests.post(f"{API}/v2/oauth/token/", data={
        "client_key": app["client_key"], "client_secret": app["client_secret"],
        "code": q["code"][0], "grant_type": "authorization_code", "redirect_uri": app["redirect_uri"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=30)
    r.raise_for_status()
    tok = r.json()
    tok["obtained_at"] = time.time()
    _tok_path(account).write_text(json.dumps(tok))
    print("saved", _tok_path(account))


def _token(account: str) -> str:
    tok = json.loads(_tok_path(account).read_text())
    if time.time() > tok["obtained_at"] + tok.get("expires_in", 86400) - 300:
        app = _app()
        r = requests.post(f"{API}/v2/oauth/token/", data={
            "client_key": app["client_key"], "client_secret": app["client_secret"],
            "grant_type": "refresh_token", "refresh_token": tok["refresh_token"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=30)
        r.raise_for_status()
        tok = r.json()
        tok["obtained_at"] = time.time()
        _tok_path(account).write_text(json.dumps(tok))
    return tok["access_token"]


def upload(account: str, video: str, caption: str) -> dict:
    cfg = settings()["publish"]["tiktok"]
    size = os.path.getsize(video)
    chunk = size if size <= 64 * 1024 * 1024 else 10 * 1024 * 1024
    total = -(-size // chunk)
    source = {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": chunk, "total_chunk_count": total}
    h = {"Authorization": f"Bearer {_token(account)}", "Content-Type": "application/json; charset=UTF-8"}
    if cfg["mode"] == "direct":
        body = {"post_info": {"title": caption[:2200], "privacy_level": cfg["privacy_level"],
                              "disable_duet": False, "disable_comment": False, "disable_stitch": False,
                              "video_cover_timestamp_ms": 1000, "is_aigc": False},
                "source_info": source}
        url = f"{API}/v2/post/publish/video/init/"
    else:
        body = {"source_info": source}
        url = f"{API}/v2/post/publish/inbox/video/init/"
    r = requests.post(url, headers=h, json=body, timeout=60)
    r.raise_for_status()
    data = r.json()["data"]
    with open(video, "rb") as f:
        for i in range(total):
            part = f.read(chunk if i < total - 1 else size - chunk * (total - 1))
            a = i * chunk
            requests.put(data["upload_url"], data=part, timeout=300, headers={
                "Content-Type": "video/mp4", "Content-Length": str(len(part)),
                "Content-Range": f"bytes {a}-{a + len(part) - 1}/{size}"}).raise_for_status()
    return {"id": data["publish_id"], "url": None}


def status(account: str, publish_id: str) -> dict:
    r = requests.post(f"{API}/v2/post/publish/status/fetch/", json={"publish_id": publish_id},
                      headers={"Authorization": f"Bearer {_token(account)}",
                               "Content-Type": "application/json; charset=UTF-8"}, timeout=30)
    r.raise_for_status()
    return r.json()["data"]


def stats(account: str, video_ids: list[str]) -> dict[str, dict]:
    if not video_ids:
        return {}
    r = requests.post(f"{API}/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count",
                      json={"filters": {"video_ids": video_ids[:20]}},
                      headers={"Authorization": f"Bearer {_token(account)}",
                               "Content-Type": "application/json; charset=UTF-8"}, timeout=30)
    r.raise_for_status()
    out = {}
    for v in r.json().get("data", {}).get("videos", []):
        out[v["id"]] = {"views": v.get("view_count", 0), "likes": v.get("like_count", 0),
                        "comments": v.get("comment_count", 0), "shares": v.get("share_count", 0)}
    return out
