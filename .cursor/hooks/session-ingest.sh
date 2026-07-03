#!/bin/bash
# Session start: refresh sync manifest and inject business context pointer
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
"$ROOT/scripts/sync/run_ingest.sh" 2>/dev/null || true

MANIFEST="$ROOT/knowledge/.generated/sync_manifest.json"
SYNCED="unknown"
if [[ -f "$MANIFEST" ]]; then
  SYNCED=$(python3 -c "import json; print(json.load(open('$MANIFEST'))['synced_at'])" 2>/dev/null || echo "unknown")
fi

python3 << PYEOF
import json
print(json.dumps({
  "additional_context": (
    "NGC Business Brain session. Read knowledge/00_index.md first. "
    "Latest export sync: ${SYNCED}. "
    "Live manifest: knowledge/.generated/sync_manifest.json. "
    "Daily ops: knowledge/09_daily_ops/README.md. "
    "Automation setup: knowledge/10_automation/README.md."
  )
}))
PYEOF
