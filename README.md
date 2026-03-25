# Hours Tracker (Demo)

A lightweight Hours Tracker web app (vanilla HTML/CSS/JS) — demo-first implementation.
Purpose: learn and demonstrate core frontend engineering practices (modular code, testable pure functions, local persistence) before migrating to TypeScript + Next.js and a Go backend.

---

## Status (summary)
- Current: Day 4 complete — UI + storage + projects + demo auth + totals + live timer + CSV export (local demo).
- Tests: All Vitest unit tests passing locally (core pure functions + totals + auth + storage).
- Next: Day 5 — manual edit/delete entries + CSV filters + accessibility polish + more tests.

---

## Progress Log (concise daily notes)

Day 1 — UI scaffold & wiring
- Built mobile-first "bento" layout: header, clock card, sessions table, totals footer.
- Added `index.html`, `styles.css`, initial `src/app.js` wiring (DOM-ready init).
- Added `.biome.json` and VS Code workspace suggestions.
- Acceptance: UI displays, responsive, buttons wired to demo handlers.

Day 2 — Storage & core logic + tests
- Implemented `src/storage.js`: localStorage API (users, sessions, projects).
- Implemented pure core functions in `src/app.js`: `clockIn`, `clockOut`, `calculateSessionDuration`, `formatDuration`, `exportCSV`.
- Introduced Vitest tests for core functions and storage roundtrip.
- Ensured module is Node-import-safe (no top-level DOM queries) so tests can import app logic.
- Acceptance: unit tests pass for core logic; clock in/out persists to localStorage.

Day 3 — Demo auth & current-user UI
- Added demo register/login/logout (client-side demo mode) and auth modal.
- Added header current-user display and login/logout toggle.
- Storage: `createUser`, `authenticateUser`, `setCurrentUserId` (demo pattern, base64).
- Acceptance: registration/login/logout work in browser; header updates; tests cover auth functions.

Day 4 — Projects, totals, live timer & modal Escape key
- Added project selector and project persistence (`proj-default`).
- Sessions include `projectId`; CSV now includes `projectId` + `projectName`.
- Implemented `calculateTotals(sessions)` returning `{ today, week, month }` (ms).
  - Day = calendar day
  - Week = last 7 days including reference day
  - Month = calendar month
- Live timer: when clocked in, `#status-since` displays "since <local time> — HH:MM:SS" updating every second; timer resumes after reload.
- Auth modal closable via `Escape` key.
- Acceptance: all Vitest tests pass (including totals test). Browser checks for clock in/out, totals, CSV verified.

---

## Features (MVP)
- Demo register/login (client-side, demo-only)
- Clock In / Clock Out actions
- Session list with date, start, end, duration, project, notes
- Manual add/edit/delete entries (delete implemented)
- Export CSV (includes project name)
- Mobile-first responsive "bento" layout
- Totals: Today / Week / Month
- Live elapsed timer while clocked in
- Demo data helpers (ensureDemoUser, ensureDemoProjects)

---

## Built with
- HTML5, CSS (mobile-first), JavaScript (ES modules)
- Biome.js for formatting/linting
- Vitest for unit testing
- Live Server (or any static server) for local development

---

## Project structure (current)
- index.html — app UI + modal markup
- styles.css — styles (mobile-first, desktop breakpoint at 880px)
- docs/
  - case_study_hours_tracker.md — Case Study
- src/
  - app.js — core behavior + UI wiring (Node-import safe)
  - storage.js — localStorage persistence and demo auth helpers
- tests/
  - app.test.js — Vitest tests (pure functions + storage + auth + totals)
- .biome.json — Biome config
- package.json — scripts & dev dependencies
- README.md — this file

---

## Getting started (quick)
Prerequisites
- Node.js >= 18 (for dev tools), pnpm or npm
- Optional: Live Server VS Code extension, or any static file server

Install
- pnpm: `pnpm install`
- npm: `npm install`

Run (dev)
- Option A: Live Server extension — right-click `index.html` -> Open with Live Server
- Option B: CLI static server:
  - `npx live-server --port=5173`

Format / lint
- Check: `npx biome check`
- Format: `npx biome format`

Tests
- Run unit tests: `npx vitest --run`
- Tests included cover:
  - duration calculations
  - totals calculation
  - clock-in/out flows
  - auth create/authenticate
  - storage roundtrip
  - CSV contents (including project columns)

---

## Data model & localStorage schema (client-side demo)
- Users: key `ht:users` -> JSON array of { id, username, passwordHash, createdAt }
- Current user: key `ht:currentUserId` -> user id string
- Sessions: key `ht:sessions:{userId}` -> JSON array of sessions:
  { id, userId, start: ISO(UTC), end: ISO|null, notes, projectId, createdAt, updatedAt }
- Projects: key `ht:projects` -> JSON array of { id, name }

Timezone rule
- Store timestamps as UTC ISO strings via `new Date().toISOString()`.
- Display using local methods: `new Date(iso).toLocaleString()` or `toLocaleTimeString()`.
- Duration calculations use `Date.parse(ISO)` (ms) — DST-proof by using absolute times.

---

## Usage (UI walkthrough)
- Register or use demo account (demo/demo).
- Select a project in the project dropdown (default "General").
- Enter an optional quick note.
- Click Clock In: session created with start time; header shows "clocked in" and live elapsed timer.
- Click Clock Out: session receives end time; session row shows duration and footer totals update.
- Export CSV: downloads CSV with header:
  `id,start,end,durationSeconds,projectId,projectName,notes`

---

## Acceptance criteria (current)
- UI: responsive, accessible header + bento layout.
- Core logic: `clockIn` / `clockOut` persist to per-user sessions.
- Projects: sessions record `projectId` and CSV contains project name.
- Totals: Today / Week / Month calculations correct (unit-tested).
- Live timer: updates every second while clocked in and resumes after reload.
- Tests: `npx vitest --run` passes locally.

---

## Day 5 (next steps — concise)
Primary goals:
- Manual edit entry modal + update logic and tests.
- CSV enhancements: export range filters (today/week/month) and ensure proper escaping.
- Accessibility: keyboard focus trap in modal, ARIA roles for dynamic elements.
- Add more unit tests and a simple Playwright smoke E2E for basic user flow.

Planned PR-sized tasks (2–4h each):
1. Implement Edit Entry modal (UI + save) — 4h
2. CSV export range filters (UI + tests) — 3h
3. Modal focus trap & keyboard accessibility — 3h
4. Playwright smoke test for registration -> clock in/out -> export — 4h

---

## Security & production migration checklist
- Replace demo client-side auth with server-side hashed passwords (bcrypt/Argon2).
- Use secure cookies or properly signed JWTs with refresh tokens.
- CSRF protection if using cookies.
- Input validation & sanitization server-side.
- Use prepared statements / sqlc for DB queries.
- Store secrets in environment variables or secret manager — never in repo.

---

## Contributing
- Branch per task: `feature/<short-desc>`
- Keep PRs small (2–4 hour chunks)
- Run Biome format + tests locally before PR
- Provide screenshots and test notes in PR description

---

## Quick commands
- Start Dev Server: `npx live-server --port=5173`
- Run Tests: `npx vitest --run`
- Format: `npx biome format`

---

## Contact
- Repo owner: Hermit-commits-code
- For questions: open an issue in your repo

---
