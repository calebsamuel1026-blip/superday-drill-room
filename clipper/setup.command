#!/bin/bash
# macOS / Linux one-time setup. Double-click (macOS) or run: ./setup.command
cd "$(dirname "$0")"
set -e
if [[ "$OSTYPE" == darwin* ]]; then
  if ! command -v brew >/dev/null; then
    echo "Installing Homebrew (needed for ffmpeg/deno)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
  fi
  brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
  command -v deno >/dev/null || brew install deno
  command -v python3 >/dev/null || brew install python
else
  command -v ffmpeg >/dev/null || sudo apt-get install -y ffmpeg
  command -v deno >/dev/null || (curl -fsSL https://deno.land/install.sh | sh)
fi
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
[ -f .env ] || cp .env.example .env
echo
echo "Paste your Anthropic API key (or just press Enter to skip for now):"
read -r KEY
if [ -n "$KEY" ]; then sed -i.bak "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$KEY|" .env && rm -f .env.bak; fi
python -m clipper doctor || true
echo
echo "Setup done. Start the autopilot with: ./start.command  (or double-click it)"
