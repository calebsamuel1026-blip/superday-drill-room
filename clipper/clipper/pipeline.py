"""End-to-end: URL -> signals -> moments -> AI ranking -> per-account renders -> queue."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from . import campaigns, db, experiments
from .config import settings, streamers
from .detect import find_moments
from .models import ChatMessage, Moment, Segment, Source
from .edit.title import render_title
from .render import build_ass, caption_y, render_clip
from .signals.audio import loudness_curve
from .signals.heatmap import heatmap_curve
from .signals.keywords import keyword_curve
from .transcribe import parse_json3, shift, transcribe, whisper_available


def log(*a):
    print("[clipper]", *a, flush=True)


def have_agent() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


# ─────────────────────────── ranking ───────────────────────────

def _heuristic_rank(moments: list[Moment], languages: list[str]):
    """No API key: rank by signal strength, use template hooks."""
    from .agent import Packaging, Ranking, Verdict
    import random as _r
    tmpl = {k: {l: _r.choice(v) for l, v in d.items()} for k, d in experiments.HOOK_TEMPLATES.items()}
    titles = {"en": "GTA 6 moment chat lost it over 💀", "es": "El chat enloqueció con esto en GTA 6 💀",
              "pt": "O chat surtou com isso no GTA 6 💀"}
    tags = {"en": ["#gta6", "#gta6clips", "#gaming"], "es": ["#gta6", "#gta6español", "#gaming"],
            "pt": ["#gta6", "#gta6brasil", "#cortes"]}
    camp = campaigns.CURRENT.get()
    if camp:
        who = camp.get("creator") or ""
        titles = {"en": f"{who} chat lost it 💀", "es": f"{who} y el chat enloqueció 💀",
                  "pt": f"{who} e o chat surtou 💀"}
    vs = []
    top = max((m.score for m in moments), default=1) or 1
    for i, m in enumerate(moments):
        vs.append(Verdict(candidate_index=i, keep=True, virality=int(60 + 35 * m.score / top),
                          moment_type=",".join(m.signals.get("chat_tags", [])) or "spike",
                          why="signal-only ranking (no ANTHROPIC_API_KEY)", trim_start=0,
                          trim_end=m.end - m.start,
                          packaging=[Packaging(language=l, hook_shock=tmpl["shock"][l],
                                               hook_question=tmpl["question"][l], title=titles[l],
                                               description="", hashtags=tags[l]) for l in languages]))
    return Ranking(verdicts=vs)


def rank(src: Source, moments: list[Moment], languages: list[str]):
    if not have_agent():
        log("ANTHROPIC_API_KEY not set -> signal-only ranking")
        return _heuristic_rank(moments, languages)
    from .agent import rank_moments
    return rank_moments(src.title, src.streamer_id, src.language, moments, languages)


# ─────────────────────────── routing ───────────────────────────

def target_accounts(source_language: str | None, virality: int) -> list[str]:
    out = []
    for name, acc in settings()["accounts"].items():
        if acc["language"] == source_language or source_language is None:
            out.append(name)
        elif source_language in (acc.get("crosspost_from") or []) and virality >= acc.get("crosspost_min_score", 90):
            out.append(name)
    return out


def detect_layout(video, start: float, end: float, streamer: dict) -> dict:
    """Streamer's manual facecam box wins; otherwise auto-detect the face cam."""
    mode = settings()["render"].get("layout", "auto")
    if streamer.get("facecam"):
        return {"layout": "split", "cam": streamer["facecam"]}
    if mode == "blur_fill":
        return {"layout": "none"}
    try:
        from .edit.face import detect
        return detect(str(video), start, end)
    except Exception as e:  # noqa: BLE001  (opencv missing etc.)
        log("face detection unavailable:", e)
        return {"layout": "none"}


def edit_plan(video, start: float, end: float, peak_rel: float, min_keep: float | None = None):
    """Dead-air cuts + where to punch-in zoom (output time)."""
    from .edit.jumpcut import keep_ranges, remap
    r = settings()["render"]
    keep = None
    if r.get("jumpcuts", True):
        keep = keep_ranges(str(video), start, end, protect=(peak_rel - 1.5, peak_rel + 3.0),
                           min_keep=min_keep or settings()["detection"]["min_clip_seconds"])
        if len(keep) == 1 and keep[0][0] < 0.01 and keep[0][1] >= end - start - 0.05:
            keep = None
    zoom = remap(peak_rel, keep) if keep else peak_rel
    return keep, zoom


def long_window(m: Moment, duration: float, length: float = 66.0) -> tuple[float, float]:
    """61-75s cut for TikTok Creator Rewards (>1 min): more setup before, reaction after."""
    a = max(0.0, m.peak - length * 0.68)
    b = min(duration, a + length)
    return max(0.0, b - length), b


def _slug(s: str, n=40) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:n] or "clip"


# ─────────────────────────── render one moment ───────────────────────────

def produce(src: Source, m: Moment, verdict, section_path: Path, section_offset: float,
            all_segments: list[Segment] | None) -> list[int]:
    """Renders one ranked moment for every target account. Returns clip ids."""
    cfg = settings()
    st = streamers().get(src.streamer_id or "", {})
    camp = campaigns.CURRENT.get()
    accounts = target_accounts(src.language, verdict.virality)
    if camp:
        accounts = campaigns.accounts_for(camp, accounts)
    if not accounts:
        return []
    tight = (m.start + verdict.trim_start, m.start + verdict.trim_end)
    full = (m.start, m.end)
    if tight[1] - tight[0] < cfg["detection"]["min_clip_seconds"]:
        tight = full

    # transcript with word timings for the downloaded section
    if whisper_available():
        sec_segments = transcribe(section_path, src.language)
        sec_segments = [Segment(s.start + section_offset, s.end + section_offset, s.text,
                                [type(w)(w.start + section_offset, w.end + section_offset, w.text) for w in s.words])
                        for s in sec_segments]
    else:
        sec_segments = all_segments or []

    ids = []
    packs = {p.language: p for p in verdict.packaging}
    layout = detect_layout(section_path, tight[0] - section_offset, tight[1] - section_offset, st)
    log(f"  layout: {layout.get('layout')}")
    for acc_name in accounts:
        acc = cfg["accounts"][acc_name]
        lang = acc["language"]
        pack = packs.get(lang) or next(iter(packs.values()))
        arms = experiments.choose_arms(acc_name)
        a, b = tight if arms["length"] == "tight" else full
        if camp:
            a, b = campaigns.clamp_length(camp, a, b, m.peak, src.duration)
        segs = shift(sec_segments, a, b)
        translated = None
        if src.language and lang != src.language and segs and have_agent():
            from .agent import translate_captions
            translated = translate_captions(segs, src.language, [lang], src.streamer_id).get(lang)
        hook = None if arms["hook_style"] == "none" else (
            pack.hook_question if arms["hook_style"] == "question" else pack.hook_shock)
        name = f"{int(a):06d}_{_slug(pack.title)}"
        outdir = Path(cfg["outdir"]) / acc_name / src.id
        outdir.mkdir(parents=True, exist_ok=True)
        keep, zoom = edit_plan(section_path, a - section_offset, b - section_offset, m.peak - a)
        handle = acc.get("handle") if cfg["render"].get("watermark", False) else None
        title_png = render_title(hook, outdir / f"{name}.title.png") if hook else None
        ass = build_ass(outdir / f"{name}.ass", segs, b - a, None, handle,
                        arms["caption_style"], translated, caption_y(layout), keep)
        out = render_clip(section_path, outdir / f"{name}.mp4", a - section_offset, b - section_offset,
                          ass, layout, keep=keep, zoom_at=zoom, title_png=title_png)
        credit = f"🎥 {st.get('name', src.title)} — {src.url}"
        description = (pack.description + "\n" + credit).strip()
        title, hashtags = pack.title, list(pack.hashtags)
        if camp:
            title, description, hashtags = campaigns.apply_rules(camp, title, description, hashtags, lang)
        meta = {"title": title, "description": description, "hashtags": hashtags,
                "campaign": camp and camp["id"],
                "hook": hook, "arms": arms, "virality": verdict.virality, "why": verdict.why,
                "moment_type": verdict.moment_type, "source": src.url, "vod_start": a, "vod_end": b}
        (outdir / f"{name}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
        (outdir / f"{name}.caption.txt").write_text(
            f"{title}\n\n{description}\n\n{' '.join(hashtags)}\n", encoding="utf-8")
        long_path = None
        if cfg["render"].get("tiktok_long_variant") and "tiktok" in acc["platforms"]:
            la, lb = long_window(m, src.duration)
            la, lb = max(la, section_offset), min(lb, section_offset + _media_len(section_path))
            if lb - la > 60.5:
                lsegs = shift(sec_segments, la, lb)
                ltr = None
                if translated is not None and have_agent():
                    from .agent import translate_captions
                    ltr = translate_captions(lsegs, src.language, [lang], src.streamer_id).get(lang)
                lkeep, lzoom = edit_plan(section_path, la - section_offset, lb - section_offset, m.peak - la,
                                         min_keep=61.0)       # stays >1 min for Creator Rewards
                lass = build_ass(outdir / f"{name}.long.ass", lsegs, lb - la, None, handle,
                                 arms["caption_style"], ltr, caption_y(layout), lkeep)
                long_path = str(render_clip(section_path, outdir / f"{name}.long.mp4", la - section_offset,
                                            lb - section_offset, lass, layout, keep=lkeep, zoom_at=lzoom,
                                            title_png=title_png))
        cid = db.insert_clip(source_id=src.id, streamer_id=src.streamer_id, source_language=src.language,
                             account=acc_name, language=lang, start=a, end=b, signal_score=m.score,
                             virality=verdict.virality, title=title, description=description,
                             hashtags=hashtags, campaign_id=camp and camp["id"], hook=hook, arms=arms, path=str(out), long_path=long_path,
                             agent_json=verdict.model_dump())
        log(f"  ✔ [{acc_name}] v={verdict.virality} {pack.title!r} -> {out}")
        ids.append(cid)
    return ids


# ─────────────────────────── process a VOD ───────────────────────────

def process_url(url: str, chat_file: str | None = None, use_audio: bool = True,
                max_clips: int = 6, force: bool = False, campaign_id: str | None = None,
                streamer_id: str | None = None) -> list[int]:
    if campaign_id:
        camp = campaigns.load().get(campaign_id)
        if not camp:
            raise SystemExit(f"unknown campaign {campaign_id} (see config/campaigns.yaml)")
        token = campaigns.CURRENT.set(camp)
        try:
            return _process_url(url, chat_file, use_audio, max_clips, force, streamer_id)
        finally:
            campaigns.CURRENT.reset(token)
    return _process_url(url, chat_file, use_audio, max_clips, force, streamer_id)


def _process_url(url: str, chat_file: str | None, use_audio: bool, max_clips: int, force: bool,
                 streamer_id: str | None = None) -> list[int]:
    from .sources import twitch, youtube
    src = youtube.probe(url)
    if streamer_id and streamer_id in streamers():        # e.g. a reaction re-uploaded by a fan channel
        src.streamer_id = streamer_id
        src.language = streamers()[streamer_id].get("language") or src.language
    if not force and db.source_seen(src.id):
        log("already processed", src.id)
        return []
    camp = campaigns.CURRENT.get()
    if camp:
        src.language = src.language or camp.get("language") or (camp.get("languages") or [None])[0]
        log(f"campaign: {camp['id']} (${camp.get('cpm_usd')}/1k)")
    elif not src.streamer_id:
        log("WARNING: streamer not in config/streamers.yaml -> generic persona")
    db.upsert_source(src, "processing")
    log(f"{src.platform} | {src.title} | {src.duration/3600:.1f}h | streamer={src.streamer_id} lang={src.language}")
    workdir = Path(settings()["workdir"]) / src.id

    chat: list[ChatMessage] = []
    if chat_file:
        chat = load_chat_file(chat_file)
    elif src.platform == "youtube":
        chat = youtube.fetch_youtube_chat(src)
    elif src.platform == "twitch":
        chat = twitch.fetch_vod_chat(url, workdir / "chat.jsonl")
    log(f"chat messages: {len(chat)}")

    segments: list[Segment] = []
    if src.platform == "youtube":
        sub = youtube.fetch_subtitles(src, src.language)
        if sub:
            segments = parse_json3(sub)
    log(f"transcript segments: {len(segments)}")

    audio_z = None
    if use_audio:
        try:
            ap = youtube.fetch_audio(src)
            if ap:
                audio_z = loudness_curve(str(ap), src.duration)
        except Exception as e:  # noqa: BLE001
            log("audio analysis skipped:", e)

    heat_z = heatmap_curve(src.heatmap, src.duration)
    kw_z = keyword_curve(segments, src.duration, src.language) if segments else None
    moments = find_moments(src.duration, chat or None, audio_z, heat_z, kw_z, src.language, segments)
    log(f"candidate moments: {len(moments)}")
    if not moments:
        db.upsert_source(src, "done")
        return []

    langs = sorted({a["language"] for a in settings()["accounts"].values()})
    ranking = rank(src, moments, langs)
    min_v = settings()["agent"]["min_virality_score"]
    keep = sorted([v for v in ranking.verdicts if v.keep and v.virality >= min_v
                   and 0 <= v.candidate_index < len(moments)], key=lambda v: -v.virality)[:max_clips]
    log(f"agent kept {len(keep)}/{len(moments)}")
    ids = []
    for v in keep:
        m = moments[v.candidate_index]
        la, lb = long_window(m, src.duration)
        a, b = min(m.start, la) - 2, max(m.end, lb) + 2
        sec = youtube.download_section(src, max(0, a), b, f"{int(m.start)}")
        ids += produce(src, m, v, sec, max(0, a), segments)
    db.upsert_source(src, "done")
    return ids


def _media_len(path) -> float:
    import subprocess
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                        "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def load_chat_file(path: str) -> list[ChatMessage]:
    """Accepts our jsonl ({t,author,text}), yt-dlp live_chat.json, or TwitchDownloader json."""
    p = Path(path)
    if p.name.endswith(".live_chat.json"):
        from .sources.youtube import parse_youtube_live_chat
        return parse_youtube_live_chat(p)
    txt = p.read_text(encoding="utf-8")
    if txt.lstrip().startswith("{") and '"comments"' in txt[:5000]:
        data = json.loads(txt)
        return [ChatMessage(float(c["content_offset_seconds"]), (c.get("commenter") or {}).get("name", ""),
                            (c.get("message") or {}).get("body", "")) for c in data["comments"]]
    return [ChatMessage(**json.loads(l)) for l in txt.splitlines() if l.strip()]


def process_local(video: str, chat_file: str | None, streamer_id: str | None, language: str | None,
                  title: str = "", max_clips: int = 6) -> list[int]:
    """Same pipeline for a video file already on disk (e.g. a live-buffer cut or a download)."""
    import subprocess
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                "default=nw=1:nk=1", video], capture_output=True, text=True).stdout.strip())
    st = streamers().get(streamer_id or "", {})
    src = Source(url=f"file://{Path(video).resolve()}", id=f"file_{_slug(Path(video).stem)}", title=title or Path(video).stem,
                 platform="file", duration=dur, streamer_id=streamer_id,
                 language=language or st.get("language"), video_path=video)
    chat = load_chat_file(chat_file) if chat_file else []
    segments = transcribe(video, src.language) if whisper_available() else []
    audio_z = loudness_curve(video, dur)
    kw_z = keyword_curve(segments, dur, src.language) if segments else None
    moments = find_moments(dur, chat or None, audio_z, None, kw_z, src.language, segments)
    log(f"candidate moments: {len(moments)}")
    if not moments:
        return []
    langs = sorted({a["language"] for a in settings()["accounts"].values()})
    ranking = rank(src, moments, langs)
    min_v = settings()["agent"]["min_virality_score"]
    keep = sorted([v for v in ranking.verdicts if v.keep and v.virality >= min_v
                   and 0 <= v.candidate_index < len(moments)], key=lambda v: -v.virality)[:max_clips]
    ids = []
    for v in keep:
        ids += produce(src, moments[v.candidate_index], v, Path(video), 0.0, segments)
    return ids
