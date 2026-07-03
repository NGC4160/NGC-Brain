#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  exec "$ROOT/.venv/bin/python3" "$ROOT/scripts/sync/sync_hcp_api.py" "$@"
else
  exec python3 "$ROOT/scripts/sync/sync_hcp_api.py" "$@"
fi
