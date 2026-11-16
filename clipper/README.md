# GTA 6 Clip Farm

An automatic clipping system. It finds the best moments in GTA 6 streams and YouTube videos, renders vertical Shorts/TikToks, and posts them to three channels: **English, Spanish and Brazilian Portuguese**.

```
 discover ─▶ signals ─────────────────────────────▶ AI agent ──────────────▶ render ─────────────▶ post ─▶ metrics ─▶ learn
 (VODs of    • chat velocity spikes (per language)    (Claude, with a          • 9:16 blur-fill      YouTube     48h views   A/B bandit +
  43 target  • audio loudness jumps                    persona file per         or facecam split    Shorts +    vs channel  per-streamer
  streamers) • YouTube "Most replayed" heatmap         streamer) picks what     • karaoke captions   TikTok      median      "what works"
             • transcript keywords ("NO WAY", kkkk)    goes viral and writes    • hook text (A/B)                            notes fed back
                                                       hooks/titles in EN/ES/PT • translated subs                            to the agent
 LIVE: `watch <twitch channel>` → anonymous chat listener + rolling 10-min stream buffer → clip ~1-2 min after it happens
```

## Why it works
- **Chat spikes.** Each chat message is scored. A plain message counts 1. Hype words count extra: `KEKW`, `OMEGALUL`, `kkkkkkk`, `jajaja`, `MDS`, `CARALHO`, `NO MAMES`, `CLIP IT`, `CLIPA ISSO`. Messages in all caps, stretched letters and emote spam also count extra. One spamming user counts only once per second.
- **Baseline.** Each stream's chat is compared with its own rolling baseline (median and MAD), so a 2k-viewer chat and a 60k-viewer chat are judged the same way.
- **Chat delay.** Chat reacts about 7 seconds after the event, so the timeline is shifted back before cutting.
- **Other signals.** For YouTube videos with no chat replay, the "Most replayed" heatmap and audio spikes do the same job.
- **Persona agent.** `config/streamers.yaml` holds a persona for each of the 43 creators: energy, catchphrases, running bits, which moment types go viral, copyright notes. Claude Opus 5.5 reads it with each batch of candidate moments. It rejects false spikes (giveaways, raids, sub trains), tightens the cut, and writes native hooks, titles and hashtags for each language.
- **Learning from results.** After 48h, a post counts as a "win" if it beats that channel's median views. A Thompson-sampling bandit then picks hook style, caption style and clip length for new clips, and decides which streamers to clip more. `learn` has Claude rewrite each streamer's "what works" notes from the real numbers.

## Install (on your computer or a cheap VPS)
```bash
cd clipper
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg with libass:   macOS: brew install ffmpeg   |  Ubuntu: apt install ffmpeg
# yt-dlp needs a JS runtime for YouTube now:  install deno  (https://deno.land)  — or: pip install yt-dlp[default]
export ANTHROPIC_API_KEY=sk-ant-...      # the persona agent + translations
python -m pytest tests -q                # needs: python tests/make_fixture.py
```
Without `ANTHROPIC_API_KEY` everything still runs. Clips are then ranked by signal strength only and get template hooks.

## Daily use
```bash
python -m clipper discover                                      # new GTA 6 VODs from all 43 creators
python -m clipper process "https://www.twitch.tv/videos/123..."   # clip one VOD
python -m clipper process "https://www.youtube.com/watch?v=..."   # YouTube video or stream VOD
python -m clipper watch kaicenat                                # LIVE: clip as it happens
python -m clipper queue                                         # rendered clips waiting to post
python -m clipper post --now                                    # post the best clips now (respects daily caps)
python -m clipper run --loop --every 20                         # full autopilot: discover→clip→post→metrics
python -m clipper report                                        # A/B results + streamer leaderboard
python -m clipper learn                                         # AI updates each streamer's "what works" notes
```
Rendered clips go to `out/<account>/<source>/`. Each one comes with a `.caption.txt` (title, description with credit, hashtags) and a `.json` (virality score, the agent's reasoning, A/B arms). Until the APIs are connected, you can upload straight from that folder by hand.

## Paid clipping campaigns (Content Rewards, Vyro, streamer networks)
```bash
python -m clipper campaigns list           # 27 researched campaigns + status + $/1k
python -m clipper campaigns run            # clip new videos from every campaign you've joined
python -m clipper campaigns submissions    # posted campaign clips you still need to submit on the site
python -m clipper campaigns submitted 12   # mark post 12 as submitted
python -m clipper campaigns earnings       # estimated payout (views x CPM, min/max applied)
```
How it works:
1. Join a campaign on its site and link your accounts there.
2. In `config/campaigns.yaml`, set `joined: true` and `status: active`, and copy the campaign's rules: hashtags, @mentions, length, and things to avoid.
3. The pipeline then clips that campaign's channels and gives the AI the creator's brief. It forces the rules into every caption and adds the ad label (`#ad`, `#publicidad` or `#publi`). It also keeps betting campaigns off the PT-BR account, as Brazilian ad rules require.
4. Campaign clips get priority in the posting queue, weighted by $/1k.
5. The autopilot (`run --loop`) includes campaigns. Expected GTA 6 campaigns (Kai Cenat, N3on, Adin Ross, Ibai/AuronPlay) are already listed as `expected`. Flip them on the day they go live.

Rejection traps to avoid: hidden like counts, editing the caption after approval, and posting after the campaign's budget runs out. Research: `docs/CAMPAIGNS_RESEARCH.md`.

## How much to post (no-shadowban schedule)
10+ posts a day on ONE account is risky. Spread volume across accounts instead. New accounts ramp up automatically from each account's `started` date (`config/settings.yaml → cadence`):

| | warm-up | week 1 | weeks 2–4 | steady | min gap | hard cap |
|---|---|---|---|---|---|---|
| TikTok | 4 days | 1/day | 2/day | 3/day | 2.5 h | 5 |
| YouTube Shorts | 0 | 2/day | 3/day | 4/day | 1.5 h | 6 |
| Instagram Reels | 4 days | 1/day | 2/day | 2/day | 3 h | 3 |

The real ban risk is unoriginal content, not volume. Keep the hooks, captions and edits on every clip, and never post the exact same file on two accounts. Details: `docs/POSTING_VOLUME_RESEARCH.md`.

## Connect the accounts (when you're on your computer)
1. **Create the 6 accounts.** That is one YouTube channel and one TikTok per language. Put each channel's handle in `config/settings.yaml → accounts` (it is burned into the video as a small watermark).
2. **YouTube.**
   - In Google Cloud, create a project and enable YouTube Data API v3.
   - Create an OAuth client of type *Desktop* and save it as `secrets/youtube_client_secret.json`.
   - Run `python -m clipper auth youtube --account en`, then the same for `es` and `pt`, logging in as each channel.
   - Google may lock uploads from unaudited projects to private. The uploader warns you if that happens; if so, submit the free API audit form.
3. **TikTok.**
   - On developers.tiktok.com, create an app with Login Kit and Content Posting API.
   - Save `secrets/tiktok_app.json`, then run `python -m clipper auth tiktok --account en` (and `es`, `pt`).
   - Default mode is `inbox`: clips land in your TikTok drafts and you tap post. Adding a trending sound in the app helps reach.
   - Unaudited apps can only post privately, so apply for the audit. Alternatively, use an audited scheduler such as Upload-Post or Ayrshare.
4. **Schedule.** Put `python -m clipper run` on cron every 20 minutes. Posting only fires inside each account's `post_windows_local`.

## Money plan
| Lever | Details |
|---|---|
| **YouTube Shorts (YPP)** | 45% Shorts revenue share. Needs 1,000 subs + 10M Shorts views in 90 days. **Thresholds rise for new applicants on 1 Feb 2027 — apply before that.** |
| **TikTok Creator Rewards** | Needs 10k followers, 100k views/30 days, **videos over 1 minute**. That's why `tiktok_long_variant` exists. Brazil and Mexico are eligible; Spain is unconfirmed. |
| **Paid clipping campaigns** | Content Rewards (formerly Whop) has a median of about $1.09 per 1k views; Vyro pays $1.50–2. N3on's clipper network paid about $1.4M to 303 clippers at about $40 per 100k views. **These pay from day 1 without monetized channels.** Join campaigns for GTA 6 streamers and point the farm at those streamers. |
| **Language arbitrage** | 9 of the top 10 GTA streamers of 2025 were non-English. ES/PT clip markets are less crowded, and the best moments cross-post with translated captions (`crosspost_from`). |

Full sources: `docs/RESEARCH_TECH_AND_MONEY.md`, `data/research/streamers_research.yaml`.

## Risks
- **Reused-content policy (YouTube).** Unedited reposts get demonetized channel-wide, and since 1 Oct 2026 Shorts gives them less reach. Even with the streamer's permission, a clip can still count as reused content. The pipeline adds original hooks, captions, translation, a per-channel style and tight edits. Keep that, and don't post raw cuts.
- **Copyright strikes.** IShowSpeed and Adin Ross have reportedly had clip channels struck (see notes in `config/streamers.yaml`). Prefer streamers with paid clipping programs, or ones who openly tolerate clippers. Always credit the streamer (it's automatic in the description).
- **Spoilers.** Story spoilers right after launch are what Rockstar has historically taken down.
- **Volume.** 3–6 posts per channel per day is the default. Spamming 20+ a day gets channels flagged as inauthentic.

## Files
```
config/settings.yaml          accounts, thresholds, posting windows, A/B factors
config/streamers.yaml         persona knowledge base (GENERATED — edit research yaml / overrides, run tools_build_streamers.py)
config/streamers_overrides.yaml   facecam boxes, priority bumps, notes
config/hype_lexicon.yaml      chat vocabulary + weights (research vocab merged in automatically)
config/learned/<id>.md        what the A/B results taught the agent about each streamer
clipper/signals/              chat / audio / heatmap / keyword detectors
clipper/detect.py             signal fusion → candidate moments
clipper/agent.py              Claude persona + virality agent, caption translation, learning
clipper/render.py             ffmpeg 9:16 render with karaoke captions + hook
clipper/sources/              yt-dlp (YouTube/Twitch/Kick), Twitch VOD chat + live chat + stream buffer
clipper/publish/              YouTube Data API + TikTok Content Posting API
clipper/experiments.py        Thompson-sampling A/B testing
```
