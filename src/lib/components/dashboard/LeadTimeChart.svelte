<script lang="ts">
	/**
	 * Lead Time Scatterplot - SVG-based distribution visualization
	 * @component
	 */
	import { scaleTime, scaleLinear } from 'd3-scale';
	import type { LeadTimeEntry, Percentiles } from '$lib/analytics/metrics.js';

	interface Props {
		data: LeadTimeEntry[];
		percentiles: Percentiles;
		onpointclick?: (issueId: string) => void;
	}

	const { data, percentiles, onpointclick }: Props = $props();

	const POINT_RADIUS: Record<string, number> = {
		epic: 6,
		feature: 5,
		story: 4,
		task: 3.5,
		bug: 3.5
	};

	const MARGIN = { top: 12, right: 12, bottom: 24, left: 36 };
	const WIDTH = 500;
	const HEIGHT = 220;
	const innerW = WIDTH - MARGIN.left - MARGIN.right;
	const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

	const xScale = $derived(() => {
		const dates = data.map((d) => new Date(d.closedAt).getTime());
		const min = Math.min(...dates);
		const max = Math.max(...dates);
		return scaleTime()
			.domain([min || Date.now() - 86400000, max || Date.now()])
			.range([0, innerW]);
	});

	const yScale = $derived(() => {
		const maxLead = Math.max(...data.map((d) => d.leadTimeDays), 1);
		return scaleLinear()
			.domain([0, maxLead * 1.1])
			.range([innerH, 0]);
	});

	const points = $derived(
		data.map((d) => ({
			cx: xScale()(new Date(d.closedAt).getTime()),
			cy: yScale()(d.leadTimeDays),
			r: POINT_RADIUS[d.issueType] ?? 3.5,
			issueId: d.issueId,
			title: `${d.title}\n${d.leadTimeDays.toFixed(1)}d lead time`,
			issueType: d.issueType
		}))
	);

	const yTicks = $derived(() => {
		const scale = yScale();
		return scale.ticks(4).map((v: number) => ({ y: scale(v), label: `${v.toFixed(0)}d` }));
	});

	const xTicks = $derived(() => {
		const scale = xScale();
		return scale.ticks(4).map((v: Date) => ({
			x: scale(v),
			label: `${v.getMonth() + 1}/${v.getDate()}`
		}));
	});

	const p50Y = $derived(percentiles.p50 > 0 ? yScale()(percentiles.p50) : null);
	const p85Y = $derived(percentiles.p85 > 0 ? yScale()(percentiles.p85) : null);
</script>

{#if data.length === 0}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-gray-400 dark:text-gray-500">No closed issues to display</p>
	</div>
{:else}
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" class="h-full w-full" preserveAspectRatio="xMidYMid meet">
		<g transform="translate({MARGIN.left},{MARGIN.top})">
			<!-- Grid lines -->
			{#each yTicks() as tick (tick.label)}
				<line
					x1="0"
					y1={tick.y}
					x2={innerW}
					y2={tick.y}
					class="stroke-gray-200 dark:stroke-gray-700"
					stroke-width="0.5"
				/>
				<text
					x="-4"
					y={tick.y}
					text-anchor="end"
					dominant-baseline="middle"
					class="fill-gray-400 dark:fill-gray-500"
					font-size="8">{tick.label}</text
				>
			{/each}
			{#each xTicks() as tick (tick.label)}
				<text
					x={tick.x}
					y={innerH + 14}
					text-anchor="middle"
					class="fill-gray-400 dark:fill-gray-500"
					font-size="8">{tick.label}</text
				>
			{/each}

			<!-- Percentile lines -->
			{#if p50Y !== null}
				<line
					x1="0"
					y1={p50Y}
					x2={innerW}
					y2={p50Y}
					stroke="#60a5fa"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.6"
				/>
			{/if}
			{#if p85Y !== null}
				<line
					x1="0"
					y1={p85Y}
					x2={innerW}
					y2={p85Y}
					stroke="#fbbf24"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.6"
				/>
			{/if}

			<!-- Points -->
			{#each points as pt (pt.issueId)}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
				<circle
					cx={pt.cx}
					cy={pt.cy}
					r={pt.r}
					fill="#3b82f6"
					fill-opacity="0.55"
					stroke="#2563eb"
					stroke-width="0.8"
					class="hover:fill-opacity-100 cursor-pointer transition-opacity"
					onclick={() => onpointclick?.(pt.issueId)}
					role="img"
					aria-label={pt.title}
				>
					<title>{pt.title}</title>
				</circle>
			{/each}
		</g>
	</svg>
	<!-- Legend -->
	<div class="pointer-events-none absolute top-2 right-3 space-y-0.5 text-[10px]">
		{#if percentiles.p50 > 0}
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-px w-4 border-t border-dashed border-blue-400"></span>
				<span class="text-gray-500 dark:text-gray-400">P50: {percentiles.p50.toFixed(1)}d</span>
			</div>
		{/if}
		{#if percentiles.p85 > 0}
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-px w-4 border-t border-dashed border-amber-400"></span>
				<span class="text-gray-500 dark:text-gray-400">P85: {percentiles.p85.toFixed(1)}d</span>
			</div>
		{/if}
	</div>
{/if}
