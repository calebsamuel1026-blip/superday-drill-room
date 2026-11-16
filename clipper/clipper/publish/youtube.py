"""YouTube Shorts upload (Data API v3) — one OAuth token per language account.

Setup: Google Cloud Console -> new project -> enable "YouTube Data API v3" -> OAuth consent
screen (External, add your Google accounts as test users) -> Credentials -> OAuth client ID
-> Desktop app -> download JSON to secrets/youtube_client_secret.json.
Then: python -m clipper auth youtube --account en   (log in with the EN channel's Google account)

NOTE: historically, uploads from API projects that hadn't passed Google's compliance audit
were locked PRIVATE. Google's Nov 2026 revision history reportedly lifts that — but blogs
disagree, so upload() re-reads status.privacyStatus and warns if YouTube forced private.
Uploads cost ~100 quota units (reported: separate upload bucket ~100/day).
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from ..config import SECRETS_DIR, settings

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube.readonly"]


def _token_path(account: str) -> Path:
    return SECRETS_DIR / f"youtube_token_{account}.json"


def authorize(account: str):
    from google_auth_oauthlib.flow import InstalledAppFlow
    flow = InstalledAppFlow.from_client_secrets_file(str(SECRETS_DIR / "youtube_client_secret.json"), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    _token_path(account).write_text(creds.to_json())
    print(f"saved {_token_path(account)}")


def _service(account: str):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials.from_authorized_user_file(str(_token_path(account)), SCOPES)
    if not creds.valid and creds.refresh_token:
        creds.refresh(Request())
        _token_path(account).write_text(creds.to_json())
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def upload(account: str, video: str, title: str, description: str, tags: list[str],
           language: str, publish_at: datetime | None = None) -> dict:
    from googleapiclient.http import MediaFileUpload
    cfg = settings()["publish"]["youtube"]
    status = {"privacyStatus": cfg["privacy"], "selfDeclaredMadeForKids": False,
              "containsSyntheticMedia": False}
    if publish_at:
        status["privacyStatus"] = "private"
        status["publishAt"] = publish_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    tagline = " ".join(t if t.startswith("#") else f"#{t}" for t in tags)
    body = {
        "snippet": {"title": title[:100], "description": f"{description}\n\n{tagline} #shorts"[:5000],
                    "tags": [t.lstrip("#") for t in tags][:15], "categoryId": cfg["category_id"],
                    "defaultLanguage": language, "defaultAudioLanguage": language},
        "status": status,
    }
    req = _service(account).videos().insert(part="snippet,status", body=body,
                                            media_body=MediaFileUpload(video, chunksize=-1, resumable=True,
                                                                       mimetype="video/mp4"))
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    got = (resp.get("status") or {}).get("privacyStatus")
    if got and got != status["privacyStatus"]:
        print(f"[youtube] WARNING: requested {status['privacyStatus']} but video is {got} "
              "(API project probably needs the compliance audit)")
    return {"id": resp["id"], "url": f"https://youtube.com/shorts/{resp['id']}"}


def stats(account: str, ids: list[str]) -> dict[str, dict]:
    out = {}
    svc = _service(account)
    for i in range(0, len(ids), 50):
        r = svc.videos().list(part="statistics", id=",".join(ids[i:i + 50])).execute()
        for it in r.get("items", []):
            s = it["statistics"]
            out[it["id"]] = {"views": int(s.get("viewCount", 0)), "likes": int(s.get("likeCount", 0)),
                             "comments": int(s.get("commentCount", 0)), "shares": 0}
    return out
