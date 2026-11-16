# Paid Clipping Campaigns: Research (2026-11-16)

Scope: platforms that pay clippers per view (CPM), live/recent campaigns (EN/ES/PT-BR), GTA 6 outlook, compliance rules for an automated system, and what top clippers do.

**How this was researched.** Web search only. `WebFetch` could not reach contentrewards.com, clipspeed.ai and similar hosts from this sandbox (DNS blocked). Every figure below therefore comes from search-index snippets of the pages cited. Many sources are vendors (Content Rewards, ClipAffiliates, FindClout, OpenClip, Cut.Pro, Ssemble, ClipSpeed) writing about their own market, and several of them compete with each other. Treat the numbers as a starting point. Before posting, open the live campaign page and check it. Labels used:

- **VERIFIED**: seen on the platform's own listing or docs (still a cached snapshot, so it can be stale).
- **REPORTED**: from a third party or the press.
- **UNVERIFIED**: from a single weak source.

---

## 0. TL;DR for the automation

- **Typical rate.** Real money sits at about **$1 per 1k views**. The Content Rewards snapshot of 707 live campaigns (10 Nov 2026) had a median of **$1.09/1k**:
  - TikTok $1.00
  - Instagram $1.20
  - YouTube $1.425
  - X $1.00
  - Gaming category $1.405
  - Entertainment $1.00
  - UGC-only campaigns $2.00

  Content Rewards then takes **10%** of creator payouts.
- **What limits earnings.** Each campaign has its own **minimum payout per clip** (for example $2 to $15, which works out to 2k to 15k views at $1/1k), a **per-clip cap** ($100 to $1,000 is common) and a **total budget that drains**. Budgets often run out within days.
- **What gets clips rejected.**
  - Missing a required hashtag, @mention or caption text.
  - Missing disclosure.
  - Hiding likes.
  - Posting from an account that isn't linked.
  - Reposting the same edit too many times.
  - Copyrighted music.
  - Botted views. Botting is a **permanent ban**, and the platform can claw back the balance.
- **Discovering campaigns by machine.** There is **no official Content Rewards campaign API**. Third-party Apify actors scrape the public Discover directory. Fields include rate, budget left, burn rate, platforms and status. Vyro, Ssemble and Cut.Pro have no public API either.
- **GTA 6 (launches 19 Nov 2026).** I found **no announced paid GTA 6 clipping campaign** on any marketplace. Kai Cenat has announced a 100% marathon. Adin Ross has talked up a paid GTA 6 server. N3on's network pays about $40 to $50 per 100k views. These are the most likely sources.
- **PT-BR.** Gambling or "bet" promotion, including clipping campaigns and affiliate codes, is **prohibited in Brazil** (MP 1.394). CONAR requires an ad label even when pay is per result.

---

## 1. Platforms

### 1.1 Content Rewards (formerly Whop Content Rewards): the largest marketplace
- **URLs:**
  - https://contentrewards.com
  - Discover: https://contentrewards.com/c/discover, and https://contentrewards.com/discover/<uuid> per campaign
  - Whop docs: https://docs.whop.com/manage-your-business/growth-marketing/content-rewards and https://docs.whop.com/memberships-and-access/third-party-apps/content-rewards
- **How it works.**
  1. Sign up as a creator through Whop.
  2. Connect and verify each social account. The account has to be linked or the submission is rejected.
  3. Join a campaign.
  4. Post the clip on your own account.
  5. Submit the post URL.

  The brand or the AI check then approves the clip. Whop's AI check auto-approves within about 48h, but the owner can still reject manually afterwards. Views are tracked through the linked account.
- **Pay formula:** `views/1000 × rate`, capped at the campaign's per-clip maximum. A clip must also clear the campaign's minimum payout. Example: a $2 minimum at $1/1k needs about 2,000 views. Another: a $3,000 cap at $3/1k stops earning at 1M views. (VERIFIED, from the CR articles "clipping-payouts-explained" and "clipping-cpm-rates-november-2026")
- **Rates (VERIFIED snapshot, 10 Nov 2026, 707 live campaigns):**
  - Overall median $1.0875/1k. The middle 50% sit between $1.00 and $2.00, and the mode is $1.00 (218 campaigns).
  - By platform: TikTok $1.00 (651 campaigns), Instagram $1.20 (595), YouTube $1.425 (416), X $1.00 (129).
  - UGC-only campaigns: $2.00 median.
  - Gaming: 28 campaigns, $1.405 median. Entertainment: 105 campaigns, $1.00.

  CR's own blog says streamer campaigns pay $1 to $5/1k. ClipAffiliates, a competitor, says most pay $0.50 to $1.50. Third-party pages give an overall range of $0.20 to $6.
- **Per-platform rates.** Many campaigns set a separate rate for each platform. Example: TikTok $0.30/1k against $1/1k elsewhere.
- **Fees.**
  - Creators pay 10% on CPM campaigns under the current terms. The FAQ still says 7%, which looks outdated.
  - Brands pay 10%, or 8% if verified. The minimum campaign budget is $1,000.
- **Payout timing.**
  - Per-post clips pay about 15 minutes after approval, once the minimum is reached.
  - Under the older terms, a clip earns for 7 days after approval and the payout is then held for 3 days. ClipSpeed describes this as a "10-day hold".
  - Withdrawing from the Whop balance to a bank, PayPal or crypto wallet takes up to 5 business days.
  - An unsettled payout goes back to the campaign if the clip is rejected (for example for fake views) or the account is banned.
- **Platforms that count:** TikTok, Instagram Reels, YouTube Shorts and X, set per campaign.
- **Known problems.**
  - Budgets drain fast. Don't post into campaigns that are 90% or more spent.
  - Clips get rejected after the views have already come in.
  - Rules can change mid-campaign, and the current terms govern payout.
  - Payouts are held over suspected bots.
  - Many listings are application-only or already completed. Discover shows completed campaigns too.
- **Rejection rule.** The ToS for clippers says brands may only reject based on requirements written in the campaign's Requirements or Description section (https://www.contentrewards.com/terms-of-service/clippers). You can appeal once in the app.
- **Machine-readable:** no official endpoint. Whop's `GET /ad_campaigns` is for paid ads, not Content Rewards. Apify scrapers read the public directory without logging in:
  - `fayoussef/whop-clipping-campaigns-scraper`: rate/1k, budget left, burn rate, platforms, categories, URL, and the budget delta since the last run. https://apify.com/fayoussef/whop-clipping-campaigns-scraper
  - `automation-lab/whop-content-rewards-scraper`: brand, status, type (clipping/UGC), category, description. A "budget monitor" example is included. https://apify.com/automation-lab/whop-content-rewards-scraper
  - `tactful_anvil/whop-content-rewards-scraper`: total, spent and remaining budget, progress %, platforms, creator count, status.
  - `lurkapi/whop-clipping-content-rewards-scraper`
  - An n8n workflow also exists: https://n8n.io/workflows/21119

  **Recommendation:** run one of these, or our own polite scraper of `/c/discover`, on a schedule. Filter on status=active, budget_left > 20%, platforms ∩ {tiktok, youtube}, and language.

### 1.2 Vyro (MrBeast / ViewStats team, launched Oct 2025)
- **URL:** https://vyro.com
- **How it works.** Sign up and pick a campaign. Download or clip the source, which is often footage Vyro provides; some campaigns say not to alter it. Post on your own account and submit the URL. Vyro tracks views across platforms and updates earnings about hourly.
- **Rates.**
  - Vyro's headline is "$3/1k". Live campaigns are mostly $1 to $2.
  - The MrBeast campaign listed $1,000 per 1M views ($1/1k) on 27 Sep 2026.
  - Ketone-IQ and HeyLemon AI listed $1,500 per 1M ($1.50/1k). (REPORTED, FindClout)
  - Other campaigns that have run include Mark Rober and Unwell.
- **Minimum views:** disputed. Sources say 1,000 (FindClout) or 5,000 (streamer.guide).
- **Cap:** about $1,000 per post.
- **Payout.** The minimum withdrawal is $10, once a week, through Stripe or PayPal depending on country. Earnings stay pending until the campaign ends and a final view-verification check runs.
- **Platforms:** TikTok, Reels, Shorts.
- **Rules.** Flagged or botted views can mean a permanent ban. No buying views and no engagement groups.
- **Machine-readable:** none known.
- **Sources:**
  - https://findclout.com/blog/how-much-does-vyro-pay
  - https://www.clipspeed.ai/blog/vyro-clipping-platform-mrbeast-guide.html
  - https://www.ssemble.com/blog/vyro-review-2026
  - https://influencermarketinghub.com/mrbeast-launches-vyro/
  - https://www.clipaffiliates.com/blog/vyro-review

### 1.3 Ssemble Clip Rewards (multi-language: has ES and PT UIs)
- **URLs:**
  - https://www.ssemble.com/clip-rewards
  - Spanish: https://www.ssemble.com/es/clip-rewards
  - Portuguese: https://www.ssemble.com/pt/clip-rewards
  - Help: https://help.ssemble.com/clipper-reward-program-for-clippers
- **Rates:** set by each campaign, roughly $0.35 to $4/1k. The standard rate is $1/1k and creators can set as low as $0.10.
- **Minimum views:** 1,000 per clip.
- **Payout timing.** Earnings become payable 5 days after posting, following a bot and abuse review.
- **Payout method:** conflicting. One page says Stripe (identity plus bank), and the help center says PayPal. The minimum payout is $20 by one page and $10 by an older one.
- **Spanish example.** A Spanish trading streamer spent $500 and got 500k verified views from 100 clippers, a $1.00 effective CPM. https://www.ssemble.com/blog/how-a-spanish-trading-streamer-got-500k-views-for-500

### 1.4 Cut.Pro (Brazil/LatAm "campeonatos de cortes"; PT/ES/EN)
- **URLs:**
  - https://cut.pro/pt-BR/championships (open list)
  - Help: https://cut.pro/pt-BR/help/premios-y-envios
- **Pay models:** a ranking prize, a CPM (custo por mil), or a count of valid clips.
- **Pay rails.** Payouts go by PIX. Brands pay a 20% platform fee on PIX prizes, and the minimum PIX prize pool is R$5,000. Smaller prizes are paid in credits.
- **Withdrawals.** Clippers can withdraw by PIX once every 7 days with no minimum.
- **Per-campaign thresholds** vary. Examples: Piva Educacional has no per-video minimum and pays by PIX every Friday from R$20 accumulated. Thiago Roas pays from 5k views per video, capped at R$200 per video.
- Cut.Pro claims about **US$1/1k** on average.
- **Machine-readable:** championship pages have stable URLs (`/championships/<slug>-<id>`), and some blog pages have `.md` versions. No API.
- **Sources:**
  - https://cut.pro/pt-BR/blog/clipping-championship-budget-2026
  - https://cut.pro/pt-BR/blog/sacar-premio-campeonato-de-cortes-2026
  - https://cut.pro/pt-BR/blog/plataformas-campeonato-de-cortes-comparativo-2026

### 1.5 ClipAffiliates
- **URL:** https://www.clipaffiliates.com
- **Rates:** $1 to $5/1k, set per campaign.
- **Fees:** a 9% fee on payouts. One source says 9% on brand deposits as well.
- **Payout:** crypto, after a 72-hour review window. Free to join.
- Its blog is a useful competitor-comparison source but it is biased.
- https://www.clipaffiliates.com/blog/best-clipping-platforms-compared

### 1.6 Clipping.io / "Clipping" (the company behind Stake and Adin Ross campaigns)
- A performance network that leans toward creator and crypto/iGaming brands. It reports more than $1.5M paid to clippers and about 10k "content reposters". Typical CPM is around $1 to $3. Its fees, payout methods and verification are not published. (REPORTED)
- Bloomberg reports that its Adin Ross / Stake campaign drew **430M views from 11,000 videos by 520 clippers** (self-reported). Stake paid **$500 per 1M views**, raised to **$800 per 1M** in December. That is $0.50 to $0.80/1k.
- https://www.bloomberg.com/features/2026-stake-drake-crypto-casino-adin-ross-gambling/
- Gambling content is a **compliance hazard**: banned in Brazil, age-gated on most platforms, and many ad rules apply.

### 1.7 ClipFarm
- Runs on Whop's infrastructure. Brands pay a 10% fee plus processing. Clippers are paid through Whop, and the brand approves each clip. (REPORTED, https://www.elev8or.io/blog/content-rewards-alternatives)

### 1.8 Clipify, ClipLab, Sidequest, Clipson, Revclip, Vues
- **Clipify:** lists "AI bot detection" as a feature. No fee or payout data found.
- **ClipLab and Sidequest:** no reviews or payout data found. Treat both as unverified.
- **Clipson, Revclip and Vues:** small clipper apps that exist on Trustpilot or in app stores. No data on them.

### 1.9 Promote.fun, FindClout, Lumina Clippers, other networks
- **Promote.fun:** campaign CPMs of $0.50 to $3 (https://findclout.com/blog/promote-fun-vs-vyro).
- **FindClout and Lumina Clippers:** networks or agencies that recruit clippers. https://luminaclippers.com/blog/clipping-platforms

### 1.10 Kick
- Kick has **no published platform-wide rate per view for clippers**. Kick-linked programs run through streamer or org Discords using Kick's native clip tool, which makes clips of 10 to 180 seconds.
- **Claims about Kick paying clippers.**
  - Tubefilter, Business Insider and cut.pro say about half of the roughly 1,000-person N3on / Adin Ross clipper network is paid by Kick. Adin Ross has said Kick pays clippers to make its streams more discoverable.
  - Kick said its clipping initiative drove more than 3B views in September 2025.

  These are REPORTED, not an official program page.
- **KPP (Kick Partner Program).** It pays *streamers*, not clippers. It was revised in September 2026 after a calculation error, moving to a rolling model.
- **Risks.** Discords pay in crypto, bans forfeit pending payouts, and Discords are hard to vet.
- **Sources:**
  - https://findclout.com/blog/kick-clipping-program
  - https://win.gg/kick-clipping-program/
  - https://cut.pro/en/blog/kick-pays-clippers-directly-2026
  - https://streamscharts.com/news/kick-revises-kpp-september-2026-update

### 1.11 Streamer-run clipper networks
- **N3on (with Adin Ross).**
  - The network is about 1,000 clippers, roughly half in India and Nigeria.
  - N3on paid **more than $1.4M to 303 clippers over 5 weeks** (Business Insider, April 2026).
  - Rates: **$40 per 100k views**, sometimes $50 per 100k ($0.40 to $0.50/1k). Earlier periods were $20 to $30 per 100k.
  - Sources:
    - https://www.tubefilter.com/2026/04/29/n3on-spending-millions-stream-clippers-tiktok-kick/amp/
    - https://www.complex.com/pop-culture/a/alex-ocho/n3on-303-clippers-stream-boost
    - https://www.pulse.bot/creator-economy/news/n3on-reveals-he-paid-army-of-clippers-14m-over-five-weeks-to-make-him-go-viral-33b741c8-a67f-4424-b461-32c4c6b8727b/
- **Adin Ross.** In July 2025 he said a clip with 100k views earns the clipper $50 ($0.50/1k). Dexerto could not verify that he pays this himself. https://jamtest.dexerto.com/entertainment/adin-ross-asks-his-viewers-why-they-would-ever-work-a-9-5-job-3230469
- **MrBeast:** $50 per 100k, through Vyro.
- **How to join:** usually through Discord. Applications are run by managers, and payouts go out weekly by PayPal or crypto.

  These Discords are **not machine-discoverable**. You'd have to join each streamer's official Discord (linked from their Kick/X bio) and watch its #clipping / #payouts channels. Scam servers impersonating streamers are common, so **never pay to join**.

### 1.12 Fourthwall, Creator.co, Eklipse, OpusClip
- **Fourthwall and Creator.co:** I found no per-view clipping marketplace on either. Fourthwall is merch and memberships; Creator.co is an influencer/UGC marketplace with flat-fee deals.
- **OpusClip and Eklipse:** these are tools, not payers.

---

## 2. Active / recent campaigns found (as of Nov 2026)

Every listing below comes from a cached search snippet, so I could not confirm live status. **Check each URL before submitting.** Status codes:

- `active`: the snapshot shows budget remaining.
- `ended`: the snapshot shows $0 remaining or submissions closed.
- `unverified`: status unknown.

| # | Who | Platform | CPM | Rules / notes | Status | Source |
|---|---|---|---|---|---|---|
| 1 | Streamer University (Kai Cenat), posted by "Rynenzo" | Content Rewards | $1.50/1k | YT/IG/TT. Max $100 per submission. $1,000 budget, $742 left at the snapshot (about 2 weeks old). | unverified (VERIFIED listing, stale) | https://contentrewards.com/discover/a55d9ef1-915a-4a04-b807-180016adff77 |
| 2 | "Clip Streamers Earn $2 per 1k Views" | Content Rewards | $2/1k | Streamer clipping. | unverified | https://contentrewards.com/discover/9a1fbc53-42de-4487-a1a8-58db5578adef |
| 3 | Streamer clipping campaign | Content Rewards | $1.50/1k | Min $4.50 per clip (about 3k views), max $300 per clip. | unverified | (cited in CR blog snippet) |
| 4 | Streamer campaign, TikTok only | Content Rewards | $1.00/1k | TikTok. | unverified | (CR snippet) |
| 5 | Androgenic | Content Rewards | $1.00/1k | Kick is the reference source. YT/IG/TT. Min $15 / max $150. Submissions closed. | ended | CR discover (Kick query results; exact URL unresolved) |
| 6 | Jack Neel Podcast | Content Rewards | YT $2/1k, TT $3/1k | $5,568 of $6,000 budget left at the snapshot. | active (snapshot) | CR discover (podcast results) |
| 7 | Jerith Podcast Clipping | Content Rewards | $2/1k | YT/TT/IG. $180 of $430 left. | active, nearly drained | CR discover |
| 8 | Double Coverage Podcast ($43k) | Content Rewards | $2/1k | $0 left. | ended | CR discover |
| 9 | KYRO Podcasts | Content Rewards | $1.25/1k | TT/IG/YT/X. Application-only. | unverified | CR discover |
| 10 | Goldie Podcast | Content Rewards | $1/1k | | unverified | https://contentrewards.com/discover/457eb40c-28ad-413a-9e82-9588eb117ca2 |
| 11 | Vibe Scaling Podcast (2) | Content Rewards | $3/1k | | unverified | https://contentrewards.com/discover/af945aa3-5767-451c-a6a0-f808d400b17c |
| 12 | **ES**: Carlos Esparraga, "Clips Hablando - 1$ por cada 1000 visitas" | Content Rewards | $1/1k (TikTok $0.30/1k) | Min payout $7.50. Spanish. | unverified | CR ES results (candidate URLs in YAML) |
| 13 | **ES**: Carlotta Sabina Academy, "Clips Hablando de VALOR" | Content Rewards | YT $0.30/1k | TT/YT/IG. Spanish. | unverified | CR ES results |
| 14 | **ES**: ClippiXStudio Español (Daniel Curto) | Content Rewards | n/a | Spanish. | unverified | CR ES results |
| 15 | **ES**: ClipHaus, Spanish course creator (podcast clips leading to an academy account) | Content Rewards | n/a | Spanish. | unverified | CR ES results |
| 16 | **ES**: EmpireDrop (Ricky World videos) | Content Rewards | n/a | Spanish clips for a Spanish audience. | unverified | CR ES results |
| 17 | MrBeast | Vyro | $1/1k ($1,000 per 1M) | Shorts/TT/Reels. Cap about $1k per post. Don't alter provided clips. | active as of 27 Sep 2026 (REPORTED) | https://findclout.com/blog/how-much-does-vyro-pay |
| 18 | Ketone-IQ, HeyLemon AI | Vyro | $1.50/1k | Brand campaigns. | REPORTED, Sep 2026 | same |
| 19 | N3on clipper network | Discord / direct | $0.40 to 0.50/1k | Apply through his Discord. Kick IRL/gambling content. | active (REPORTED, April 2026) | Tubefilter |
| 20 | **PT-BR**: Thiago Roas | Cut.Pro | CPM in BRL | Pays from 5k views per video, cap R$200 per video. | unverified | https://cut.pro/en/championships/thiago-roas-105051858909433856 |
| 21 | **PT-BR**: Piva Educacional 1ª Edição | Cut.Pro | n/a | No per-video minimum. PIX every Friday from R$20. | unverified | https://cut.pro/pt-BR/championships/piva-educacional-1-edicao-97084674824376320 |
| 22 | **PT-BR**: Flávio Passos, Mariana Rios, Sheviii2k (Deserthon), Cortes Louco por Leilões, Batalha de cortes Erico Rocha | Cut.Pro | n/a | Brazilian creators and streamers. | unverified | cut.pro/…/championships/… |

**Gaps.** I found no indexed Content Rewards or Vyro campaign for a big Spanish gaming streamer (Ibai, AuronPlay, TheGrefg, Rubius) or a big Brazilian one (Gaules, Casimiro, Alanzoka). ES/PT campaigns that exist are mostly course creators, "valor/mindset" podcasts and Brazilian info-product creators. For gaming, Cut.Pro is the best PT-BR venue.

---

## 3. GTA 6 (release 19 Nov 2026, PS5/Xbox Series)

- **Status:** **no paid GTA 6 clipping campaign has been announced or indexed** on Content Rewards, Vyro, Ssemble, Cut.Pro or ClipAffiliates as of 16 Nov 2026. Rockstar/Take-Two is aggressive about DMCA, including takedowns of leak and AI GTA 6 videos, so a publisher-run campaign is unlikely.
- **Twitch claim.** A Cut.Pro blog says Twitch is "working with Rockstar for the launch (clips, Drops, monetization)". This is UNVERIFIED.
- **Most likely to run or fund GTA 6 clipping:**
  1. **Kai Cenat.** He announced a 100% completion marathon at launch and asked fans not to post spoilers. Expect his Streamer University-style CR campaigns. Sources: https://win.gg/kai-cenat-reveals-gta-6-marathon/ and https://sportskeeda.com/us/streamers/news-kai-cenat-hold-gta-6-100-playthrough-marathon-upon-game-s-release
  2. **N3on.** He has a standing paid network at $40 to $50 per 100k. The GTA 6 Extended Look featured an N3on-lookalike streamer character and he recreated the scene live, so GTA 6 content is on-brand for him. https://www.thenationalnews.com/arts-culture/pop-culture/2026/08/30/gta-6-n3on-netflix-kick/
  3. **Adin Ross.** Paid GTA 6 RP server ("get a job in my GTA 6 server and get paid"). He has run Clipping/Stake campaigns before and is linked to Kick's clipper payments.
  4. **Kick itself.** Its pattern is paying clippers to promote Kick streams.
  5. **IShowSpeed and xQc.** Huge GTA audiences, but no known per-view program.
  6. **Spanish and Portuguese.** **Ibai and AuronPlay** get less English-language clipping competition (ClipSpeed GTA 6 streamer guides). In Brazil, look at **Cut.Pro championships** from Brazilian streamers.
- **Practical note.** Unofficial clips of streamers playing GTA 6 earn nothing from campaigns. They only make money through platform creator funds, and they risk Rockstar claims on unreleased or spoiler footage. A clip only counts as campaign revenue once it's attached to a campaign. Watch CR Discover in the Gaming category, plus each streamer's Discord/X, from 19 to 26 Nov.
- **VOD retention.** Twitch keeps VODs for 7 days by default, so launch-week source footage has to be captured quickly.

---

## 4. Rules an automated system must comply with

### 4.1 Platform/marketplace-level (apply to every campaign)
1. **Clips are judged only against the written campaign requirements.** On Content Rewards, rules posted in Discord don't count. Parse the Requirements and Description fields for every campaign.
2. **Link and verify every posting account** on the marketplace before submitting. Posting from an unlinked account means rejection.
3. **Organic views only.** No bought views, bots or engagement pods. The penalty is a permanent ban, and CR can offset the banned creator's balance (CR ToS §13.2). Vyro bans for flagged views.
4. **Don't hide like counts.** Hidden likes mean automatic rejection on many campaigns.
5. **Don't edit the caption after approval**, for example to remove a tag. That breaks the terms the clip was approved on.
6. **Repost limits.** Many campaigns cap how many times the same edit may be reposted. Track this per campaign.
7. **Music and IP.** The clipper clears music. Mute or replace copyrighted audio and use only the source the campaign provides.
8. **Respect campaign source restrictions.** Some campaigns say "don't edit or alter provided clips" (Vyro MrBeast). Others demand original edits.
9. **Rules can change mid-campaign.** Re-fetch requirements before every submission.
10. **Budget awareness.** Skip campaigns that are 90% or more spent. Unpaid views are wasted.

### 4.2 Common per-campaign requirements (seen in briefs)
- A required **@mention** of the creator in every caption.
- Required **hashtags**, for example `#AntCEO #AntCEOyoutube`.
- Required **caption text** or a link-in-bio or pinned comment.
- A **disclosure tag as the very first thing in the caption**, and also **on screen** (Scroll Marketing campaign).
- Minimum or maximum clip length. Kick native clips run 10 to 180 seconds. Campaign minimums are usually 10 to 15 seconds, and Shorts can be up to 3 minutes.
- **Language** of the clip and captions, as in the ES campaigns that ask for Spanish clips for a Spanish audience.
- **Application approval** before you can post (KYRO, some podcasts).
- **Content-match:** the clip must match the brief, with no low-quality reuploads.

### 4.3 Disclosure (FTC / platform / Brazil / Spain)
- **FTC (US).** A paid clip is an endorsement or advertisement, so a clear disclosure is required. Use `#ad`, `#sponsored` or `#paidpartnership` placed up front. CR's FTC page says compliance is required even though CR doesn't always enforce it. https://contentrewards.com/terms-of-service/ftc-compliance
- **TikTok.** Turn on the **Commercial Content / Branded Content toggle** *and* add a caption disclosure. Guides say the toggle is mandatory under the Branded Content Policy. https://influencermarketinghub.com/tiktok-commercial-content-library/
- **YouTube.** Tick **"Includes paid promotion"**, which adds a label. Add a caption or verbal disclosure too.
- **Instagram.** Use the **Paid partnership** label.
- **Brazil, CONAR (May 2026 guide).** Pay-per-result content is still advertising and must be identified as such, for example `#publi` or `#publicidade`.

  **Betting promotion is banned** (MP 1.394). This includes clips and affiliate codes. Paid political content is barred during elections.
- **Spain/LatAm.** I found no specific clipping guidance. Default to `#publi` or `#publicidad`, since Spain's influencer ad rules (Ley General de Comunicación Audiovisual, RD 444/2024) require labelling ads.
- **AI.** TikTok and YouTube require **disclosure of realistic synthetic or AI content and synthetic voice**. Undisclosed AI voice can be demoted. Some campaigns forbid AI voiceovers, so treat "no AI voice" as a parseable rule.

### 4.4 Platform anti-spam (affects account survival)
- **YouTube "inauthentic content" (renamed July 2025) and "reused content".** These cover clips and compilations without meaningful added value, *even with permission*, and are judged across the whole channel. Add commentary, captions, an edit or a storyline, and vary templates. https://www.tubefilter.com/2026/07/13/youtube-inauthentic-content-monetization-policy-update/
- **TikTok.** Frequent reposting from one device or account cluster triggers spam filters. Guides recommend 3 to 5 posts per account per day, with separate devices or accounts to avoid linking.

---

## 5. Tactics of top campaign clippers (mostly vendor-reported, unverified)

- **Volume math:** `posts/day × average views × CPM − rejects`. Example: 10 posts a day × 8k views × $1.50 is about $3,600 a month before rejections. (OpenClip/AutoClip)
- **Accounts:** 4 or more accounts per clipper and double-digit posts per day across them. The top 1% run multiple matured accounts with more than 20 transformed posts a day, automated production, and only high-CPM campaigns.
- **Per-account cadence:** 3 to 5 posts a day per account. More than that hurts reach and can trigger spam filters.
- **Device separation:** cheap Android phones, one per TikTok account.
- **Income tiers (vendor-reported):**
  - Beginners: $100 to $500 a month.
  - Consistent daily clippers: $1k to $3k.
  - Top 1%: $10k or more.

  Claims of $20k to $50k a month and "18 videos a day earning $30k" are unverified. One vendor says 90% of clippers make under $50 a month.
- **Network scale:** N3on had 303 clippers who earned $1.4M in 5 weeks, about $4.6k each on average, or roughly $920 a week. Stake/Adin had 520 clippers and 11k videos, about 21 videos per clipper per campaign, averaging about 39k views per video.
- **Stacking:** campaign CPM, plus platform creator funds (TikTok Creator Rewards, YouTube Shorts revenue share), plus affiliate income, plus account sales. A 100k-follower niche account is said to sell for $1k to $5k.
- **Niche selection.** Pick streamers with search demand for clips: Kai Cenat, IShowSpeed, Adin, N3on, xQc. Podcasts pay the highest stable CPMs, at $2 to $3/1k. Gaming CPMs are above the median.
- **Spanish-language advantage.** There is less competition, for example AuronPlay and Ibai GTA clips.
- **Budget timing.** Join new campaigns in the first 24 to 48 hours before the budget drains, and monitor the burn rate (the Apify `budget delta` field).

---

## Sources (main)
- https://contentrewards.com/articles/clipping-cpm-rates-november-2026
- https://contentrewards.com/articles/clipping-payouts-explained
- https://contentrewards.com/articles/why-clips-get-rejected
- https://contentrewards.com/articles/get-paid-clip-streamers
- https://contentrewards.com/faqs
- https://www.contentrewards.com/terms-of-service/clippers
- https://contentrewards.com/terms-of-service/ftc-compliance
- https://docs.whop.com/manage-your-business/growth-marketing/content-rewards
- https://docs.whop.com/api-reference/ad-campaigns/list-ad-campaigns
- https://apify.com/fayoussef/whop-clipping-campaigns-scraper
- https://apify.com/automation-lab/whop-content-rewards-scraper
- https://apify.com/tactful_anvil/whop-content-rewards-scraper
- https://www.clipspeed.ai/blog/whop-content-rewards-clipping-guide.html
- https://findclout.com/blog/how-much-does-vyro-pay
- https://findclout.com/blog/why-whop-clips-get-rejected
- https://findclout.com/blog/kick-clipping-program
- https://findclout.com/blog/is-clipping-legal
- https://www.ssemble.com/clip-rewards
- https://help.ssemble.com/clipper-reward-program-for-clippers
- https://cut.pro/pt-BR/blog/clipping-championship-budget-2026
- https://cut.pro/pt-BR/blog/como-ganhar-dinheiro-com-cortes-2026
- https://cut.pro/en/blog/ganar-dinero-con-clips-de-gta-6-2026
- https://www.clipaffiliates.com/blog/clipping-cpm-rates-2026
- https://www.tubefilter.com/2026/04/29/n3on-spending-millions-stream-clippers-tiktok-kick/amp/
- https://www.bloomberg.com/features/2026-stake-drake-crypto-casino-adin-ross-gambling/
- https://win.gg/kai-cenat-reveals-gta-6-marathon/
- https://openclip.app/guides/how-much-do-clippers-make
- https://openclip.app/clipping/clipping-campaign-rules
- https://openclip.app/guides/clipping-on-kick
- https://www.tubefilter.com/2026/07/13/youtube-inauthentic-content-monetization-policy-update/
