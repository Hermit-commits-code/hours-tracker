#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${1:-./logs}"
PATTERN="${2:-ERROR}"
LIMIT="${3:-20}"

echo "Analyzing logs in: $LOG_DIR for pattern: $PATTERN"
if [ ! -d "$LOG_DIR" ]; then
  echo "No log directory found at $LOG_DIR"
  exit 0
fi

# Count occurrences per file
declare -A counts
total=0
for f in "$LOG_DIR"/*; do
  if [ -f "$f" ]; then
    cnt=$(grep -c -- "$PATTERN" "$f" || true)
    counts["$f"]=$cnt
    total=$((total + cnt))
  fi
done

echo "Total matches: $total"
echo
printf "%8s  %s\n" "COUNT" "FILE"
for f in "${!counts[@]}"; do
  printf "%8d  %s\n" "${counts[$f]}" "$f"
done | sort -rn

echo
echo "Top $LIMIT matches (file:line):"
grep -R --line-number -- "$PATTERN" "$LOG_DIR" | head -n "$LIMIT" || true

echo
echo "Sample context for top files (up to 3 lines of context):"
# print context for top 3 files
printf "%s\n" "${!counts[@]}" | xargs -I{} bash -c 'echo "---- {} (matches: '"${counts[{}]}"' ) ----"; grep -n --color=always -m 5 -n -C 1 "'"$PATTERN"'" {} || true' 2>/dev/null || true
