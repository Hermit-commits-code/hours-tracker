// storage.js
// Minimal localStorage-based persistence layer for the Hours Tracker.

const NAMESPACE = "ht";

const keyUsers = () => `${NAMESPACE}:users`;
const keySessions = (userId) => `${NAMESPACE}:sessions:${userId}`;
const keyCurrentUser = () => `${NAMESPACE}:currentUserId`;
const keyProjects = () => `${NAMESPACE}:projects`;

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

/* Users */
export function loadUsers() {
	return loadJSON(keyUsers(), []);
}

export function saveUsers(users) {
	return saveJSON(keyUsers(), users);
}

export function findUserByUsername(username) {
	if (!username) return null;
	return loadUsers().find((u) => u.username === username) || null;
}

export function findUserById(id) {
	if (!id) return null;
	return loadUsers().find((u) => u.id === id) || null;
}

// Base64 encode compatible in Node/browser
function encodeBase64(str) {
	try {
		if (typeof btoa !== "undefined") return btoa(str);
		if (typeof Buffer !== "undefined")
			return Buffer.from(str, "utf-8").toString("base64");
	} catch (e) {}
	return str;
}

// createUser: demo-only password handling (base64). Replace with proper hashing server-side.
export function createUser({ username, password }) {
	if (!username || !password) throw new Error("username and password required");
	const users = loadUsers();
	if (users.some((u) => u.username === username))
		throw new Error("username already exists");
	const now = new Date().toISOString();
	const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
	const user = {
		id,
		username,
		passwordHash: encodeBase64(password), // DEMO ONLY
		createdAt: now,
	};
	users.push(user);
	saveUsers(users);
	return user;
}

export function authenticateUser(username, password) {
	const u = findUserByUsername(username);
	if (!u) return null;
	const incoming = encodeBase64(password);
	return u.passwordHash === incoming ? u : null;
}

/* Sessions */
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

/* Projects */
export function loadProjects() {
	return loadJSON(keyProjects(), []);
}

export function saveProjects(projects) {
	return saveJSON(keyProjects(), projects);
}

export function ensureDemoProjects() {
	const projects = loadProjects();
	if (projects.length === 0) {
		const demo = { id: "proj-default", name: "General" };
		projects.push(demo);
		saveProjects(projects);
		return projects;
	}
	return projects;
}

/* Demo user helper */
export function ensureDemoUser() {
	const users = loadUsers();
	if (users.length === 0) {
		const demo = {
			id: "demo",
			username: "demo",
			passwordHash: encodeBase64("demo"), // DEMO ONLY
			createdAt: new Date().toISOString(),
		};
		users.push(demo);
		saveUsers(users);
		setCurrentUserId(demo.id);
		return demo.id;
	}
	// set first user as current if none configured
	let cur = getCurrentUserId();
	if (!cur) {
		setCurrentUserId(users[0].id);
		cur = users[0].id;
	}
	return cur;
}

/* Test/dev helper */
export function clearAllForUser(userId) {
	if (!userId) return;
	localStorage.removeItem(keySessions(userId));
}
