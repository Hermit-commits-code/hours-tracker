#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:5173}"
TIMEOUT="${2:-3}"

if ! command -v curl >/dev/null 2>&1; then
	echo 'curl is required for health check'
	exit 2
fi

status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$URL" || echo "000")
if [ "$status" = "200" ]; then
	echo "OK: ${URL} -> ${status}"
	exit 0
else
	echo "FAIL: ${URL} -> ${status}" >&2
	exit 1
fi
