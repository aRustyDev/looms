<script lang="ts">
	/**
	 * IssueTable - Table view for browsing issues
	 * @component
	 */
	import type { Issue } from '$lib/db/types.js';
	import { STATUS_COLORS, PRIORITY_COLORS } from './types.js';

	interface Props {
		issues: Issue[];
		loading?: boolean;
		error?: string | null;
		selectedId?: string | null;
		sortField?: string;
		sortDirection?: 'asc' | 'desc';
		onselect?: (id: string) => void;
		onsort?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
		onretry?: () => void;
	}

	let {
		issues = [],
		loading = false,
		error = null,
		selectedId = null,
		sortField = 'updated_at',
		sortDirection = 'desc',
		onselect,
		onsort,
		onretry
	}: Props = $props();

	function handleRowClick(issueId: string) {
		onselect?.(issueId);
	}

	function handleSort(field: string) {
		const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
		onsort?.({ field, direction: newDirection });
	}

	function handleRetry() {
		onretry?.();
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			if (diffHours === 0) {
				const diffMins = Math.floor(diffMs / (1000 * 60));
				return `${diffMins}m ago`;
			}
			return `${diffHours}h ago`;
		}
		if (diffDays === 1) return 'yesterday';
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	function getAriaSort(field: string): 'ascending' | 'descending' | 'none' {
		if (sortField !== field) return 'none';
		return sortDirection === 'asc' ? 'ascending' : 'descending';
	}
</script>

{#if loading}
	<div data-testid="loading-skeleton" class="animate-pulse space-y-2 p-4">
		{#each [1, 2, 3] as n (n)}
			<div class="h-12 rounded bg-gray-200 dark:bg-gray-700"></div>
		{/each}
	</div>
{:else if error}
	<div class="flex flex-col items-center justify-center p-8 text-center">
		<p class="mb-4 text-red-500">{error}</p>
		<button
			onclick={handleRetry}
			class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
		>
			Retry
		</button>
	</div>
{:else if issues.length === 0}
	<div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
		<p>No issues yet</p>
		<p class="text-sm">Create your first issue to get started</p>
	</div>
{:else}
	<table role="grid" class="w-full border-collapse">
		<thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
			<tr>
				<th
					role="columnheader"
					aria-sort={getAriaSort('id')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('id')}
				>
					ID
					{#if sortField === 'id'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
				<th
					role="columnheader"
					aria-sort={getAriaSort('title')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('title')}
				>
					Title
					{#if sortField === 'title'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
				<th
					role="columnheader"
					aria-sort={getAriaSort('priority')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('priority')}
				>
					Priority
					{#if sortField === 'priority'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
				<th
					role="columnheader"
					aria-sort={getAriaSort('status')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('status')}
				>
					Status
					{#if sortField === 'status'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
				<th
					role="columnheader"
					aria-sort={getAriaSort('assignee')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('assignee')}
				>
					Assignee
					{#if sortField === 'assignee'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
				<th
					role="columnheader"
					aria-sort={getAriaSort('updated_at')}
					class="cursor-pointer border-b p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => handleSort('updated_at')}
				>
					Updated
					{#if sortField === 'updated_at'}
						<span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each issues as issue (issue.id)}
				<tr
					class="cursor-pointer border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
					class:selected={selectedId === issue.id}
					class:bg-blue-50={selectedId === issue.id}
					class:dark:bg-blue-900={selectedId === issue.id}
					onclick={() => handleRowClick(issue.id)}
				>
					<td class="p-2 font-mono text-sm">{issue.id}</td>
					<td class="p-2">{issue.title}</td>
					<td class="p-2">
						<span class={PRIORITY_COLORS[issue.priority] ?? 'text-gray-500'}>
							P{issue.priority}
						</span>
					</td>
					<td class="p-2">
						<span
							class="rounded px-2 py-0.5 text-sm {STATUS_COLORS[issue.status] ?? 'text-gray-500'}"
						>
							{issue.status}
						</span>
					</td>
					<td class="p-2">
						{#if issue.assignee}
							{issue.assignee}
						{:else}
							<span class="text-gray-400 italic">Unassigned</span>
						{/if}
					</td>
					<td class="p-2 text-sm text-gray-500">
						{formatDate(issue.updated_at)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.selected {
		/* Additional selected styles if needed */
	}
</style>
