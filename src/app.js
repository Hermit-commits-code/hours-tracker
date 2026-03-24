// src/app.js
// Day 2: core pure behaviors (clockIn/clockOut, CSV) + lazy DOM wiring.
// Top-level code avoids querying `document` so the module is import-safe in Node (Vitest).

import {
	loadSessions,
	saveSessions,
	getCurrentUserId,
	ensureDemoUser,
	clearAllForUser,
	setCurrentUserId,
} from "./storage.js";

/* ------------------------
   Module-scoped variables
   ------------------------
   DOM element references are declared here but NOT resolved at module-load time.
   They are assigned inside init(), which only runs in the browser.
*/
let $clockToggle;
let $statusState;
let $statusSince;
let $sessionsTbody;
let $exportCSV;
let $loginBtn;
let $quickNote;

const qs = (sel) =>
	typeof document !== "undefined" ? document.querySelector(sel) : null;

const $ = (sel) => {
	const el = qs(sel);
	if (!el) throw new Error(`Required element not found: ${sel}`);
	return el;
};

function init() {
	// Resolve DOM refs here so importing this module in Node does not throw.
	$clockToggle = $("#clock-toggle");
	$statusState = $("#status-state");
	$statusSince = $("#status-since");
	$sessionsTbody = $("#sessions-tbody");
	$exportCSV = $("#export-csv");
	$loginBtn = $("#login-btn");
	$quickNote = $("#quick-note");

	$clockToggle.addEventListener("click", handleClockToggle);
	$exportCSV.addEventListener("click", handleExportCSV);
	$loginBtn.addEventListener("click", handleLogin);

	// ensure demo user exists during development
	ensureDemoUser();

	renderCurrent();
}

function renderCurrent() {
	const uid = getCurrentUserId();
	const sessions = uid ? loadSessions(uid) : [];
	const open = hasOpenSession(uid);
	const sinceISO = open ? sessions.find((s) => s.end === null)?.start : null;
	// Only call renderStatus/renderSessions when DOM refs exist
	if (typeof document !== "undefined") {
		renderStatus({ clockedIn: !!open, sinceISO });
		renderSessions(sessions);
	}
}

/* --------- PURE LOGIC (exported for tests) --------- */

export function generateId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function calculateSessionDuration(startISO, endISO) {
	const ms = Date.parse(endISO) - Date.parse(startISO);
	return ms >= 0 ? ms : 0;
}

export function formatDuration(ms) {
	const totalSec = Math.floor(ms / 1000);
	const hh = Math.floor(totalSec / 3600);
	const mm = Math.floor((totalSec % 3600) / 60);
	const ss = totalSec % 60;
	return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function pad(n) {
	return n.toString().padStart(2, "0");
}

export function hasOpenSession(userId) {
	if (!userId) return false;
	const sessions = loadSessions(userId);
	return sessions.some((s) => s.end === null);
}

export function clockIn(userId, note = "") {
	if (!userId) throw new Error("clockIn: missing userId");
	if (hasOpenSession(userId)) throw new Error("User already clocked in");
	const sessions = loadSessions(userId);
	const now = new Date().toISOString();
	const session = {
		id: generateId(),
		userId,
		start: now,
		end: null,
		notes: note || "",
		createdAt: now,
		updatedAt: now,
	};
	sessions.push(session);
	saveSessions(userId, sessions);
	return session;
}

export function clockOut(userId) {
	if (!userId) throw new Error("clockOut: missing userId");
	const sessions = loadSessions(userId);
	const open = sessions.find((s) => s.end === null);
	if (!open) throw new Error("No open session to clock out of");
	const now = new Date().toISOString();
	open.end = now;
	open.updatedAt = now;
	saveSessions(userId, sessions);
	return open;
}

export function exportCSV(userId) {
	const sessions = loadSessions(userId);
	const header = "id,start,end,durationSeconds,notes";
	const rows = sessions.map((s) => {
		const durationSeconds = s.end
			? Math.floor(calculateSessionDuration(s.start, s.end) / 1000)
			: "";
		const safeNotes = (s.notes || "").replace(/"/g, '""');
		return `${s.id},${s.start || ""},${s.end || ""},${durationSeconds},"${safeNotes}"`;
	});
	return [header, ...rows].join("\n");
}

/* --------- Small DOM helpers (non-test heavy) --------- */

function renderStatus({ clockedIn = false, sinceISO = null } = {}) {
	if (!$statusState || !$statusSince || !$clockToggle) return;
	$statusState.textContent = clockedIn ? "clocked in" : "clocked out";
	$statusSince.textContent = sinceISO ? `since ${formatLocal(sinceISO)}` : "";
	$clockToggle.textContent = clockedIn ? "Clock Out" : "Clock In";
}

function renderSessions(sessions) {
	if (!$sessionsTbody) return;
	$sessionsTbody.innerHTML = "";
	if (!sessions || sessions.length === 0) {
		const tr = document.createElement("tr");
		const td = document.createElement("td");
		td.setAttribute("colspan", "6");
		td.textContent = "No sessions yet. Clock in to create your first entry.";
		tr.appendChild(td);
		$sessionsTbody.appendChild(tr);
		return;
	}

	sessions.forEach((s) => {
		const tr = document.createElement("tr");
		const dateTd = document.createElement("td");
		dateTd.textContent = formatLocalDate(s.start);
		tr.appendChild(dateTd);

		const startTd = document.createElement("td");
		startTd.textContent = formatLocalTime(s.start);
		tr.appendChild(startTd);

		const endTd = document.createElement("td");
		endTd.textContent = s.end ? formatLocalTime(s.end) : "—";
		tr.appendChild(endTd);

		const durTd = document.createElement("td");
		durTd.textContent = s.end
			? formatDuration(calculateSessionDuration(s.start, s.end))
			: "—";
		tr.appendChild(durTd);

		const notesTd = document.createElement("td");
		notesTd.textContent = s.notes || "";
		tr.appendChild(notesTd);

		const actionsTd = document.createElement("td");
		const editBtn = document.createElement("button");
		editBtn.className = "btn";
		editBtn.textContent = "Edit";
		editBtn.addEventListener("click", () =>
			alert(`Edit ${s.id} (not implemented)`),
		);
		const delBtn = document.createElement("button");
		delBtn.className = "btn";
		delBtn.textContent = "Delete";
		delBtn.addEventListener("click", () => {
			if (!confirm("Delete this entry?")) return;
			const uid = getCurrentUserId();
			const filtered = loadSessions(uid).filter((x) => x.id !== s.id);
			saveSessions(uid, filtered);
			renderCurrent();
		});
		actionsTd.append(editBtn, delBtn);
		tr.appendChild(actionsTd);

		$sessionsTbody.appendChild(tr);
	});
}

function formatLocal(iso) {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}
function formatLocalDate(iso) {
	try {
		return new Date(iso).toLocaleDateString();
	} catch {
		return iso;
	}
}
function formatLocalTime(iso) {
	try {
		return new Date(iso).toLocaleTimeString();
	} catch {
		return iso;
	}
}

/* --------- Event handlers --------- */

function handleClockToggle() {
	try {
		let uid = getCurrentUserId();
		if (!uid) uid = ensureDemoUser();
		if (hasOpenSession(uid)) {
			clockOut(uid);
		} else {
			const note = $quickNote?.value || "";
			clockIn(uid, note);
		}
		renderCurrent();
	} catch (err) {
		console.error(err);
		alert(err.message);
	}
}

function handleExportCSV() {
	const uid = getCurrentUserId();
	if (!uid) return alert("No user signed in (demo only).");
	const csv = exportCSV(uid);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "hours.csv";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function handleLogin() {
	alert("Demo login will be implemented on Day 3.");
}

/* Bootstrap only in browser */
if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", init);
}

// export for debugging in browser console
if (typeof window !== "undefined") {
	window.__HT = {
		clockIn,
		clockOut,
		exportCSV,
		generateId,
		calculateSessionDuration,
		formatDuration,
		clearAllForUser: (uid) => clearAllForUser(uid),
		setCurrentUserId,
	};
}
