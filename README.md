# Hours Tracker (Demo)

A lightweight Hours Tracker web app (vanilla HTML/CSS/JS) — demo-first implementation.
Purpose: learn and demonstrate core frontend engineering practices (modular code, testable pure functions, local persistence) before migrating to TypeScript + Next.js and a Go backend.

Status
- Current: Day 1 UI scaffold complete (responsive "bento" layout, wired button handlers).
- Next: Day 2 — implement storage + core logic (clockIn/clockOut, duration calc), add unit tests.

Table of contents
- Features
- Built with
- Project structure
- Getting started
- Development commands
- Testing
- Data model & localStorage schema
- Usage
- Acceptance criteria (Day 1)
- Roadmap & next steps
- Security & production checklist
- Contributing
- License
- Contact

Features (MVP)
- Demo register/login (client-side, demo-only)
- Clock In / Clock Out actions
- Session list with date, start, end, duration, notes
- Manual add/edit/delete entries (planned)
- Export CSV (planned)
- Mobile-first responsive "bento" layout

Built with
- HTML5, CSS (mobile-first), plain JavaScript (ES modules)
- Biome.js for formatting/linting (config: .biome.json)
- Vitest for unit testing (pure functions)
- Live Server (or any static server) for local development

Project structure
- index.html — app UI
- styles.css — styles (mobile-first, desktop breakpoint at 880px)
- src/
  - app.js — UI wiring & pure helper stubs (incremental logic)
  - (future) storage.js — localStorage layer
  - (future) ui.js — DOM helpers (optional)
- tests/
  - app.test.js — unit tests (Vitest)
- .biome.json — Biome config
- package.json — scripts & dev dependencies
- README.md — this file

Getting started (quick)
Prerequisites
- Node.js >= 18 (for dev tools), pnpm or npm
- Optional: Live Server VS Code extension, or any static file server

Install (choose one)
- Using pnpm:
  pnpm install
- Using npm:
  npm install

Run (dev)
- Start a static dev server (option A: Live Server ext; option B: local tool)
  - Option A: Right-click `index.html` -> Open with Live Server
  - Option B: Install live-server and run:
    npx live-server --port=5173

Code formatting / lint (Biome)
- Check:
  npx biome check
- Format:
  npx biome format

Development commands (package.json)
- Start (if configured):
  npm run start
- Test:
  npm run test
- Format:
  npm run format  (if you add this to scripts)

Testing
- Uses Vitest for pure function unit tests.
- Run tests:
  npx vitest
- Tests focus on:
  - calculateSessionDuration(startISO, endISO)
  - formatDuration(ms)
  - prevention of double clock-in
  - exportCSV formatting
  - storage roundtrip (save + load)

Data model & localStorage schema (client-side demo)
- Keys / shapes used by the demo:
  - Users: key `ht:users` -> JSON array of:
    { id, username, passwordHash, createdAt }
  - Current user: key `ht:currentUserId` -> user id string
  - Sessions per user: key `ht:sessions:{userId}` -> JSON array of sessions:
    { id, userId, start: ISO(UTC), end: ISO|null, notes, createdAt, updatedAt }

Important timezone rule
- Store timestamps as UTC ISO strings (Date.toISOString()).
- Display using local methods: new Date(iso).toLocaleString() / toLocaleTimeString().
- Calculate durations using Date.parse(ISO) → milliseconds (DST-safe).

Usage (UI walkthrough)
- Register (demo) then Login (demo) — sets current user in localStorage.
- Click Clock In: creates a session with start=now (ISO) and end=null.
- Click Clock Out: closes the last open session with end=now.
- Session list displays date, start, end, duration (hh:mm:ss), notes and actions (Edit/Delete).
- Export CSV will create CSV with header: id,start,end,durationSeconds,notes (planned).

Day 1 Acceptance Criteria (verify before moving on)
- index.html displays header, clock card, sessions table, and footer totals.
- Responsive behavior: stacked on mobile, two-column at >=880px.
- src/app.js wired: clicking Clock In, Export CSV, Login shows demo alerts and console logs (no runtime errors).
- .biome.json exists and is recognized by Biome.
- All files committed to repo with clear commit messages.

Roadmap & next steps (short)
- Day 2: Implement storage.js and core pure functions (clockIn/clockOut, calculateSessionDuration, formatDuration). Add Vitest tests for these functions.
- Day 3: Demo auth persistence + UI login/register.
- Day 4: Integrate DOM with core logic, render sessions, add totals.
- Day 5: Manual edit/delete + CSV export + more tests.
- Weeks 3–4: Migrate to TypeScript and prepare Next.js frontend scaffolding.
- Weeks 5–8: Build Go backend (API, auth, Postgres), replace localStorage persistence.
- Weeks 9–12: Deploy, CI, portfolio case study, interview prep.

Security & production checklist (for migration)
- Replace demo client-side auth with server-side auth + secure cookies or JWTs.
- Hash passwords with bcrypt (or Argon2) on server.
- Enable HTTPS and secure cookie flags.
- Implement CSRF protection for cookie-based auth.
- Validate and sanitize all user inputs server-side.
- Use prepared statements (sqlc/pgx) or safe ORM to avoid SQL injection.
- Do not store secrets in repo. Use environment variables and secrets manager.

Contribution
- Preferred workflow:
  - Create a branch per task: `feature/<short-desc>`
  - Keep PRs small (2–4 hour sized chunks).
  - Run Biome format and tests locally before submitting PR.
- To contribute:
  - Fork repo → implement feature → open PR with description, screenshots, tests.

License
- MIT License (or choose your preferred license).

Contact
- Repo owner: Hermit-commits-code (your GitHub profile)
- For questions, open an issue in this repository.

Appendix: Useful commands
- Quick server:
  npx live-server --port=5173
- Format all files:
  npx biome format
- Run all tests:
  npx vitest

---

