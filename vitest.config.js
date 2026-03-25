// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Ignore Playwright E2E tests so Vitest does not attempt to run them.
		exclude: ["tests/e2e/**", "e2e/**"],
	},
});
