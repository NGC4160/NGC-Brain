#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  exec "$ROOT/.venv/bin/python3" "$ROOT/scripts/setup/google_drive_auth.py" "$@"
else
  exec python3 "$ROOT/scripts/setup/google_drive_auth.py" "$@"
fi
