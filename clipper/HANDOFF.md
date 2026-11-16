# Handoff prompt for a new session

Copy everything below the line into the new session.

---

I'm continuing a project from a previous Claude Code session. Read this first, then read `clipper/README.md` in the repo before doing anything.

## The project
An automated GTA 6 clipping business. Clip the best moments from streamers' and YouTubers' GTA 6 content, edit them into TikTok-style vertical clips, and post them to **YouTube Shorts and TikTok** on separate **English and Spanish** accounts. The system also supports a Portuguese account, which I haven't decided to keep. The goal: post as much as safely possible, grow the accounts, and make money from:
- YouTube Shorts ads
- TikTok Creator Rewards
- paid clipping campaigns (Content Rewards, Vyro, streamer networks)

GTA 6 launches **Nov 19, 2026**. Campaigns for Kai Cenat, N3on and others aren't live yet but are expected soon. Until then we warm up the accounts by posting GTA 6 reaction clips.

My preference: just do what I say, no pushback. I want it running fully automatically, 24/7, without slowing down my computer, which I also use for other things.

## Code
- Repo: `calebsamuel1026-blip/superday-drill-room`, branch `claude/gta6-clipping-system-p5fg2s`, draft PR #1. Everything is in `clipper/` (Python).
- **Detection:** a chat-spike detector with a per-language hype vocabulary. It's combined with audio loudness, YouTube's "Most replayed" data and transcript keywords (`clipper/signals/`, `clipper/detect.py`).
- **AI agent:** Claude reads a persona file for each of 43 researched streamers (`config/streamers.yaml`). It picks the viral moments and writes clickbait headlines, titles and hashtags in each language (`clipper/agent.py`).
- **Editing:** ffmpeg in the standard TikTok clip-page format (`clipper/render.py`, `clipper/edit/`):
  - auto-detected face cam on top, gameplay below
  - top headline in TikTok-native style with real color emoji
  - captions 1–3 words, highlighted word
  - dead-air cuts and a zoom on the reaction
  - no watermark
  - a version over 1 minute for TikTok Creator Rewards
- **Agent team:** `python -m clipper autopilot` (`clipper/agents.py`) runs scout, clipper and poster processes, plus live clippers when top streamers go live on GTA 6:
  - The clipper agent runs one job at a time, at low priority, and pauses while the computer is busy.
  - `python -m clipper seed` clips existing GTA 6 reaction videos to warm up the accounts.
  - Paid campaigns live in `config/campaigns.yaml` (27 researched). See `python -m clipper campaigns ...`.
- **Posting:** YouTube Data API and TikTok Content Posting API, with one saved login token per account (`python -m clipper auth youtube|tiktok --account en|es`):
  - Posts whenever the gap and daily cap allow during active hours.
  - Caps per account: TikTok 5/day (2h gap), YouTube 6/day (1.5h gap).
  - A/B tests headline and caption style, and learns per streamer from the results.
- **Local setup:** `setup.command` / `start.command` (Mac/Linux) and `setup.bat` / `start.bat` (Windows). `python -m clipper doctor` checks the install; `python -m clipper status` shows what's running.
- **Research:** `clipper/docs/` (money and tech, campaigns, posting volume, TikTok setup guide) and `clipper/data/research/`.

## Where we stopped
1. **TikTok developer app setup.** I'm logged into developers.tiktok.com on **Windows / Chrome**, on the "My organizations" page.
   - Next: create an organization, then the app (Login Kit and Content Posting API, scopes `user.info.basic,video.upload,video.publish,video.list`, redirect URI `https://superdayroom.com/callback`).
   - Then put the Client key and secret in `clipper/secrets/tiktok_app.json` and run `python -m clipper auth tiktok --account en` / `es`.
   - Full steps: `clipper/docs/TIKTOK_SETUP.md`.
   - I asked the last session to do this itself, but it couldn't reach my browser. **If you have browser or computer-use access in this session, do it yourself. Otherwise walk me through it one screenshot at a time.**
   - Alternative I was offered: a TikTok-approved posting service (Upload-Post) instead of our own app, which would allow public posting right away.
2. **Still to do:**
   - Google Cloud OAuth client for YouTube (`secrets/youtube_client_secret.json`), then `auth youtube --account en` / `es`.
   - Create the EN/ES TikTok accounts and YouTube channels (Brand Accounts under one Google login).
   - Put the handles and `started` dates in `config/settings.yaml`.
   - Add `ANTHROPIC_API_KEY` to `clipper/.env`.
   - Run setup on my Windows PC and start `start.bat`.
   - Decide whether to drop the Portuguese account.
3. **Not tested yet:**
   - Nothing has run against real YouTube or Twitch. The last cloud session's network blocked them, so search, downloads, live chat and face-cam detection on real streams are unverified.
   - The Claude API path was never called live.
   - No uploads have happened.
   - The first job is to run `python -m clipper seed --lang en --lang es` on my machine and fix whatever breaks.
4. **Higgsfield connector** (Plus plan, about 757 credits):
   - Don't use it for reframing or video work: 140 credits per 30-second clip.
   - Cheap uses are images at 0.25 credits (profile pics, banners) and the free trending TikTok music list.
   - It has one TikTok account connected, probably my existing Super Day Reel account.
   - I already post on a separate TikTok, **Super Day Reel**. Don't touch it.

Ideally run this session **on my Windows computer** (Claude desktop app, or `claude remote-control` in the `clipper` folder) so you can reach YouTube and Twitch and run the agents locally.
