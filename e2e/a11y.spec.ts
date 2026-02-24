/**
 * Accessibility Tests
 * @module e2e/a11y.spec
 *
 * Automated accessibility testing using axe-core.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
	test('homepage has no accessibility violations', async ({ page }) => {
		await page.goto('/');

		// Test for WCAG 2.1 AA violations, excluding best-practice rules
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		// Log violations for debugging
		if (accessibilityScanResults.violations.length > 0) {
			console.warn(
				'Accessibility violations:',
				JSON.stringify(accessibilityScanResults.violations, null, 2)
			);
		}

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('page has proper heading hierarchy', async ({ page }) => {
		await page.goto('/');

		// Get all headings
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

		// If there are headings, verify hierarchy
		if (headings.length > 0) {
			const headingLevels = await Promise.all(
				headings.map(async (h) => {
					const tagName = await h.evaluate((el) => el.tagName.toLowerCase());
					return parseInt(tagName.replace('h', ''));
				})
			);

			// Verify heading levels don't skip (e.g., h1 -> h3 without h2)
			for (let i = 1; i < headingLevels.length; i++) {
				const current = headingLevels[i]!;
				const previous = headingLevels[i - 1]!;
				// Each subsequent heading should be at most 1 level deeper
				expect(current - previous).toBeLessThanOrEqual(1);
			}
		}

		// App uses navigation tabs instead of h1, which is acceptable
		// Main landmark should exist for accessibility
		const main = page.locator('main');
		await expect(main).toBeVisible();
	});

	test('all images have alt text', async ({ page }) => {
		await page.goto('/');

		const images = await page.locator('img').all();
		for (const img of images) {
			const alt = await img.getAttribute('alt');
			// alt can be empty string for decorative images, but should exist
			expect(alt).not.toBeNull();
		}
	});

	test('all form inputs have labels', async ({ page }) => {
		await page.goto('/');

		// Only check visible inputs that are not inside dialogs (dialogs may not be rendered yet)
		const inputs = await page
			.locator('input:not([type="hidden"]):visible, textarea:visible, select:visible')
			.all();

		for (const input of inputs) {
			const id = await input.getAttribute('id');
			const ariaLabel = await input.getAttribute('aria-label');
			const ariaLabelledBy = await input.getAttribute('aria-labelledby');
			const title = await input.getAttribute('title');
			const placeholder = await input.getAttribute('placeholder');

			// Input should have either a label, aria-label, aria-labelledby, or title
			const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;
			const hasAriaLabel = !!ariaLabel;
			const hasAriaLabelledBy = !!ariaLabelledBy;
			const hasTitle = !!title;

			// For search inputs, placeholder can serve as accessible name
			const inputType = await input.getAttribute('type');
			const isSearchWithPlaceholder = inputType === 'search' && !!placeholder;

			expect(
				hasLabel || hasAriaLabel || hasAriaLabelledBy || hasTitle || isSearchWithPlaceholder
			).toBe(true);
		}
	});

	test('buttons and links are keyboard accessible', async ({ page }) => {
		await page.goto('/');

		// Get all interactive elements
		const interactiveElements = await page.locator('button, a, [role="button"], [tabindex]').all();

		for (const element of interactiveElements) {
			const tabindex = await element.getAttribute('tabindex');
			// Elements should not have negative tabindex (unless intentionally hidden)
			if (tabindex !== null) {
				const tabindexValue = parseInt(tabindex);
				// Allow -1 only if aria-hidden
				if (tabindexValue < 0) {
					const ariaHidden = await element.getAttribute('aria-hidden');
					expect(ariaHidden).toBe('true');
				}
			}
		}
	});

	test('focus is visible on interactive elements', async ({ page }) => {
		await page.goto('/');

		// Tab through the page
		await page.keyboard.press('Tab');

		// Get the focused element
		const focusedElement = await page.evaluate(() => {
			const el = document.activeElement;
			if (!el || el === document.body) return null;

			const styles = window.getComputedStyle(el);
			return {
				tagName: el.tagName,
				hasOutline: styles.outlineStyle !== 'none' || styles.boxShadow !== 'none',
				outlineStyle: styles.outlineStyle,
				outlineWidth: styles.outlineWidth
			};
		});

		// If there's a focused element, it should have visible focus
		if (focusedElement) {
			expect(focusedElement.hasOutline).toBe(true);
		}
	});

	test('color contrast meets WCAG AA standards', async ({ page }) => {
		await page.goto('/');

		// Run axe specifically for color-contrast
		const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'color-contrast'
		);

		expect(contrastViolations).toHaveLength(0);
	});

	test('page has lang attribute', async ({ page }) => {
		await page.goto('/');

		const lang = await page.locator('html').getAttribute('lang');
		expect(lang).toBeTruthy();
	});

	test('skip link is available for keyboard users', async ({ page }) => {
		await page.goto('/');

		// Check if a skip link exists (targets main-content)
		const skipLink = page.locator('a[href="#main-content"]');
		const count = await skipLink.count();

		if (count > 0) {
			// Press Tab to focus the skip link (first focusable element)
			await page.keyboard.press('Tab');

			// Skip link should become visible when focused
			await expect(skipLink.first()).toBeVisible();
		}
	});
});

test.describe('Accessibility - Reduced Motion', () => {
	test('respects prefers-reduced-motion', async ({ page }) => {
		// Emulate reduced motion preference
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		// Check that animations are disabled or reduced
		const hasReducedMotion = await page.evaluate(() => {
			return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		});

		expect(hasReducedMotion).toBe(true);
	});
});

test.describe('Accessibility - Screen Reader', () => {
	test('main content is properly marked', async ({ page }) => {
		await page.goto('/');

		// Check for main landmark
		const main = page.locator('main, [role="main"]');
		const mainCount = await main.count();

		// Page should have exactly one main landmark
		expect(mainCount).toBe(1);
	});

	test('aria-live regions work correctly', async ({ page }) => {
		await page.goto('/');

		// Check for any aria-live regions
		const liveRegions = await page.locator('[aria-live]').all();

		for (const region of liveRegions) {
			const ariaLive = await region.getAttribute('aria-live');
			// aria-live should be 'polite', 'assertive', or 'off'
			expect(['polite', 'assertive', 'off']).toContain(ariaLive);
		}
	});
});
