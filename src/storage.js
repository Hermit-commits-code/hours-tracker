// Storage.JS
// Minimal localStorage based persistence layer for Hours Tracker (Day 2)
// Replace with Server Backend API later

const NAMESPACE = "ht";

const keyUsers = () => `${NAMESPACE}: users`;
const keySessions = (userId) => `${NAMESPACE}:sessions:${userId}`;
const keyCurrentUser = () => `${NAMESPACE}:currentUserId`;

function loadJSON(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch (err) {
		console.error("loadJSON parse error", err);
		return fallback;
	}
}

function saveJSON(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (err) {
		console.error("saveJSON error", err);
	}
}

export function loadUsers() {
	return loadJSON(keyUsers(), []);
}

export function saveUsers(users) {
	return saveJSON(keyUsers(), users);
}

export function loadSessions(userId) {
	if (!userId) return [];
	return loadJSON(keySessions(userId), []);
}

export function saveSessions(userId, sessions) {
	if (!userId) return;
	return saveJSON(keySessions(userId), sessions);
}

export function getCurrentUserId() {
	return localStorage.getItem(keyCurrentUser());
}

export function setCurrentUserId(userId) {
	if (userId == null) {
		localStorage.removeItem(keyCurrentUser());
	} else {
		localStorage.setItem(keyCurrentUser(), userId);
	}
}

// Utility to ensure at least one demo user exists and set current user.
// This is for local development / demo only.
export function ensureDemoUser() {
	const users = loadUsers();
	if (users.length === 0) {
		const demo = {
			id: "demo",
			username: "demo",
			passwordHash: "demo", // DEMO ONLY
			createdAt: new Date().toISOString(),
		};
		users.push(demo);
		saveUsers(users);
		setCurrentUserId(demo.id);
		return demo.id;
	}
	// Set first user as current if none configured.
	let cur = getCurrentUserId();
	if (!cur) {
		setCurrentUserId(users[0].id);
		cur = users[0].id;
	}
	return cur;
}
// Small helper for tests/dev to clear keys
export function clearAllForUser(userId) {
	if (!userId) return;
	localStorage.removeItem(keySessions(userId));
}
