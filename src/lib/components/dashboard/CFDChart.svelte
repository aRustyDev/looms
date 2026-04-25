<script lang="ts">
	/**
	 * Cumulative Flow Diagram (CFD) - SVG stacked area chart
	 * @component
	 */
	import { scaleTime, scaleLinear } from 'd3-scale';
	import type { CFDPoint } from '$lib/analytics/metrics.js';

	interface Props {
		data: CFDPoint[];
	}

	const { data }: Props = $props();

	const STATUS_COLORS = {
		closed: '#22c55e',
		in_progress: '#3b82f6',
		open: '#6b7280'
	};

	const MARGIN = { top: 8, right: 8, bottom: 24, left: 32 };
	const WIDTH = 500;
	const HEIGHT = 220;
	const innerW = WIDTH - MARGIN.left - MARGIN.right;
	const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

	const xScale = $derived(() => {
		const dates = data.map((d) => new Date(d.date).getTime());
		return scaleTime()
			.domain([Math.min(...dates), Math.max(...dates)])
			.range([0, innerW]);
	});

	const yScale = $derived(() => {
		const maxTotal = Math.max(...data.map((d) => d.open + d.in_progress + d.closed), 1);
		return scaleLinear()
			.domain([0, maxTotal * 1.05])
			.range([innerH, 0]);
	});

	// Build stacked area paths: closed (bottom), in_progress (middle), open (top)
	function buildPath(getBottom: (d: CFDPoint) => number, getTop: (d: CFDPoint) => number): string {
		if (data.length === 0) return '';
		const xs = xScale();
		const ys = yScale();

		const forward = data
			.map((d) => `${xs(new Date(d.date).getTime())},${ys(getTop(d))}`)
			.join(' L');
		const backward = [...data]
			.reverse()
			.map((d) => `${xs(new Date(d.date).getTime())},${ys(getBottom(d))}`)
			.join(' L');

		return `M${forward} L${backward} Z`;
	}

	const closedPath = $derived(
		buildPath(
			() => 0,
			(d) => d.closed
		)
	);
	const inProgressPath = $derived(
		buildPath(
			(d) => d.closed,
			(d) => d.closed + d.in_progress
		)
	);
	const openPath = $derived(
		buildPath(
			(d) => d.closed + d.in_progress,
			(d) => d.closed + d.in_progress + d.open
		)
	);

	const yTicks = $derived(() => {
		const scale = yScale();
		return scale.ticks(4).map((v: number) => ({ y: scale(v), label: String(v) }));
	});

	const xTicks = $derived(() => {
		const scale = xScale();
		return scale.ticks(5).map((v: Date) => ({
			x: scale(v),
			label: `${v.getMonth() + 1}/${v.getDate()}`
		}));
	});
</script>

{#if data.length === 0}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-gray-400 dark:text-gray-500">No flow data to display</p>
	</div>
{:else}
	<div class="relative h-full w-full">
		<svg viewBox="0 0 {WIDTH} {HEIGHT}" class="h-full w-full" preserveAspectRatio="xMidYMid meet">
			<g transform="translate({MARGIN.left},{MARGIN.top})">
				<!-- Y grid -->
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

				<!-- Stacked areas (bottom to top: closed, in_progress, open) -->
				<path d={closedPath} fill={STATUS_COLORS.closed} fill-opacity="0.55" />
				<path d={inProgressPath} fill={STATUS_COLORS.in_progress} fill-opacity="0.55" />
				<path d={openPath} fill={STATUS_COLORS.open} fill-opacity="0.4" />

				<!-- X labels -->
				{#each xTicks() as tick (tick.label)}
					<text
						x={tick.x}
						y={innerH + 14}
						text-anchor="middle"
						class="fill-gray-400 dark:fill-gray-500"
						font-size="8">{tick.label}</text
					>
				{/each}
			</g>
		</svg>
		<!-- Legend -->
		<div class="pointer-events-none absolute right-2 bottom-1 flex gap-3 text-[10px]">
			{#each [['Closed', STATUS_COLORS.closed], ['In Progress', STATUS_COLORS.in_progress], ['Open', STATUS_COLORS.open]] as [label, color] (label)}
				<div class="flex items-center gap-1">
					<span class="inline-block h-2 w-2 rounded-sm" style="background: {color}; opacity: 0.65"
					></span>
					<span class="text-gray-500 dark:text-gray-400">{label}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
