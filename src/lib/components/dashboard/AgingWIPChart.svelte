<script lang="ts">
	/**
	 * Aging WIP Chart - Open issues ranked by age
	 * @component
	 *
	 * Horizontal bar chart showing top N oldest open issues.
	 * Color-coded by health status (RAG).
	 */
	import type { AgingWIPEntry, Percentiles } from '$lib/analytics/metrics.js';
	import HealthBadge from './HealthBadge.svelte';

	interface Props {
		data: AgingWIPEntry[];
		percentiles: Percentiles;
		limit?: number;
	}

	const { data, percentiles, limit = 10 }: Props = $props();

	const visible = $derived(data.slice(0, limit));
	const maxAge = $derived(visible.length ? visible[0].ageDays : 1);
</script>

{#if data.length === 0}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-gray-400 dark:text-gray-500">No open issues</p>
	</div>
{:else}
	<div class="flex h-full flex-col overflow-auto p-3">
		<div class="space-y-1.5">
			{#each visible as entry (entry.issueId)}
				{@const widthPct = Math.max(4, (entry.ageDays / maxAge) * 100)}
				<div class="flex items-center gap-2">
					<HealthBadge ageDays={entry.ageDays} {percentiles} variant="list" />
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<div
								class="h-3.5 rounded-sm bg-amber-400/70 dark:bg-amber-500/50"
								style="width: {widthPct}%"
							></div>
							<span class="shrink-0 text-[10px] text-gray-500 tabular-nums dark:text-gray-400">
								{entry.ageDays.toFixed(0)}d
							</span>
						</div>
						<p class="truncate text-[10px] text-gray-600 dark:text-gray-400" title={entry.title}>
							{entry.title}
						</p>
					</div>
				</div>
			{/each}
		</div>
		{#if data.length > limit}
			<p class="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
				+{data.length - limit} more
			</p>
		{/if}
	</div>
{/if}
