#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  exec "$ROOT/.venv/bin/python3" "$ROOT/scripts/admin_bot/legacy_pricebook_audit.py" "$@"
else
  exec python3 "$ROOT/scripts/admin_bot/legacy_pricebook_audit.py" "$@"
fi
