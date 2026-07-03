#!/bin/bash
# Re-ingest when export files are edited
set -euo pipefail
input=$(cat)
file_path=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

if [[ "$file_path" == *"external_docs/exports/"* ]]; then
  ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
  "$ROOT/scripts/sync/run_ingest.sh" 2>/dev/null || true
  python3 -c 'import json; print(json.dumps({"additional_context": "Export file changed — sync_manifest.json refreshed. Offer to diff against knowledge/ if prices or policies may have changed."}))'
else
  echo '{}'
fi
