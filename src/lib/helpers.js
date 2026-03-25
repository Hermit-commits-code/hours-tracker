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
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/* Date helpers */
export function startOfDay(d) {
	const nd = new Date(d);
	nd.setHours(0, 0, 0, 0);
	return nd;
}
export function startOfMonth(d) {
	const nd = new Date(d);
	nd.setDate(1);
	nd.setHours(0, 0, 0, 0);
	return nd;
}
export function startOfNextMonth(d) {
	const nd = startOfMonth(d);
	nd.setMonth(nd.getMonth() + 1);
	return nd;
}

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
