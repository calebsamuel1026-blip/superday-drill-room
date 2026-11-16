"""YouTube / Twitch / Kick VOD access through yt-dlp.

Strategy for long VODs (streams are 4-12h): never download the whole video.
  1. metadata (+ heatmap), chat replay, auto-subtitles, low-bitrate audio  -> detect moments
  2. download ONLY the candidate sections in 1080p                          -> render
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import yt_dlp

from ..config import settings, streamer_for_url
from ..models import ChatMessage, Source

_YDL_BASE = {"quiet": True, "no_warnings": True, "noprogress": True}


def _platform(url: str, info: dict) -> str:
    ex = (info.get("extractor_key") or "").lower()
    if "twitch" in ex or "twitch.tv" in url:
        return "twitch"
    if "kick" in ex or "kick.com" in url:
        return "kick"
    if "youtube" in ex or "youtu" in url:
        return "youtube"
    return ex or "other"


def probe(url: str) -> Source:
    with yt_dlp.YoutubeDL(_YDL_BASE) as ydl:
        info = ydl.extract_info(url, download=False)
    st = streamer_for_url(url) or streamer_for_url(info.get("uploader_url") or info.get("channel_url") or "") \
        or streamer_for_url(info.get("uploader_id") or info.get("uploader") or "")
    return Source(
        url=url,
        id=f"{_platform(url, info)}_{info['id']}",
        title=info.get("title") or "",
        platform=_platform(url, info),
        duration=float(info.get("duration") or 0),
        streamer_id=st["id"] if st else None,
        language=(st or {}).get("language") or (info.get("language") or None),
        heatmap=info.get("heatmap"),
    )


def _dir(src: Source) -> Path:
    d = Path(settings()["workdir"]) / src.id
    d.mkdir(parents=True, exist_ok=True)
    return d


def fetch_youtube_chat(src: Source) -> list[ChatMessage]:
    """Downloads the live-chat replay (only exists for VODs of YouTube livestreams)."""
    d = _dir(src)
    out = d / "chat.jsonl"
    if not out.exists():
        opts = {**_YDL_BASE, "skip_download": True, "writesubtitles": True,
                "subtitleslangs": ["live_chat"], "outtmpl": str(d / "yt.%(ext)s")}
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([src.url])
        cand = list(d.glob("yt*.live_chat.json"))
        if not cand:
            return []
        cand[0].rename(out)
    return parse_youtube_live_chat(out)


def parse_youtube_live_chat(path: Path) -> list[ChatMessage]:
    """Parses yt-dlp's live_chat.json (one JSON object per line)."""
    msgs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            rep = obj.get("replayChatItemAction") or {}
            offset = rep.get("videoOffsetTimeMsec")
            for act in rep.get("actions", []):
                item = (act.get("addChatItemAction") or {}).get("item") or {}
                r = item.get("liveChatTextMessageRenderer") or item.get("liveChatPaidMessageRenderer")
                if not r or offset is None:
                    continue
                parts = []
                for run in (r.get("message") or {}).get("runs", []):
                    if "text" in run:
                        parts.append(run["text"])
                    elif "emoji" in run:
                        e = run["emoji"]
                        sc = e.get("shortcuts") or []
                        # unicode emoji keep their char; channel emotes keep :name:
                        parts.append(e.get("emojiId") if not e.get("isCustomEmoji") else (sc[0] if sc else ""))
                msgs.append(ChatMessage(
                    t=int(offset) / 1000.0,
                    author=(r.get("authorName") or {}).get("simpleText", ""),
                    text="".join(parts),
                ))
    msgs.sort(key=lambda m: m.t)
    return msgs


def fetch_subtitles(src: Source, lang: str | None) -> Path | None:
    """Auto-generated captions (json3) as a free transcript when Whisper isn't available."""
    d = _dir(src)
    have = list(d.glob("subs*.json3"))
    if have:
        return have[0]
    langs = [lang] if lang else ["en", "es", "pt"]
    opts = {**_YDL_BASE, "skip_download": True, "writeautomaticsub": True, "writesubtitles": True,
            "subtitleslangs": [f"{l}.*" for l in langs] + langs, "subtitlesformat": "json3",
            "outtmpl": str(d / "subs.%(ext)s")}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([src.url])
    except yt_dlp.utils.DownloadError:
        return None
    have = list(d.glob("subs*.json3"))
    return have[0] if have else None


def fetch_audio(src: Source) -> Path | None:
    """Lowest-bitrate audio of the whole VOD (~30-60 MB/hour) for loudness analysis."""
    d = _dir(src)
    have = list(d.glob("audio.*"))
    if have:
        return have[0]
    opts = {**_YDL_BASE, "format": "worstaudio/worst", "outtmpl": str(d / "audio.%(ext)s")}
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([src.url])
    have = list(d.glob("audio.*"))
    return have[0] if have else None


def download_section(src: Source, start: float, end: float, tag: str) -> Path:
    """Downloads only [start, end] in up to 1080p."""
    d = _dir(src)
    out = d / f"sec_{tag}.mp4"
    if out.exists():
        return out
    opts = {**_YDL_BASE,
            "format": "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080]/b",
            "merge_output_format": "mp4",
            "download_ranges": yt_dlp.utils.download_range_func(None, [(start, end)]),
            "force_keyframes_at_cuts": True,
            "outtmpl": str(d / f"sec_{tag}.%(ext)s")}
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([src.url])
    if not out.exists():
        alt = sorted(d.glob(f"sec_{tag}.*"))
        if alt:
            alt[0].rename(out)
    return out


def list_channel_videos(channel_url: str, limit: int = 15) -> list[dict]:
    """Recent uploads/streams/VODs of a channel (YouTube /streams, Twitch /videos, Kick)."""
    opts = {**_YDL_BASE, "extract_flat": "in_playlist", "playlistend": limit}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
    out = []
    for e in info.get("entries") or []:
        if not e:
            continue
        url = e.get("url") or e.get("webpage_url")
        if url and not url.startswith("http"):
            url = f"https://www.youtube.com/watch?v={e['id']}"
        out.append({"url": url, "title": e.get("title") or "", "id": e.get("id"),
                    "duration": e.get("duration"), "live_status": e.get("live_status")})
    return out


def is_gta6(title: str) -> bool:
    kws = settings()["game_filter"]["title_keywords"]
    t = re.sub(r"\s+", " ", title.lower())
    return any(k in t for k in kws)
