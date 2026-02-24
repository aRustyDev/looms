<script lang="ts">
	/**
	 * GlobalNav - Main navigation bar with tabs and actions
	 * @component
	 */
	import ThemeToggle from './ThemeToggle.svelte';

	type Tab = 'Issues' | 'Epics' | 'Board' | 'Dashboard' | 'Graph';
	type Theme = 'light' | 'dark' | 'system';

	interface Props {
		activeTab: Tab;
		theme?: Theme;
		onnavigate?: (tab: Tab) => void;
		oncreateissue?: () => void;
		oncreateepic?: () => void;
		onthemechange?: (theme: Theme) => void;
	}

	let {
		activeTab,
		theme = 'system',
		onnavigate,
		oncreateissue,
		oncreateepic,
		onthemechange
	}: Props = $props();

	const TABS: Tab[] = ['Issues', 'Epics', 'Board', 'Dashboard', 'Graph'];
	let tabRefs: HTMLButtonElement[] = $state([]);

	function handleTabClick(tab: Tab) {
		onnavigate?.(tab);
	}

	function handleTabKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			const nextIndex = (index + 1) % TABS.length;
			tabRefs[nextIndex]?.focus();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			const prevIndex = (index - 1 + TABS.length) % TABS.length;
			tabRefs[prevIndex]?.focus();
		}
	}
</script>

<nav class="border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
	<div class="flex h-14 items-center justify-between">
		<!-- Left: Tabs -->
		<div role="tablist" class="flex items-center gap-1">
			{#each TABS as tab, index (tab)}
				<button
					role="tab"
					type="button"
					id="tab-{tab.toLowerCase()}"
					aria-selected={activeTab === tab}
					tabindex={activeTab === tab ? 0 : -1}
					bind:this={tabRefs[index]}
					onclick={() => handleTabClick(tab)}
					onkeydown={(e) => handleTabKeyDown(e, index)}
					class="rounded-md px-4 py-2 text-sm font-medium transition-colors {activeTab === tab
						? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}"
				>
					{tab}
				</button>
			{/each}
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-2">
			<!-- Quick Actions -->
			<button
				type="button"
				aria-label="New Issue"
				onclick={() => oncreateissue?.()}
				class="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Issue
			</button>

			<button
				type="button"
				aria-label="New Epic"
				onclick={() => oncreateepic?.()}
				class="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Epic
			</button>

			<!-- Divider -->
			<div class="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

			<!-- Theme Toggle -->
			<ThemeToggle {theme} {onthemechange} />
		</div>
	</div>
</nav>
