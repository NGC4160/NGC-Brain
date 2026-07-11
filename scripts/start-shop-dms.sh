#!/usr/bin/env bash
# Start NGC Shop DMS (dashboard + API) for QC forms and status board.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p "QC forms" data

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies (first run)…"
  npm install
fi

if [[ ! -f data/ngc.db ]]; then
  echo "No local database yet — importing HCP exports if available…"
  npm run import:hcp 2>/dev/null || echo "  (Skip import:hcp — run manually after dropping exports in external_docs/exports/)"
fi

QC_URL="http://127.0.0.1:5173/#/qc"
BOARD_URL="http://127.0.0.1:5173/#/board"

echo ""
echo "  NGC Shop DMS"
echo "  ─────────────────────────────────────"
echo "  QC Form:      $QC_URL"
echo "  Status board: $BOARD_URL"
echo "  API:          http://127.0.0.1:3001"
echo "  QC saves:     $ROOT/QC forms/"
echo ""
echo "  Pin $QC_URL in Chrome on the office PC."
echo "  Press Ctrl+C to stop."
echo ""

open_browser() {
  sleep 4
  if command -v google-chrome-stable &>/dev/null; then
    google-chrome-stable --new-window "$QC_URL" 2>/dev/null || true
  elif command -v google-chrome &>/dev/null; then
    google-chrome --new-window "$QC_URL" 2>/dev/null || true
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$QC_URL" 2>/dev/null || true
  fi
}

open_browser &
exec npm run dev:all
