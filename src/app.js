const qs = (sel) => document.querySelector(sel);
const $clockToggle = qs("#clock-toggle");
const $statusSince = qs("#status-since");
const $sessionsTbody = qs("#sessions-tbody");
const $exportCSV = qs("#export-csv");
const $loginBtn = qs("#login-btn");
const $quickNote = qs("#quick-note");

function init() {
	$clockToggle.addEventListener("click", handleClockToggle);
	$exportCSV.addEventListener("click", handleExportCSV);
	$loginBtn.addEventListener("click", handleLogin);
	// Initial Render RenderSessions
	renderSessions([]);
}

function renderStatus() {
	$statusState.textContent = "clocked-out";
	$statusSince.textContent = "";
	$clockToggle.textContent = "Clock In";
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
