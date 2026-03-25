#!/usr/bin/env bash

set -euo pipefail

# Usage ./scripts/csv_filter.sh <csv-file> <field> <value>
IN="${1:-./hours-all.csv}"
FIELD="${2:-projectName}"
VALUE="${3:-General}"
LIMIT="${4:-200}"

if [ ! -f "$IN" ]; then
	echo "CSV not found: $IN" >&2
	exit 2
fi

# Simple approach: print header then lines matching the VALUE anywhere
# THis is naive for CSV but practical for quick filtering

head -n 1 "$IN"
grep -i -- "$VALUE" "$IN" | head -n "$LIMIT"
