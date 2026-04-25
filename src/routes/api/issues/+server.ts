/**
 * Issues API Endpoint
 * @module routes/api/issues
 *
 * Handles issue listing and creation via bd CLI.
 * All write operations go through ProcessSupervisor.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDataAccessLayer } from '$lib/server/db/dal.js';
import { getProcessSupervisor } from '$lib/server/cli/supervisor.js';
import type { IssueFilter } from '$lib/db/types.js';

/**
 * GET /api/issues - List issues with optional filtering
 */
export const GET: RequestHandler = async ({ url }) => {
	const dal = await getDataAccessLayer();

	// Parse filter params from URL
	const filter: IssueFilter = {};

	const status = url.searchParams.get('status');
	if (status) {
		filter.status = status.includes(',') ? status.split(',') : status;
	}

	const issueType = url.searchParams.get('issue_type');
	if (issueType) {
		filter.issueType = issueType.includes(',') ? issueType.split(',') : issueType;
	}

	const priority = url.searchParams.get('priority');
	if (priority) {
		const priorities = priority.split(',').map(Number);
		filter.priority = priorities.length === 1 ? priorities[0] : priorities;
	}

	const assignee = url.searchParams.get('assignee');
	if (assignee) {
		filter.assignee = assignee.includes(',') ? assignee.split(',') : assignee;
	}

	const search = url.searchParams.get('search');
	if (search) {
		filter.search = search;
	}

	const limit = url.searchParams.get('limit');
	if (limit) {
		filter.limit = parseInt(limit, 10);
	}

	const offset = url.searchParams.get('offset');
	if (offset) {
		filter.offset = parseInt(offset, 10);
	}

	try {
		const issues = await dal.getIssues(filter);
		return json({ issues });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to fetch issues';
		throw error(500, message);
	}
};

/**
 * POST /api/issues - Create a new issue via bd CLI
 */
export const POST: RequestHandler = async ({ request }) => {
	const supervisor = getProcessSupervisor();
	const dal = await getDataAccessLayer();

	const body = await request.json();
	const { title, issue_type, description, priority, assignee } = body;

	if (!title || typeof title !== 'string') {
		throw error(400, 'Title is required');
	}

	if (!issue_type || typeof issue_type !== 'string') {
		throw error(400, 'Issue type is required');
	}

	const args = ['create', '--title', title, '--type', issue_type];

	if (priority !== undefined) {
		args.push('--priority', String(priority));
	}

	if (assignee) {
		args.push('--assignee', assignee);
	}

	if (description) {
		args.push('--description', description);
	}

	try {
		const result = await supervisor.execute('bd', args);

		if (result.exitCode !== 0) {
			throw error(500, result.stderr || 'Failed to create issue');
		}

		// Parse issue ID from CLI output (format: "✓ Created issue: <id>")
		const match = result.stdout.match(/Created issue:\s*(\S+)/);
		const issueId = match?.[1];

		if (!issueId) {
			throw error(500, 'Could not parse issue ID from CLI output');
		}

		// Fetch the created issue from database
		const issue = await dal.getIssue(issueId);

		if (!issue) {
			throw error(500, `Created issue ${issueId} not found in database`);
		}

		return json({ issue }, { status: 201 });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		const message = e instanceof Error ? e.message : 'Failed to create issue';
		throw error(500, message);
	}
};
