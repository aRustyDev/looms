/**
 * Dashboard Page Server Load
 * @module routes/(app)/dashboard/+page.server
 *
 * Loads issues and computes metrics server-side.
 */

import { getDataAccessLayer } from '$lib/server/db/dal.js';
import {
	calculateLeadTime,
	calculateCycleTime,
	calculateThroughput,
	calculateCFD,
	calculateAgingWIP,
	calculatePercentiles
} from '$lib/analytics/metrics.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		const dal = await getDataAccessLayer();
		const issues = await dal.getIssues();

		const leadTimes = calculateLeadTime(issues);
		const cycleTimes = calculateCycleTime(issues);
		const throughput = calculateThroughput(issues, 'week');
		const cfd = calculateCFD(issues, 30);
		const agingWIP = calculateAgingWIP(issues);

		const leadTimePercentiles = calculatePercentiles(leadTimes.map((e) => e.leadTimeDays));
		const cycleTimePercentiles = calculatePercentiles(cycleTimes.map((e) => e.cycleTimeDays));

		// Summary stats
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
			issues,
			summary: {
				totalOpen,
				totalClosed,
				avgLeadTimeDays,
				avgCycleTimeDays,
				recentThroughput
			},
			leadTimes,
			cycleTimes,
			throughput,
			cfd,
			agingWIP,
			leadTimePercentiles,
			cycleTimePercentiles
		};
	} catch (error) {
		console.error('Failed to load dashboard data:', error);
		return {
			issues: [],
			summary: {
				totalOpen: 0,
				totalClosed: 0,
				avgLeadTimeDays: null,
				avgCycleTimeDays: null,
				recentThroughput: 0
			},
			leadTimes: [],
			cycleTimes: [],
			throughput: [],
			cfd: [],
			agingWIP: [],
			leadTimePercentiles: { p50: 0, p85: 0, p95: 0 },
			cycleTimePercentiles: { p50: 0, p85: 0, p95: 0 },
			error: error instanceof Error ? error.message : 'Failed to load dashboard data'
		};
	}
};
