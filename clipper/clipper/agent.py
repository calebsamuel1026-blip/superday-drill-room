"""The persona-aware virality agent (Claude).

Signals tell us WHERE chat/audio exploded. The agent decides WHICH of those moments will
actually go viral for THIS streamer, using a knowledge base of each creator's persona,
running bits, audience, what has worked before (learned from our own A/B results), and
then writes the hook / title / hashtags natively for each target language account.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from .config import CONFIG_DIR, settings, streamers
from .models import Moment, Segment

LEARNED_DIR = CONFIG_DIR / "learned"

SYSTEM = """You are the head editor of a short-form clipping operation that posts GTA 6 streamer clips to YouTube Shorts and TikTok on three channels: English (en), Spanish (es, neutral Latin-American with Spain-friendly slang) and Brazilian Portuguese (pt).

Your job: given candidate moments that our detectors flagged (chat velocity spikes, audio spikes, YouTube most-replayed heatmap, transcript keywords), decide which will perform best as a 15-60 second vertical clip, and package them.

How you judge virality:
- The first 1.5 seconds must contain a reason to keep watching. A moment that needs 40 seconds of setup is weak unless the payoff is huge.
- Strong: genuine shock/scream reactions, chaotic fails, unexpected NPC/physics moments in GTA 6, hilarious RP lines, rage, streamer-vs-chat interactions, collabs between big names, first-ever reactions to big GTA 6 reveals (map, Lucia/Jason story beats, police chases, heists), wholesome surprises, a clean "skill" moment.
- Weak: menus, loading screens, long silent driving, donation-reading, inside jokes that need 10 minutes of context, moments where chat is spamming for an unrelated reason (giveaway, raid, sub train) — check the chat sample for that.
- The streamer's persona matters most: a moment fits if it is the version of the streamer their fans love and that outsiders instantly get. Use the persona notes and the "what has worked" notes.
- Chat tags tell you the moment type (laugh, shock, hype, tension, fail, clip_request). Chat literally asking to clip it is a strong signal.
- Penalize anything that would be unsafe to post: slurs, sexual content, real-life doxxing, minors, real violence. Mark keep=false for those.

Packaging rules:
- hook_shock / hook_question: two variants (we A/B test them) of on-screen text shown for the first ~3 seconds, max 7 words, native slang for that language, no hashtags. It must create curiosity without spoiling the payoff.
- title: max 70 chars, include "GTA 6" naturally, may include the streamer's name. YouTube Shorts title style. No clickbait that misrepresents the clip.
- hashtags: 3-6, always include #gta6 plus the streamer and a language-appropriate tag (e.g. #gta6clips, #gta6español, #gta6brasil).
- description: 1-2 lines + credit line "Streamer: <name> (<platform link handle>)".
- Write each language natively — not a literal translation. Spanish and Portuguese must sound like real Latin-American/Brazilian clip channels.
- trim: you may tighten start/end (seconds relative to the clip start you were given) so the clip starts right before the action and ends right after the payoff/reaction. Keep 12-58s.
"""


class Packaging(BaseModel):
    language: Literal["en", "es", "pt"]
    hook_shock: str = Field(description="hook variant A: bold statement/reaction")
    hook_question: str = Field(description="hook variant B: curiosity question / 'wait for it' style")
    title: str
    description: str
    hashtags: list[str]


class Verdict(BaseModel):
    candidate_index: int
    keep: bool
    virality: int = Field(description="0-100 predicted virality for this streamer")
    moment_type: str = Field(description="e.g. rage, scream, fail, funny_rp, chaos, skill, reveal_reaction, wholesome")
    why: str = Field(description="one or two sentences")
    trim_start: float = Field(description="seconds from the given clip start where the final clip should start")
    trim_end: float = Field(description="seconds from the given clip start where the final clip should end")
    packaging: list[Packaging]


class Ranking(BaseModel):
    verdicts: list[Verdict]


class CaptionLine(BaseModel):
    index: int
    text: str


class Translation(BaseModel):
    language: Literal["en", "es", "pt"]
    lines: list[CaptionLine]


class Translations(BaseModel):
    translations: list[Translation]


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic()


def persona_block(streamer_id: str | None) -> str:
    if not streamer_id or streamer_id not in streamers():
        return "Streamer: unknown (no persona notes yet). Judge on universal virality."
    s = streamers()[streamer_id]
    learned = LEARNED_DIR / f"{streamer_id}.md"
    notes = learned.read_text() if learned.exists() else "(no performance data yet)"
    return ("STREAMER PERSONA\n" + json.dumps(s, ensure_ascii=False, indent=1)
            + "\n\nWHAT HAS WORKED FOR OUR CHANNELS (from A/B results)\n" + notes)


def _parse(output_format, system_blocks, user_text, max_tokens=16000):
    cfg = settings()["agent"]
    client = _client()
    kwargs = dict(model=cfg["model"], max_tokens=max_tokens, system=system_blocks,
                  messages=[{"role": "user", "content": user_text}],
                  output_config={"effort": cfg.get("effort", "medium")},
                  output_format=output_format)
    try:
        # server-side refusal fallback (on by default; remove `fallbacks` to opt out)
        resp = client.beta.messages.parse(betas=["server-side-fallback-2026-07-01"],
                                          fallbacks="default", **kwargs)
    except TypeError:
        resp = client.messages.parse(**kwargs)
    if resp.stop_reason == "refusal":
        raise RuntimeError(f"agent refused: {getattr(resp, 'stop_details', None)}")
    return resp.parsed_output


def rank_moments(source_title: str, streamer_id: str | None, source_language: str | None,
                 moments: list[Moment], languages: list[str]) -> Ranking:
    system = [
        {"type": "text", "text": SYSTEM},
        {"type": "text", "text": persona_block(streamer_id), "cache_control": {"type": "ephemeral"}},
    ]
    cands = []
    for i, m in enumerate(moments):
        cands.append({
            "candidate_index": i,
            "clip_start_in_vod": m.start, "clip_length": round(m.end - m.start, 1),
            "peak_offset_in_clip": round(m.peak - m.start, 1),
            "signals": m.signals,
            "transcript": m.transcript[:2500] or "(no transcript)",
            "chat_sample": m.chat_sample[:50],
        })
    user = (f"VOD title: {source_title}\nSource language: {source_language or 'unknown'}\n"
            f"Write packaging for these languages: {languages}\n\n"
            f"CANDIDATES\n{json.dumps(cands, ensure_ascii=False, indent=1)}\n\n"
            "Return one verdict per candidate.")
    return _parse(Ranking, system, user)


def translate_captions(segments: list[Segment], source_language: str | None,
                       targets: list[str], streamer_id: str | None) -> dict[str, list[str]]:
    """Segment-level caption translation, keeping slang/energy. Returns {lang: [line per segment]}."""
    targets = [t for t in targets if t != source_language]
    if not targets or not segments:
        return {}
    lines = [{"index": i, "text": s.text} for i, s in enumerate(segments)]
    system = [{"type": "text", "text": (
        "You translate gaming-stream captions for short-form clips. Keep it short (captions are read in 1-2s), "
        "keep energy, swearing level and slang natural for the target audience (Brazilian Portuguese for pt, "
        "Latin-American Spanish for es). Keep names, in-game terms and emote words as-is. "
        "Return exactly one line per input index.")}]
    user = (f"Streamer context: {persona_block(streamer_id)[:1500]}\n\nTargets: {targets}\n"
            f"Source language: {source_language}\nLines:\n{json.dumps(lines, ensure_ascii=False)}")
    res: Translations = _parse(Translations, system, user)
    out = {}
    for tr in res.translations:
        by = {l.index: l.text for l in tr.lines}
        out[tr.language] = [by.get(i, segments[i].text) for i in range(len(segments))]
    return out


def update_learned_notes(streamer_id: str, performance_rows: list[dict]) -> str:
    """Asks the agent to rewrite the 'what has worked' notes for a streamer from real metrics."""
    LEARNED_DIR.mkdir(exist_ok=True)
    path = LEARNED_DIR / f"{streamer_id}.md"
    old = path.read_text() if path.exists() else ""
    client = _client()
    resp = client.messages.create(
        model=settings()["agent"]["model"], max_tokens=4000,
        output_config={"effort": "medium"},
        messages=[{"role": "user", "content": (
            "Here are our posted clips of this streamer with their 48h performance vs channel median, "
            "moment type, hook style, caption style, length and title style.\n"
            f"{json.dumps(performance_rows, ensure_ascii=False)}\n\nPrevious notes:\n{old}\n\n"
            "Rewrite the notes (max 15 bullet points) on what moment types, hooks and packaging work and "
            "don't work for this streamer on each language account. Be concrete, cite numbers.")}])
    text = "".join(b.text for b in resp.content if b.type == "text")
    path.write_text(text)
    return text
