#!/usr/bin/env bash
# Start the Birdhouse app and print a public URL you can text to a friend.
# Requires: python3, and either cloudflared or npx.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8787}"
HOST="${HOST:-0.0.0.0}"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt

echo "Starting app on http://${HOST}:${PORT} ..."
HOST="$HOST" PORT="$PORT" RELOAD=0 python -m app.main &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
    break
  fi
  sleep 0.5
done

echo
echo "Creating a temporary public link (Cloudflare tunnel)..."
echo "Leave this terminal open while your friend tries it."
echo

if command -v cloudflared >/dev/null 2>&1; then
  cloudflared tunnel --url "http://127.0.0.1:${PORT}"
else
  npx --yes cloudflared tunnel --url "http://127.0.0.1:${PORT}"
fi
