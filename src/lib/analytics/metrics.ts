/**
 * Metrics Engine - Lean/Kanban calculations
 * @module analytics/metrics
 *
 * Pure calculation functions operating on Issue arrays.
 * No DAL dependency — receives data, returns results.
 */

import type { Issue } from '$lib/db/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadTimeEntry {
	issueId: string;
	title: string;
	leadTimeDays: number;
	closedAt: string;
	issueType: string;
}

export interface CycleTimeEntry {
	issueId: string;
	title: string;
	cycleTimeDays: number;
	closedAt: string;
	issueType: string;
}

export interface ThroughputBucket {
	period: string;
	count: number;
	byType: Record<string, number>;
}

export interface CFDPoint {
	date: string;
	open: number;
	in_progress: number;
	closed: number;
}

export interface AgingWIPEntry {
	issueId: string;
	title: string;
	status: string;
	ageDays: number;
	issueType: string;
	priority: number;
}

export interface Percentiles {
	p50: number;
	p85: number;
	p95: number;
}

export type ThroughputGranularity = 'day' | 'week' | 'month';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;
const WISP_THRESHOLD_MS = 3_600_000; // 1 hour

/** True if the issue is ephemeral (opened+closed <1h with no started_at). */
function isWisp(issue: Issue): boolean {
	if (!issue.completed_at && !issue.closed_at) return false;
	const end = issue.completed_at ?? issue.closed_at;
	if (!end) return false;
	const elapsed = new Date(end).getTime() - new Date(issue.created_at).getTime();
	return elapsed < WISP_THRESHOLD_MS && !issue.started_at;
}

function daysBetween(a: string, b: string): number {
	return (new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY;
}

function toDateKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Bucket key for a date at the given granularity. */
function bucketKey(dateStr: string, granularity: ThroughputGranularity): string {
	const d = new Date(dateStr);
	if (granularity === 'day') return toDateKey(d);
	if (granularity === 'month')
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	// week: ISO week starting Monday
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	const monday = new Date(d);
	monday.setDate(diff);
	return toDateKey(monday);
}

function generateDateRange(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const current = new Date(startDate);
	const end = new Date(endDate);
	while (current <= end) {
		dates.push(toDateKey(current));
		current.setDate(current.getDate() + 1);
	}
	return dates;
}

// ---------------------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------------------

/**
 * Lead time = closed_at (or completed_at) - created_at, in days.
 * Excludes wisps.
 */
export function calculateLeadTime(issues: Issue[]): LeadTimeEntry[] {
	return issues
		.filter((i) => (i.completed_at || i.closed_at) && !isWisp(i))
		.map((i) => {
			const end = i.completed_at ?? i.closed_at!;
			return {
				issueId: i.id,
				title: i.title,
				leadTimeDays: Math.max(0, daysBetween(i.created_at, end)),
				closedAt: end,
				issueType: i.issue_type
			};
		});
}

/**
 * Cycle time = closed_at (or completed_at) - started_at, in days.
 * Only includes issues that have a started_at. Excludes wisps.
 */
export function calculateCycleTime(issues: Issue[]): CycleTimeEntry[] {
	return issues
		.filter((i) => i.started_at && (i.completed_at || i.closed_at) && !isWisp(i))
		.map((i) => {
			const end = i.completed_at ?? i.closed_at!;
			return {
				issueId: i.id,
				title: i.title,
				cycleTimeDays: Math.max(0, daysBetween(i.started_at!, end)),
				closedAt: end,
				issueType: i.issue_type
			};
		});
}

/**
 * Count of closed issues per time bucket (day/week/month).
 * Excludes wisps.
 */
export function calculateThroughput(
	issues: Issue[],
	granularity: ThroughputGranularity = 'week'
): ThroughputBucket[] {
	const buckets = new Map<string, ThroughputBucket>();

	for (const issue of issues) {
		const end = issue.completed_at ?? issue.closed_at;
		if (!end || isWisp(issue)) continue;

		const key = bucketKey(end, granularity);
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { period: key, count: 0, byType: {} };
			buckets.set(key, bucket);
		}
		bucket.count++;
		bucket.byType[issue.issue_type] = (bucket.byType[issue.issue_type] ?? 0) + 1;
	}

	return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Cumulative flow: for each date, cumulative count of issues by status.
 * Builds from issue created_at/started_at/completed_at timestamps.
 */
export function calculateCFD(issues: Issue[], days: number = 30): CFDPoint[] {
	const now = new Date();
	const startDate = new Date(now.getTime() - days * MS_PER_DAY);
	const dateRange = generateDateRange(toDateKey(startDate), toDateKey(now));

	// For each date, count cumulative issues in each bucket
	return dateRange.map((date) => {
		const cutoff = new Date(date + 'T23:59:59Z').getTime();
		let open = 0;
		let inProgress = 0;
		let closed = 0;

		for (const issue of issues) {
			const created = new Date(issue.created_at).getTime();
			if (created > cutoff) continue; // not yet created

			const completedAt = issue.completed_at ?? issue.closed_at;
			const completed = completedAt ? new Date(completedAt).getTime() : null;
			const started = issue.started_at ? new Date(issue.started_at).getTime() : null;

			if (completed && completed <= cutoff) {
				closed++;
			} else if (started && started <= cutoff) {
				inProgress++;
			} else {
				open++;
			}
		}

		return { date, open, in_progress: inProgress, closed };
	});
}

/**
 * Open issues sorted by age descending.
 * Age = now - created_at.
 */
export function calculateAgingWIP(issues: Issue[]): AgingWIPEntry[] {
	const now = Date.now();
	return issues
		.filter((i) => !i.completed_at && !i.closed_at && i.status !== 'closed' && i.status !== 'done')
		.map((i) => ({
			issueId: i.id,
			title: i.title,
			status: i.status,
			ageDays: (now - new Date(i.created_at).getTime()) / MS_PER_DAY,
			issueType: i.issue_type,
			priority: i.priority
		}))
		.sort((a, b) => b.ageDays - a.ageDays);
}

/**
 * Calculate P50, P85, P95 from a sorted array of durations.
 * Returns 0 for all if empty.
 */
export function calculatePercentiles(values: number[]): Percentiles {
	if (values.length === 0) return { p50: 0, p85: 0, p95: 0 };

	const sorted = [...values].sort((a, b) => a - b);
	const percentile = (p: number) => {
		const idx = Math.ceil((p / 100) * sorted.length) - 1;
		return sorted[Math.max(0, idx)];
	};

	return {
		p50: percentile(50),
		p85: percentile(85),
		p95: percentile(95)
	};
}
