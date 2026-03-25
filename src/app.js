// src/app.js
// Full app (Node-import safe) with demo auth, projects, totals, live timer,
// add/update entry modal, export range, and tests-friendly exports.

import {
	authenticateUser,
	clearAllForUser,
	createUser,
	ensureDemoProjects,
	ensureDemoUser,
	findUserById,
	getCurrentUserId,
	loadProjects,
	loadSessions,
	saveProjects,
	saveSessions,
	setCurrentUserId,
} from "./storage.js";

/* DOM refs (resolved in init) */
let $clockToggle;
let $statusState;
let $statusSince;
let $sessionsTbody;
let $exportCSV;
let $loginBtn;
let $quickNote;
let $projectSelect;
let $currentUserSpan;
let $authModal;
let $authForm;
let $authUsername;
let $authPassword;
let $authSubmit;
let $authToggle;
let $authClose;

let $entryModal,
	$entryForm,
	$entryStart,
	$entryEnd,
	$entryNotes,
	$entryProject,
	$entrySave,
	$entryCancel;
let authMode = "login"; // or 'register'
let liveTimerId = null;
let entryEditingId = null;

const qs = (sel) =>
	typeof document !== "undefined" ? document.querySelector(sel) : null;
const $ = (sel) => {
	const el = qs(sel);
	if (!el) throw new Error(`Required element not found: ${sel}`);
	return el;
};

/* ---------------------------
   Init
   --------------------------- */
function init() {
	$clockToggle = $("#clock-toggle");
	$statusState = $("#status-state");
	$statusSince = $("#status-since");
	$sessionsTbody = $("#sessions-tbody");
	$exportCSV = $("#export-csv");
	$loginBtn = $("#login-btn");
	$quickNote = $("#quick-note");
	$projectSelect = $("#project-select");
	$currentUserSpan = $("#current-user");

	$authModal = $("#auth-modal");
	$authForm = $("#auth-form");
	$authUsername = $("#auth-username");
	$authPassword = $("#auth-password");
	$authSubmit = $("#auth-submit");
	$authToggle = $("#auth-toggle");
	$authClose = $("#auth-close");

	$entryModal = $("#entry-modal");
	$entryForm = $("#entry-form");
	$entryStart = $("#entry-start");
	$entryEnd = $("#entry-end");
	$entryNotes = $("#entry-notes");
	$entryProject = $("#entry-project");
	$entrySave = $("#entry-save");
	$entryCancel = $("#entry-cancel");

	$clockToggle.addEventListener("click", handleClockToggle);
	$exportCSV.addEventListener("click", handleExportCSV);
	$loginBtn.addEventListener("click", handleLogin);

	$authForm.addEventListener("submit", handleAuthSubmit);
	$authToggle.addEventListener("click", handleAuthToggle);
	$authClose.addEventListener("click", closeAuthModal);

	const addEntryBtn = qs("#add-entry-btn");
	if (addEntryBtn)
		addEntryBtn.addEventListener("click", () => openEntryModal());

	$entryForm?.addEventListener("submit", handleEntrySubmit);
	$entryCancel?.addEventListener("click", closeEntryModal);

	// Close auth modal on Escape
	document.addEventListener("keydown", (ev) => {
		if (ev.key === "Escape") {
			if ($authModal && !$authModal.classList.contains("hidden"))
				closeAuthModal();
			if ($entryModal && !$entryModal.classList.contains("hidden"))
				closeEntryModal();
		}
	});

	// ensure demo data
	ensureDemoUser();
	ensureDemoProjects();
	populateProjectSelect(loadProjects());
	populateEntryProjectSelect(loadProjects());

	renderCurrent();
}

/* ---------------------------
   Exports: core helpers (pure)
   --------------------------- */

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

/* Totals & date helpers */
export function calculateTotals(
	sessions,
	referenceISO = new Date().toISOString(),
) {
	const ref = new Date(referenceISO);
	const refStartOfDay = startOfDay(ref).getTime();
	const refStartOfWeek = startOfDay(
		new Date(ref.getTime() - 6 * 24 * 3600 * 1000),
	).getTime();
	const refStartOfMonth = startOfMonth(ref).getTime();

	let totalDay = 0;
	let totalWeek = 0;
	let totalMonth = 0;

	sessions.forEach((s) => {
		const sStart = Date.parse(s.start);
		const sEnd = s.end ? Date.parse(s.end) : Date.now();
		if (!(sEnd > sStart)) return;
		const overlap = (aStart, aEnd) =>
			Math.max(0, Math.min(sEnd, aEnd) - Math.max(sStart, aStart));
		totalDay += overlap(refStartOfDay, refStartOfDay + 24 * 3600 * 1000);
		totalWeek += overlap(refStartOfWeek, Date.parse(ref) + 24 * 3600 * 1000);
		totalMonth += overlap(refStartOfMonth, startOfNextMonth(ref).getTime());
	});

	return { today: totalDay, week: totalWeek, month: totalMonth };
}

function startOfDay(d) {
	const nd = new Date(d);
	nd.setHours(0, 0, 0, 0);
	return nd;
}
function startOfMonth(d) {
	const nd = new Date(d);
	nd.setDate(1);
	nd.setHours(0, 0, 0, 0);
	return nd;
}
function startOfNextMonth(d) {
	const nd = startOfMonth(d);
	nd.setMonth(nd.getMonth() + 1);
	return nd;
}

/* ---------------------------
   Session ops (core)
   --------------------------- */

export function hasOpenSession(userId) {
	if (!userId) return false;
	const sessions = loadSessions(userId);
	return sessions.some((s) => s.end === null);
}

export function clockIn(userId, note = "", projectId = "proj-default") {
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
		projectId,
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

/* Add / Update entries (pure) */
export function addEntry(
	userId,
	{ startISO, endISO = null, notes = "", projectId = "proj-default" },
) {
	if (!userId) throw new Error("addEntry: missing userId");
	const sessions = loadSessions(userId);
	const now = new Date().toISOString();
	const entry = {
		id: generateId(),
		userId,
		start: startISO,
		end: endISO,
		notes,
		projectId,
		createdAt: now,
		updatedAt: now,
	};
	sessions.push(entry);
	saveSessions(userId, sessions);
	return entry;
}

export function updateEntry(userId, entryId, changes = {}) {
	if (!userId) throw new Error("updateEntry: missing userId");
	const sessions = loadSessions(userId);
	const idx = sessions.findIndex((s) => s.id === entryId);
	if (idx === -1) throw new Error("Entry not found");
	const now = new Date().toISOString();
	sessions[idx] = { ...sessions[idx], ...changes, updatedAt: now };
	saveSessions(userId, sessions);
	return sessions[idx];
}

/* Filter by range + exportCSV */
export function filterSessionsByRange(
	sessions,
	range = "all",
	referenceISO = new Date().toISOString(),
) {
	if (!sessions || range === "all") return sessions;
	const ref = new Date(referenceISO);
	const sDay = startOfDay(ref).getTime();
	const sWeek = startOfDay(
		new Date(ref.getTime() - 6 * 24 * 3600 * 1000),
	).getTime();
	const sMonth = startOfMonth(ref).getTime();
	const endRef = sDay + 24 * 3600 * 1000;

	return sessions.filter((s) => {
		const sStart = Date.parse(s.start);
		const sEnd = s.end ? Date.parse(s.end) : Date.now();
		if (range === "today") return sEnd > sDay && sStart < endRef;
		if (range === "week") return sEnd > sWeek && sStart < endRef;
		if (range === "month")
			return sEnd > sMonth && sStart < startOfNextMonth(ref).getTime();
		return true;
	});
}

export function exportCSV(
	userId,
	range = "all",
	referenceISO = new Date().toISOString(),
) {
	const all = loadSessions(userId);
	const sessions = filterSessionsByRange(all, range, referenceISO);
	const header = "id,start,end,durationSeconds,projectId,projectName,notes";
	const projects = loadProjects();
	const rows = sessions.map((s) => {
		const durationSeconds = s.end
			? Math.floor(calculateSessionDuration(s.start, s.end) / 1000)
			: "";
		const safeNotes = (s.notes || "").replace(/"/g, '""');
		const proj = projects.find((p) => p.id === s.projectId);
		const projNameSafe = proj ? proj.name.replace(/"/g, '""') : "";
		return `${s.id},${s.start || ""},${s.end || ""},${durationSeconds},${s.projectId || ""},"${projNameSafe}","${safeNotes}"`;
	});
	return [header, ...rows].join("\n");
}

/* ---------------------------
   DOM rendering / UI
   --------------------------- */

function renderCurrent() {
	const uid = getCurrentUserId();

	if ($currentUserSpan) {
		const user = uid ? findUserById(uid) : null;
		$currentUserSpan.textContent = user ? `Signed in: ${user.username}` : "";
	}
	if ($loginBtn) $loginBtn.textContent = uid ? "Logout" : "Login";

	const sessions = uid ? loadSessions(uid) : [];
	const open = hasOpenSession(uid);
	const sinceISO = open ? sessions.find((s) => s.end === null)?.start : null;

	renderStatus({ clockedIn: !!open, sinceISO });
	renderSessions(sessions);

	const totals = calculateTotals(sessions);
	updateTotalsDisplay(totals);

	if (open && sinceISO) startLiveTimer(sinceISO);
	else stopLiveTimer();
}

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
		td.setAttribute("colspan", "7");
		td.textContent = "No sessions yet. Clock in to create your first entry.";
		tr.appendChild(td);
		$sessionsTbody.appendChild(tr);
		return;
	}

	const projects = loadProjects();

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

		const projectTd = document.createElement("td");
		const proj = projects.find((p) => p.id === s.projectId);
		projectTd.textContent = proj ? proj.name : s.projectId || "";
		tr.appendChild(projectTd);

		const notesTd = document.createElement("td");
		notesTd.textContent = s.notes || "";
		tr.appendChild(notesTd);

		const actionsTd = document.createElement("td");
		const editBtn = document.createElement("button");
		editBtn.className = "btn";
		editBtn.textContent = "Edit";
		editBtn.addEventListener("click", () => openEntryModal(s));
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

function updateTotalsDisplay({ today = 0, week = 0, month = 0 } = {}) {
	const tToday = qs("#total-today");
	const tWeek = qs("#total-week");
	const tMonth = qs("#total-month");
	if (tToday) tToday.textContent = msToHoursString(today);
	if (tWeek) tWeek.textContent = msToHoursString(week);
	if (tMonth) tMonth.textContent = msToHoursString(month);
}

function msToHoursString(ms) {
	const hours = ms / (1000 * 60 * 60);
	if (hours < 1) return `${Math.round(hours * 60)}m`;
	return `${hours.toFixed(2).replace(/\.00$/, "")}h`;
}

/* Live timer */
function startLiveTimer(startISO) {
	stopLiveTimer();
	if (!$statusSince) return;
	const update = () => {
		const elapsed = Date.now() - Date.parse(startISO);
		$statusSince.textContent = `since ${formatLocal(startISO)} — ${formatDuration(elapsed)}`;
	};
	update();
	liveTimerId = setInterval(update, 1000);
}

function stopLiveTimer() {
	if (liveTimerId) {
		clearInterval(liveTimerId);
		liveTimerId = null;
	}
}

/* Formatting helpers */
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

/* ---------------------------
   Entry modal helpers & conversions
   --------------------------- */
const _previousActiveElement = null;
function focusFirstDescendant(el) {
	if (!el) return;
	const focusable = el.querySelectorAll(
		'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
	);
	if (focusable.length) {
		focusable[0].focus();
		return focusable[0];
	}
	return null;
}

function trapTabKey(e, modal) {
	if (e.key !== "Tab") return;
	const focusable = Array.from(
		modal.querySelectorAll(
			'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
		),
	);
	if (!focusable.length) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}

function populateProjectSelect(projects) {
	if (!$projectSelect) return;
	$projectSelect.innerHTML = "";
	projects.forEach((p) => {
		const opt = document.createElement("option");
		opt.value = p.id;
		opt.textContent = p.name;
		$projectSelect.appendChild(opt);
	});
}

function populateEntryProjectSelect(projects) {
	if (!$entryProject) return;
	$entryProject.innerHTML = "";
	projects.forEach((p) => {
		const opt = document.createElement("option");
		opt.value = p.id;
		opt.textContent = p.name;
		$entryProject.appendChild(opt);
	});
}

function openEntryModal(entry = null) {
	entryEditingId = entry?.id || null;
	if ($entryModal) {
		$entryModal.classList.remove("hidden");
		$entryModal.setAttribute("aria-hidden", "false");
		if (entry) {
			$entryStart.value = isoToLocalDateTime(entry.start);
			$entryEnd.value = entry.end ? isoToLocalDateTime(entry.end) : "";
			$entryNotes.value = entry.notes || "";
			$entryProject.value = entry.projectId || "proj-default";
		} else {
			$entryStart.value = isoToLocalDateTime(new Date().toISOString());
			$entryEnd.value = "";
			$entryNotes.value = "";
			$entryProject.value = "proj-default";
		}
		$entryStart.focus();
	}
}

function closeEntryModal() {
	if ($entryModal) {
		$entryModal.classList.add("hidden");
		$entryModal.setAttribute("aria-hidden", "true");
		const addBtn = qs("#add-entry-btn");
		if (addBtn) addBtn.focus();
	}
}

function handleEntrySubmit(e) {
	e.preventDefault();
	const uid = getCurrentUserId() || ensureDemoUser();
	const startVal = $entryStart.value;
	const endVal = $entryEnd.value;
	const startISO = localDateTimeToISO(startVal);
	const endISO = endVal ? localDateTimeToISO(endVal) : null;
	const notes = $entryNotes.value || "";
	const projectId = $entryProject.value || "proj-default";
	if (entryEditingId) {
		updateEntry(uid, entryEditingId, {
			start: startISO,
			end: endISO,
			notes,
			projectId,
		});
	} else {
		addEntry(uid, { startISO, endISO, notes, projectId });
	}
	closeEntryModal();
	renderCurrent();
}

function isoToLocalDateTime(iso) {
	const d = new Date(iso);
	const pad = (n) => n.toString().padStart(2, "0");
	const yyyy = d.getFullYear();
	const mm = pad(d.getMonth() + 1);
	const dd = pad(d.getDate());
	const hh = pad(d.getHours());
	const min = pad(d.getMinutes());
	return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
function localDateTimeToISO(local) {
	if (!local) return null;
	// new Date(local) treats local time, so toISOString gives UTC representation
	const d = new Date(local);
	return d.toISOString();
}

/* ---------------------------
   Event handlers & auth
   --------------------------- */

function handleClockToggle() {
	try {
		let uid = getCurrentUserId();
		if (!uid) uid = ensureDemoUser();
		if (hasOpenSession(uid)) {
			clockOut(uid);
		} else {
			const note = $quickNote?.value || "";
			const projectId = $projectSelect?.value || "proj-default";
			clockIn(uid, note, projectId);
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
	const range = qs("#export-range")?.value || "all";
	const csv = exportCSV(uid, range);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `hours-${range}.csv`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function handleLogin() {
	const uid = getCurrentUserId();
	if (uid) {
		logoutUser();
		renderCurrent();
		return;
	}
	openAuthModal("login");
}

/* Auth modal helpers */
function openAuthModal(mode = "login") {
	authMode = mode;
	if ($authModal) {
		$authModal.classList.remove("hidden");
		$authModal.setAttribute("aria-hidden", "false");
		$authSubmit.textContent = mode === "login" ? "Sign In" : "Register";
		$authToggle.textContent =
			mode === "login" ? "Register" : "Use existing account";
		$authUsername.value = "";
		$authPassword.value = "";
		$authUsername.focus();
	}
}

function closeAuthModal() {
	if ($authModal) {
		$authModal.classList.add("hidden");
		$authModal.setAttribute("aria-hidden", "true");
		const loginBtn = qs("#login-btn");
		if (loginBtn) loginBtn.focus();
	}
}

function handleAuthToggle() {
	openAuthModal(authMode === "login" ? "register" : "login");
}

function handleAuthSubmit(e) {
	e.preventDefault();
	const uname = $authUsername.value.trim();
	const pass = $authPassword.value || "";
	if (!uname || !pass) return alert("Username and password required (demo)");
	try {
		if (authMode === "register") {
			registerUser(uname, pass);
		} else {
			loginUser(uname, pass);
		}
		closeAuthModal();
		renderCurrent();
	} catch (err) {
		alert(err.message);
	}
}

/* Auth wrappers */
export function registerUser(username, password) {
	const user = createUser({ username, password });
	setCurrentUserId(user.id);
	return user;
}
export function loginUser(username, password) {
	const found = authenticateUser(username, password);
	if (!found) throw new Error("Invalid username or password");
	setCurrentUserId(found.id);
	return found;
}
export function logoutUser() {
	setCurrentUserId(null);
}

/* Bootstrap only in browser */
if (typeof document !== "undefined") {
	document.addEventListener("DOMContentLoaded", init);
}

/* Dev exports */
if (typeof window !== "undefined") {
	window.__HT = {
		clockIn,
		clockOut,
		addEntry,
		updateEntry,
		exportCSV,
		calculateTotals,
		formatDuration,
		clearAllForUser: (uid) => clearAllForUser(uid),
		setCurrentUserId,
		loadProjects,
		saveProjects,
		registerUser,
		loginUser,
		logoutUser,
	};
}
