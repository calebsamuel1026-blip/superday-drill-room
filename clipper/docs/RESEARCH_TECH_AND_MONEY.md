# Clipper Pipeline: Tech and Monetization Research

Research date: 2026-11-16. Scope: Python auto-clipping pipeline (chat spikes, audio spikes, YouTube "most replayed" heatmap, LLM ranking, 9:16 render with captions) that auto-publishes to YouTube Shorts and TikTok across three language accounts (EN, ES, PT-BR).

**How sure we are.** Each claim is marked:
- **[verified]**: checked against source code or primary docs during this session.
- **[reported]**: from secondary sources (blogs, vendor guides, trade press). Recheck before relying on it.

**Network limits in this session.** The sandbox could not reach `developers.google.com`, `developers.tiktok.com`, `gql.twitch.tv`, `dev.to` or `bundle.social`, and the GitHub API was unavailable. As a result:
- Google and TikTok policy points come from search snippets of the official pages, not from reading those pages.
- The Twitch GQL request could not be tested live.
- Star counts come from GitHub repo pages, fetched where possible.
- Licenses were read from the raw `LICENSE` files on raw.githubusercontent.com.

---

## 1. Open-source repos to reuse

### 1a. End-to-end "long video to Shorts" generators

| Repo | Stars (approx.) | License | What to reuse |
|---|---|---|---|
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | ~8.5k | **MIT** for the core. `cloud/` is under a source-available commercial license, so don't copy it. | Word-level transcript, then scene detection, then an LLM picks 3-15 moments, then FFmpeg cuts them. 9:16 reframe with MediaPipe and YOLOv8 face tracking, plus blurred-background, stacked split-screen and screencast layouts. Burned subtitles and hook-text overlay. REST API, webhooks and MCP server. The most complete MIT reference. |
| [SamurAIGPT/AI-Youtube-Shorts-Generator](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) | ~6.1k | **MIT** | faster-whisper (local) transcription. An LLM virality-scores segments 0-100 for hooks, emotional peaks and conflict. Videos over 30 minutes are split into overlapping chunks, and overlapping candidates are deduped by score. OpenCV face tracking with motion smoothing for the crop. Good template for the LLM ranking prompt. |
| [FujiwaraChoki/supoclip](https://github.com/FujiwaraChoki/supoclip) | ~3.2k | **AGPL-3.0**. Do not copy into a closed or hosted product. | LLM picks 3-7 segments, with scores for hook, engagement, value and shareability. AssemblyAI word-synced captions. Use for ideas only. |
| [ClipsAI/clipsai](https://github.com/ClipsAI/clipsai) | ~570 | **MIT** | Library split into a transcript-based clip finder (WhisperX) and a `resize` that reframes 16:9 to 9:16 on the active speaker using Pyannote diarization (needs an HF token). Clean, importable modules. |
| [NaufalRizqullah/opensource-clipping](https://github.com/NaufalRizqullah/opensource-clipping) | small, 2026, active | **MIT** | MediaPipe BlazeFace face-tracked 9:16 crop with smoothing and a deadzone (anti-jitter). Pyannote speaker-switch camera. Blurred pillarbox when speakers overlap. Karaoke subtitles, hook teasers and auto thumbnails. |
| [SysAdminDoc/Vertigo](https://github.com/SysAdminDoc/Vertigo) | small | **MIT** | "Smart Track": samples MediaPipe faces at 2 fps, turns them into keyframes, renders with FFmpeg. A cheap tracking approach. |
| [Shaarav4795/ClippedAI](https://github.com/Shaarav4795/ClippedAI) | small | **CC BY-NC 4.0**. Non-commercial, do not copy. | Ideas only. |

### 1b. Captions and transcription

| Repo | License | Notes |
|---|---|---|
| [m1guelpf/auto-subtitle](https://github.com/m1guelpf/auto-subtitle) | **MIT** | Whisper, then SRT, then FFmpeg burn-in. Tiny and easy to copy. |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | **MIT** | CTranslate2 Whisper, about 4x faster. Has `word_timestamps=True`. Recommended ASR backend for EN, ES and PT. |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | **BSD-2-Clause** | Forced alignment for accurate word timings, which karaoke captions need, plus diarization. |
| [jianfch/stable-ts](https://github.com/jianfch/stable-ts) | **MIT** | Stabilized word timestamps. Writes ASS directly for styled word-by-word captions. |
| [mli/autocut](https://github.com/mli/autocut) | **Apache-2.0** | Transcript-driven cutting (edit the markdown transcript to cut the video). |

### 1c. Chat-spike and highlight detectors

| Repo | License | Technique |
|---|---|---|
| [joaohenggeler/twitch-chat-highlights](https://github.com/joaohenggeler/twitch-chat-highlights) | **MIT** | Counts specific emotes or words (for example LUL, KEKW, Pog) in sliding windows of about 20 s, ranks the top N, and plots them. Copyable. |
| [hougesen/twitch-highlight-finder](https://github.com/hougesen/twitch-highlight-finder) | check the repo (Rust thesis project) | Emote-based, language-agnostic scoring. Emotes work across EN, ES and PT, which suits a multilingual pipeline. |
| [packsun/chatplot](https://github.com/packsun/chatplot) | GPL-2.0 | Histogram of messages per minute, top 9 minutes. Idea only. |
| [xurei/twitch-highlights-logger](https://github.com/xurei/twitch-highlights-logger) | GPL-3.0 | Window message counts. Idea only. |
| [emso-c/stream-analyser](https://github.com/emso-c/stream-analyser) | GPL-3.0 | YouTube stream chat analysis. Idea only. |
| StreamLighter ([write-up](https://him229-github-io.pages.dev/side-projects/streamlighter)) | n/a | Moving average of chat density per second, triggering on spikes. |
| "Clip it" ([Devpost](https://devpost.com/software/clip-it)) | n/a | Rolling median of 30 s windows, flagging windows well above the median. |
| LIGHTOR paper ([PDF](https://www2.cs.sfu.ca/~jnwang/papers/lightor.pdf)) | academic | Chat-timestamp highlight initialization. Handles the delay between an event and the chat reaction. |

**Recommended spike algorithm** (synthesized from the above):
1. Bucket messages into 1-2 s bins.
2. Compute a robust z-score against a rolling median and MAD baseline over 5 minutes.
3. Add an emote-weighted term (LUL, KEKW, OMEGALUL, Pog, W, "KKKK" for PT-BR, "JAJAJA" for ES) and a unique-chatters term.
4. **Shift the window back 10-30 s**, because chat lags the moment.
5. Merge the result with the audio RMS/loudness spikes and the YouTube heatmap.
6. Pass the top-K windows to the LLM ranker with the transcript.

### 1d. Chat downloaders and heatmap helpers

| Repo | License | Notes |
|---|---|---|
| [lay295/TwitchDownloader](https://github.com/lay295/TwitchDownloader) | **MIT** | C# GUI and CLI (`TwitchDownloaderCLI chatdownload --id <vod> -o chat.json`). Releases continue: 1.56.5 (20 Jul 2026) fixed chat JSON deserialization ([releases](https://github.com/lay295/TwitchDownloader/releases)). It is the reference implementation of the GQL call in section 2. |
| [xenova/chat-downloader](https://github.com/xenova/chat-downloader) | **MIT** | Python. Handles YouTube live and past broadcasts and Twitch live, past broadcasts and clips. About 1.2k stars. Maintenance is uneven, so test it. |
| [PetterKraabol/Twitch-Chat-Downloader](https://github.com/PetterKraabol/Twitch-Chat-Downloader) | **MIT** | Python. Older and has historically broken on API changes ([410 errors](https://lightrun.com/answers/petterkraabol-twitch-chat-downloader-410-client-error)). |
| [Dorian25/ytb-most-replayed](https://github.com/Dorian25/ytb-most-replayed) | **MIT** | Scrapes the most-replayed heatmap. Not needed, because yt-dlp exposes it (section 3). |
| [WillianAgostini/youtube-heatmap](https://github.com/WillianAgostini/youtube-heatmap) | GPL-3.0 | Same purpose. Idea only. |

### 1e. Reframing references
- [Google AutoFlip (MediaPipe)](https://opensource.googleblog.com/2020/02/autoflip-open-source-framework-for.html). MediaPipe is **Apache-2.0** ([google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)). AutoFlip is the C++ reference for saliency-based reframing. For Python, use MediaPipe Face Detection with an EMA or Kalman filter and a deadzone, as opensource-clipping does.
- Practical pitfalls are covered in [ClipSpeed on face tracking](https://dev.to/kyle_clipspeedai/face-tracking-for-vertical-video-why-its-harder-than-it-looks-and-how-it-works-3e97). For gaming streams, use a split layout (facecam on top, gameplay on the bottom) rather than a face crop.

**License summary:** freely copyable (MIT/BSD/Apache) are openshorts core, SamurAIGPT, ClipsAI, opensource-clipping, Vertigo, auto-subtitle, faster-whisper, whisperX, stable-ts, autocut, twitch-chat-highlights, TwitchDownloader, chat-downloader and MediaPipe. **Do not copy** supoclip (AGPL), ClippedAI (NC), the GPL chat tools, or openshorts `cloud/`.

---

## 2. Fetching chat replay

### 2a. YouTube live VOD chat with yt-dlp [verified against yt-dlp source]

```bash
yt-dlp --skip-download --write-subs --sub-langs live_chat -o "%(id)s" URL
# produces <id>.live_chat.json
```

**Format.** The file is **JSON Lines**: one JSON object per line, with `ensure_ascii=False`.

**Not json3.** `live_chat` is its own "subtitle" track with the extension `.json`. `json3` is the format for normal captions and is unrelated.

Source: [`yt_dlp/downloader/youtube_live_chat.py`](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/downloader/youtube_live_chat.py).

**Each line of a replay (finished VOD):**

```
line.replayChatItemAction.videoOffsetTimeMsec            -> str, ms from video start  (int(...))
line.replayChatItemAction.actions[]                      -> list (usually 1)
  [i].addChatItemAction.item.liveChatTextMessageRenderer
        .message.runs[].text                             -> text pieces
        .message.runs[].emoji.shortcuts[0] / .emoji.emojiId   -> emoji runs (no "text")
        .authorName.simpleText                           -> display name
        .authorExternalChannelId                         -> channel id
        .timestampUsec                                   -> str, wall-clock epoch microseconds
        .id                                              -> message id
  other renderers under .item: liveChatPaidMessageRenderer (superchat; .purchaseAmountText.simpleText),
        liveChatMembershipItemRenderer, liveChatPaidStickerRenderer, liveChatViewerEngagementMessageRenderer
  other action types: addLiveChatTickerItemAction, addBannerToLiveChatCommand, markChatItemAsDeletedAction, ...
```

**Live-recorded lines** (chat captured while the stream was live) are wrapped differently:

```
{"replayChatItemAction": {"actions": [<action>]}, "videoOffsetTimeMsec": "<ms>", "isLive": true}
```

Here `videoOffsetTimeMsec` sits at the **top level**, not inside `replayChatItemAction`.

Robust parser:

```python
off = obj.get("videoOffsetTimeMsec") or obj["replayChatItemAction"].get("videoOffsetTimeMsec")
for a in obj["replayChatItemAction"]["actions"]:
    r = a.get("addChatItemAction", {}).get("item", {}).get("liveChatTextMessageRenderer")
    if r: text = "".join(x.get("text") or (x.get("emoji",{}).get("shortcuts") or [""])[0] for x in r["message"]["runs"])
```

This works for VODs of past live streams and premieres. It does not work for normal uploads, which have no chat. Downloading chat while a stream is live runs until the stream ends.

### 2b. Twitch VOD chat with the GQL `VideoCommentsByOffsetOrCursor` query

Verified against TwitchDownloader `master` [ChatDownloader.cs](https://github.com/lay295/TwitchDownloader/blob/master/TwitchDownloaderCore/ChatDownloader.cs). Not live-tested from this sandbox.

**Endpoint and headers:**
- `POST https://gql.twitch.tv/gql`
- `Client-ID: kd1unb4b3q4t58fwlpcbzcbnm76a8fp`. TwitchDownloader's chat downloader uses this ID now.
- The web client ID `kimne78kx3ncx6brgo4mv6wki5h1ko` is still used elsewhere in TwitchDownloader, for example VOD access tokens and badges. It is more likely to trigger Client-Integrity challenges.

**First page (by offset):**

```json
{"operationName":"VideoCommentsByOffsetOrCursor",
 "variables":{"videoID":"<VOD_ID>","contentOffsetSeconds":0},
 "extensions":{"persistedQuery":{"version":1,
   "sha256Hash":"b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a"}}}
```

**Next pages:** use the same body with `"variables":{"videoID":"<VOD_ID>","cursor":"<last edge cursor>"}`.

**Response paths:**

```
data.video.comments.edges[].cursor
data.video.comments.edges[].node.contentOffsetSeconds   (int seconds)
data.video.comments.edges[].node.commenter.{login,displayName}
data.video.comments.edges[].node.message.fragments[].text  (+ .emote.emoteID)
data.video.comments.edges[].node.createdAt
data.video.comments.pageInfo.hasNextPage
```

**Status as of 2026:** it works, with caveats.
- TwitchDownloader is still shipping chat fixes. Release 1.56.5 (Jul 2026) is current.
- An earlier release warned: "Twitch has started cracking down on the use of their private GraphQL API ... Chat downloading works again, for now" ([1.52.7](https://newreleases.io/project/github/lay295/TwitchDownloader/release/1.52.7)).
- [reported] Cursor paging sometimes hits the Client-Integrity challenge. One workaround is to page **by `contentOffsetSeconds` only**: re-query at the last offset + 1 and dedupe by `node.id` ([Apify actor notes](https://apify.com/devilscrapes/twitch-vod-chat-archive)).
- [reported] There is heavy IP throttling after about 10k messages.
- This is an undocumented private API and may conflict with Twitch's terms.

**Mitigations:**
- Shell out to `TwitchDownloaderCLI chatdownload`. Its maintainers track hash and client-ID changes.
- Pin the hash in config.
- Where possible, record live chat yourself (2c).

### 2c. Live Twitch chat via anonymous IRC [reported, still in use in 2026]

```
wss://irc-ws.chat.twitch.tv:443  (or irc.chat.twitch.tv:6697 TLS)
CAP REQ :twitch.tv/tags twitch.tv/commands
PASS SCHMOOPIIE        (any value, or omit)
NICK justinfan12345    (justinfan + random digits)
JOIN #channel
```

- Read-only. The `tags` capability gives the `tmi-sent-ts` ms timestamp and `emotes` positions.
- 2026-dated client libraries still ship this path ([goknut](https://pkg.go.dev/github.com/asabla/goknut/internal/irc), [forum](https://discuss.dev.twitch.tv/t/anonymous-connection-to-twitch-chat/20392)).
- Twitch's official docs push token auth (`chat:read`) or EventSub `channel.chat.message`, which is the official long-term path ([docs](https://dev.twitch.tv/docs/irc/authenticate-bot)).
- Recommendation: run an always-on recorder for the streamers you clip. It gives exact timestamps and removes the need for the fragile VOD GQL.

### 2d. Kick chat history [reported]
- The **official** API (`https://api.kick.com/public/v1/`) covers OAuth, sending chat and webhooks (`chat.message.sent`). It has **no chat-history or VOD-chat endpoint**.
- Live chat comes through Kick's Pusher WebSocket (unofficial) or official webhooks.
- Unofficial past-chat routes have been reported but are not confirmed working ([Apify kick-chat-archive](https://apify.com/devilscrapes/kick-chat-archive), [kickcom Go pkg](https://pkg.go.dev/github.com/xaionaro-go/kickcom)):
  - `GET https://kick.com/api/v2/channels/{channel_id}/messages`, which returns the recent buffer
  - `/api/v1/chat-history/...` style routes
- A DEV write-up says past chat is gone once the stream ends ([DEV](https://dev.to/devil_scrapes/kick-chat-scraper-archive-live-chat-before-it-disappears-forever-32b3)).
- **Plan:** record Kick chat live through Pusher or a webhook, or fall back to audio and heatmap signals only.

---

## 3. yt-dlp `heatmap` (Most Replayed) [verified against yt-dlp source]

- It is a documented info-dict field ([common.py](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/common.py)): "heatmap: A list of dictionaries" with:
  - `start_time`: float seconds
  - `end_time`: float seconds
  - `value`: float between 0 and 1, normalized
- Extraction ([youtube/_video.py `_extract_heatmap`](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/youtube/_video.py)):
  - Reads frameworkUpdates `macroMarkersListEntity.markersList` where `markerType == "MARKER_TYPE_HEATMAP"`.
  - `start_time = startMillis/1000`, `end_time = (startMillis+durationMillis)/1000`, `value = intensityScoreNormalized`.
  - Typically 100 buckets per video (the tests assert `'heatmap': 'count:100'`).
- Usage:
  - From the CLI: `yt-dlp -j --skip-download URL | jq .heatmap`.
  - From Python: `yt_dlp.YoutubeDL({'skip_download':True}).extract_info(url)['heatmap']`.
- The field is `None` or absent when YouTube has no "Most replayed" data, which is common for new or low-view videos.
- Each bucket is 1% of the duration, so for a 3-hour VOD that is about 108 s. Use the heatmap as a coarse prior and refine it with chat and audio signals.

---

## 4. Publishing APIs

### 4a. YouTube Data API v3 `videos.insert`

**Quota.** The 1,600-unit figure is outdated.
- The official revision history notes a change "from approximately 1600 units to approximately 100 units" per upload ([revision history](https://developers.google.com/youtube/data/revision_history)). Third parties date this to Dec 2025.
- The API is moving to **granular quota buckets**, starting with `videos.insert` and `search.list`.
- [reported] Current model:
  - `videos.insert` sits in its own **Video Uploads bucket** at 1 unit per call, with a default of **about 100 uploads per project per day**.
  - The rest of the API shares the usual **10,000 units/day** default (`videos.update` = 50, `thumbnails.set` = 50, `videos.list` = 1).
  - Sources: [timetopost](https://timetopost.co/blog/how-to-upload-videos-youtube-api/), [Blotato](https://www.blotato.com/blog/youtube-api-pricing), [outstand](https://www.outstand.so/blog/youtube-api-pricing-quota).
  - Check the Cloud Console quota page for the project.
- For 3 channels at several Shorts a day each, one project is now enough. More than that needs the quota-extension / API Services audit form.

**Private lock for unverified projects.** The rule has changed.
- Since 28 Jul 2020, uploads from unverified projects created after that date were locked to private until audited.
- [reported via search snippets of the official pages] A **2 Nov 2026** revision-history entry says videos uploaded through `videos.insert` from unverified API projects are **no longer restricted to private viewing mode**, reversing the 2020 policy.
- The `videos.insert` reference now says the same, and an omitted `status.privacyStatus` defaults to public, though creator account settings can still make it private.
- Many 2026 blogs still describe the old lock, but they predate this change.
- Sources: [revision history](https://developers.google.com/youtube/data/revision_history), [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert).

**Action items:**
- Read back `status.privacyStatus` after every upload.
- OAuth consent still needs verification for the `youtube.upload` scope if you go beyond test users. In "Testing" status, refresh tokens expire after 7 days. Publish the app, or keep it in testing and re-auth weekly.
- For Shorts, upload vertical video of 3 min or less. `#Shorts` in the title or description is optional.
- Set `status.containsSyntheticMedia` if AI voice or visuals are used.

### 4b. TikTok Content Posting API [reported; official pages not reachable from the sandbox]

| | Direct Post | Upload (to inbox / drafts) |
|---|---|---|
| Scope | `video.publish` | `video.upload` |
| Flow | `POST /v2/post/publish/creator_info/query/`, then `POST /v2/post/publish/video/init/` (`post_info.privacy_level`, `title` and so on; `source_info` = `FILE_UPLOAD` chunks or `PULL_FROM_URL` from a verified domain), then poll `/v2/post/publish/status/fetch/` | `POST /v2/post/publish/inbox/video/init/`. The video lands in the creator's TikTok inbox, and **the creator must finish posting in the app** with a manual tap. |
| Audit | **Required for public posts.** Unaudited clients: all posts are forced to **`SELF_ONLY` (private)**, limited to **5 users per 24 h**, and those accounts must be set private when posting. Posts made before the audit stay private afterward. | No audit needed for the inbox flow, but it is not hands-free. |
| UX requirements (audit) | Show creator nickname/avatar from `creator_info`, a privacy dropdown with no default, interaction toggles, a commercial-content disclosure, and user consent before posting. TikTok rejects "personal account management utilities". | |
| Caps | [reported] about 15 posts per day per creator across all API clients. `init` is rate-limited to about 6 per minute per user token. | |

Sources:
- [Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [Get started](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [bundle.social on approval](https://bundle.social/blog/tiktok-api-approval)
- [Postiz TikTok docs](https://docs.postiz.com/providers/tiktok)
- [adaptlypost](https://adaptlypost.com/blog/why-does-my-app-need-approval-post-tiktok)

**Implication:** an internal tool for our own 3 accounts is unlikely to pass the audit by itself. Use an already-audited third-party poster (4c), or use Upload-to-inbox and have a human tap publish.

### 4c. Audited aggregators for multi-account posting [reported; vendor pricing pages, Sep-Oct 2026]

| Service | API | TikTok + YT Shorts | Price signal |
|---|---|---|---|
| [Upload-Post](https://www.upload-post.com/pricing-comparison) | REST on all plans, plus n8n/Make/MCP | Yes. TikTok needs a paid plan. | From $24/mo ($16 annual), unlimited posts, priced per profile |
| [Buffer](https://buffer.com/resources/social-media-api-multi-platform-posting/) | API on every plan | Yes | Free tier; paid plans priced per channel |
| [Metricool](https://www.upload-post.com/metricool-pricing/) | API only on Advanced (from €43/mo) | Yes | Priced per brand (1 account per network per brand) |
| [Ayrshare](https://www.upload-post.com/ayrshare-pricing/) | Mature REST, multi-profile ("Business") | Yes | From $149/mo; Business about $599/mo |
| Blotato, Zernio, PostPeer, Postiz (self-host OSS) | REST | Yes | $29-$97/mo ([Blotato research](https://www.blotato.com/research/social-media-agent-pricing)) |
| Repurpose.io | No public API found | Auto-repost workflows | n/a |

**Recommendation:**
- Post to **YouTube directly** with our own project, since the quota and private lock are no longer blockers.
- Post to **TikTok through Upload-Post or Ayrshare** under their audited client, so posts are public with no audit of our own.
- Keep a TikTok inbox-upload fallback.

---

## 5. Monetization (late 2026)

### 5a. YouTube Shorts
- **Revenue share:** creators keep **45%** of the Shorts ads pool, allocated by views. Music licensing is deducted first. Long-form is 55%.
- **YPP ad-revenue tier today:** 1,000 subscribers plus either 4,000 public watch hours in 12 months or **10M public Shorts views in 90 days**.
- **From 1 Feb 2027 (new applicants):** the thresholds rise. Coverage describes the watch-hour and Shorts-view requirements doubling for new creators. Channels already in YPP are reported as unaffected.
  - Sources: [vidIQ 2027 changes](https://vidiq.com/blog/post/youtube-partner-program-changes-2027/), [Metricool](https://metricool.com/youtube-partner-program-2027-changes/), [exchange4media](https://www.exchange4media.com/industry-briefing-news/youtube-sets-10-million-shorts-views-for-monetisation-from-2027-157245.html).
  - Sources conflict on whether 10M is the current or the 2027 figure. **Apply before Feb 2027 if eligible.**
- **Lower tier:** 500 subs, 3 uploads in 90 days, and 3k watch hours or 3M Shorts views. This unlocks fan funding and Shopping, not ads.
- **Shorts RPM:** typically about $0.03-$0.10 per 1k views. It is higher for EN/US audiences and lower for ES/PT-BR ([vidIQ](https://vidiq.com/blog/post/youtube-shorts-monetization/)).

### 5b. TikTok Creator Rewards Program (CRP)
- **Requirements:** 18+, **10k followers**, **100k qualified views in the last 30 days**, and **original videos longer than 1 minute**.
- **Countries:** most consistently listed as **US, UK, Germany, Japan, South Korea, France, Mexico, Brazil**, attributed to the TikTok Creator Academy page updated 11 Sep 2026.
  - **Brazil: eligible. Mexico: eligible. Spain: not confirmed.** Only one weak source lists Spain.
  - TikTok checks the *creator's* account region, so the ES account should target Mexico or LATAM, or be registered in an eligible country.
  - Sources: [shortsfast](https://shortsfast.com/blog/tiktok-creator-rewards-eligibility-2026/), [ttcalculator](https://ttcalculator.net/learn/creator-fund-countries/), [toptal](https://www.toptal.com/creator/post/how-to-join-the-tiktok-creator-rewards-program).
- **Implication:**
  - Clips must be **longer than 60 s**. Build a "61-90 s" render profile for TikTok and keep 20-45 s for Shorts.
  - CRP "originality" checks penalize unedited reuploads, so the transforms in 5e apply here too.

### 5c. Clip-paying marketplaces (pay per 1k views on our own accounts)

| Platform | Typical CPM | Notes |
|---|---|---|
| **Content Rewards** (ex-"Whop Content Rewards"; [contentrewards.com](https://contentrewards.com/articles/clipping-data), [Whop docs](https://docs.whop.com/manage-your-business/growth-marketing/content-rewards)) | **Median about $1.09 / 1k**; $1.00 is the most common rate. The 10 Nov 2026 snapshot covered 707 live campaigns. Range $0.05-$6. | Per-clip payout caps. Since 25 Sep 2026, earnings stop 30 days after submission. Platform fee about 7-10% ([clipspeed](https://www.clipspeed.ai/blog/whop-content-rewards-clipping-guide.html)). Many campaigns are streamer or podcast clipping, which fits our pipeline. |
| **Vyro** (MrBeast-backed, launched Oct 2025) | Set per campaign; **$1.50-$2.00 / 1k** in Sep 2026 listings (older "flat $3" claims) | [clipspeed Vyro](https://www.clipspeed.ai/blog/vyro-clipping-platform-mrbeast-guide.html), [opus Vyro vs Whop](https://www.opus.pro/blog/vyro-vs-whop) |
| Clipping.net | $0.50-$3 / 1k (sources conflict) | [ssemble](https://www.ssemble.com/blog/best-clipping-platforms-2026) |
| ClipAffiliates | $1-$5 / 1k (self-reported) | [clipaffiliates](https://www.clipaffiliates.com/blog/clipping-cpm-rates-2026) |
| Clipping.io, ClipFarm | No reliable 2026 data found | Verify before use |

**Rule of thumb:** about $1 per 1k views from campaigns. That is 10-30x Shorts ad RPM, so campaigns should be the primary revenue source and platform payouts a bonus. Campaigns usually require per-campaign tags or captions and view verification through account linking, so the pipeline needs a per-campaign caption and hashtag template.

### 5d. GTA 6
- **GTA 6 launches 19 Nov 2026**, three days from now ([ghostshorts guide](https://ghostshorts.com/blog/gta-6-clipping-guide-2026)).
- **No Rockstar-run paid clipping program was found.**
- Expect a flood of streamer-sponsored campaigns on Content Rewards and Vyro (GTA 6 streams from Kai Cenat-, xQc- and IShowSpeed-tier creators).
- Rockstar/Take-Two is aggressive on leaks and copyright, which is a risk for pre-release footage.
- Medal runs a GTA 6 *giveaway* quest, not paid clipping ([medal.tv](https://medal.tv/features/gta6)).
- Opportunity: high-volume EN/ES/PT-BR clips of big GTA streamers during launch week, through campaigns that the streamers themselves fund.

### 5e. Reused/inauthentic content risk (YouTube) and transforms

**15 Jul 2025 update.**
- "Repetitious content" was renamed "**inauthentic content**", covering mass-produced and repetitive videos. YouTube called it a minor clarification.
- The separate **reused content** policy (clips, compilations, reactions) was "unchanged".
- Enforcement is **channel-wide demonetization**, not per video.
- Sources: [SEJ](https://searchenginejournal.com/youtube-targets-mass-produced-content-in-monetization-update/550337/), [Engadget](https://www.engadget.com/entertainment/youtube/never-fear-reaction-videos-are-still-allowed-under-youtubes-new-inauthentic-content-policy-222401009.html), [ppc.land](https://ppc.land/youtube-clarifies-inauthentic-content-policy-changes/).

**1 Oct 2026 Shorts recommendation update.**
- Shorts recommendations now favor original content and **reduce reach for channels that mostly re-upload others' clips** with little change.
- This is a ranking change, not a ban. Monetization still follows the reused-content policy.
- No numeric threshold has been published, and Studio gives no signal that reach was reduced.
- Sources: [SEJ](https://searchenginejournal.com/youtube-original-shorts-reposted-clips-reach/591774/), [Dexerto](https://www.dexerto.com/youtube/youtube-cracks-down-on-clipping-channels-in-shorts-update-prioritizing-original-content-3415700/), [Social Media Today](https://www.socialmediatoday.com/news/youtube-updates-shorts-algorithm-to-put-more-focus-on-original-content/).

**Key point:** permission from the streamer (for example through a campaign) does **not** satisfy the reused-content policy. That policy is about added value, not copyright ([vidIQ guide](https://vidiq.com/blog/post/youtube-reused-content-policy-guide/)).

**Transforms that reduce risk.** Build these into the renderer and the LLM step:
1. **Original commentary or context.** Use an LLM-written hook or title card and setup text ("What happened before this..."), plus an optional AI or human voiceover intro. This is the strongest signal.
2. **Narrative editing.** Tighten with jump-cuts that remove dead air, add zooms or punch-ins on reactions, and combine multiple angles.
3. **Localization as transformation.** Translated, styled captions in ES and PT-BR, or dubbing. The value added is real, but do not upload the *same* clip across our own channels without changing it.
4. **Unique visual identity per channel.** Consistent caption style, layout (facecam and gameplay split), branded intro and outro, and progress bar.
5. **Avoid template spam.** Vary the hooks, titles, thumbnails and cut points. Don't post dozens of near-identical clips a day. Cap at roughly 3-6 per channel per day.
6. **Credit the source** (streamer name and link). This does not protect monetization, but it helps with claims and the trust signals campaigns want.
7. **Original series formats** add authorship: "Top 5 moments this week", reaction compilations with your own ranking, "explained" clips.
8. Set `containsSyntheticMedia` when using AI voice or visuals.

On TikTok, the same transforms help with CRP "originality" checks, and clips must run longer than 60 s.
