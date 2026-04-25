<script lang="ts">
	/**
	 * Dashboard Page - Lean/Kanban metrics overview
	 * @component
	 */
	import { calculateThroughput, type ThroughputGranularity } from '$lib/analytics/metrics.js';
	import type {
		LeadTimeEntry,
		CycleTimeEntry,
		ThroughputBucket,
		CFDPoint,
		AgingWIPEntry,
		Percentiles
	} from '$lib/analytics/metrics.js';
	import type { Issue } from '$lib/db/types.js';
	import LeadTimeChart from '$lib/components/dashboard/LeadTimeChart.svelte';
	import ThroughputChart from '$lib/components/dashboard/ThroughputChart.svelte';
	import CFDChart from '$lib/components/dashboard/CFDChart.svelte';
	import AgingWIPChart from '$lib/components/dashboard/AgingWIPChart.svelte';

	interface Summary {
		totalOpen: number;
		totalClosed: number;
		avgLeadTimeDays: number | null;
		avgCycleTimeDays: number | null;
		recentThroughput: number;
	}

	interface Props {
		data: {
			issues: Issue[];
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

	// Client-side throughput granularity toggle
	let throughputGranularity = $state<ThroughputGranularity>('week');
	const throughputData = $derived(
		throughputGranularity === 'week'
			? data.throughput
			: calculateThroughput(data.issues, throughputGranularity)
	);

	function formatDays(days: number | null): string {
		if (days === null) return '--';
		if (days < 1) return `${Math.round(days * 24)}h`;
		return `${days.toFixed(1)}d`;
	}

	function handlePointClick(_issueId: string) {
		// TODO: Navigate to issue detail when deep-linking is implemented
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
				<div class="h-64">
					<LeadTimeChart
						data={data.leadTimes}
						percentiles={data.leadTimePercentiles}
						onpointclick={handlePointClick}
					/>
				</div>
			</div>

			<!-- Throughput Chart -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Throughput</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">Items completed per period</p>
				</div>
				<div class="h-64">
					<ThroughputChart
						data={throughputData}
						granularity={throughputGranularity}
						ongranularitychange={(g) => (throughputGranularity = g)}
					/>
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
				<div class="h-64">
					<CFDChart data={data.cfd} />
				</div>
			</div>

			<!-- Aging WIP -->
			<div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Aging WIP</h2>
					<p class="text-xs text-gray-500 dark:text-gray-400">Open issues by age</p>
				</div>
				<div class="h-64">
					<AgingWIPChart data={data.agingWIP} percentiles={data.leadTimePercentiles} />
				</div>
			</div>
		</div>
	</div>
</div>
