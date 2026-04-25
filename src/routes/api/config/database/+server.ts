/**
 * Database Configuration API Endpoint
 * @module routes/api/config/database
 *
 * GET: Returns current database configuration and connection status
 * PUT: Updates database configuration and reconnects
 * POST /test: Tests a connection without persisting
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDataAccessLayer, initDataAccessLayer } from '$lib/server/db/dal.js';

/**
 * GET /api/config/database - Get current database config and status
 */
export const GET: RequestHandler = async () => {
	try {
		const dal = await getDataAccessLayer();
		const backend = dal.getBackend();

		// Test the connection with a simple query
		let connected = false;
		let issueCount = 0;
		let databases: string[] = [];

		try {
			const result = await dal.query<{ count: number }>('SELECT COUNT(*) as count FROM issues');
			connected = true;
			issueCount = result.rows[0]?.count ?? 0;
		} catch {
			connected = false;
		}

		// List available databases (Dolt only)
		if (backend === 'dolt' && connected) {
			try {
				const dbResult = await dal.query<{ Database: string }>('SHOW DATABASES');
				databases = dbResult.rows
					.map((r) => r.Database)
					.filter((db) => db.startsWith('beads_'))
					.sort();
			} catch {
				// Not critical
			}
		}

		return json({
			backend,
			host: process.env.DOLT_HOST ?? '127.0.0.1',
			port: parseInt(process.env.DOLT_PORT ?? '13306', 10),
			database: process.env.DOLT_DATABASE ?? 'beads_looms',
			connected,
			issueCount,
			databases
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to get database config';
		throw error(500, message);
	}
};

/**
 * PUT /api/config/database - Update database config and reconnect
 * Body: { host?: string, port?: number, database?: string }
 */
export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { host, port, database: dbName } = body;

	// Validate inputs
	if (host !== undefined && typeof host !== 'string') {
		throw error(400, 'host must be a string');
	}
	if (port !== undefined && (typeof port !== 'number' || port < 1 || port > 65535)) {
		throw error(400, 'port must be a number between 1 and 65535');
	}
	if (dbName !== undefined && typeof dbName !== 'string') {
		throw error(400, 'database must be a string');
	}

	const newHost = host ?? process.env.DOLT_HOST ?? '127.0.0.1';
	const newPort = port ?? parseInt(process.env.DOLT_PORT ?? '13306', 10);
	const newDb = dbName ?? process.env.DOLT_DATABASE ?? 'beads_looms';

	try {
		// Reconnect with new config
		const dal = await initDataAccessLayer({
			backend: 'dolt',
			dolt: {
				host: newHost,
				port: newPort,
				user: process.env.DOLT_USER ?? 'root',
				password: process.env.DOLT_PASSWORD ?? '',
				database: newDb
			}
		});

		// Test connection
		const result = await dal.query<{ count: number }>('SELECT COUNT(*) as count FROM issues');
		const issueCount = result.rows[0]?.count ?? 0;

		// Update env vars for this process
		process.env.DOLT_HOST = newHost;
		process.env.DOLT_PORT = String(newPort);
		process.env.DOLT_DATABASE = newDb;

		return json({
			success: true,
			backend: 'dolt',
			host: newHost,
			port: newPort,
			database: newDb,
			connected: true,
			issueCount
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to connect with new config';
		throw error(400, `Connection failed: ${message}`);
	}
};

/**
 * POST /api/config/database - Test a connection without persisting
 * Body: { host: string, port: number, database: string }
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { host, port, database: dbName } = body;

	if (!host || !port || !dbName) {
		throw error(400, 'host, port, and database are required');
	}

	try {
		const mysql = await import('mysql2/promise');
		const conn = await mysql.createConnection({
			host,
			port,
			user: process.env.DOLT_USER ?? 'root',
			password: process.env.DOLT_PASSWORD ?? '',
			database: dbName,
			connectTimeout: 5000
		});

		// Test with a simple query
		const [rows] = await conn.execute('SELECT COUNT(*) as count FROM issues');
		const count = (rows as { count: number }[])[0]?.count ?? 0;
		await conn.end();

		return json({ success: true, issueCount: count });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Connection test failed';
		return json({ success: false, error: message }, { status: 200 });
	}
};
