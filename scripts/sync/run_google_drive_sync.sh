#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  PY="$ROOT/.venv/bin/python3"
else
  PY=python3
fi

"$PY" "$ROOT/scripts/sync/sync_google_drive.py" "$@"
"$ROOT/scripts/sync/run_ingest.sh" 2>/dev/null || true
