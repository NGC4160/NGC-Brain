#!/bin/bash
# Generate (and optionally email) the NGC morning briefing — no customer PII.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  PY="$ROOT/.venv/bin/python3"
else
  PY="python3"
fi

"$PY" "$ROOT/scripts/sync/generate_morning_briefing.py" "$@"

if [[ "${EMAIL_BRIEFING:-}" == "1" ]]; then
  "$PY" "$ROOT/scripts/sync/email_morning_briefing.py"
fi
