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

if [ -x "./scripts/health_check.sh" ]; then
  echo "> verifiying dev server..."
  ./scripts/health_check.sh http://127.0.0.1:5173 2 || echo "dev server not responding (ok for CI-less runs)"
fi

echo "> Running unit tests..."
if npx vitest --run; then
	echo "All checks passed."
else
	echo "Tests failed."
	exit 3
fi
