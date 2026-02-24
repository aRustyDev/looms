/**
 * Database Module
 * @module db
 *
 * Provides unified database access for SQLite and Dolt backends.
 * All write operations go through the `bd` CLI via ProcessSupervisor.
 */

export { DataAccessLayer, getDataAccessLayer, initDataAccessLayer } from './dal.js';

export type {
	DatabaseBackend,
	DatabaseConfig,
	QueryResult,
	Issue,
	Dependency,
	Comment,
	Label,
	IssueFilter
} from './types.js';
