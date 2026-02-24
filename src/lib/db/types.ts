/**
 * Database Types for Data Access Layer
 * @module db/types
 */

/** Supported database backends */
export type DatabaseBackend = 'sqlite' | 'dolt';

/** Configuration for Data Access Layer */
export interface DatabaseConfig {
	/** Path to .beads directory (default: auto-discover) */
	beadsPath?: string;
	/** Override backend detection */
	backend?: DatabaseBackend;
	/** Dolt server configuration */
	dolt?: {
		host: string;
		port: number;
		user: string;
		password: string;
		database: string;
	};
	/** Connection pool size for Dolt (default: 5) */
	poolSize?: number;
}

/** Result of a database query */
export interface QueryResult<T = Record<string, unknown>> {
	/** Returned rows */
	rows: T[];
	/** Number of rows affected (for write operations) */
	affectedRows?: number;
	/** Query execution time in milliseconds */
	duration: number;
}

/** Issue type from database */
export interface Issue {
	id: string;
	title: string;
	description: string;
	design?: string;
	acceptance_criteria?: string;
	notes?: string;
	status: string;
	priority: number;
	issue_type: string;
	assignee?: string;
	owner?: string;
	created_at: string;
	updated_at: string;
	closed_at?: string;
	external_ref?: string;
	spec_id?: string;
	due_at?: string;
	metadata?: Record<string, unknown>;
}

/** Dependency relationship from database */
export interface Dependency {
	issue_id: string;
	depends_on_id: string;
	type: 'blocks' | 'parent-child' | 'relates_to';
	created_at: string;
}

/** Comment from database */
export interface Comment {
	id: string;
	issue_id: string;
	content: string;
	author: string;
	created_at: string;
}

/** Label from database */
export interface Label {
	issue_id: string;
	label: string;
}

/** Filter options for issue queries */
export interface IssueFilter {
	status?: string | string[];
	priority?: number | number[];
	issueType?: string | string[];
	assignee?: string | string[];
	search?: string;
	parentId?: string;
	labels?: string[];
	limit?: number;
	offset?: number;
	orderBy?: {
		field: keyof Issue;
		direction: 'asc' | 'desc';
	};
}
