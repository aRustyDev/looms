/**
 * Dashboard Page Tests
 * @module routes/(app)/dashboard/+page.test
 *
 * Tests use server-side data loading - data is passed via the `data` prop
 * which simulates SvelteKit's +page.server.ts load function.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import Page from './+page.svelte';
import type { Issue } from '$lib/db/types.js';
import {
	calculateLeadTime,
	calculateCycleTime,
	calculateThroughput,
	calculateCFD,
	calculateAgingWIP,
	calculatePercentiles
} from '$lib/analytics/metrics.js';

async function waitForAsync() {
	await tick();
	await new Promise((r) => setTimeout(r, 50));
	await tick();
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'test-1',
		title: 'Test Issue',
		description: '',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: '2026-04-01T00:00:00Z',
		updated_at: '2026-04-01T00:00:00Z',
		...overrides
	};
}

/** Build the same shape that +page.server.ts returns */
function buildDashboardData(issues: Issue[]) {
	const leadTimes = calculateLeadTime(issues);
	const cycleTimes = calculateCycleTime(issues);
	const throughput = calculateThroughput(issues, 'week');
	const cfd = calculateCFD(issues, 30);
	const agingWIP = calculateAgingWIP(issues);
	const leadTimePercentiles = calculatePercentiles(leadTimes.map((e) => e.leadTimeDays));
	const cycleTimePercentiles = calculatePercentiles(cycleTimes.map((e) => e.cycleTimeDays));

	const totalOpen = issues.filter(
		(i) => !i.completed_at && !i.closed_at && i.status !== 'closed' && i.status !== 'done'
	).length;
	const totalClosed = leadTimes.length;
	const avgLeadTimeDays = leadTimes.length
		? leadTimes.reduce((s, e) => s + e.leadTimeDays, 0) / leadTimes.length
		: null;
	const avgCycleTimeDays = cycleTimes.length
		? cycleTimes.reduce((s, e) => s + e.cycleTimeDays, 0) / cycleTimes.length
		: null;
	const lastBucket = throughput[throughput.length - 1];
	const recentThroughput = lastBucket?.count ?? 0;

	return {
		summary: { totalOpen, totalClosed, avgLeadTimeDays, avgCycleTimeDays, recentThroughput },
		leadTimes,
		cycleTimes,
		throughput,
		cfd,
		agingWIP,
		leadTimePercentiles,
		cycleTimePercentiles
	};
}

function emptyDashboardData() {
	return buildDashboardData([]);
}

describe('Dashboard Page', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders page title', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();
			expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
		});

		it('renders subtitle', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();
			expect(screen.getByText('Lean/Kanban metrics overview')).toBeInTheDocument();
		});

		it('renders all four chart panel headings', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();
			expect(screen.getByRole('heading', { level: 2, name: 'Lead Time' })).toBeInTheDocument();
			expect(screen.getByRole('heading', { level: 2, name: 'Throughput' })).toBeInTheDocument();
			expect(
				screen.getByRole('heading', { level: 2, name: 'Cumulative Flow' })
			).toBeInTheDocument();
			expect(screen.getByRole('heading', { level: 2, name: 'Aging WIP' })).toBeInTheDocument();
		});
	});

	describe('Summary Stats', () => {
		it('shows open issue count', async () => {
			const issues = [
				makeIssue({ id: 'a', status: 'open' }),
				makeIssue({ id: 'b', status: 'in_progress' }),
				makeIssue({ id: 'c', status: 'closed', completed_at: '2026-04-10T00:00:00Z' })
			];
			render(Page, { props: { data: buildDashboardData(issues) } });
			await waitForAsync();

			expect(screen.getByText('Open Issues')).toBeInTheDocument();
			expect(screen.getByText('2')).toBeInTheDocument(); // 2 open/in-progress
		});

		it('shows lead time stat', async () => {
			const issues = [
				makeIssue({
					id: 'a',
					status: 'closed',
					created_at: '2026-04-01T00:00:00Z',
					completed_at: '2026-04-04T00:00:00Z' // 3 days
				})
			];
			render(Page, { props: { data: buildDashboardData(issues) } });
			await waitForAsync();

			expect(screen.getByText('Avg Lead Time')).toBeInTheDocument();
			expect(screen.getByText('3.0d')).toBeInTheDocument();
		});

		it('shows dashes when no data', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();

			// avgLeadTimeDays and avgCycleTimeDays are null → "--"
			const dashes = screen.getAllByText('--');
			expect(dashes.length).toBeGreaterThanOrEqual(2);
		});

		it('shows throughput count and total closed', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();

			expect(screen.getByText('Throughput (last period)')).toBeInTheDocument();
			expect(screen.getByText('0 total closed')).toBeInTheDocument();
		});
	});

	describe('Chart Placeholders', () => {
		it('shows Coming Soon for panels with data', async () => {
			const issues = [
				makeIssue({
					id: 'a',
					status: 'closed',
					created_at: '2026-04-01T00:00:00Z',
					completed_at: '2026-04-05T00:00:00Z'
				})
			];
			render(Page, { props: { data: buildDashboardData(issues) } });
			await waitForAsync();

			const comingSoon = screen.getAllByText('Coming Soon');
			expect(comingSoon.length).toBeGreaterThanOrEqual(1);
		});

		it('shows data point count in lead time placeholder', async () => {
			const issues = [
				makeIssue({
					id: 'a',
					status: 'closed',
					created_at: '2026-04-01T00:00:00Z',
					completed_at: '2026-04-05T00:00:00Z'
				}),
				makeIssue({
					id: 'b',
					status: 'closed',
					created_at: '2026-04-02T00:00:00Z',
					completed_at: '2026-04-08T00:00:00Z'
				})
			];
			render(Page, { props: { data: buildDashboardData(issues) } });
			await waitForAsync();

			expect(screen.getByText('2 data points ready')).toBeInTheDocument();
		});

		it('shows empty state for panels with no data', async () => {
			render(Page, { props: { data: emptyDashboardData() } });
			await waitForAsync();

			expect(screen.getByText('No closed issues to display')).toBeInTheDocument();
			expect(screen.getByText('No throughput data to display')).toBeInTheDocument();
			expect(screen.getByText('No open issues')).toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		it('displays error message when present', async () => {
			const data = { ...emptyDashboardData(), error: 'Database connection failed' };
			render(Page, { props: { data } });
			await waitForAsync();

			expect(screen.getByText('Database connection failed')).toBeInTheDocument();
		});
	});
});
