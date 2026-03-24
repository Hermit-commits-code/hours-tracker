// tests/app.test.js
// Vitest tests for the pure functions + storage roundtrip.

import { describe, it, expect, beforeEach } from "vitest";

// lightweight localStorage mock for tests (reset per test)
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

// Import after mock
import * as storage from "../src/storage.js";
import * as app from "../src/app.js";

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

describe("storage roundtrip & session flows with projects", () => {
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

	it("clockIn prevents double clock-in and clockOut works with project", () => {
		const uid = "user1";
		storage.setCurrentUserId(uid);
		storage.saveSessions(uid, []);
		// ensure project exists
		storage.saveProjects([{ id: "p1", name: "Alpha" }]);

		const s1 = app.clockIn(uid, "note1", "p1");
		expect(app.hasOpenSession(uid)).toBe(true);
		expect(s1.projectId).toBe("p1");

		expect(() => app.clockIn(uid)).toThrow();
		const closed = app.clockOut(uid);
		expect(closed.end).toBeTruthy();
		expect(app.hasOpenSession(uid)).toBe(false);
	});

	it("clockOut when none open throws error", () => {
		const uid = "user2";
		storage.saveSessions(uid, []);
		expect(() => app.clockOut(uid)).toThrow();
	});

	it("exportCSV produces header and rows equal to sessions count and includes project columns", () => {
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
		// check that project name appears in second line
		expect(lines[1].includes("Alpha")).toBe(true);
	});
});
