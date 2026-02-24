#!/usr/bin/env node

/**
 * projx-ui CLI entry point
 *
 * This script starts the SvelteKit server using the Node adapter build output.
 * It's designed to be installed globally via npm and run as a standalone server.
 */

import { createServer } from 'node:http';
import { handler } from '../build/handler.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer(handler);

server.listen(PORT, HOST, () => {
	console.log(`projx-ui server running at http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down gracefully...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
