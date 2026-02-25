/**
 * Issues List Page Server Load
 * @module routes/(app)/+page.server
 *
 * Loads issues from the database on the server side where
 * native modules (better-sqlite3) are available.
 */

import { DataAccessLayer } from '$lib/server/db/dal.js';
import type { PageServerLoad } from './$types.js';

// Canonical status order
const STATUS_ORDER = ['open', 'in_progress', 'review', 'done', 'closed'];

export const load: PageServerLoad = async () => {
	try {
		const dal = await DataAccessLayer.create();
		const issues = await dal.getIssues();

		// Extract unique values for filters, maintaining canonical order for statuses
		const statusSet = new Set(issues.map((i) => i.status).filter(Boolean));
		const statuses = STATUS_ORDER.filter((s) => statusSet.has(s));
		// Add any statuses not in the canonical order at the end
		statusSet.forEach((s) => {
			if (!statuses.includes(s)) statuses.push(s);
		});

		const assignees = [...new Set(issues.map((i) => i.assignee).filter(Boolean))] as string[];
		const issueTypes = [...new Set(issues.map((i) => i.issue_type).filter(Boolean))];

		return {
			issues,
			statuses,
			assignees,
			issueTypes
		};
	} catch (error) {
		console.error('Failed to load issues:', error);
		return {
			issues: [],
			statuses: ['open', 'in_progress', 'done'],
			assignees: [],
			issueTypes: ['task', 'bug', 'feature'],
			error: error instanceof Error ? error.message : 'Failed to load issues'
		};
	}
};
