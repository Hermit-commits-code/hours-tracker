// tests/app.test.js
import { beforeEach, describe, expect, it } from "vitest";

// simple localStorage mock
function createLocalStorageMock() {
	let store = {};
	return {
		getItem(key) {
			return Object.hasOwn(store, key) ? store[key] : null;
		},
		setItem(key, value) {
			store[key] = String(value);
		},
		removeItem(key) {
			delete store[key];
		},
		clear() {
			store = {};
		},
	};
}

global.localStorage = createLocalStorageMock();

import * as app from "../src/app.js";
import * as storage from "../src/storage.js";

beforeEach(() => {
	global.localStorage.clear();
});

describe("pure helpers", () => {
	it("calculateSessionDuration returns expected ms for 4.5 hours", () => {
		const s = "2026-03-24T22:00:00.000Z";
		const e = "2026-03-25T02:30:00.000Z";
		expect(app.calculateSessionDuration(s, e)).toBe(16200000);
	});

	it("formatDuration formats ms to HH:MM:SS", () => {
		expect(app.formatDuration(5400000)).toBe("01:30:00");
	});

	it("generateId returns a non-empty string", () => {
		const id = app.generateId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(4);
	});
});

describe("storage & auth", () => {
	it("create and authenticate user (demo)", () => {
		const user = storage.createUser({ username: "alice", password: "secret" });
		expect(user.username).toBe("alice");
		const auth = storage.authenticateUser("alice", "secret");
		expect(auth).not.toBeNull();
		expect(auth.username).toBe("alice");
		const bad = storage.authenticateUser("alice", "wrong");
		expect(bad).toBeNull();
	});
});

describe("sessions & projects", () => {
	it("projects save/load roundtrip", () => {
		const projects = [
			{ id: "p1", name: "Alpha" },
			{ id: "p2", name: "Beta" },
		];
		storage.saveProjects(projects);
		const loaded = storage.loadProjects();
		expect(loaded.length).toBe(2);
		expect(loaded[0].name).toBe("Alpha");
	});

	it("save and load sessions persists data", () => {
		const uid = "u-test";
		const sessions = [
			{
				id: "s1",
				userId: uid,
				start: "2026-03-24T22:00:00.000Z",
				end: "2026-03-24T23:00:00.000Z",
				notes: "x",
			},
		];
		storage.saveSessions(uid, sessions);
		const loaded = storage.loadSessions(uid);
		expect(Array.isArray(loaded)).toBe(true);
		expect(loaded.length).toBe(1);
		expect(loaded[0].id).toBe("s1");
	});

	it("clockIn/clockOut and project handling", () => {
		const uid = "user1";
		storage.setCurrentUserId(uid);
		storage.saveSessions(uid, []);
		storage.saveProjects([{ id: "p1", name: "Alpha" }]);
		const s1 = app.clockIn(uid, "note1", "p1");
		expect(app.hasOpenSession(uid)).toBe(true);
		expect(s1.projectId).toBe("p1");
		expect(() => app.clockIn(uid)).toThrow();
		const closed = app.clockOut(uid);
		expect(closed.end).toBeTruthy();
		expect(app.hasOpenSession(uid)).toBe(false);
	});

	it("exportCSV produces header and project name", () => {
		const uid = "user3";
		const sessions = [
			{
				id: "a",
				userId: uid,
				start: "2026-03-24T08:00:00.000Z",
				end: "2026-03-24T09:00:00.000Z",
				notes: "one",
				projectId: "p-a",
			},
			{
				id: "b",
				userId: uid,
				start: "2026-03-24T10:00:00.000Z",
				end: "2026-03-24T12:00:00.000Z",
				notes: "two",
				projectId: "p-b",
			},
		];
		storage.saveSessions(uid, sessions);
		storage.saveProjects([
			{ id: "p-a", name: "Alpha" },
			{ id: "p-b", name: "Beta" },
		]);
		const csv = app.exportCSV(uid);
		const lines = csv.split("\n").filter(Boolean);
		expect(
			lines[0].startsWith(
				"id,start,end,durationSeconds,projectId,projectName,notes",
			),
		).toBe(true);
		expect(lines.length).toBe(1 + sessions.length);
		expect(lines[1].includes("Alpha")).toBe(true);
	});
});

describe("totals calculation", () => {
	it("calculates today/week/month totals correctly", () => {
		const ref = "2026-03-25T12:00:00.000Z";
		const sessions = [
			{
				id: "a",
				start: "2026-03-25T08:00:00.000Z",
				end: "2026-03-25T10:00:00.000Z",
			},
			{
				id: "b",
				start: "2026-03-22T09:00:00.000Z",
				end: "2026-03-22T10:00:00.000Z",
			},
			{
				id: "c",
				start: "2026-03-05T09:00:00.000Z",
				end: "2026-03-05T13:00:00.000Z",
			},
		];
		const totals = app.calculateTotals(sessions, ref);
		expect(totals.today).toBe(2 * 3600 * 1000);
		expect(totals.week).toBe((2 + 1) * 3600 * 1000);
		expect(totals.month).toBe((2 + 1 + 4) * 3600 * 1000);
	});
});

describe("add/update entry and export range", () => {
	it("addEntry stores session and updateEntry updates it", () => {
		const uid = "t-user";
		storage.setCurrentUserId(uid);
		storage.saveSessions(uid, []);
		const ent = app.addEntry(uid, {
			startISO: "2026-03-25T01:00:00.000Z",
			endISO: "2026-03-25T02:00:00.000Z",
			notes: "test",
			projectId: "proj-default",
		});
		expect(ent.id).toBeTruthy();
		let loaded = storage.loadSessions(uid);
		expect(loaded.length).toBe(1);
		app.updateEntry(uid, ent.id, { notes: "updated" });
		loaded = storage.loadSessions(uid);
		expect(loaded[0].notes).toBe("updated");
	});

	it("exportCSV with range filters sessions correctly", () => {
		const uid = "csv-user";
		storage.saveSessions(uid, [
			{
				id: "a",
				userId: uid,
				start: "2026-03-25T08:00:00.000Z",
				end: "2026-03-25T09:00:00.000Z",
			},
			{
				id: "b",
				userId: uid,
				start: "2026-03-20T08:00:00.000Z",
				end: "2026-03-20T09:00:00.000Z",
			},
		]);
		const allCsv = app.exportCSV(uid, "all").split("\n").filter(Boolean);
		expect(allCsv.length).toBe(1 + 2);
		const todayCsv = app
			.exportCSV(uid, "today", "2026-03-25T12:00:00.000Z")
			.split("\n")
			.filter(Boolean);
		expect(todayCsv.length).toBe(1 + 1);
	});
});
