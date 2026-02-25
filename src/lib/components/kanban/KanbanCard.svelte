<script lang="ts">
	/**
	 * KanbanCard - Single card on the Kanban board
	 * @component
	 */

	interface Issue {
		id: string;
		title: string;
		type: string;
		priority: string;
		status: string;
		assignee?: string | null;
	}

	interface Props {
		issue: Issue;
		dragging?: boolean;
		onclick?: (issue: Issue) => void;
	}

	let { issue, dragging = false, onclick }: Props = $props();

	const PRIORITY_BORDER_COLORS: Record<string, string> = {
		P0: 'border-l-red-500',
		P1: 'border-l-orange-500',
		P2: 'border-l-yellow-500',
		P3: 'border-l-green-500',
		P4: 'border-l-gray-400'
	};

	const PRIORITY_BG_COLORS: Record<string, string> = {
		P0: 'bg-red-50 dark:bg-red-950/30',
		P1: 'bg-orange-50 dark:bg-orange-950/30',
		P2: 'bg-yellow-50 dark:bg-yellow-950/20',
		P3: 'bg-green-50 dark:bg-green-950/20',
		P4: 'bg-gray-50 dark:bg-gray-800'
	};

	const PRIORITY_TEXT_COLORS: Record<string, string> = {
		P0: 'text-red-700 dark:text-red-400',
		P1: 'text-orange-700 dark:text-orange-400',
		P2: 'text-yellow-700 dark:text-yellow-400',
		P3: 'text-green-700 dark:text-green-400',
		P4: 'text-gray-600 dark:text-gray-400'
	};

	const TYPE_COLORS: Record<string, string> = {
		bug: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
		task: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		feature: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
		epic: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
	};

	function getPriorityBorderColor(priority: string): string {
		return PRIORITY_BORDER_COLORS[priority] ?? 'border-l-gray-300';
	}

	function getPriorityBgColor(priority: string): string {
		return PRIORITY_BG_COLORS[priority] ?? 'bg-white dark:bg-gray-800';
	}

	function getPriorityTextColor(priority: string): string {
		return PRIORITY_TEXT_COLORS[priority] ?? 'text-gray-600 dark:text-gray-400';
	}

	function getTypeColor(type: string): string {
		return TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function handleClick() {
		onclick?.(issue);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onclick?.(issue);
		}
	}

	function handleDragStart(event: DragEvent) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/json', JSON.stringify(issue));
			event.dataTransfer.effectAllowed = 'move';
		}
	}
</script>

<div
	role="option"
	aria-label="{issue.id}: {issue.title}"
	aria-selected="false"
	tabindex="0"
	draggable="true"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	ondragstart={handleDragStart}
	class="rounded-lg border border-l-4 shadow-sm {getPriorityBorderColor(
		issue.priority
	)} {getPriorityBgColor(
		issue.priority
	)} cursor-pointer p-3 transition-all hover:shadow-md dark:border-gray-700 {dragging
		? 'scale-95 opacity-50 shadow-lg'
		: ''}"
>
	<!-- Header: ID and Type -->
	<div class="mb-2 flex items-center justify-between">
		<span class="font-mono text-xs text-gray-500 dark:text-gray-400">{issue.id}</span>
		<span class="rounded-full px-2 py-0.5 text-xs {getTypeColor(issue.type)}">{issue.type}</span>
	</div>

	<!-- Title -->
	<h4 class="mb-2 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
		{issue.title}
	</h4>

	<!-- Footer: Priority and Assignee -->
	<div class="flex items-center justify-between">
		<span class="rounded px-1.5 py-0.5 text-xs font-bold {getPriorityTextColor(issue.priority)}"
			>{issue.priority}</span
		>

		{#if issue.assignee}
			<div class="flex items-center gap-1">
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
				>
					{getInitials(issue.assignee)}
				</div>
				<span class="max-w-20 truncate text-xs text-gray-600 dark:text-gray-400"
					>{issue.assignee}</span
				>
			</div>
		{:else}
			<span class="text-xs text-gray-400 italic dark:text-gray-500">Unassigned</span>
		{/if}
	</div>
</div>
