#!/bin/bash
# One-command Google Drive setup — prompts only for missing credentials.
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

CLIENT_ID="$(get_env GOOGLE_DRIVE_CLIENT_ID)"
CLIENT_SECRET="$(get_env GOOGLE_DRIVE_CLIENT_SECRET)"
REFRESH_TOKEN="$(get_env GOOGLE_DRIVE_REFRESH_TOKEN)"

if [[ -z "$CLIENT_ID" ]]; then
  echo "Step 1/3 — Google OAuth Client ID"
  echo "  Get it: Google Cloud Console → APIs & Services → Credentials → OAuth client (Desktop)"
  echo "  Guide:  knowledge/10_automation/google_drive_setup.md"
  read -rp "  Paste GOOGLE_DRIVE_CLIENT_ID: " CLIENT_ID
  set_env GOOGLE_DRIVE_CLIENT_ID "$CLIENT_ID"
  echo ""
fi

if [[ -z "$CLIENT_SECRET" ]]; then
  echo "Step 2/3 — Google OAuth Client Secret"
  read -rsp "  Paste GOOGLE_DRIVE_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
  set_env GOOGLE_DRIVE_CLIENT_SECRET "$CLIENT_SECRET"
  echo ""
fi

if [[ -z "$REFRESH_TOKEN" ]]; then
  echo "Step 3/3 — Refresh Token"
  echo "  Get it: https://developers.google.com/oauthplayground"
  echo "  (Gear → use your own OAuth credentials → Drive API v3 → drive.readonly → Authorize → Exchange)"
  read -rsp "  Paste GOOGLE_DRIVE_REFRESH_TOKEN: " REFRESH_TOKEN
  echo ""
  set_env GOOGLE_DRIVE_REFRESH_TOKEN "$REFRESH_TOKEN"
  echo ""
fi

echo "Testing connection..."
if ! "$PY" "$ROOT/scripts/setup/google_drive_auth.py" --page-size 5; then
  echo ""
  echo "Connection failed. Check credentials and knowledge/10_automation/google_drive_setup.md"
  exit 1
fi

echo ""
echo "Syncing Drive files into repo..."
chmod +x "$ROOT/scripts/sync/run_google_drive_sync.sh"
"$ROOT/scripts/sync/run_google_drive_sync.sh"

echo ""
echo "=== Connected ==="
echo "  Credentials: .env (gitignored)"
echo "  Synced files: external_docs/drive/ and external_docs/assets/"
echo "  Re-sync anytime: ./scripts/sync/run_google_drive_sync.sh"
echo ""
echo "Optional — live Drive in Cursor chat:"
echo "  ./scripts/setup/print_google_drive_mcp.sh"
echo "  Paste output into Cursor → Settings → Tools & MCP"
echo ""
