#!/bin/bash
# Print google-drive MCP block for Cursor (~/.cursor/mcp.json) from .env
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No .env found. Copy .env.example → .env and fill Google Drive credentials." >&2
  echo "Guide: knowledge/10_automation/google_drive_setup.md" >&2
  exit 1
fi

# shellcheck disable=SC1090
source <(grep -E '^GOOGLE_DRIVE_' "$ENV_FILE" | sed 's/^/export /')

for var in GOOGLE_DRIVE_CLIENT_ID GOOGLE_DRIVE_CLIENT_SECRET GOOGLE_DRIVE_REFRESH_TOKEN; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing $var in .env" >&2
    exit 1
  fi
done

cat <<EOF
Paste into Cursor → Settings → Tools & MCP (user-level ~/.cursor/mcp.json):

{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@franciscpd/drive-mcp-server"],
      "env": {
        "GOOGLE_DRIVE_CLIENT_ID": "$GOOGLE_DRIVE_CLIENT_ID",
        "GOOGLE_DRIVE_CLIENT_SECRET": "$GOOGLE_DRIVE_CLIENT_SECRET",
        "GOOGLE_DRIVE_REFRESH_TOKEN": "$GOOGLE_DRIVE_REFRESH_TOKEN",
        "LOG_LEVEL": "info"
      }
    }
  }
}

Then restart MCP / start a new agent session and run:
  ./scripts/setup/run_google_drive_test.sh
EOF
