#!/bin/bash
# NGC Drive catalog — skip (exit 0) when GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is unset.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  exec "$ROOT/.venv/bin/python3" "$ROOT/scripts/sync/run_drive_sync.py" "$@"
else
  exec python3 "$ROOT/scripts/sync/run_drive_sync.py" "$@"
fi
