Put credentials here (this folder is git-ignored):

- `youtube_client_secret.json` — OAuth "Desktop app" client from Google Cloud Console (YouTube Data API v3 enabled)
- `youtube_token_<account>.json` — created automatically by `python -m clipper auth youtube --account en`
- `tiktok_app.json` — `{"client_key": "...", "client_secret": "...", "redirect_uri": "..."}`
- `tiktok_token_<account>.json` — created by `python -m clipper auth tiktok --account en`
- `twitch_app.json` (optional) — `{"client_id": "...", "client_secret": "..."}` for Helix API discovery

Set `ANTHROPIC_API_KEY` in your shell for the persona/virality agent.
