#!/usr/bin/env bash
# Nightly pipeline: ingest → embed → daily reflect
# Cross-platform (macOS/Linux). Called by launchd or cron.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Load .env if present
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

# Prefer project venv
if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PY="$ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY="$(command -v python3)"
else
  echo "python3 not found" >&2
  exit 1
fi

export PYTHONPATH="$ROOT/src${PYTHONPATH:+:$PYTHONPATH}"

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) ingest"
"$PY" "$ROOT/scripts/ingest_omi.py"

echo "==> embed vault"
"$PY" "$ROOT/scripts/embed_vault.py" || echo "embed skipped/failed (is Ollama up?)"

echo "==> daily reflect"
"$PY" "$ROOT/scripts/daily_reflect.py" || echo "reflect skipped/failed"

echo "==> done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
