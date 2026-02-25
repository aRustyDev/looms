<script lang="ts">
	/**
	 * KanbanBoard - Full Kanban board with columns
	 * @component
	 */
	import KanbanColumn from './KanbanColumn.svelte';

	interface Issue {
		id: string;
		title: string;
		type: string;
		priority: string;
		status: string;
		assignee?: string | null;
	}

	interface Props {
		issues: Issue[];
		statuses: string[];
		loading?: boolean;
		oncardclick?: (issue: Issue) => void;
		onstatuschange?: (issue: Issue, newStatus: string) => void;
	}

	let { issues, statuses, loading = false, oncardclick, onstatuschange }: Props = $props();

	const issuesByStatus = $derived(
		statuses.reduce(
			(acc, status) => {
				acc[status] = issues.filter((issue) => issue.status === status);
				return acc;
			},
			{} as Record<string, Issue[]>
		)
	);

	function handleCardClick(issue: Issue) {
		oncardclick?.(issue);
	}

	function handleDrop(issue: Issue, newStatus: string) {
		if (issue.status !== newStatus) {
			onstatuschange?.(issue, newStatus);
		}
	}
</script>

<div
	role="region"
	aria-label="Kanban board"
	data-testid="kanban-board"
	class="flex h-full gap-4 overflow-x-auto"
>
	{#if loading}
		<div data-testid="kanban-loading" class="flex gap-4">
			{#each statuses as _status (_status)}
				<div class="w-72 shrink-0">
					<div class="animate-pulse">
						<div class="h-10 rounded-t-lg bg-gray-200 dark:bg-gray-700"></div>
						<div class="h-64 space-y-2 rounded-b-lg bg-gray-100 p-2 dark:bg-gray-800">
							<div class="h-20 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
							<div class="h-20 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		{#each statuses as status (status)}
			<div class="shrink-0">
				<KanbanColumn
					{status}
					issues={issuesByStatus[status] ?? []}
					oncardclick={handleCardClick}
					ondrop={handleDrop}
				/>
			</div>
		{/each}
	{/if}
</div>
