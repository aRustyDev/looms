<script lang="ts">
	/**
	 * App Layout - Shell for authenticated routes
	 * @component
	 */
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex h-full flex-col">
	{@render children?.()}
</div>
