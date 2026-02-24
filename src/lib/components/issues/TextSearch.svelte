<script lang="ts">
	/**
	 * TextSearch - Debounced search input with clear button
	 * @component
	 */

	interface Props {
		value?: string;
		placeholder?: string;
		loading?: boolean;
		onsearch?: (query: string) => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search issues...',
		loading = false,
		onsearch
	}: Props = $props();

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		scheduleSearch();
	}

	function scheduleSearch() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			onsearch?.(value);
			debounceTimer = null;
		}, 300);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			// Cancel pending debounce and search immediately
			if (debounceTimer) {
				clearTimeout(debounceTimer);
				debounceTimer = null;
			}
			onsearch?.(value);
		}
	}

	function handleClear() {
		value = '';
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		onsearch?.('');
	}
</script>

<div class="relative">
	<input
		type="search"
		aria-label="Search issues"
		autocomplete="off"
		{placeholder}
		{value}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
	/>

	{#if loading}
		<div data-testid="search-loading" class="absolute top-1/2 right-3 -translate-y-1/2">
			<svg
				class="h-4 w-4 animate-spin text-gray-400"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if value}
		<button
			type="button"
			aria-label="Clear search"
			onclick={handleClear}
			class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	{/if}
</div>
