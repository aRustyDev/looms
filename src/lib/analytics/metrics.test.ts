/**
 * Metrics Engine Tests
 * @module analytics/metrics.test
 */

import { describe, it, expect } from 'vitest';
import {
	calculateLeadTime,
	calculateCycleTime,
	calculateThroughput,
	calculateCFD,
	calculateAgingWIP,
	calculatePercentiles
} from './metrics.js';
import type { Issue } from '$lib/db/types.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'test-1',
		title: 'Test issue',
		description: '',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: '2026-04-01T00:00:00Z',
		updated_at: '2026-04-01T00:00:00Z',
		...overrides
	};
}

const closedIssue = (
	id: string,
	createdAt: string,
	completedAt: string,
	extra: Partial<Issue> = {}
) =>
	makeIssue({
		id,
		status: 'closed',
		created_at: createdAt,
		completed_at: completedAt,
		...extra
	});

const inProgressIssue = (
	id: string,
	createdAt: string,
	startedAt: string,
	extra: Partial<Issue> = {}
) =>
	makeIssue({
		id,
		status: 'in_progress',
		created_at: createdAt,
		started_at: startedAt,
		...extra
	});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateLeadTime', () => {
	it('returns lead time in days for closed issues', () => {
		const issues = [
			closedIssue('a', '2026-04-01T00:00:00Z', '2026-04-04T00:00:00Z'),
			closedIssue('b', '2026-04-01T00:00:00Z', '2026-04-11T00:00:00Z')
		];
		const result = calculateLeadTime(issues);
		expect(result).toHaveLength(2);
		expect(result[0].leadTimeDays).toBeCloseTo(3, 1);
		expect(result[1].leadTimeDays).toBeCloseTo(10, 1);
	});

	it('excludes open issues', () => {
		const issues = [makeIssue({ id: 'open-1' })];
		expect(calculateLeadTime(issues)).toHaveLength(0);
	});

	it('excludes wisps (closed <1h with no started_at)', () => {
		const issues = [
			closedIssue('wisp', '2026-04-01T00:00:00Z', '2026-04-01T00:30:00Z') // 30 min
		];
		expect(calculateLeadTime(issues)).toHaveLength(0);
	});

	it('includes issues closed <1h if they have started_at (not wisps)', () => {
		const issues = [
			closedIssue('quick', '2026-04-01T00:00:00Z', '2026-04-01T00:30:00Z', {
				started_at: '2026-04-01T00:10:00Z'
			})
		];
		expect(calculateLeadTime(issues)).toHaveLength(1);
	});

	it('uses closed_at as fallback when completed_at is missing', () => {
		const issues = [
			makeIssue({
				id: 'fallback',
				status: 'closed',
				created_at: '2026-04-01T00:00:00Z',
				closed_at: '2026-04-06T00:00:00Z'
			})
		];
		const result = calculateLeadTime(issues);
		expect(result).toHaveLength(1);
		expect(result[0].leadTimeDays).toBeCloseTo(5, 1);
	});

	it('returns empty array for no issues', () => {
		expect(calculateLeadTime([])).toHaveLength(0);
	});
});

describe('calculateCycleTime', () => {
	it('returns cycle time for issues with started_at', () => {
		const issues = [
			closedIssue('a', '2026-04-01T00:00:00Z', '2026-04-10T00:00:00Z', {
				started_at: '2026-04-03T00:00:00Z'
			})
		];
		const result = calculateCycleTime(issues);
		expect(result).toHaveLength(1);
		expect(result[0].cycleTimeDays).toBeCloseTo(7, 1);
	});

	it('excludes issues without started_at', () => {
		const issues = [closedIssue('no-start', '2026-04-01T00:00:00Z', '2026-04-10T00:00:00Z')];
		expect(calculateCycleTime(issues)).toHaveLength(0);
	});

	it('excludes wisps', () => {
		const issues = [closedIssue('wisp', '2026-04-01T00:00:00Z', '2026-04-01T00:20:00Z')];
		expect(calculateCycleTime(issues)).toHaveLength(0);
	});
});

describe('calculateThroughput', () => {
	it('counts closed issues per day', () => {
		const issues = [
			closedIssue('a', '2026-04-01T00:00:00Z', '2026-04-10T12:00:00Z'),
			closedIssue('b', '2026-04-01T00:00:00Z', '2026-04-10T14:00:00Z'),
			closedIssue('c', '2026-04-01T00:00:00Z', '2026-04-11T10:00:00Z')
		];
		const result = calculateThroughput(issues, 'day');
		expect(result).toHaveLength(2);
		expect(result[0].count).toBe(2);
		expect(result[1].count).toBe(1);
	});

	it('groups by week', () => {
		const issues = [
			closedIssue('a', '2026-04-01T00:00:00Z', '2026-04-06T00:00:00Z'), // Mon Apr 6
			closedIssue('b', '2026-04-01T00:00:00Z', '2026-04-07T00:00:00Z'), // Tue Apr 7
			closedIssue('c', '2026-04-01T00:00:00Z', '2026-04-13T00:00:00Z') // Mon Apr 13
		];
		const result = calculateThroughput(issues, 'week');
		expect(result).toHaveLength(2);
	});

	it('groups by month', () => {
		const issues = [
			closedIssue('a', '2026-03-01T00:00:00Z', '2026-03-15T00:00:00Z'),
			closedIssue('b', '2026-03-01T00:00:00Z', '2026-04-05T00:00:00Z')
		];
		const result = calculateThroughput(issues, 'month');
		expect(result).toHaveLength(2);
		expect(result[0].period).toBe('2026-03');
		expect(result[1].period).toBe('2026-04');
	});

	it('tracks byType breakdown', () => {
		const issues = [
			closedIssue('a', '2026-04-01T00:00:00Z', '2026-04-10T00:00:00Z', { issue_type: 'bug' }),
			closedIssue('b', '2026-04-01T00:00:00Z', '2026-04-10T00:00:00Z', { issue_type: 'feature' }),
			closedIssue('c', '2026-04-01T00:00:00Z', '2026-04-10T00:00:00Z', { issue_type: 'bug' })
		];
		const result = calculateThroughput(issues, 'day');
		expect(result[0].byType).toEqual({ bug: 2, feature: 1 });
	});

	it('excludes wisps', () => {
		const issues = [closedIssue('wisp', '2026-04-10T00:00:00Z', '2026-04-10T00:15:00Z')];
		expect(calculateThroughput(issues, 'day')).toHaveLength(0);
	});

	it('returns empty for no closed issues', () => {
		expect(calculateThroughput([], 'week')).toHaveLength(0);
	});
});

describe('calculateCFD', () => {
	it('returns cumulative counts per date', () => {
		const issues = [
			makeIssue({ id: 'a', created_at: '2026-04-20T00:00:00Z', status: 'open' }),
			closedIssue('b', '2026-04-18T00:00:00Z', '2026-04-22T00:00:00Z'),
			inProgressIssue('c', '2026-04-19T00:00:00Z', '2026-04-21T00:00:00Z')
		];
		const result = calculateCFD(issues, 10);
		expect(result.length).toBeGreaterThan(0);

		// Each point should have open, in_progress, closed
		for (const point of result) {
			expect(point).toHaveProperty('date');
			expect(point).toHaveProperty('open');
			expect(point).toHaveProperty('in_progress');
			expect(point).toHaveProperty('closed');
		}
	});

	it('returns points for the date range', () => {
		const result = calculateCFD([], 7);
		expect(result).toHaveLength(8); // 7 days + today
	});

	it('correctly categorizes issues at cutoff dates', () => {
		const issues = [closedIssue('done', '2026-04-20T00:00:00Z', '2026-04-22T00:00:00Z')];
		const result = calculateCFD(issues, 5);
		// Before created_at: no counts
		const beforeCreation = result.find((p) => p.date === '2026-04-19');
		if (beforeCreation) {
			expect(beforeCreation.open + beforeCreation.in_progress + beforeCreation.closed).toBe(0);
		}
	});
});

describe('calculateAgingWIP', () => {
	it('returns open issues sorted by age descending', () => {
		const issues = [
			makeIssue({ id: 'new', created_at: '2026-04-24T00:00:00Z', status: 'open' }),
			makeIssue({ id: 'old', created_at: '2026-04-10T00:00:00Z', status: 'in_progress' }),
			closedIssue('done', '2026-04-01T00:00:00Z', '2026-04-20T00:00:00Z') // excluded
		];
		const result = calculateAgingWIP(issues);
		expect(result).toHaveLength(2);
		expect(result[0].issueId).toBe('old'); // older first
		expect(result[1].issueId).toBe('new');
	});

	it('excludes closed and done issues', () => {
		const issues = [
			makeIssue({ id: 'done', status: 'done' }),
			makeIssue({ id: 'closed', status: 'closed' }),
			closedIssue('completed', '2026-04-01T00:00:00Z', '2026-04-05T00:00:00Z')
		];
		expect(calculateAgingWIP(issues)).toHaveLength(0);
	});

	it('includes issues with various in-progress statuses', () => {
		const issues = [
			makeIssue({ id: 'review', status: 'review', created_at: '2026-04-20T00:00:00Z' }),
			makeIssue({ id: 'blocked', status: 'blocked', created_at: '2026-04-15T00:00:00Z' })
		];
		const result = calculateAgingWIP(issues);
		expect(result).toHaveLength(2);
	});

	it('returns empty for no open issues', () => {
		expect(calculateAgingWIP([])).toHaveLength(0);
	});
});

describe('calculatePercentiles', () => {
	it('returns P50, P85, P95', () => {
		const values = Array.from({ length: 100 }, (_, i) => i + 1);
		const result = calculatePercentiles(values);
		expect(result.p50).toBe(50);
		expect(result.p85).toBe(85);
		expect(result.p95).toBe(95);
	});

	it('handles single value', () => {
		const result = calculatePercentiles([42]);
		expect(result.p50).toBe(42);
		expect(result.p85).toBe(42);
		expect(result.p95).toBe(42);
	});

	it('handles empty array', () => {
		const result = calculatePercentiles([]);
		expect(result).toEqual({ p50: 0, p85: 0, p95: 0 });
	});

	it('handles unsorted input', () => {
		const result = calculatePercentiles([100, 1, 50, 75, 25]);
		expect(result.p50).toBe(50);
		expect(result.p95).toBe(100);
	});

	it('handles two values', () => {
		const result = calculatePercentiles([10, 20]);
		expect(result.p50).toBe(10);
		expect(result.p85).toBe(20);
		expect(result.p95).toBe(20);
	});
});

describe('performance', () => {
	it('handles 1000 issues in <500ms', () => {
		const issues: Issue[] = Array.from({ length: 1000 }, (_, i) => {
			const createdDate = new Date('2026-01-01');
			createdDate.setDate(createdDate.getDate() + Math.floor(i / 10));
			const completedDate = new Date(createdDate);
			completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 30) + 1);

			return makeIssue({
				id: `perf-${i}`,
				issue_type: ['task', 'bug', 'feature'][i % 3],
				created_at: createdDate.toISOString(),
				started_at: new Date(createdDate.getTime() + 86400000).toISOString(),
				completed_at: completedDate.toISOString(),
				status: 'closed'
			});
		});

		const start = performance.now();
		calculateLeadTime(issues);
		calculateCycleTime(issues);
		calculateThroughput(issues, 'week');
		calculateCFD(issues, 30);
		calculateAgingWIP(issues);
		const leadTimes = calculateLeadTime(issues).map((e) => e.leadTimeDays);
		calculatePercentiles(leadTimes);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(500);
	});
});
