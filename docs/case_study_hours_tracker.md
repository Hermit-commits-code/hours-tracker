# Hours Tracker — Case Study (Draft)

Project: Hours Tracker (vanilla → TS/Next migration)

Overview
- Problem: simple time tracking with CSV export and totals.
- Role: sole developer, built UI, storage, tests, and basic ops scripts.

Key features implemented
- Demo register/login (client-side)
- Clock In / Clock Out with live timer and persistence
- Add/Edit entries modal (datetime-local)
- Export CSV with range filters
- CLI scripts: run_checks.sh, analyze_logs.sh, csv_filter.sh, health_check.sh, nightly_maintenance.sh

Security & Ops notes
- Demo auth -> plan to migrate to server-side hashed passwords
- Scripts for running checks and simple backups included (scripts/)
- Planned: rate limiting on login, CSRF protection on cookie auth

Lessons learned
- Date/time edge cases (timezone handling)
- Modal accessibility and focus management
- Testing pure functions first speeds UX iteration

Next steps
1. Migrate core helpers to TypeScript
2. Scaffold Next.js front-end and port UI components
3. Build Go backend for auth and sessions
