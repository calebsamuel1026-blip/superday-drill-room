"""python -m clipper <command>

  process <url> [--chat FILE]     clip one VOD / YouTube video (YouTube, Twitch, Kick)
  local <video> [--chat FILE]     clip a local file
  seed [--lang en] [--top 6]       START TODAY: find + clip existing GTA 6 reaction videos (warm-up content)
  discover                         list new GTA 6 VODs from every streamer in config/streamers.yaml
  run [--loop]                     discover -> process -> post -> metrics (the money loop)
  watch <twitch_channel>           LIVE mode: clip in real time from chat spikes
  post [--account en] [--now]      post the best queued clips (respects windows + daily caps)
  metrics                          pull views/likes for recent posts
  learn                            update each streamer's "what works" notes from results (AI)
  report [--account en]            A/B test results + streamer leaderboard
  queue                            show rendered clips waiting to be posted
  auth youtube|tiktok --account X  connect a channel

  campaigns list                   paid clipping campaigns (config/campaigns.yaml)
  campaigns import                 add campaigns found by research (joined: false)
  campaigns run                    clip new videos from every joined, active campaign
  campaigns submissions            posted campaign clips + whether you've submitted them
  campaigns submitted <post_id>    mark a post as submitted on the campaign site
  campaigns earnings               estimated payout per campaign (views x CPM)
"""
from __future__ import annotations

import argparse
import json
import time

from .config import settings, streamers


def cmd_discover(limit=8, quiet=False):
    from . import db
    from .sources.youtube import is_gta6, list_channel_videos
    found = []
    for s in sorted(streamers().values(), key=lambda s: -s.get("priority", 5)):
        for plat, url in (s.get("channels") or {}).items():
            try:
                vids = list_channel_videos(url, limit)
            except Exception as e:  # noqa: BLE001
                if not quiet:
                    print(f"  {s['id']}/{plat}: {str(e)[:90]}")
                continue
            for v in vids:
                if v.get("live_status") == "is_live" or not is_gta6(v["title"]):
                    continue
                with db.connect() as con:
                    if con.execute("SELECT 1 FROM sources WHERE url=? AND status='done'", (v["url"],)).fetchone():
                        continue
                found.append({**v, "streamer": s["id"], "priority": s.get("priority", 5)})
                print(f"  NEW  [{s['language']}] {s['name']:<18} {v['title'][:70]}  {v['url']}")
    return found


def cmd_seed(langs: list[str], top: int, dry_run: bool, max_videos: int):
    import time as _t
    from . import db
    from .sources.youtube import is_gta6, search
    cfg = settings()["seed"]
    picked = []
    seen = set()
    for lang in langs:
        sts = sorted([s for s in streamers().values() if s["language"] == lang],
                     key=lambda s: -s.get("priority", 5))[:top]
        for st in sts:
            first = st["name"].split("(")[0].split("/")[0].strip()
            for q in cfg["queries"].get(lang, []):
                try:
                    res = search(q.format(name=first), cfg["per_query"])
                except Exception as e:  # noqa: BLE001
                    print(f"  search failed ({q.format(name=first)}): {str(e)[:80]}")
                    continue
                for v in res:
                    blob = (v["title"] + " " + v["channel"]).lower()
                    dur = v.get("duration") or 0
                    if (v["id"] in seen or not is_gta6(v["title"]) or first.lower() not in blob
                            or v.get("live_status") == "is_live" or dur > cfg["max_duration_hours"] * 3600
                            or (dur and dur < 60)):
                        continue
                    with db.connect() as con:
                        if con.execute("SELECT 1 FROM sources WHERE url=? AND status='done'", (v["url"],)).fetchone():
                            continue
                    seen.add(v["id"])
                    picked.append((st, v))
                    print(f"  [{lang}] {st['name']:<16} {dur / 60:>5.0f}m  {v['title'][:70]}  {v['url']}")
    print(f"{len(picked)} reaction videos found")
    if dry_run:
        return
    # interleave languages so every account gets content early
    by_lang: dict[str, list] = {}
    for st, v in picked:
        by_lang.setdefault(st["language"], []).append((st, v))
    order = [x for grp in zip(*[iter(v) for v in by_lang.values()]) for x in grp] if len(by_lang) > 1 else picked
    order += [x for x in picked if x not in order]
    from .pipeline import process_url
    for st, v in order[:max_videos]:
        print(f"\n== {st['name']}: {v['title'][:80]}")
        try:
            process_url(v["url"], max_clips=3, streamer_id=st["id"])
        except Exception as e:  # noqa: BLE001
            print("  failed:", str(e)[:200])
        _t.sleep(2)


def campaign_discover(camp: dict, limit=8) -> list[dict]:
    from . import db
    from .sources.youtube import list_channel_videos
    kws = [k.lower() for k in camp.get("title_keywords") or []]
    out = []
    for url in camp.get("source_channels") or []:
        try:
            vids = list_channel_videos(url, limit)
        except Exception as e:  # noqa: BLE001
            print(f"  {camp['id']}: {str(e)[:90]}")
            continue
        for v in vids:
            if v.get("live_status") == "is_live" or (kws and not any(k in v["title"].lower() for k in kws)):
                continue
            with db.connect() as con:
                if con.execute("SELECT 1 FROM sources WHERE url=? AND status='done'", (v["url"],)).fetchone():
                    continue
            out.append(v)
    return out


def cmd_campaigns(action: str, arg: str | None):
    from . import campaigns
    if action == "list":
        for c in sorted(campaigns.load().values(), key=lambda c: -(c.get("cpm_usd") or 0)):
            mark = "✅" if c.get("joined") and c.get("status") == "active" else "  "
            print(f"{mark} {c['id']:<32} {c.get('status', '?'):<10} ${c.get('cpm_usd') or '?':<5}/1k "
                  f"{c.get('platform', ''):<16} {c.get('creator', '')}  {c.get('url', '')}")
        print("\n✅ = joined + active (processed by `campaigns run`). Edit config/campaigns.yaml to join.")
    elif action == "import":
        print(f"added {campaigns.import_research()} campaigns to config/campaigns.yaml")
    elif action == "run":
        from .pipeline import process_url
        act = campaigns.active()
        if not act:
            print("no joined + active campaigns yet (set joined: true / status: active in config/campaigns.yaml)")
        for c in act:
            for v in campaign_discover(c)[:4]:
                print(f"[{c['id']}] {v['title'][:70]}")
                try:
                    process_url(v["url"], campaign_id=c["id"])
                except Exception as e:  # noqa: BLE001
                    print("  failed:", e)
    elif action == "submissions":
        for r in campaigns.submissions(arg):
            st = "submitted" if r["submitted"] else "TODO"
            print(f"{r['id']:>5} {st:<9} [{r['campaign_id']}] {r['account']}/{r['platform']} "
                  f"views={r['views'] or 0:<8} {r['url'] or r['remote_id']}")
    elif action == "submitted":
        campaigns.mark_submitted(int(arg))
        print("marked", arg)
    elif action == "earnings":
        print(json.dumps(campaigns.earnings(), indent=1))


def main():
    ap = argparse.ArgumentParser(prog="clipper", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("process"); p.add_argument("url"); p.add_argument("--chat")
    p.add_argument("--no-audio", action="store_true"); p.add_argument("--max", type=int, default=6)
    p.add_argument("--force", action="store_true"); p.add_argument("--campaign")
    p = sub.add_parser("campaigns"); p.add_argument("action", choices=["list", "import", "run", "submissions",
                                                                       "submitted", "earnings"])
    p.add_argument("arg", nargs="?")
    p = sub.add_parser("local"); p.add_argument("video"); p.add_argument("--chat")
    p.add_argument("--streamer"); p.add_argument("--lang"); p.add_argument("--max", type=int, default=6)
    sub.add_parser("discover")
    p = sub.add_parser("seed"); p.add_argument("--lang", action="append")
    p.add_argument("--top", type=int, default=6); p.add_argument("--max-videos", type=int, default=30)
    p.add_argument("--dry-run", action="store_true")
    p = sub.add_parser("run"); p.add_argument("--loop", action="store_true")
    p.add_argument("--every", type=int, default=20, help="minutes between cycles")
    p = sub.add_parser("watch"); p.add_argument("channel"); p.add_argument("--dry-run", action="store_true")
    p = sub.add_parser("post"); p.add_argument("--account"); p.add_argument("--now", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    sub.add_parser("metrics"); sub.add_parser("learn"); sub.add_parser("queue")
    p = sub.add_parser("report"); p.add_argument("--account")
    p = sub.add_parser("auth"); p.add_argument("platform", choices=["youtube", "tiktok"])
    p.add_argument("--account", required=True)
    a = ap.parse_args()

    if a.cmd == "process":
        from .pipeline import process_url
        process_url(a.url, a.chat, not a.no_audio, a.max, a.force, a.campaign)
    elif a.cmd == "campaigns":
        cmd_campaigns(a.action, a.arg)
    elif a.cmd == "local":
        from .pipeline import process_local
        process_local(a.video, a.chat, a.streamer, a.lang, max_clips=a.max)
    elif a.cmd == "seed":
        cmd_seed(a.lang or sorted({x["language"] for x in settings()["accounts"].values()}),
                 a.top, a.dry_run, a.max_videos)
    elif a.cmd == "discover":
        cmd_discover()
    elif a.cmd == "run":
        from .pipeline import process_url
        from .poster import collect_metrics, post
        while True:
            for v in sorted(cmd_discover(quiet=True), key=lambda v: -v["priority"])[:6]:
                try:
                    process_url(v["url"])
                except Exception as e:  # noqa: BLE001
                    print("  process failed:", e)
            cmd_campaigns("run", None)          # paid campaigns first-class in the loop
            post()
            collect_metrics()
            if not a.loop:
                break
            time.sleep(a.every * 60)
    elif a.cmd == "watch":
        from .live import watch
        watch(a.channel, dry_run=a.dry_run)
    elif a.cmd == "post":
        from .poster import post
        post(a.account, a.now, a.dry_run)
    elif a.cmd == "metrics":
        from .poster import collect_metrics
        collect_metrics()
    elif a.cmd == "learn":
        from .agent import update_learned_notes
        from .db import connect
        with connect() as con:
            rows = [dict(r) for r in con.execute(
                "SELECT c.streamer_id, c.account, c.title, c.hook, c.arms, c.virality, c.agent_json, "
                "(SELECT views FROM metrics m WHERE m.post_id=p.id ORDER BY fetched_at DESC LIMIT 1) views "
                "FROM posts p JOIN clips c ON c.id=p.clip_id WHERE p.status='posted'")]
        by = {}
        for r in rows:
            if r["views"] is not None and r["streamer_id"]:
                r["moment_type"] = json.loads(r.pop("agent_json") or "{}").get("moment_type")
                by.setdefault(r["streamer_id"], []).append(r)
        for sid, rs in by.items():
            if len(rs) >= 3:
                print(f"== {sid}\n{update_learned_notes(sid, rs)}\n")
    elif a.cmd == "report":
        from .experiments import report
        for acc in ([a.account] if a.account else settings()["accounts"]):
            print(f"== {acc}\n{json.dumps(report(acc), indent=1)}")
    elif a.cmd == "queue":
        from .db import connect
        with connect() as con:
            for r in con.execute("SELECT c.id, c.account, c.virality, c.streamer_id, c.title, c.path FROM clips c "
                                 "WHERE NOT EXISTS (SELECT 1 FROM posts p WHERE p.clip_id=c.id) "
                                 "ORDER BY account, virality DESC"):
                print(f"{r['id']:>5} [{r['account']}] v={r['virality']:>3} {r['streamer_id'] or '-':<14} "
                      f"{r['title'][:60]}\n       {r['path']}")
    elif a.cmd == "auth":
        if a.platform == "youtube":
            from .publish.youtube import authorize
        else:
            from .publish.tiktok import authorize
        authorize(a.account)
