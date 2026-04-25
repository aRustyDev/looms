<script lang="ts">
	/**
	 * Dashboard Page - Lean/Kanban metrics overview
	 * @component
	 */
	import type {
		LeadTimeEntry,
		CycleTimeEntry,
		ThroughputBucket,
		CFDPoint,
		AgingWIPEntry,
		Percentiles
	} from '$lib/analytics/metrics.js';

	interface Summary {
		totalOpen: number;
		totalClosed: number;
		avgLeadTimeDays: number | null;
		avgCycleTimeDays: number | null;
		recentThroughput: number;
	}

	interface Props {
		data: {
			summary: Summary;
			leadTimes: LeadTimeEntry[];
			cycleTimes: CycleTimeEntry[];
			throughput: ThroughputBucket[];
			cfd: CFDPoint[];
			agingWIP: AgingWIPEntry[];
			leadTimePercentiles: Percentiles;
			cycleTimePercentiles: Percentiles;
			error?: string;
		};
	}

	const { data }: Props = $props();

	function formatDays(days: number | null): string {
		if (days === null) return '--';
		if (days < 1) return `${Math.round(days * 24)}h`;
		return `${days.toFixed(1)}d`;
	}
</script>

<svelte:head>
	<title>Dashboard - Looms</title>
</svelte:head>

<div class="flex h-full flex-col overflow-auto bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
		<h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Lean/Kanban metrics overview</p>
	</div>

	{#if data.error}
		<div
			class="border-danger/30 bg-danger/10 text-danger mx-6 mt-4 rounded-lg border px-4 py-3 text-sm"
		>
			{data.error}
		</div>
	{/if}

	<div class="flex-1 space-y-6 p-6">
		<!-- Summary Stats -->
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Open Issues</p>
				<p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
					{data.summary.totalOpen}
				</p>
			</div>
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Lead Time</p>
				<p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
					{formatDays(data.summary.avgLeadTimeDays)}
				</p>
				{#if data.leadTimePercentiles.p85 > 0}
					<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
						P85: {formatDays(data.leadTimePercentiles.p85)}
					</p>
				{/if}
			</div>
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Cycle Time</p>
				<p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
					{formatDays(data.summary.avgCycleTimeDays)}
				</p>
				{#if data.cycleTimePercentiles.p85 > 0}
					<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
						P85: {formatDays(data.cycleTimePercentiles.p85)}
					</p>
				{/if}
			</div>
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
			>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Throughput (last period)</p>
				<p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
					{data.summary.recentThroughput}
				</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
					{data.summary.totalClosed} total closed
				</p>
			</div>
		</div>

		<!-- Chart Grid: 2x2 -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Lead Time Scatterplot -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Lead Time</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Distribution of time from creation to close
					</p>
				</div>
				<div class="flex h-64 items-center justify-center">
					{#if data.leadTimes.length === 0}
						<p class="text-sm text-gray-400 dark:text-gray-500">No closed issues to display</p>
					{:else}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
							>
								<svg
									class="h-5 w-5 text-blue-600 dark:text-blue-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="3" />
									<path
										d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-5.07-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14 2.83 2.83m4.48 4.48 2.83 2.83"
									/>
								</svg>
							</div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Coming Soon</p>
							<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
								{data.leadTimes.length} data points ready
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Throughput Chart -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Throughput</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">Items completed per period</p>
				</div>
				<div class="flex h-64 items-center justify-center">
					{#if data.throughput.length === 0}
						<p class="text-sm text-gray-400 dark:text-gray-500">No throughput data to display</p>
					{:else}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
							>
								<svg
									class="h-5 w-5 text-green-600 dark:text-green-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 12h4l3-9 4 18 3-9h4" />
								</svg>
							</div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Coming Soon</p>
							<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
								{data.throughput.length} periods tracked
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- CFD Chart -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Cumulative Flow</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Issue status distribution over time
					</p>
				</div>
				<div class="flex h-64 items-center justify-center">
					{#if data.cfd.length === 0}
						<p class="text-sm text-gray-400 dark:text-gray-500">No flow data to display</p>
					{:else}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"
							>
								<svg
									class="h-5 w-5 text-purple-600 dark:text-purple-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M2 20h20M2 16l5-4 4 2 5-6 4 4" />
								</svg>
							</div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Coming Soon</p>
							<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
								{data.cfd.length} days of data
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Aging WIP -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Aging WIP</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">Open issues by age</p>
				</div>
				<div class="flex h-64 items-center justify-center">
					{#if data.agingWIP.length === 0}
						<p class="text-sm text-gray-400 dark:text-gray-500">No open issues</p>
					{:else}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
							>
								<svg
									class="h-5 w-5 text-amber-600 dark:text-amber-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" />
									<path d="M12 6v6l4 2" />
								</svg>
							</div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Coming Soon</p>
							<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
								{data.agingWIP.length} items in progress
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
