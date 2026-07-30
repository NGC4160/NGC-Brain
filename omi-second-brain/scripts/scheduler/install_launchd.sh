#!/usr/bin/env bash
# Install nightly launchd agent on macOS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLIST_SRC="$ROOT/scripts/scheduler/com.omi-second-brain.ingest.plist"
DEST_DIR="$HOME/Library/LaunchAgents"
DEST="$DEST_DIR/com.omi-second-brain.ingest.plist"
LOG_DIR="$HOME/Library/Logs/omi-second-brain"

mkdir -p "$DEST_DIR" "$LOG_DIR"
chmod +x "$ROOT/scripts/scheduler/nightly_run.sh"

# Rewrite placeholder paths for this machine
sed \
  -e "s|/Users/YOU/path/to/omi-second-brain|$ROOT|g" \
  -e "s|/Users/YOU/Library/Logs/omi-second-brain|$LOG_DIR|g" \
  "$PLIST_SRC" > "$DEST"

launchctl unload "$DEST" 2>/dev/null || true
launchctl load "$DEST"
echo "Installed: $DEST"
echo "Test now:  $ROOT/scripts/scheduler/nightly_run.sh"
echo "Logs:      $LOG_DIR"
