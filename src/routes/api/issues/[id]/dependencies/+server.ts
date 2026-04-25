/**
 * Issue Dependencies API Endpoint
 * @module routes/api/issues/[id]/dependencies
 *
 * Handles dependency operations: list, add, remove.
 * Write operations go through ProcessSupervisor via bd CLI.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDataAccessLayer } from '$lib/server/db/dal.js';
import { getProcessSupervisor } from '$lib/server/cli/supervisor.js';

/**
 * GET /api/issues/[id]/dependencies - List dependencies for an issue
 */
export const GET: RequestHandler = async ({ params }) => {
	const dal = await getDataAccessLayer();
	const { id } = params;

	try {
		const dependencies = await dal.getDependencies(id);
		return json({ dependencies });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to fetch dependencies';
		throw error(500, message);
	}
};

/**
 * POST /api/issues/[id]/dependencies - Add a dependency via bd CLI
 * Body: { depends_on_id: string, type?: string }
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const supervisor = getProcessSupervisor();
	const dal = await getDataAccessLayer();
	const { id } = params;

	const body = await request.json();
	const { depends_on_id, type } = body;

	if (!depends_on_id || typeof depends_on_id !== 'string') {
		throw error(400, 'depends_on_id is required');
	}

	// Verify both issues exist
	const [issue, target] = await Promise.all([dal.getIssue(id), dal.getIssue(depends_on_id)]);

	if (!issue) {
		throw error(404, `Issue ${id} not found`);
	}
	if (!target) {
		throw error(404, `Dependency target ${depends_on_id} not found`);
	}

	const args = ['dep', 'add', id, depends_on_id];
	if (type) {
		args.push('--type', type);
	}

	try {
		const result = await supervisor.execute('bd', args);

		if (result.exitCode !== 0) {
			throw error(500, result.stderr || 'Failed to add dependency');
		}

		// Fetch updated dependencies
		const dependencies = await dal.getDependencies(id);
		return json({ dependencies }, { status: 201 });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		const message = e instanceof Error ? e.message : 'Failed to add dependency';
		throw error(500, message);
	}
};

/**
 * DELETE /api/issues/[id]/dependencies - Remove a dependency via bd CLI
 * Body: { depends_on_id: string }
 */
export const DELETE: RequestHandler = async ({ params, request }) => {
	const supervisor = getProcessSupervisor();
	const { id } = params;

	const body = await request.json();
	const { depends_on_id } = body;

	if (!depends_on_id || typeof depends_on_id !== 'string') {
		throw error(400, 'depends_on_id is required');
	}

	try {
		const result = await supervisor.execute('bd', ['dep', 'remove', id, depends_on_id]);

		if (result.exitCode !== 0) {
			throw error(500, result.stderr || 'Failed to remove dependency');
		}

		return json({ success: true });
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		const message = e instanceof Error ? e.message : 'Failed to remove dependency';
		throw error(500, message);
	}
};
