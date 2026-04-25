/**
 * Server Hooks - SvelteKit server lifecycle
 * @module hooks.server
 *
 * Starts the FileWatcher and RealtimeServer on server init.
 * FileWatcher monitors .beads/ for changes, broadcasts via WebSocket.
 */

import { FileWatcher } from '$lib/realtime/FileWatcher.js';
import { RealtimeServer } from '$lib/realtime/RealtimeServer.js';
import { join } from 'path';

const REALTIME_PORT = parseInt(process.env.REALTIME_PORT ?? '5199', 10);
const BEADS_PATH = join(process.cwd(), '.beads');

let realtimeServer: RealtimeServer | null = null;
let fileWatcher: FileWatcher | null = null;

function startRealtime() {
	if (realtimeServer) return;

	try {
		// Start WebSocket server
		realtimeServer = new RealtimeServer({ port: REALTIME_PORT });
		realtimeServer.on('error', (err: Error) => {
			// Port in use is non-fatal — polling fallback handles it
			if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
				console.warn(`[realtime] Port ${REALTIME_PORT} in use, WebSocket disabled`);
				realtimeServer = null;
				return;
			}
			console.error('[realtime] Server error:', err.message);
		});
		realtimeServer.start();

		// Start file watcher
		fileWatcher = new FileWatcher({ watchPath: BEADS_PATH, debounceMs: 200 });
		fileWatcher.on('change', () => {
			realtimeServer?.broadcast('issues-changed', { timestamp: Date.now() });
		});
		fileWatcher.on('error', (err: Error) => {
			console.error('[realtime] Watcher error:', err.message);
		});
		fileWatcher.start();

		console.warn(`[realtime] WebSocket on ws://localhost:${REALTIME_PORT}, watching ${BEADS_PATH}`);
	} catch (err) {
		console.error('[realtime] Failed to start:', (err as Error).message);
	}
}

// Start on module load (runs once when SvelteKit server starts)
startRealtime();

// Cleanup on process exit
function cleanup() {
	fileWatcher?.stop();
	realtimeServer?.stop();
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
