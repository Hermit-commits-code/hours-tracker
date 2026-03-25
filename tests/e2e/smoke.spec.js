import { expect, test } from "@playwright/test";

test("core smoke: clock in/out and export", async ({ page }) => {
	// Use the app subpath used by your live-server
	await page.goto("/hours-tracker/", { waitUntil: "networkidle" });

	// Wait for the quick note input to exist (increase timeout if needed)
	await page.waitForSelector("#quick-note", { timeout: 10000 });
	await page.fill("#quick-note", "smoke test note");

	// Clock In / Clock Out
	await page.waitForSelector("#clock-toggle", { timeout: 5000 });
	await page.click("#clock-toggle");
	await page.waitForTimeout(800);
	await page.click("#clock-toggle");
	await page.waitForTimeout(300);

	// Ensure a session row shows up
	await page.waitForSelector("#sessions-tbody tr", { timeout: 5000 });
	const rows = page.locator("#sessions-tbody tr");
	await expect(rows.first()).toBeVisible();

	// Monkeypatch createObjectURL and click export
	await page.evaluate(() => {
		window.__exportCalled = false;
		const orig = URL.createObjectURL;
		URL.createObjectURL = function (b) {
			window.__exportCalled = true;
			return orig.call(this, b);
		};
	});

	await page.waitForSelector("#export-csv", { timeout: 5000 });
	await page.click("#export-csv");

	const exportCalled = await page.evaluate(() => !!window.__exportCalled);
	expect(exportCalled).toBe(true);
});
