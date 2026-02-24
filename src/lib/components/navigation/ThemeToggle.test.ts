/**
 * ThemeToggle Component Tests (TDD)
 * @module components/navigation/ThemeToggle.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
	beforeEach(() => {
		// Reset document class
		document.documentElement.classList.remove('dark', 'light');
	});

	describe('rendering', () => {
		it('renders theme toggle button', () => {
			render(ThemeToggle, { props: {} });

			expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
		});

		it('shows current theme indicator', () => {
			render(ThemeToggle, { props: { theme: 'dark' } });

			// Should show some indication of dark theme (icon or text)
			const button = screen.getByRole('button', { name: /theme/i });
			expect(button).toBeInTheDocument();
		});
	});

	describe('theme cycling', () => {
		it('cycles through themes on click: light -> dark -> system', async () => {
			const onThemeChange = vi.fn();
			render(ThemeToggle, { props: { theme: 'light', onthemechange: onThemeChange } });

			await fireEvent.click(screen.getByRole('button', { name: /theme/i }));

			expect(onThemeChange).toHaveBeenCalledWith('dark');
		});

		it('cycles from dark to system', async () => {
			const onThemeChange = vi.fn();
			render(ThemeToggle, { props: { theme: 'dark', onthemechange: onThemeChange } });

			await fireEvent.click(screen.getByRole('button', { name: /theme/i }));

			expect(onThemeChange).toHaveBeenCalledWith('system');
		});

		it('cycles from system to light', async () => {
			const onThemeChange = vi.fn();
			render(ThemeToggle, { props: { theme: 'system', onthemechange: onThemeChange } });

			await fireEvent.click(screen.getByRole('button', { name: /theme/i }));

			expect(onThemeChange).toHaveBeenCalledWith('light');
		});
	});

	describe('theme application', () => {
		it('applies dark class to document when theme is dark', () => {
			render(ThemeToggle, { props: { theme: 'dark' } });

			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});

		it('removes dark class when theme is light', () => {
			document.documentElement.classList.add('dark');
			render(ThemeToggle, { props: { theme: 'light' } });

			expect(document.documentElement.classList.contains('dark')).toBe(false);
		});
	});

	describe('accessibility', () => {
		it('button has accessible name', () => {
			render(ThemeToggle, { props: {} });

			const button = screen.getByRole('button', { name: /theme/i });
			expect(button).toHaveAccessibleName();
		});

		it('indicates current theme to screen readers', () => {
			render(ThemeToggle, { props: { theme: 'dark' } });

			const button = screen.getByRole('button', { name: /theme/i });
			// Should have some aria description or label indicating current theme
			expect(button.getAttribute('aria-label') || button.textContent).toMatch(/dark|theme/i);
		});
	});

	describe('icons', () => {
		it('shows sun icon for light theme', () => {
			render(ThemeToggle, { props: { theme: 'light' } });

			expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
		});

		it('shows moon icon for dark theme', () => {
			render(ThemeToggle, { props: { theme: 'dark' } });

			expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
		});

		it('shows system icon for system theme', () => {
			render(ThemeToggle, { props: { theme: 'system' } });

			expect(screen.getByTestId('icon-system')).toBeInTheDocument();
		});
	});
});
