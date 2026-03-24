const qs = (sel) => document.querySelector(sel);
const $clockToggle = qs("#clock-toggle");
const $statusState = qs("#status-state");
const $statusSince = qs("#status-since");
const $sessionsTbody = qs("#sessions-tbody");
const $exportCSV = qs("#export-csv");
const $loginBtn = qs("#login-btn");
const $quickNote = qs("#quick-note");
const $ = (sel) => {
	const el = qs(sel);
	if (!el) throw new Error(`Required element not found in DOM: ${sel}`);
	return el;
};

function init() {
	$clockToggle.addEventListener("click", handleClockToggle);
	$exportCSV.addEventListener("click", handleExportCSV);
	$loginBtn.addEventListener("click", handleLogin);
	// Initial Render RenderSessions
	renderStatus();
	renderSessions([]);
}

function renderStatus({ clockedIn = false, sinceISO = null } = {}) {
	$statusState.textContent = clockedIn ? "clock-in" : "clocked-out";
	$statusSince.textContent = sinceISO ? `since ${formatLocal(sinceISO)}` : "";
	$clockToggle.textContent = clockedIn ? "Clock Out" : "Clock In";
}

function renderSessions(sessions) {
	$sessionsTbody.innerHTML = "";
	// Insert a placeholder row
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
		editBtn.addEventListener("click", () => {
			// TODO: open edit modal (Day 5)
			alert(`Edit entry ${s.id} (not implemented yet)`);
		});
		const delBtn = document.createElement("button");
		delBtn.className = "btn";
		delBtn.textContent = "Delete";
		delBtn.addEventListener("click", () => {
			// TODO: delete entry (Day 5)
			alert(`Delete entry ${s.id} (not implemented yet)`);
		});
		actionsTd.append(editBtn, delBtn);
		tr.appendChild(actionsTd);

		$sessionsTbody.appendChild(tr);
	});
	// Future Map sessions => rows.
}

function handleClockToggle(e) {
	console.log(
		"Clock toggle clicked (demo placeholder). Quick note:",
		$quickNote.value,
	);
	// TODO: Implement Clock In/Out Behavior (Day 2+)
	alert("Demo: clock toggle clicked. Implemented in Day 2.");
}

function handleExportCSV(e) {
	console.log("Export CSV clicked (demo placeholder).");
	alert("Demo: export CSV will be implemented Day 5.");
}

function handleLogin(e) {
	console.log("Login clicked (demo placeholder).");
	alert("Demo: login/register will be implemented Day 3.");
}

/* ----- Small pure helpers (useful for Day 2) ----- */

function calculateSessionDuration(startISO, endISO) {
	// returns ms; negative durations are clamped to 0
	const ms = Date.parse(endISO) - Date.parse(startISO);
	return ms >= 0 ? ms : 0;
}

function formatDuration(ms) {
	const totalSec = Math.floor(ms / 1000);
	const hh = Math.floor(totalSec / 3600);
	const mm = Math.floor((totalSec % 3600) / 60);
	const ss = totalSec % 60;
	return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function pad(n) {
	return n.toString().padStart(2, "0");
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

/* ----- bootstrap after DOM ready ----- */
document.addEventListener("DOMContentLoaded", init);
