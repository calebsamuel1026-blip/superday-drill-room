from __future__ import annotations

from dataclasses import dataclass, field, asdict


@dataclass
class ChatMessage:
    t: float          # seconds from start of the video
    author: str
    text: str


@dataclass
class Word:
    start: float
    end: float
    text: str


@dataclass
class Segment:
    start: float
    end: float
    text: str
    words: list[Word] = field(default_factory=list)


@dataclass
class Moment:
    """A candidate highlight found by the signal detectors."""
    start: float
    end: float
    peak: float
    score: float
    signals: dict = field(default_factory=dict)
    chat_sample: list[str] = field(default_factory=list)
    transcript: str = ""

    def to_dict(self):
        return asdict(self)


@dataclass
class Source:
    url: str
    id: str
    title: str
    platform: str                 # youtube | twitch | kick | file
    duration: float
    streamer_id: str | None = None
    language: str | None = None
    video_path: str | None = None
    chat_path: str | None = None
    heatmap: list[dict] | None = None
    subtitles_path: str | None = None
