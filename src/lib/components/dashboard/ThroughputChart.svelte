<script lang="ts">
	/**
	 * Throughput Chart - SVG bar chart
	 * @component
	 */
	import { scaleBand, scaleLinear } from 'd3-scale';
	import type { ThroughputBucket, ThroughputGranularity } from '$lib/analytics/metrics.js';

	interface Props {
		data: ThroughputBucket[];
		granularity?: ThroughputGranularity;
		ongranularitychange?: (g: ThroughputGranularity) => void;
	}

	const { data, granularity = 'week', ongranularitychange }: Props = $props();

	const granularities: ThroughputGranularity[] = ['day', 'week', 'month'];

	const MARGIN = { top: 8, right: 8, bottom: 24, left: 32 };
	const WIDTH = 500;
	const HEIGHT = 190;
	const innerW = WIDTH - MARGIN.left - MARGIN.right;
	const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

	const xScale = $derived(() =>
		scaleBand<string>()
			.domain(data.map((d) => d.period))
			.range([0, innerW])
			.padding(0.25)
	);

	const yScale = $derived(() => {
		const maxCount = Math.max(...data.map((d) => d.count), 1);
		return scaleLinear()
			.domain([0, maxCount * 1.15])
			.range([innerH, 0]);
	});

	const bars = $derived(
		data.map((d) => ({
			x: xScale()(d.period) ?? 0,
			y: yScale()(d.count),
			width: xScale().bandwidth(),
			height: innerH - yScale()(d.count),
			count: d.count,
			period: d.period
		}))
	);

	const yTicks = $derived(() => {
		const scale = yScale();
		return scale.ticks(4).map((v: number) => ({ y: scale(v), label: String(v) }));
	});

	// Rolling average
	const rollingAvg = $derived(() => {
		if (data.length < 2) return null;
		const windowSize = Math.min(3, data.length);
		return (data.slice(-windowSize).reduce((s, d) => s + d.count, 0) / windowSize).toFixed(1);
	});

	function formatPeriodLabel(period: string): string {
		if (period.length === 7) return period; // YYYY-MM
		const d = new Date(period);
		return `${d.getMonth() + 1}/${d.getDate()}`;
	}
</script>

{#if data.length === 0}
	<div class="flex h-full items-center justify-center">
		<p class="text-sm text-gray-400 dark:text-gray-500">No throughput data to display</p>
	</div>
{:else}
	<div class="flex h-full flex-col">
		<!-- Granularity toggle -->
		<div class="flex items-center justify-between px-3 pt-2">
			<div class="flex gap-1">
				{#each granularities as g (g)}
					<button
						type="button"
						class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors
							{g === granularity
							? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
							: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}"
						onclick={() => ongranularitychange?.(g)}
					>
						{g}
					</button>
				{/each}
			</div>
			{#if rollingAvg()}
				<span class="text-[10px] text-gray-400 dark:text-gray-500">avg: {rollingAvg()}/period</span>
			{/if}
		</div>

		<!-- Chart -->
		<div class="flex-1 px-1">
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

					<!-- Bars -->
					{#each bars as bar (bar.period)}
						<rect
							x={bar.x}
							y={bar.y}
							width={bar.width}
							height={bar.height}
							fill="#22c55e"
							fill-opacity="0.65"
							rx="2"
						>
							<title>{bar.count} items ({bar.period})</title>
						</rect>
					{/each}

					<!-- X labels (show subset to avoid crowding) -->
					{#each bars as bar, i (bar.period)}
						{#if i % Math.max(1, Math.ceil(bars.length / 6)) === 0 || i === bars.length - 1}
							<text
								x={bar.x + bar.width / 2}
								y={innerH + 14}
								text-anchor="middle"
								class="fill-gray-400 dark:fill-gray-500"
								font-size="7"
							>
								{formatPeriodLabel(bar.period)}
							</text>
						{/if}
					{/each}
				</g>
			</svg>
		</div>
	</div>
{/if}
