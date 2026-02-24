/**
 * KanbanCard Component Tests (TDD)
 * @module components/kanban/KanbanCard.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import KanbanCard from './KanbanCard.svelte';

const mockIssue = {
	id: 'TEST-123',
	title: 'Fix authentication bug',
	type: 'bug',
	priority: 'P1',
	status: 'in_progress',
	assignee: 'John Doe'
};

describe('KanbanCard', () => {
	describe('rendering', () => {
		it('displays issue title', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
		});

		it('displays issue ID', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			expect(screen.getByText('TEST-123')).toBeInTheDocument();
		});

		it('displays issue type badge', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			// Find the type badge specifically (has rounded-full class)
			const typeBadges = screen.getAllByText(/bug/i);
			const typeBadge = typeBadges.find((el) => el.classList.contains('rounded-full'));
			expect(typeBadge).toBeInTheDocument();
		});

		it('displays priority indicator', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			expect(screen.getByText(/P1/)).toBeInTheDocument();
		});

		it('displays assignee', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		it('displays initials when avatar not available', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			// Should show initials (JD for John Doe)
			expect(screen.getByText('JD')).toBeInTheDocument();
		});

		it('displays "Unassigned" when no assignee', () => {
			const issueWithoutAssignee = { ...mockIssue, assignee: null };
			render(KanbanCard, { props: { issue: issueWithoutAssignee } });

			expect(screen.getByText('Unassigned')).toBeInTheDocument();
		});

		it('truncates long titles with ellipsis', () => {
			const longTitleIssue = {
				...mockIssue,
				title:
					'This is a very long issue title that should be truncated with an ellipsis at the end'
			};
			render(KanbanCard, { props: { issue: longTitleIssue } });

			const titleElement = screen.getByText(longTitleIssue.title);
			expect(titleElement).toHaveClass('truncate');
		});

		it('shows priority color stripe', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			// Card should have priority-related styling
			const card = screen.getByRole('option');
			expect(card.className).toMatch(/border-l|bg-/);
		});
	});

	describe('interaction', () => {
		it('calls onclick when card clicked', async () => {
			const onClick = vi.fn();
			render(KanbanCard, { props: { issue: mockIssue, onclick: onClick } });

			await fireEvent.click(screen.getByRole('option'));

			expect(onClick).toHaveBeenCalledWith(mockIssue);
		});

		it('is keyboard focusable', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			const card = screen.getByRole('option');
			expect(card).toHaveAttribute('tabindex', '0');
		});

		it('triggers onclick on Enter key', async () => {
			const onClick = vi.fn();
			render(KanbanCard, { props: { issue: mockIssue, onclick: onClick } });

			const card = screen.getByRole('option');
			await fireEvent.keyDown(card, { key: 'Enter' });

			expect(onClick).toHaveBeenCalledWith(mockIssue);
		});
	});

	describe('accessibility', () => {
		it('has role="option"', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			expect(screen.getByRole('option')).toBeInTheDocument();
		});

		it('has aria-label with issue info', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			const card = screen.getByRole('option');
			expect(card).toHaveAttribute('aria-label');
			expect(card.getAttribute('aria-label')).toContain('TEST-123');
		});
	});

	describe('drag state', () => {
		it('has draggable attribute', () => {
			render(KanbanCard, { props: { issue: mockIssue } });

			const card = screen.getByRole('option');
			expect(card).toHaveAttribute('draggable', 'true');
		});

		it('applies dragging style when dragging prop is true', () => {
			render(KanbanCard, { props: { issue: mockIssue, dragging: true } });

			const card = screen.getByRole('option');
			expect(card.className).toMatch(/opacity-|scale-|shadow-/);
		});
	});
});
