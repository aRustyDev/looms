/**
 * StatusDropdown Component Tests (TDD)
 * @module components/issues/StatusDropdown.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StatusDropdown from './StatusDropdown.svelte';

const defaultStatuses = ['open', 'in_progress', 'review', 'done', 'closed'];

describe('StatusDropdown', () => {
	describe('rendering', () => {
		it('renders current status as button', () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			expect(screen.getByRole('button')).toHaveTextContent('open');
		});

		it('displays all available statuses when opened', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			// Check options within the listbox
			const options = screen.getAllByRole('option');
			expect(options).toHaveLength(defaultStatuses.length);
			expect(options[0]).toHaveTextContent('open');
			expect(options[1]).toHaveTextContent('in_progress');
			expect(options[2]).toHaveTextContent('review');
			expect(options[3]).toHaveTextContent('done');
			expect(options[4]).toHaveTextContent('closed');
		});

		it('shows status color coding', () => {
			render(StatusDropdown, { props: { status: 'in_progress', statuses: defaultStatuses } });

			const button = screen.getByRole('button');
			// Should have some color-related class
			expect(button.className).toMatch(/text-|bg-/);
		});

		it('does not show dropdown when closed', () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	describe('interaction', () => {
		it('opens dropdown on click', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('closes dropdown when clicking outside', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));
			expect(screen.getByRole('listbox')).toBeInTheDocument();

			// Click outside
			await fireEvent.click(document.body);

			await waitFor(() => {
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			});
		});

		it('calls onchange with new status when selected', async () => {
			const onChange = vi.fn();
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, onchange: onChange }
			});

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.click(screen.getByRole('option', { name: 'in_progress' }));

			expect(onChange).toHaveBeenCalledWith('in_progress');
		});

		it('closes dropdown after selection', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.click(screen.getByRole('option', { name: 'done' }));

			await waitFor(() => {
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			});
		});
	});

	describe('optimistic updates', () => {
		it('updates UI immediately on selection', async () => {
			const onChange = vi.fn();
			const { rerender } = render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, onchange: onChange }
			});

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.click(screen.getByRole('option', { name: 'in_progress' }));

			// Simulate parent updating props after onChange
			await rerender({ status: 'in_progress', statuses: defaultStatuses, onchange: onChange });

			expect(screen.getByRole('button')).toHaveTextContent('in_progress');
		});

		it('shows loading indicator during update', async () => {
			const onChange = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, onchange: onChange, loading: true }
			});

			expect(screen.getByTestId('status-loading')).toBeInTheDocument();
		});

		it('reverts to original status on error', async () => {
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, error: 'Update failed' }
			});

			// Error state should show original status
			expect(screen.getByRole('button')).toHaveTextContent('open');
			expect(screen.getByText(/update failed/i)).toBeInTheDocument();
		});

		it('shows error toast on failure', async () => {
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, error: 'Network error' }
			});

			expect(screen.getByText(/network error/i)).toBeInTheDocument();
		});
	});

	describe('keyboard navigation', () => {
		it('opens dropdown with Enter key', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			const button = screen.getByRole('button');
			button.focus();
			await fireEvent.keyDown(button, { key: 'Enter' });

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('opens dropdown with Space key', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			const button = screen.getByRole('button');
			button.focus();
			await fireEvent.keyDown(button, { key: ' ' });

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('navigates options with Arrow keys', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			// Current status (index 0) is initially highlighted
			const options = screen.getAllByRole('option');
			expect(options[0]).toHaveAttribute('data-highlighted', 'true');

			// ArrowDown moves to next option
			const listbox = screen.getByRole('listbox');
			await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

			expect(options[0]).toHaveAttribute('data-highlighted', 'false');
			expect(options[1]).toHaveAttribute('data-highlighted', 'true');
		});

		it('selects option with Enter', async () => {
			const onChange = vi.fn();
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, onchange: onChange }
			});

			await fireEvent.click(screen.getByRole('button'));

			const listbox = screen.getByRole('listbox');
			await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
			await fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // Move to second option
			await fireEvent.keyDown(listbox, { key: 'Enter' });

			expect(onChange).toHaveBeenCalled();
		});

		it('closes dropdown with Escape', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));
			expect(screen.getByRole('listbox')).toBeInTheDocument();

			await fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

			await waitFor(() => {
				expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			});
		});
	});

	describe('accessibility', () => {
		it('has role="listbox" on dropdown', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		it('has role="option" on each status option', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			const options = screen.getAllByRole('option');
			expect(options).toHaveLength(defaultStatuses.length);
		});

		it('current status indicated with aria-selected', async () => {
			render(StatusDropdown, { props: { status: 'in_progress', statuses: defaultStatuses } });

			await fireEvent.click(screen.getByRole('button'));

			const selectedOption = screen.getByRole('option', { name: 'in_progress' });
			expect(selectedOption).toHaveAttribute('aria-selected', 'true');
		});

		it('button has aria-haspopup and aria-expanded', async () => {
			render(StatusDropdown, { props: { status: 'open', statuses: defaultStatuses } });

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-haspopup', 'listbox');
			expect(button).toHaveAttribute('aria-expanded', 'false');

			await fireEvent.click(button);
			expect(button).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('disabled state', () => {
		it('does not open when disabled', async () => {
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, disabled: true }
			});

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		it('button has aria-disabled when disabled', () => {
			render(StatusDropdown, {
				props: { status: 'open', statuses: defaultStatuses, disabled: true }
			});

			expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
		});
	});
});
