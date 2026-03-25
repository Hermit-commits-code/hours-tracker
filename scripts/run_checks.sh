#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<EOF
Usage: $0 [--help]
Run local checks: biome (if available) and vitest.
EOF
}

if [ "${1:-}" = "--help" ]; then
	usage
	exit 0
fi

echo "=== run_checks.sh ==="
echo "> Running Biome checks..."
if command -v npx >/dev/null 2>&1; then
	npx biome check . || {
		echo "Biome check failed."
		exit 2
	}
else
	echo "npx not found; skipping biome check"
fi

echo "> Running unit tests..."
if npx vitest --run; then
	echo "All checks passed."
else
	echo "Tests failed."
	exit 3
fi
