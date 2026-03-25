# Scripts

List of helper scripts used in dev:
- run_checks.sh — runs Biome checks and Vitest (used in CI)
  Usage: ./scripts/run_checks.sh

- analyze_logs.sh — count ERROR occurrences and show samples
  Usage: ./scripts/analyze_logs.sh ./logs ERROR 20

- csv_filter.sh — quick grep-based CSV filter
  Usage: ./scripts/csv_filter.sh hours-all.csv projectName General

- health_check.sh — simple HTTP probe
  Usage: ./scripts/health_check.sh http://localhost:5173 3

- nightly_maintenance.sh — run checks, backup data, rotate logs
  Usage: ./scripts/nightly_maintenance.sh
