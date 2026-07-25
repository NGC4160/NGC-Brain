#!/bin/bash
# One-command Google Drive setup for NGC cloud + desktop agents.
# Non-interactive: pass creds as env vars or --save CLIENT_ID CLIENT_SECRET REFRESH_TOKEN
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env"

if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  PY="$ROOT/.venv/bin/python3"
else
  PY=python3
fi

echo "=== NGC Google Drive Connect ==="
echo "Cloud agents use the Drive API — no Mac Google Drive Desktop required."
echo ""

get_env() {
  local key=$1
  if [[ -f "$ENV_FILE" ]]; then
    grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true
  fi
}

set_env() {
  local key=$1 val=$2
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ROOT/.env.example" "$ENV_FILE"
  fi
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    fi
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

# Non-interactive: ./scripts/setup/connect_google_drive.sh --save ID SECRET TOKEN
if [[ "${1:-}" == "--save" ]]; then
  if [[ $# -ne 4 ]]; then
    echo "Usage: $0 --save CLIENT_ID CLIENT_SECRET REFRESH_TOKEN" >&2
    exit 1
  fi
  "$PY" "$ROOT/scripts/setup/google_drive_auth.py" --save-creds "$2" "$3" "$4" --page-size 5
  chmod +x "$ROOT/scripts/sync/run_google_drive_sync.sh"
  "$ROOT/scripts/sync/run_google_drive_sync.sh" || true
  echo ""
  echo "=== Connected ==="
  echo "Also add these three values as Cursor Cloud Environment secrets so every agent can use Drive."
  exit 0
fi

CLIENT_ID="${GOOGLE_DRIVE_CLIENT_ID:-$(get_env GOOGLE_DRIVE_CLIENT_ID)}"
CLIENT_SECRET="${GOOGLE_DRIVE_CLIENT_SECRET:-$(get_env GOOGLE_DRIVE_CLIENT_SECRET)}"
REFRESH_TOKEN="${GOOGLE_DRIVE_REFRESH_TOKEN:-$(get_env GOOGLE_DRIVE_REFRESH_TOKEN)}"

if [[ -z "$CLIENT_ID" ]]; then
  if [[ ! -t 0 ]]; then
    echo "Missing GOOGLE_DRIVE_CLIENT_ID (non-interactive). Paste credentials in chat or use --save." >&2
    exit 1
  fi
  echo "Step 1/3 — Google OAuth Client ID"
  echo "  Guide: knowledge/10_automation/google_drive_setup.md"
  read -rp "  Paste GOOGLE_DRIVE_CLIENT_ID: " CLIENT_ID
  set_env GOOGLE_DRIVE_CLIENT_ID "$CLIENT_ID"
  echo ""
fi

if [[ -z "$CLIENT_SECRET" ]]; then
  if [[ ! -t 0 ]]; then
    echo "Missing GOOGLE_DRIVE_CLIENT_SECRET (non-interactive)." >&2
    exit 1
  fi
  echo "Step 2/3 — Google OAuth Client Secret"
  read -rsp "  Paste GOOGLE_DRIVE_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
  set_env GOOGLE_DRIVE_CLIENT_SECRET "$CLIENT_SECRET"
  echo ""
fi

if [[ -z "$REFRESH_TOKEN" ]]; then
  if [[ ! -t 0 ]]; then
    echo "Missing GOOGLE_DRIVE_REFRESH_TOKEN (non-interactive)." >&2
    exit 1
  fi
  echo "Step 3/3 — Refresh Token"
  echo "  https://developers.google.com/oauthplayground"
  echo "  Scope: https://www.googleapis.com/auth/drive  (full — needed to file PDFs / move audio)"
  read -rsp "  Paste GOOGLE_DRIVE_REFRESH_TOKEN: " REFRESH_TOKEN
  echo ""
  set_env GOOGLE_DRIVE_REFRESH_TOKEN "$REFRESH_TOKEN"
  echo ""
fi

# Ensure .env has whatever came from the environment
set_env GOOGLE_DRIVE_CLIENT_ID "$CLIENT_ID"
set_env GOOGLE_DRIVE_CLIENT_SECRET "$CLIENT_SECRET"
set_env GOOGLE_DRIVE_REFRESH_TOKEN "$REFRESH_TOKEN"

echo "Testing connection..."
if ! "$PY" "$ROOT/scripts/setup/google_drive_auth.py" --page-size 5; then
  echo ""
  echo "Connection failed. Check credentials and knowledge/10_automation/google_drive_setup.md"
  exit 1
fi

echo ""
echo "Syncing Drive files into repo..."
chmod +x "$ROOT/scripts/sync/run_google_drive_sync.sh"
"$ROOT/scripts/sync/run_google_drive_sync.sh" || true

echo ""
echo "=== Connected ==="
echo "  Credentials: .env (gitignored)"
echo "  Synced files: external_docs/drive/ and external_docs/assets/"
echo "  Search: python3 scripts/drive/search_drive.py Couvillion"
echo "  Re-sync: ./scripts/sync/run_google_drive_sync.sh"
echo ""
echo "Persist for all Cloud Agents:"
echo "  Add GOOGLE_DRIVE_CLIENT_ID / SECRET / REFRESH_TOKEN as Cursor Environment secrets"
echo "  (cursor.com → Environments → this repo / NGC Brain)"
echo ""
