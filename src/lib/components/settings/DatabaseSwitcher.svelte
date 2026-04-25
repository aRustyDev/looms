<script lang="ts">
	/**
	 * DatabaseSwitcher - Quick database selector dropdown
	 * @component
	 *
	 * Displays the current database name and allows switching
	 * between beads_* databases on the connected Dolt server.
	 */
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { toastStore } from '$lib/stores/toast.svelte.js';

	interface Props {
		onswitch?: () => void;
	}

	let { onswitch }: Props = $props();

	let currentDb = $state('beads_looms');
	let databases = $state<string[]>([]);
	let dropdownOpen = $state(false);
	let loading = $state(false);
	let dropdownElement: HTMLDivElement | undefined = $state();

	// Load on mount
	$effect(() => {
		if (!browser) return;
		try {
			const stored = localStorage.getItem('looms_active_database');
			if (stored) currentDb = stored;
		} catch {
			// localStorage may not be available in test environments
		}
		loadDatabases();
	});

	// Close dropdown on outside click
	$effect(() => {
		if (!browser || !dropdownOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
				dropdownOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	async function loadDatabases() {
		try {
			const response = await fetch('/api/config/database');
			if (!response.ok) return;
			const data = await response.json();
			databases = data.databases ?? [];
			currentDb = data.database;
		} catch {
			// Non-critical
		}
	}

	async function switchDatabase(db: string) {
		if (db === currentDb) {
			dropdownOpen = false;
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/config/database', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ database: db })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to switch database');
			}

			const data = await response.json();
			currentDb = data.database;
			try {
				localStorage.setItem('looms_active_database', currentDb);
			} catch {
				// localStorage may not be available
			}
			dropdownOpen = false;
			// Re-run server loads + client store in parallel for instant feel
			await Promise.all([invalidateAll(), onswitch?.()]);
			toastStore.success(`Switched to ${formatDbName(currentDb)} (${data.issueCount} issues)`);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to switch database';
			toastStore.error(message);
		} finally {
			loading = false;
		}
	}

	function formatDbName(db: string): string {
		return db.replace('beads_', '');
	}
</script>

<div class="relative" bind:this={dropdownElement}>
	<button
		type="button"
		onclick={() => (dropdownOpen = !dropdownOpen)}
		disabled={loading}
		class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
		aria-label="Switch database"
		aria-expanded={dropdownOpen}
		aria-haspopup="listbox"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
			/>
		</svg>
		<span class="font-medium">{formatDbName(currentDb)}</span>
		<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if dropdownOpen && databases.length > 0}
		<div
			class="absolute top-full right-0 z-50 mt-1 min-w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
			role="listbox"
			aria-label="Available databases"
		>
			{#each databases as db (db)}
				<button
					type="button"
					role="option"
					aria-selected={db === currentDb}
					onclick={() => switchDatabase(db)}
					class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors {db ===
					currentDb
						? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
						: 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}"
				>
					{#if db === currentDb}
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<span class="h-4 w-4"></span>
					{/if}
					<span>{formatDbName(db)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
