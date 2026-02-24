<script lang="ts">
	/**
	 * Kanban Board Page - Kanban view of issues
	 * @component
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import FilterPanel from '$lib/components/issues/FilterPanel.svelte';
	import { createIssueStore, type IssueStore } from '$lib/stores/issues.svelte.js';
	import { createDataAccessLayer, type DataAccessLayer } from '$lib/db/dal.js';
	import { createProcessSupervisor, type ProcessSupervisor } from '$lib/cli/index.js';
	import type { IssueFilter } from '$lib/db/types.js';

	interface Props {
		dal?: DataAccessLayer;
		supervisor?: ProcessSupervisor;
	}

	const props: Props = $props();

	// Use injected dependencies or create defaults
	const dal: DataAccessLayer = props.dal ?? createDataAccessLayer({ dbPath: '.beads/issues.db' });
	const supervisor: ProcessSupervisor = props.supervisor ?? createProcessSupervisor();

	// Create store
	const store: IssueStore = createIssueStore({ dal, supervisor });

	// Local state
	let loading = $state(true);
	let error = $state<string | null>(null);
	let availableStatuses = $state<string[]>(['open', 'in_progress', 'review', 'done']);
	let availableAssignees = $state<string[]>([]);
	let availableTypes = $state<string[]>(['task', 'bug', 'feature']);

	// Derived from store
	const issues = $derived(store.filtered);
	const filter = $derived(store.filter);

	// Convert Issue to KanbanBoard format
	interface KanbanIssue {
		id: string;
		title: string;
		type: string;
		priority: string;
		status: string;
		assignee?: string | null;
	}

	const kanbanIssues = $derived(
		issues.map(
			(issue): KanbanIssue => ({
				id: issue.id,
				title: issue.title,
				type: issue.issue_type,
				priority: `P${issue.priority}`,
				status: issue.status,
				assignee: issue.assignee
			})
		)
	);

	// Filter state for FilterPanel
	const filterStatus = $derived(
		Array.isArray(filter.status) ? filter.status : filter.status ? [filter.status] : []
	);
	const filterIssueType = $derived(
		Array.isArray(filter.issueType) ? filter.issueType : filter.issueType ? [filter.issueType] : []
	);
	const filterPriority = $derived(
		Array.isArray(filter.priority)
			? filter.priority
			: filter.priority !== undefined
				? [filter.priority]
				: []
	);
	const filterAssignee = $derived(
		Array.isArray(filter.assignee) ? filter.assignee[0] || '' : filter.assignee || ''
	);

	// Load initial data
	onMount(async () => {
		if (!browser) return;

		try {
			// Load metadata for filters
			const [statuses, assignees, types] = await Promise.all([
				dal.getStatuses(),
				dal.getAssignees(),
				dal.getIssueTypes()
			]);

			availableStatuses = statuses;
			availableAssignees = assignees;
			availableTypes = types;

			// Load issues
			await store.load();
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load issues';
			loading = false;
		}
	});

	function handleFilterChange(filters: {
		status: string[];
		issueType: string[];
		priority: number[];
		assignee: string;
		search: string;
	}) {
		const newFilter: IssueFilter = {};

		if (filters.status.length > 0) {
			newFilter.status = filters.status;
		}
		if (filters.issueType.length > 0) {
			newFilter.issueType = filters.issueType;
		}
		if (filters.priority.length > 0) {
			newFilter.priority = filters.priority;
		}
		if (filters.assignee) {
			newFilter.assignee = filters.assignee;
		}
		if (filters.search) {
			newFilter.search = filters.search;
		}

		store.setFilter(newFilter);
	}

	function handleCardClick(kanbanIssue: KanbanIssue) {
		store.setSelected(kanbanIssue.id);
		// TODO: Open issue detail modal
	}

	async function handleStatusChange(kanbanIssue: KanbanIssue, newStatus: string) {
		try {
			await store.update(kanbanIssue.id, { status: newStatus });
		} catch (e) {
			// TODO: Show error toast
			console.error('Failed to update status:', e);
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Filter panel -->
	<div class="border-b p-4 dark:border-gray-700">
		<FilterPanel
			status={filterStatus}
			issueType={filterIssueType}
			priority={filterPriority}
			assignee={filterAssignee}
			{availableStatuses}
			{availableTypes}
			{availableAssignees}
			onfilterchange={handleFilterChange}
		/>
	</div>

	<!-- Kanban board -->
	<div class="flex-1 overflow-hidden">
		{#if error}
			<div class="flex h-full flex-col items-center justify-center gap-4 text-center">
				<p class="text-red-600 dark:text-red-400">Error loading issues: {error}</p>
				<button
					type="button"
					onclick={() => location.reload()}
					class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		{:else}
			<KanbanBoard
				issues={kanbanIssues}
				statuses={availableStatuses}
				{loading}
				oncardclick={handleCardClick}
				onstatuschange={handleStatusChange}
			/>
		{/if}
	</div>
</div>
