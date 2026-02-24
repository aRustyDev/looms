/**
 * Issue Component Types
 * @module components/issues/types
 */

import type { Issue as DbIssue } from '$lib/db/types.js';

/** Display density for issue views */
export type DisplayDensity = 'compact' | 'comfortable';

/** Sort options for issue list */
export interface SortOption {
	field: keyof DbIssue;
	direction: 'asc' | 'desc';
	label: string;
}

/** Default sort options */
export const SORT_OPTIONS: SortOption[] = [
	{ field: 'updated_at', direction: 'desc', label: 'Updated' },
	{ field: 'created_at', direction: 'desc', label: 'Created' },
	{ field: 'priority', direction: 'asc', label: 'Priority' },
	{ field: 'status', direction: 'asc', label: 'Status' }
];

/** RAG (Red/Amber/Green) status indicator */
export type RagStatus = 'red' | 'amber' | 'green' | 'neutral';

/** Issue type to color mapping */
export const TYPE_COLORS: Record<string, string> = {
	bug: 'text-red-500',
	feature: 'text-purple-500',
	task: 'text-blue-500',
	epic: 'text-amber-500',
	chore: 'text-gray-500'
};

/** Priority to color mapping */
export const PRIORITY_COLORS: Record<number, string> = {
	1: 'text-red-500', // P1 - Critical
	2: 'text-amber-500', // P2 - High
	3: 'text-blue-500', // P3 - Medium
	4: 'text-gray-500' // P4 - Low
};

/** Status to color mapping */
export const STATUS_COLORS: Record<string, string> = {
	open: 'text-gray-500',
	in_progress: 'text-blue-500',
	review: 'text-purple-500',
	done: 'text-green-500',
	closed: 'text-gray-400'
};

/** Column configuration for issue table */
export interface ColumnConfig {
	key: string;
	label: string;
	visible: boolean;
	alwaysVisible?: boolean;
	width?: string;
}

/** Default column configuration (constant-mapped for MVP) */
export const DEFAULT_COLUMNS: ColumnConfig[] = [
	{ key: 'id', label: 'ID', visible: true, alwaysVisible: true, width: '100px' },
	{ key: 'title', label: 'Title', visible: true, alwaysVisible: true },
	{ key: 'issue_type', label: 'Type', visible: true, width: '80px' },
	{ key: 'priority', label: 'Priority', visible: true, width: '70px' },
	{ key: 'status', label: 'Status', visible: true, width: '100px' },
	{ key: 'assignee', label: 'Assignee', visible: true, width: '120px' },
	{ key: 'updated_at', label: 'Updated', visible: true, width: '120px' }
];

/** View state for issue list */
export interface IssueListState {
	issues: DbIssue[];
	loading: boolean;
	error: string | null;
	total: number;
	page: number;
	pageSize: number;
	density: DisplayDensity;
	sort: SortOption;
	selectedId: string | null;
}

/** Props for IssueRow component */
export interface IssueRowProps {
	issue: DbIssue;
	selected?: boolean;
	density?: DisplayDensity;
	columns?: ColumnConfig[];
}

/** Props for IssueCard component */
export interface IssueCardProps {
	issue: DbIssue;
	selected?: boolean;
}
