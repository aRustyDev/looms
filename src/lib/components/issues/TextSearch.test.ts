/**
 * TextSearch Component Tests (TDD)
 * @module components/issues/TextSearch.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TextSearch from './TextSearch.svelte';

describe('TextSearch', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('rendering', () => {
		it('renders search input with placeholder', () => {
			render(TextSearch, { props: {} });

			expect(screen.getByRole('searchbox')).toBeInTheDocument();
			expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
		});

		it('renders clear button when text is present', async () => {
			render(TextSearch, { props: { value: 'test' } });

			expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
		});

		it('hides clear button when input is empty', () => {
			render(TextSearch, { props: {} });

			expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
		});
	});

	describe('search behavior', () => {
		it('debounces search input by 300ms', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { onsearch: onSearch } });

			const input = screen.getByRole('searchbox');
			await fireEvent.input(input, { target: { value: 'test' } });

			// Should not be called immediately
			expect(onSearch).not.toHaveBeenCalled();

			// Fast-forward 200ms - still not called
			vi.advanceTimersByTime(200);
			expect(onSearch).not.toHaveBeenCalled();

			// Fast-forward remaining 100ms - now it should be called
			vi.advanceTimersByTime(100);
			expect(onSearch).toHaveBeenCalledWith('test');
		});

		it('calls onsearch callback with search term after debounce', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { onsearch: onSearch } });

			const input = screen.getByRole('searchbox');
			await fireEvent.input(input, { target: { value: 'bug fix' } });

			vi.advanceTimersByTime(300);

			expect(onSearch).toHaveBeenCalledWith('bug fix');
		});

		it('clears search when clear button is clicked', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { value: 'test', onsearch: onSearch } });

			await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

			// Should immediately call onsearch with empty string
			expect(onSearch).toHaveBeenCalledWith('');
		});

		it('triggers search immediately on Enter key', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { onsearch: onSearch } });

			const input = screen.getByRole('searchbox');
			await fireEvent.input(input, { target: { value: 'urgent' } });
			await fireEvent.keyDown(input, { key: 'Enter' });

			// Should be called immediately without waiting for debounce
			expect(onSearch).toHaveBeenCalledWith('urgent');
		});

		it('cancels pending debounce when Enter is pressed', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { onsearch: onSearch } });

			const input = screen.getByRole('searchbox');
			await fireEvent.input(input, { target: { value: 'urgent' } });

			// Press Enter before debounce completes
			await fireEvent.keyDown(input, { key: 'Enter' });

			expect(onSearch).toHaveBeenCalledTimes(1);
			expect(onSearch).toHaveBeenCalledWith('urgent');

			// Advance timer - should not call again
			vi.advanceTimersByTime(300);
			expect(onSearch).toHaveBeenCalledTimes(1);
		});

		it('resets debounce timer on new input', async () => {
			const onSearch = vi.fn();
			render(TextSearch, { props: { onsearch: onSearch } });

			const input = screen.getByRole('searchbox');

			// Type first character
			await fireEvent.input(input, { target: { value: 't' } });
			vi.advanceTimersByTime(200);

			// Type more characters (resets debounce)
			await fireEvent.input(input, { target: { value: 'test' } });
			vi.advanceTimersByTime(200);

			// Should still not be called (timer reset)
			expect(onSearch).not.toHaveBeenCalled();

			// Wait remaining time
			vi.advanceTimersByTime(100);
			expect(onSearch).toHaveBeenCalledWith('test');
		});
	});

	describe('accessibility', () => {
		it('has role="searchbox"', () => {
			render(TextSearch, { props: {} });

			expect(screen.getByRole('searchbox')).toBeInTheDocument();
		});

		it('has aria-label for search input', () => {
			render(TextSearch, { props: {} });

			expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label');
		});

		it('clear button has accessible name', async () => {
			render(TextSearch, { props: { value: 'test' } });

			const clearButton = screen.getByRole('button', { name: /clear/i });
			expect(clearButton).toBeInTheDocument();
		});

		it('has appropriate autocomplete attribute', () => {
			render(TextSearch, { props: {} });

			expect(screen.getByRole('searchbox')).toHaveAttribute('autocomplete', 'off');
		});
	});

	describe('controlled component', () => {
		it('displays controlled value prop', () => {
			render(TextSearch, { props: { value: 'initial search' } });

			expect(screen.getByRole('searchbox')).toHaveValue('initial search');
		});

		it('updates display when value prop changes', async () => {
			const { rerender } = render(TextSearch, { props: { value: 'initial' } });

			expect(screen.getByRole('searchbox')).toHaveValue('initial');

			await rerender({ value: 'updated' });

			expect(screen.getByRole('searchbox')).toHaveValue('updated');
		});
	});

	describe('loading state', () => {
		it('shows loading indicator when loading prop is true', () => {
			render(TextSearch, { props: { loading: true } });

			expect(screen.getByTestId('search-loading')).toBeInTheDocument();
		});

		it('hides loading indicator when loading prop is false', () => {
			render(TextSearch, { props: { loading: false } });

			expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
		});
	});
});

describe('SearchHighlight', () => {
	// Note: SearchHighlight tests will be separate since it's a different component
	// These tests are placeholders for when we implement highlighting
	it.todo('highlights matching substrings in text');
	it.todo('handles case-insensitive matching');
	it.todo('handles multiple matches');
	it.todo('renders plain text when no query');
});
