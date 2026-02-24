/**
 * FilterPanel Component Tests (TDD)
 * @module components/issues/FilterPanel.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FilterPanel from './FilterPanel.svelte';

describe('FilterPanel', () => {
	describe('rendering', () => {
		it('renders filter panel container', () => {
			render(FilterPanel);

			expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
		});

		it('renders status filter with multi-select', () => {
			render(FilterPanel);

			expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
		});

		it('renders type filter with multi-select', () => {
			render(FilterPanel);

			expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
		});

		it('renders priority filter with multi-select', () => {
			render(FilterPanel);

			expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
		});

		it('renders assignee dropdown', () => {
			render(FilterPanel);

			expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
		});

		it('renders search input', () => {
			render(FilterPanel);

			expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
		});

		it('renders clear all button when filters are active', async () => {
			render(FilterPanel, { props: { status: ['open'] } });

			expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
		});

		it('does not render clear button when no filters active', () => {
			render(FilterPanel);

			expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
		});
	});

	describe('status filter', () => {
		it('displays status options', async () => {
			render(FilterPanel, {
				props: { availableStatuses: ['open', 'in_progress', 'done'] }
			});

			const statusSelect = screen.getByLabelText(/status/i);
			await fireEvent.click(statusSelect);

			expect(screen.getByText('open')).toBeInTheDocument();
			expect(screen.getByText('in_progress')).toBeInTheDocument();
			expect(screen.getByText('done')).toBeInTheDocument();
		});

		it('allows selecting a status', async () => {
			const onFilterChange = vi.fn();
			render(FilterPanel, {
				props: {
					availableStatuses: ['open', 'in_progress', 'done'],
					onfilterchange: onFilterChange
				}
			});

			const statusSelect = screen.getByLabelText(/status/i);
			await fireEvent.click(statusSelect);
			await fireEvent.click(screen.getByText('open'));

			expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ status: ['open'] }));
		});

		it('adds to existing status selection', async () => {
			const onFilterChange = vi.fn();
			render(FilterPanel, {
				props: {
					status: ['open'],
					availableStatuses: ['open', 'in_progress', 'done'],
					onfilterchange: onFilterChange
				}
			});

			const statusSelect = screen.getByLabelText(/status/i);
			await fireEvent.click(statusSelect);
			await fireEvent.click(screen.getByText('in_progress'));

			expect(onFilterChange).toHaveBeenCalledWith(
				expect.objectContaining({
					status: expect.arrayContaining(['open', 'in_progress'])
				})
			);
		});

		it('shows selected status as badges', () => {
			render(FilterPanel, { props: { status: ['open', 'in_progress'] } });

			expect(screen.getByText('open')).toBeInTheDocument();
			expect(screen.getByText('in_progress')).toBeInTheDocument();
		});
	});

	describe('type filter', () => {
		it('displays type options', async () => {
			render(FilterPanel, {
				props: { availableTypes: ['bug', 'feature', 'task'] }
			});

			const typeSelect = screen.getByLabelText(/type/i);
			await fireEvent.click(typeSelect);

			expect(screen.getByText('bug')).toBeInTheDocument();
			expect(screen.getByText('feature')).toBeInTheDocument();
			expect(screen.getByText('task')).toBeInTheDocument();
		});
	});

	describe('priority filter', () => {
		it('displays priority options', async () => {
			render(FilterPanel);

			const prioritySelect = screen.getByLabelText(/priority/i);
			await fireEvent.click(prioritySelect);

			expect(screen.getByText(/p1/i)).toBeInTheDocument();
			expect(screen.getByText(/p2/i)).toBeInTheDocument();
			expect(screen.getByText(/p3/i)).toBeInTheDocument();
			expect(screen.getByText(/p4/i)).toBeInTheDocument();
		});
	});

	describe('search input', () => {
		it('debounces search input by 300ms', async () => {
			vi.useFakeTimers();
			const onFilterChange = vi.fn();
			render(FilterPanel, { props: { onfilterchange: onFilterChange } });

			const searchInput = screen.getByPlaceholderText(/search/i);
			await fireEvent.input(searchInput, { target: { value: 'test' } });

			// Should not call immediately
			expect(onFilterChange).not.toHaveBeenCalled();

			// Fast-forward 300ms
			await vi.advanceTimersByTimeAsync(300);

			expect(onFilterChange).toHaveBeenCalledWith(
				expect.objectContaining({
					search: 'test'
				})
			);

			vi.useRealTimers();
		});

		it('shows search value from prop', () => {
			render(FilterPanel, { props: { search: 'existing search' } });

			expect(screen.getByPlaceholderText(/search/i)).toHaveValue('existing search');
		});
	});

	describe('assignee filter', () => {
		it('displays available assignees', async () => {
			render(FilterPanel, {
				props: { availableAssignees: ['alice', 'bob', 'charlie'] }
			});

			const assigneeSelect = screen.getByLabelText(/assignee/i);
			await fireEvent.click(assigneeSelect);

			expect(screen.getByText('alice')).toBeInTheDocument();
			expect(screen.getByText('bob')).toBeInTheDocument();
			expect(screen.getByText('charlie')).toBeInTheDocument();
		});
	});

	describe('clear filters', () => {
		it('clears all filters when clear button is clicked', async () => {
			const onFilterChange = vi.fn();
			render(FilterPanel, {
				props: {
					status: ['open'],
					issueType: ['bug'],
					priority: [1],
					search: 'test',
					onfilterchange: onFilterChange
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

			expect(onFilterChange).toHaveBeenCalledWith({
				status: [],
				issueType: [],
				priority: [],
				assignee: '',
				search: ''
			});
		});
	});

	describe('filter badges', () => {
		it('displays badges for active filters', () => {
			render(FilterPanel, {
				props: {
					status: ['open'],
					issueType: ['bug'],
					priority: [1]
				}
			});

			const badges = screen.getAllByTestId('filter-badge');
			expect(badges.length).toBeGreaterThanOrEqual(3);
		});

		it('removes filter when badge is clicked', async () => {
			const onFilterChange = vi.fn();
			render(FilterPanel, {
				props: {
					status: ['open', 'in_progress'],
					onfilterchange: onFilterChange
				}
			});

			// Click the remove button on the 'open' badge
			const openBadge = screen.getByText('open').closest('[data-testid="filter-badge"]');
			const removeButton = openBadge?.querySelector('button');
			await fireEvent.click(removeButton!);

			expect(onFilterChange).toHaveBeenCalledWith(
				expect.objectContaining({
					status: ['in_progress']
				})
			);
		});
	});

	describe('accessibility', () => {
		it('has accessible filter labels', () => {
			render(FilterPanel);

			expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
		});

		it('search input has search role', () => {
			render(FilterPanel);

			expect(screen.getByRole('searchbox')).toBeInTheDocument();
		});
	});
});
