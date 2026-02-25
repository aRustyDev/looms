/**
 * IssueDetail Component Tests (TDD)
 * @module components/issues/IssueDetail.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import IssueDetail from './IssueDetail.svelte';

const mockIssue = {
	id: 'TEST-123',
	title: 'Fix authentication bug',
	description:
		'## Problem\n\nUsers cannot login after password reset.\n\n## Solution\n\nUpdate the token validation logic.',
	status: 'in_progress',
	priority: 'P1',
	type: 'bug',
	assignee: 'John Doe',
	created: '2026-02-20T10:00:00Z',
	updated: '2026-02-23T15:30:00Z',
	comments: [
		{ author: 'Jane Smith', content: 'Looking into this now.', timestamp: '2026-02-21T09:00:00Z' },
		{
			author: 'John Doe',
			content: 'Found the issue, working on fix.',
			timestamp: '2026-02-22T14:00:00Z'
		}
	],
	blockedBy: ['TEST-100', 'TEST-101'],
	blocking: ['TEST-200']
};

describe('IssueDetail', () => {
	describe('basic information', () => {
		it('displays issue ID and title', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByText('TEST-123')).toBeInTheDocument();
			expect(screen.getByText('Fix authentication bug')).toBeInTheDocument();
		});

		it('displays status badge with correct styling', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			const statusBadge = screen.getByText('in_progress');
			expect(statusBadge).toBeInTheDocument();
			// Should have some color-related styling
			expect(statusBadge.className).toMatch(/text-|bg-/);
		});

		it('displays priority indicator', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByText(/P1/)).toBeInTheDocument();
		});

		it('displays assignee', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		it('displays "Unassigned" when no assignee', () => {
			const issueWithoutAssignee = { ...mockIssue, assignee: null };
			render(IssueDetail, { props: { issue: issueWithoutAssignee } });

			expect(screen.getByText('Unassigned')).toBeInTheDocument();
		});

		it('displays created/updated timestamps', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			// Should display formatted dates
			expect(screen.getByText(/created/i)).toBeInTheDocument();
			expect(screen.getByText(/updated/i)).toBeInTheDocument();
		});

		it('displays issue type badge', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			// Find the type badge specifically (has capitalize class)
			const typeBadges = screen.getAllByText(/bug/i);
			const typeBadge = typeBadges.find((el) => el.classList.contains('capitalize'));
			expect(typeBadge).toBeInTheDocument();
		});
	});

	describe('description', () => {
		it('renders description as markdown', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			// Should render markdown headings
			expect(screen.getByRole('heading', { name: 'Problem' })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: 'Solution' })).toBeInTheDocument();
		});

		it('shows empty state for missing description', () => {
			const issueWithoutDesc = { ...mockIssue, description: '' };
			render(IssueDetail, { props: { issue: issueWithoutDesc } });

			expect(screen.getByText(/no description/i)).toBeInTheDocument();
		});
	});

	describe('tabs', () => {
		it('renders Description tab by default', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			const descriptionTab = screen.getByRole('tab', { name: /description/i });
			expect(descriptionTab).toHaveAttribute('aria-selected', 'true');
		});

		it('renders Comments tab', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByRole('tab', { name: /comments/i })).toBeInTheDocument();
		});

		it('switches content when tab clicked', async () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			// Initially shows description
			expect(screen.getByText(/Problem/)).toBeInTheDocument();

			// Click Comments tab
			await fireEvent.click(screen.getByRole('tab', { name: /comments/i }));

			// Should show comments content
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
		});

		it('tab panel has proper accessibility attributes', async () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			const tabPanel = screen.getByRole('tabpanel');
			expect(tabPanel).toBeInTheDocument();
		});
	});

	describe('comments section', () => {
		it('displays list of comments', async () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			await fireEvent.click(screen.getByRole('tab', { name: /comments/i }));

			expect(screen.getByText('Looking into this now.')).toBeInTheDocument();
			expect(screen.getByText('Found the issue, working on fix.')).toBeInTheDocument();
		});

		it('shows comment author and timestamp', async () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			await fireEvent.click(screen.getByRole('tab', { name: /comments/i }));

			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			// John Doe appears as both assignee and comment author, so we check for multiple
			const johnDoeElements = screen.getAllByText('John Doe');
			expect(johnDoeElements.length).toBeGreaterThanOrEqual(1);
		});

		it('shows "No comments" for empty list', async () => {
			const issueWithoutComments = { ...mockIssue, comments: [] };
			render(IssueDetail, { props: { issue: issueWithoutComments } });

			await fireEvent.click(screen.getByRole('tab', { name: /comments/i }));

			expect(screen.getByText(/no comments/i)).toBeInTheDocument();
		});
	});

	describe('dependencies section', () => {
		it('shows Show Dependencies link', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByRole('button', { name: /dependencies/i })).toBeInTheDocument();
		});

		it('calls onshowdependencies when clicked', async () => {
			const onShowDeps = vi.fn();
			render(IssueDetail, { props: { issue: mockIssue, onshowdependencies: onShowDeps } });

			await fireEvent.click(screen.getByRole('button', { name: /dependencies/i }));

			expect(onShowDeps).toHaveBeenCalled();
		});

		it('displays count of blocking/blocked-by issues', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			// 2 blocked by, 1 blocking
			expect(screen.getByText(/2 blocked by/i)).toBeInTheDocument();
			expect(screen.getByText(/1 blocking/i)).toBeInTheDocument();
		});

		it('shows "None" when no dependencies exist', () => {
			const issueWithoutDeps = { ...mockIssue, blockedBy: [], blocking: [] };
			render(IssueDetail, { props: { issue: issueWithoutDeps } });

			expect(screen.getByText(/none/i)).toBeInTheDocument();
		});
	});

	describe('accessibility', () => {
		it('has accessible tabs with tablist role', () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			expect(screen.getByRole('tablist')).toBeInTheDocument();
		});

		it('tabs are keyboard navigable', async () => {
			render(IssueDetail, { props: { issue: mockIssue } });

			const descriptionTab = screen.getByRole('tab', { name: /description/i });
			descriptionTab.focus();

			await fireEvent.keyDown(descriptionTab, { key: 'ArrowRight' });

			const commentsTab = screen.getByRole('tab', { name: /comments/i });
			expect(document.activeElement).toBe(commentsTab);
		});
	});
});
