/**
 * Smoke Tests
 * @module e2e/smoke.spec
 *
 * Basic smoke tests to verify the app loads and functions correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('App Smoke Tests', () => {
	test('homepage loads successfully', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);
	});

	test('has page title', async ({ page }) => {
		await page.goto('/');
		// App has a title set (Beads or similar)
		const title = await page.title();
		expect(title.length).toBeGreaterThan(0);
	});

	test('displays navigation tabs', async ({ page }) => {
		await page.goto('/');
		// Main navigation should be visible with tabs
		const nav = page.locator('nav').first();
		await expect(nav).toBeVisible();

		// Should have Issues tab
		const issuesTab = page.getByRole('tab', { name: 'Issues' });
		await expect(issuesTab).toBeVisible();
	});

	test('has main content area', async ({ page }) => {
		await page.goto('/');
		const main = page.locator('main#main-content');
		await expect(main).toBeVisible();
	});

	test('has proper viewport meta tag', async ({ page }) => {
		await page.goto('/');
		const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
		expect(viewport).toContain('width=device-width');
	});

	test('has skip link for accessibility', async ({ page }) => {
		await page.goto('/');
		const skipLink = page.locator('a[href="#main-content"]');
		// Skip link exists but is visually hidden until focused
		await expect(skipLink).toBeAttached();
	});
});

test.describe('Performance Baselines', () => {
	test('page loads within acceptable time', async ({ page }) => {
		const startTime = Date.now();
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const loadTime = Date.now() - startTime;

		// Page should load within 5 seconds
		expect(loadTime).toBeLessThan(5000);
	});

	test('no console errors on load', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Filter out expected errors (e.g., favicon 404)
		const unexpectedErrors = errors.filter(
			(err) => !err.includes('favicon') && !err.includes('404')
		);

		expect(unexpectedErrors).toHaveLength(0);
	});

	test('no uncaught exceptions', async ({ page }) => {
		const exceptions: Error[] = [];
		page.on('pageerror', (error) => {
			exceptions.push(error);
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		expect(exceptions).toHaveLength(0);
	});
});

test.describe('Responsive Design', () => {
	const viewports = [
		{ name: 'Mobile', width: 375, height: 667 },
		{ name: 'Tablet', width: 768, height: 1024 },
		{ name: 'Desktop', width: 1280, height: 720 },
		{ name: 'Wide', width: 1920, height: 1080 }
	];

	for (const viewport of viewports) {
		test(`renders correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
			page
		}) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.goto('/');

			// Navigation should be visible
			const nav = page.locator('nav').first();
			await expect(nav).toBeVisible();

			// Main content area should be visible
			const main = page.locator('main#main-content');
			await expect(main).toBeVisible();
		});
	}
});

test.describe('Navigation', () => {
	test('refreshing page maintains state', async ({ page }) => {
		await page.goto('/');
		const issuesTab = page.getByRole('tab', { name: 'Issues' });
		await expect(issuesTab).toBeVisible();

		await page.reload();
		await expect(issuesTab).toBeVisible();
	});

	test('tab navigation works', async ({ page }) => {
		await page.goto('/');

		// Issues tab should be active on homepage
		const issuesTab = page.getByRole('tab', { name: 'Issues' });
		await expect(issuesTab).toHaveAttribute('aria-selected', 'true');

		// Click on Board tab
		const boardTab = page.getByRole('tab', { name: 'Board' });
		await boardTab.click();

		// Should navigate to kanban route
		await expect(page).toHaveURL(/\/kanban/);
	});
});
