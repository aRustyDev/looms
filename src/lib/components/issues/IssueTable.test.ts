/**
 * IssueTable Component Tests (TDD)
 * @module components/issues/IssueTable.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { Issue } from '$lib/db/types.js';
import IssueTable from './IssueTable.svelte';

// Mock data
const mockIssues: Issue[] = [
	{
		id: 'test-1',
		title: 'Fix authentication bug',
		description: 'Users cannot login',
		status: 'open',
		priority: 1,
		issue_type: 'bug',
		assignee: 'alice',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-15T00:00:00Z'
	},
	{
		id: 'test-2',
		title: 'Add dark mode',
		description: 'Implement dark theme',
		status: 'in_progress',
		priority: 2,
		issue_type: 'feature',
		assignee: 'bob',
		created_at: '2024-01-02T00:00:00Z',
		updated_at: '2024-01-14T00:00:00Z'
	},
	{
		id: 'test-3',
		title: 'Update docs',
		description: 'API documentation update',
		status: 'done',
		priority: 3,
		issue_type: 'task',
		assignee: undefined,
		created_at: '2024-01-03T00:00:00Z',
		updated_at: '2024-01-13T00:00:00Z'
	}
];

describe('IssueTable', () => {
	describe('rendering', () => {
		it('renders a row for each issue', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			// Should have 3 data rows (not counting header)
			const rows = screen.getAllByRole('row');
			// Header + 3 data rows = 4
			expect(rows.length).toBeGreaterThanOrEqual(4);
		});

		it('displays issue ID and title', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			expect(screen.getByText('test-1')).toBeInTheDocument();
			expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
			expect(screen.getByText('test-2')).toBeInTheDocument();
			expect(screen.getByText('Add dark mode')).toBeInTheDocument();
		});

		it('shows status badge for each issue', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			expect(screen.getByText('open')).toBeInTheDocument();
			expect(screen.getByText('in_progress')).toBeInTheDocument();
			expect(screen.getByText('done')).toBeInTheDocument();
		});

		it('shows assignee or placeholder for unassigned', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			expect(screen.getByText('alice')).toBeInTheDocument();
			expect(screen.getByText('bob')).toBeInTheDocument();
			// Unassigned should show placeholder
			expect(screen.getByText(/unassigned/i)).toBeInTheDocument();
		});
	});

	describe('empty states', () => {
		it('shows empty state when no issues', () => {
			render(IssueTable, { props: { issues: [] } });

			expect(screen.getByText(/no issues/i)).toBeInTheDocument();
		});

		it('shows loading skeleton when loading', () => {
			render(IssueTable, { props: { issues: [], loading: true } });

			// Should have skeleton elements
			expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
		});

		it('shows error state with retry button', () => {
			render(IssueTable, { props: { issues: [], error: 'Failed to load' } });

			expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
		});
	});

	describe('selection', () => {
		it('highlights selected row', () => {
			render(IssueTable, { props: { issues: mockIssues, selectedId: 'test-2' } });

			// Find the row containing test-2
			const selectedRow = screen.getByText('test-2').closest('tr');
			expect(selectedRow).toHaveClass('selected');
		});

		it('emits select event when row is clicked', async () => {
			const onSelect = vi.fn();
			render(IssueTable, { props: { issues: mockIssues, onselect: onSelect } });

			const row = screen.getByText('test-1').closest('tr');
			await fireEvent.click(row!);

			expect(onSelect).toHaveBeenCalledWith('test-1');
		});
	});

	describe('sorting', () => {
		it('shows sort indicator on sortable columns', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			// Updated column should have sort indicator by default
			const updatedHeader = screen.getByRole('columnheader', { name: /updated/i });
			expect(updatedHeader).toHaveAttribute('aria-sort');
		});

		it('emits sort event when column header is clicked', async () => {
			const onSort = vi.fn();
			render(IssueTable, { props: { issues: mockIssues, onsort: onSort } });

			const priorityHeader = screen.getByRole('columnheader', { name: /priority/i });
			await fireEvent.click(priorityHeader);

			expect(onSort).toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('has role="grid" on table', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			expect(screen.getByRole('grid')).toBeInTheDocument();
		});

		it('has accessible column headers', () => {
			render(IssueTable, { props: { issues: mockIssues } });

			expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
		});
	});
});
