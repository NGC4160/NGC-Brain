#!/bin/bash
# NGC morning sync — HCP + QBO → ingest → Command Center live data
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.venv/bin/python3" ]]; then
  PY="$ROOT/.venv/bin/python3"
else
  PY="python3"
fi

LOG_DIR="$ROOT/knowledge/.generated"
mkdir -p "$LOG_DIR"
STATUS_FILE="$LOG_DIR/sync_status.json"
STARTED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

write_status() {
  local overall="$1"
  local hcp="$2"
  local qbo="$3"
  local ingest="$4"
  local build="$5"
  local detail="${6:-}"
  "$PY" - <<PYEOF
import json
from pathlib import Path
status = {
    "started_at": "$STARTED_AT",
    "finished_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    "overall": "$overall",
    "steps": {
        "hcp": "$hcp",
        "qbo": "$qbo",
        "ingest": "$ingest",
        "command_center": "$build",
    },
    "detail": """$detail""".strip() or None,
}
Path("$STATUS_FILE").write_text(json.dumps(status, indent=2) + "\n")
PYEOF
}

HCP_RC=0
QBO_RC=0
INGEST_RC=0
BUILD_RC=0
DETAIL=""

echo "=== NGC Morning Sync — $STARTED_AT ==="

echo "--- Housecall Pro API ---"
if "$PY" "$ROOT/scripts/sync/sync_hcp_api.py"; then
  HCP_RC=0
else
  HCP_RC=$?
  DETAIL+="HCP sync failed (rc=$HCP_RC). "
fi

echo "--- QuickBooks Online API ---"
if "$PY" "$ROOT/scripts/sync/sync_qbo_api.py"; then
  QBO_RC=0
else
  QBO_RC=$?
  DETAIL+="QBO sync failed (rc=$QBO_RC). "
fi

echo "--- Ingest exports ---"
if "$ROOT/scripts/sync/run_ingest.sh"; then
  INGEST_RC=0
else
  INGEST_RC=$?
  DETAIL+="Ingest failed (rc=$INGEST_RC). "
fi

echo "--- Shop board + deposit alerts ---"
"$PY" "$ROOT/scripts/sync/generate_shop_board.py" || true
"$PY" "$ROOT/scripts/admin_bot/deposit_gate_alerts.py" || true

echo "--- Build Command Center ---"
if "$PY" "$ROOT/scripts/build_command_center.py"; then
  BUILD_RC=0
else
  BUILD_RC=$?
  DETAIL+="Command Center build failed (rc=$BUILD_RC). "
fi

if [[ $HCP_RC -eq 0 && $QBO_RC -eq 0 && $INGEST_RC -eq 0 && $BUILD_RC -eq 0 ]]; then
  write_status "success" "ok" "ok" "ok" "ok" "$DETAIL"
  echo "=== Morning sync complete ==="
  exit 0
fi

write_status "partial" \
  "$( [[ $HCP_RC -eq 0 ]] && echo ok || echo fail )" \
  "$( [[ $QBO_RC -eq 0 ]] && echo ok || echo fail )" \
  "$( [[ $INGEST_RC -eq 0 ]] && echo ok || echo fail )" \
  "$( [[ $BUILD_RC -eq 0 ]] && echo ok || echo fail )" \
  "$DETAIL"
echo "=== Morning sync finished with errors ===" >&2
exit 1
