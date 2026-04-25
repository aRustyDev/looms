<script lang="ts">
	/**
	 * Health Status (RAG) Badge
	 * @component
	 *
	 * Red/Amber/Green indicator based on issue age vs percentile thresholds.
	 * Red: age > P95 or past due. Amber: age > P85 or due within 2 days. Green: healthy.
	 */
	import type { Percentiles } from '$lib/analytics/metrics.js';

	type Variant = 'card' | 'list';

	interface Props {
		ageDays: number;
		percentiles: Percentiles;
		dueAt?: string;
		/** Override percentile-based thresholds */
		thresholds?: { amber: number; red: number };
		variant?: Variant;
	}

	const { ageDays, percentiles, dueAt, thresholds, variant = 'card' }: Props = $props();

	type HealthStatus = 'green' | 'amber' | 'red';

	const amberThreshold = $derived(thresholds?.amber ?? percentiles.p85);
	const redThreshold = $derived(thresholds?.red ?? percentiles.p95);

	const dueStatus = $derived(() => {
		if (!dueAt) return null;
		const daysUntilDue = (new Date(dueAt).getTime() - Date.now()) / 86_400_000;
		if (daysUntilDue < 0) return 'overdue' as const;
		if (daysUntilDue <= 2) return 'due-soon' as const;
		return null;
	});

	const status: HealthStatus = $derived.by(() => {
		const due = dueStatus();
		if (due === 'overdue' || ageDays > redThreshold) return 'red';
		if (due === 'due-soon' || ageDays > amberThreshold) return 'amber';
		return 'green';
	});

	const tooltip = $derived.by(() => {
		const due = dueStatus();
		if (status === 'red') {
			if (due === 'overdue') return 'Past due date';
			return `Age (${ageDays.toFixed(0)}d) exceeds P95 (${redThreshold.toFixed(0)}d)`;
		}
		if (status === 'amber') {
			if (due === 'due-soon') return 'Due within 2 days';
			return `Age (${ageDays.toFixed(0)}d) exceeds P85 (${amberThreshold.toFixed(0)}d)`;
		}
		return `Healthy — ${ageDays.toFixed(0)}d old`;
	});

	const colorClasses: Record<HealthStatus, string> = {
		green: 'bg-rag-green',
		amber: 'bg-rag-amber',
		red: 'bg-rag-red'
	};

	const sizeClasses: Record<Variant, string> = {
		card: 'h-2.5 w-2.5',
		list: 'h-2 w-2'
	};
</script>

<span
	class="inline-block shrink-0 rounded-full {colorClasses[status]} {sizeClasses[variant]}"
	title={tooltip}
	role="img"
	aria-label="{status} health: {tooltip}"
></span>
