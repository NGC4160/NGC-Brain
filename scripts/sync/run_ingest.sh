#!/bin/bash
# Run export ingest — use venv python if available
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  exec "$ROOT/.venv/bin/python3" "$ROOT/scripts/sync/ingest_exports.py" "$@"
else
  exec python3 "$ROOT/scripts/sync/ingest_exports.py" "$@"
fi
