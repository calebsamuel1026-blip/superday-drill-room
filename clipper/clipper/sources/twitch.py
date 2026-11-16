"""Twitch: VOD chat replay + LIVE chat listener with a rolling video buffer.

VOD chat:  Twitch's public web GQL endpoint (same one the website uses), paging by cursor.
           Fallback: TwitchDownloaderCLI (https://github.com/lay295/TwitchDownloader) if installed.
LIVE:      anonymous IRC (justinfan) over TLS — no account needed — feeds the same spike
           detector in real time, while ffmpeg keeps a rolling ~10 min buffer of the HLS
           stream on disk. When chat spikes, the buffer is cut into a clip immediately,
           so you can post minutes after it happened (first-to-post wins on Shorts/TikTok).
"""
from __future__ import annotations

import json
import random
import re
import shutil
import socket
import ssl
import subprocess
import threading
import time
from collections import deque
from pathlib import Path

import requests

from ..models import ChatMessage

GQL = "https://gql.twitch.tv/gql"
CLIENT_IDS = ["kd1unb4b3q4t58fwlpcbzcbnm76a8fp",   # TwitchDownloader chat client id (works 2026)
              "kimne78kx3ncx6brgo4mv6wki5h1ko"]   # twitch.tv web client id (fallback)
COMMENTS_HASH = "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a"


def vod_id(url: str) -> str | None:
    m = re.search(r"videos/(\d+)", url) or re.search(r"^v?(\d+)$", url)
    return m.group(1) if m else None


def fetch_vod_chat(url: str, out_path: Path) -> list[ChatMessage]:
    if out_path.exists():
        return [ChatMessage(**json.loads(l)) for l in out_path.read_text().splitlines() if l]
    vid = vod_id(url)
    if not vid:
        return []
    msgs = None
    for cid in CLIENT_IDS:
        try:
            msgs = _gql_comments(vid, cid)
            break
        except Exception as e:  # noqa: BLE001
            print(f"[twitch] GQL chat failed with client {cid[:6]}… ({e})")
    if msgs is None:
        msgs = _twitch_downloader(vid, out_path.with_suffix(".td.json"))
    with open(out_path, "w") as f:
        for m in msgs:
            f.write(json.dumps(m.__dict__, ensure_ascii=False) + "\n")
    return msgs


def _gql_comments(vid: str, client_id: str) -> list[ChatMessage]:
    s = requests.Session()
    s.headers.update({"Client-ID": client_id, "Content-Type": "text/plain;charset=UTF-8",
                      "User-Agent": "Mozilla/5.0"})
    msgs, cursor, offset = [], None, 0
    for _ in range(100000):
        variables = {"videoID": vid}
        if cursor:
            variables["cursor"] = cursor
        else:
            variables["contentOffsetSeconds"] = offset
        body = [{"operationName": "VideoCommentsByOffsetOrCursor", "variables": variables,
                 "extensions": {"persistedQuery": {"version": 1, "sha256Hash": COMMENTS_HASH}}}]
        r = s.post(GQL, data=json.dumps(body), timeout=30)
        r.raise_for_status()
        data = r.json()[0]
        if "errors" in data:
            raise RuntimeError(data["errors"])
        comments = (((data.get("data") or {}).get("video") or {}).get("comments")) or {}
        edges = comments.get("edges") or []
        for e in edges:
            n = e["node"]
            frags = (n.get("message") or {}).get("fragments") or []
            text = "".join(fr.get("text", "") for fr in frags)
            msgs.append(ChatMessage(t=float(n.get("contentOffsetSeconds", 0)),
                                    author=((n.get("commenter") or {}).get("displayName") or ""),
                                    text=text))
        if not edges or not (comments.get("pageInfo") or {}).get("hasNextPage"):
            break
        cursor = edges[-1].get("cursor")
        if not cursor:
            break
        time.sleep(0.08 + random.random() * 0.05)
    msgs.sort(key=lambda m: m.t)
    return msgs


def _twitch_downloader(vid: str, out_json: Path) -> list[ChatMessage]:
    exe = shutil.which("TwitchDownloaderCLI")
    if not exe:
        raise RuntimeError("Twitch chat unavailable: install TwitchDownloaderCLI or fix GQL")
    subprocess.run([exe, "chatdownload", "--id", vid, "-o", str(out_json), "--collision", "Overwrite"],
                   check=True)
    data = json.loads(out_json.read_text())
    return [ChatMessage(t=float(c["content_offset_seconds"]),
                        author=(c.get("commenter") or {}).get("name", ""),
                        text=(c.get("message") or {}).get("body", "")) for c in data.get("comments", [])]


# ───────────────────────────── LIVE ─────────────────────────────

class LiveChat(threading.Thread):
    """Anonymous read-only Twitch IRC. Messages land in self.messages with wall-clock times."""

    def __init__(self, channel: str):
        super().__init__(daemon=True)
        self.channel = channel.lower().lstrip("#")
        self.messages: deque[tuple[float, str, str]] = deque(maxlen=200000)
        self.stop = threading.Event()

    def run(self):
        while not self.stop.is_set():
            try:
                self._loop()
            except Exception as e:  # noqa: BLE001
                print(f"[live-chat] reconnecting after error: {e}")
                time.sleep(3)

    def _loop(self):
        raw = socket.create_connection(("irc.chat.twitch.tv", 6697), timeout=300)
        sock = ssl.create_default_context().wrap_socket(raw, server_hostname="irc.chat.twitch.tv")
        nick = f"justinfan{random.randint(10000, 99999)}"
        sock.sendall(f"PASS SCHMOOPIIE\r\nNICK {nick}\r\nJOIN #{self.channel}\r\n".encode())
        buf = b""
        while not self.stop.is_set():
            chunk = sock.recv(65536)
            if not chunk:
                raise ConnectionError("closed")
            buf += chunk
            *lines, buf = buf.split(b"\r\n")
            for line in lines:
                s = line.decode("utf-8", "ignore")
                if s.startswith("PING"):
                    sock.sendall(b"PONG :tmi.twitch.tv\r\n")
                    continue
                m = re.match(r"^(?:@\S+ )?:(\w+)!\S+ PRIVMSG #\w+ :(.*)$", s)
                if m:
                    self.messages.append((time.time(), m.group(1), m.group(2)))


class HlsBuffer:
    """Keeps the last `keep_seconds` of a live stream on disk as 10s .ts segments."""

    def __init__(self, page_url: str, workdir: Path, keep_seconds: int = 600, seg: int = 10):
        self.page_url, self.dir, self.seg = page_url, workdir, seg
        self.wrap = max(6, keep_seconds // seg)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.proc = None
        self.started = None

    def start(self):
        import yt_dlp
        with yt_dlp.YoutubeDL({"quiet": True, "format": "best[height<=1080]/best"}) as ydl:
            info = ydl.extract_info(self.page_url, download=False)
        hls = info["url"]
        self.proc = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-i", hls, "-c", "copy", "-f", "segment",
             "-segment_time", str(self.seg), "-segment_wrap", str(self.wrap), "-reset_timestamps", "1",
             "-strftime", "0", str(self.dir / "buf_%04d.ts")])
        self.started = time.time()

    def cut(self, t_from: float, t_to: float, out: Path) -> Path:
        """Wall-clock [t_from, t_to] -> mp4 (uses file mtimes to locate segments)."""
        segs = sorted(self.dir.glob("buf_*.ts"), key=lambda p: p.stat().st_mtime)
        chosen = [p for p in segs if t_from - self.seg <= p.stat().st_mtime <= t_to + self.seg]
        if not chosen:
            raise RuntimeError("buffer has no segments for that window yet")
        lst = out.with_suffix(".txt")
        lst.write_text("".join(f"file '{p.resolve()}'\n" for p in chosen))
        first_start = chosen[0].stat().st_mtime - self.seg
        ss = max(0.0, t_from - first_start)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-ss", f"{ss:.2f}", "-t", f"{t_to - t_from:.2f}", "-c:v", "libx264",
                        "-preset", "veryfast", "-crf", "20", "-c:a", "aac", str(out)], check=True)
        return out

    def close(self):
        if self.proc:
            self.proc.terminate()
