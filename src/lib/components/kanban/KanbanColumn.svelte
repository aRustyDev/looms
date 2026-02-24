<script lang="ts">
	/**
	 * KanbanColumn - Single column on the Kanban board
	 * @component
	 */
	import KanbanCard from './KanbanCard.svelte';

	interface Issue {
		id: string;
		title: string;
		type: string;
		priority: string;
		status: string;
		assignee?: string | null;
	}

	interface Props {
		status: string;
		issues: Issue[];
		oncardclick?: (issue: Issue) => void;
		ondrop?: (issue: Issue, status: string) => void;
	}

	let { status, issues, oncardclick, ondrop }: Props = $props();

	let collapsed = $state(false);
	let isDragOver = $state(false);

	const STATUS_LABELS: Record<string, string> = {
		open: 'Open',
		in_progress: 'In Progress',
		review: 'Review',
		done: 'Done',
		closed: 'Closed'
	};

	function getStatusLabel(s: string): string {
		return STATUS_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
	}

	function toggleCollapse() {
		collapsed = !collapsed;
	}

	function handleCardClick(issue: Issue) {
		oncardclick?.(issue);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		const data = event.dataTransfer?.getData('application/json');
		if (data) {
			try {
				const issue = JSON.parse(data) as Issue;
				ondrop?.(issue, status);
			} catch {
				// Invalid JSON, ignore
			}
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div
		class="flex items-center justify-between rounded-t-lg bg-gray-100 px-3 py-2 dark:bg-gray-800"
	>
		<div class="flex items-center gap-2">
			<h3 class="font-medium text-gray-700 dark:text-gray-300">{getStatusLabel(status)}</h3>
			<span
				class="rounded-full bg-gray-200 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400"
			>
				{issues.length}
			</span>
		</div>
		<button
			type="button"
			aria-label={collapsed ? 'Expand column' : 'Collapse column'}
			onclick={toggleCollapse}
			class="rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
		>
			<svg
				class="h-4 w-4 transition-transform {collapsed ? '-rotate-90' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>

	<!-- Card list / Drop zone -->
	{#if !collapsed}
		<div
			role="listbox"
			aria-label="{getStatusLabel(status)} issues"
			tabindex="0"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			class="min-h-32 flex-1 space-y-2 overflow-y-auto rounded-b-lg bg-gray-50 p-2 transition-colors dark:bg-gray-900/50 {isDragOver
				? 'bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-900/20'
				: ''}"
		>
			{#if issues.length > 0}
				{#each issues as issue (issue.id)}
					<KanbanCard {issue} onclick={handleCardClick} />
				{/each}
			{:else}
				<div
					class="flex h-full items-center justify-center text-sm text-gray-400 italic dark:text-gray-500"
				>
					No issues
				</div>
			{/if}
		</div>
	{/if}
</div>
