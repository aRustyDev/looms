/**
 * GlobalNav Component Tests (TDD)
 * @module components/navigation/GlobalNav.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GlobalNav from './GlobalNav.svelte';

describe('GlobalNav', () => {
	describe('navigation', () => {
		it('renders navigation container', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('renders navigation tabs', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('tab', { name: 'Issues' })).toBeInTheDocument();
			expect(screen.getByRole('tab', { name: 'Epics' })).toBeInTheDocument();
			expect(screen.getByRole('tab', { name: 'Board' })).toBeInTheDocument();
			expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument();
			expect(screen.getByRole('tab', { name: 'Graph' })).toBeInTheDocument();
		});

		it('highlights active tab', () => {
			render(GlobalNav, { props: { activeTab: 'Board' } });

			const boardTab = screen.getByRole('tab', { name: 'Board' });
			expect(boardTab).toHaveAttribute('aria-selected', 'true');
		});

		it('calls onnavigate when tab clicked', async () => {
			const onNavigate = vi.fn();
			render(GlobalNav, { props: { activeTab: 'Issues', onnavigate: onNavigate } });

			await fireEvent.click(screen.getByRole('tab', { name: 'Board' }));

			expect(onNavigate).toHaveBeenCalledWith('Board');
		});
	});

	describe('quick actions', () => {
		it('renders [+ Issue] button', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('button', { name: /new issue/i })).toBeInTheDocument();
		});

		it('renders [+ Epic] button', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('button', { name: /new epic/i })).toBeInTheDocument();
		});

		it('calls oncreateissue when [+ Issue] clicked', async () => {
			const onCreateIssue = vi.fn();
			render(GlobalNav, { props: { activeTab: 'Issues', oncreateissue: onCreateIssue } });

			await fireEvent.click(screen.getByRole('button', { name: /new issue/i }));

			expect(onCreateIssue).toHaveBeenCalled();
		});

		it('calls oncreateepic when [+ Epic] clicked', async () => {
			const onCreateEpic = vi.fn();
			render(GlobalNav, { props: { activeTab: 'Issues', oncreateepic: onCreateEpic } });

			await fireEvent.click(screen.getByRole('button', { name: /new epic/i }));

			expect(onCreateEpic).toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('navigation has role="navigation"', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('tabs have role="tablist"', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			expect(screen.getByRole('tablist')).toBeInTheDocument();
		});

		it('each tab has role="tab"', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			const tabs = screen.getAllByRole('tab');
			expect(tabs.length).toBe(5);
		});

		it('active tab has aria-selected="true"', () => {
			render(GlobalNav, { props: { activeTab: 'Dashboard' } });

			const dashboardTab = screen.getByRole('tab', { name: 'Dashboard' });
			expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

			const issuesTab = screen.getByRole('tab', { name: 'Issues' });
			expect(issuesTab).toHaveAttribute('aria-selected', 'false');
		});

		it('all buttons have accessible names', () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				expect(button).toHaveAccessibleName();
			});
		});
	});

	describe('keyboard navigation', () => {
		it('tabs support arrow key navigation', async () => {
			render(GlobalNav, { props: { activeTab: 'Issues' } });

			const issuesTab = screen.getByRole('tab', { name: 'Issues' });
			issuesTab.focus();

			await fireEvent.keyDown(issuesTab, { key: 'ArrowRight' });

			const epicsTab = screen.getByRole('tab', { name: 'Epics' });
			expect(document.activeElement).toBe(epicsTab);
		});
	});
});
