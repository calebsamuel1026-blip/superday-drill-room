#!/bin/bash
# Starts the fully automatic clipper and keeps it running (restarts after crashes).
# macOS: double-click. Keeps the Mac awake while running. Stop with Ctrl+C or close the window.
cd "$(dirname "$0")"
source .venv/bin/activate
pip install -q --upgrade yt-dlp   # YouTube/Twitch change often; stay current
KEEPAWAKE=""
command -v caffeinate >/dev/null && KEEPAWAKE="caffeinate -dimsu"
while true; do
  $KEEPAWAKE python -m clipper autopilot   # supervisor -> scout + clipper + poster (+ live)
  code=$?
  [ $code -eq 0 ] && break
  echo "autopilot exited ($code) — restarting in 30s (Ctrl+C to stop)"
  sleep 30
done
