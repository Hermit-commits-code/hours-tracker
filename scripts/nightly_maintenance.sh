#!/usr/bin/env bash
# Purpose: Simple orchestrator calling backup + checks + log archiving; Reality practicing composing scripts and traps
set -euo pipefail

# Basic nighly maintenance demo script
# Usage: ./scripts/nightly_maintenance.sh

# Ensure required commands exist
for cmd in tar gzip; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing $cmd"; exit 2; }
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Starting nightly maintenance at $(date)"
# Run Checks
if [ -x "$SCRIPT_DIR/run_checks.sh" ]; then
  echo "Running local checks..."
  "$SCRIPT_DIR/run_checks.sh" || echo "run_checks.sh returned non-zero"
fi

# Create backups from ./data if present
DATA_DIR="$ROOT_DIR/data"
OUT_DIR="$ROOT_DIR/backups"
mkdir -p "$OUT_DIR"

if [ -d "$DATA_DIR" ]; then
  archive="${OUT_DIR}/backup-$(date +%Y%m%dT%H%M%S).tar.gz"
  tar -czf "$archive" -C "$DATA_DIR" .
  echo "Created backup: $archive"
else
  echo "No data dir at $DATA_DIR to back up"
fi

# Rotate Logs (if ./logs exists)
LOG_ARCHIVE="$ROOT_DIR/log_archive"
mkdir -p "$LOG_ARCHIVE"
if [ -d "$ROOT_DIR/logs" ]; then
  tar -czf "${LOG_ARCHIVE}/logs-$(date +%Y%m%d).tar.gz" -C "$ROOT_DIR" logs || true
  # keep last 7
  ls -1t "$LOG_ARCHIVE" | tail -n +8 | xargs -r -I{} rm -- "$LOG_ARCHIVE/{}"
  echo "Rotated logs into $LOG_ARCHIVE"
else
  echo "No logs directory found; skipping log rotation."
fi

echo "Nightly maintenance complete at $(date)"
