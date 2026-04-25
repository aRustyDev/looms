/**
 * Single Issue API Endpoint
 * @module routes/api/issues/[id]
 *
 * Handles individual issue operations: get, update, delete (close).
 * All write operations go through ProcessSupervisor via bd CLI.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDataAccessLayer } from '$lib/server/db/dal.js';
import { getProcessSupervisor } from '$lib/server/cli/supervisor.js';

/**
 * GET /api/issues/[id] - Get a single issue
 */
export const GET: RequestHandler = async ({ params }) => {
	const dal = await getDataAccessLayer();
	const { id } = params;

	try {
		const issue = await dal.getIssue(id);

		if (!issue) {
			throw error(404, `Issue ${id} not found`);
		}

		return json({ issue });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		const message = e instanceof Error ? e.message : 'Failed to fetch issue';
		throw error(500, message);
	}
};

/**
 * PATCH /api/issues/[id] - Update an issue via bd CLI
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const supervisor = getProcessSupervisor();
	const dal = await getDataAccessLayer();
	const { id } = params;

	const body = await request.json();
	const { title, issue_type, description, priority, assignee, status } = body;

	// Verify issue exists
	const existing = await dal.getIssue(id);
	if (!existing) {
		throw error(404, `Issue ${id} not found`);
	}

	const args = ['update', id];

	if (title !== undefined) {
		args.push('--title', title);
	}

	if (issue_type !== undefined) {
		args.push('--type', issue_type);
	}

	if (description !== undefined) {
		args.push('--description', description);
	}

	if (priority !== undefined) {
		args.push('--priority', String(priority));
	}

	if (assignee !== undefined) {
		args.push('--assignee', assignee);
	}

	if (status !== undefined) {
		args.push('--status', status);
	}

	// Only run update if there are changes
	if (args.length === 2) {
		return json({ issue: existing });
	}

	try {
		const result = await supervisor.execute('bd', args);

		if (result.exitCode !== 0) {
			throw error(500, result.stderr || 'Failed to update issue');
		}

		// Fetch updated issue from database
		const issue = await dal.getIssue(id);

		return json({ issue });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		const message = e instanceof Error ? e.message : 'Failed to update issue';
		throw error(500, message);
	}
};

/**
 * DELETE /api/issues/[id] - Close an issue via bd CLI
 */
export const DELETE: RequestHandler = async ({ params }) => {
	const supervisor = getProcessSupervisor();
	const dal = await getDataAccessLayer();
	const { id } = params;

	// Verify issue exists
	const existing = await dal.getIssue(id);
	if (!existing) {
		throw error(404, `Issue ${id} not found`);
	}

	try {
		const result = await supervisor.execute('bd', ['close', id]);

		if (result.exitCode !== 0) {
			throw error(500, result.stderr || 'Failed to close issue');
		}

		return json({ success: true, id });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		const message = e instanceof Error ? e.message : 'Failed to close issue';
		throw error(500, message);
	}
};
