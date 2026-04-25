<script lang="ts">
	/**
	 * DatabaseConfigModal - Database connection configuration
	 * @component
	 */

	interface Props {
		open: boolean;
		onclose?: () => void;
	}

	let { open, onclose }: Props = $props();

	let host = $state('127.0.0.1');
	let port = $state(13306);
	let database = $state('beads_looms');
	let backend = $state('dolt');
	let connected = $state(false);
	let issueCount = $state(0);
	let databases = $state<string[]>([]);
	let loading = $state(false);
	let testing = $state(false);
	let saving = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);
	let error = $state<string | null>(null);

	let modalElement: HTMLDivElement | undefined = $state();

	// Load current config when modal opens
	$effect(() => {
		if (open) {
			loadConfig();
		} else {
			testResult = null;
			error = null;
		}
	});

	// Focus trap
	$effect(() => {
		if (open && modalElement) {
			modalElement.focus();
		}
	});

	async function loadConfig() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/api/config/database');
			if (!response.ok) throw new Error('Failed to load config');
			const data = await response.json();
			host = data.host;
			port = data.port;
			database = data.database;
			backend = data.backend;
			connected = data.connected;
			issueCount = data.issueCount;
			databases = data.databases ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load config';
		} finally {
			loading = false;
		}
	}

	async function testConnection() {
		testing = true;
		testResult = null;
		try {
			const response = await fetch('/api/config/database', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ host, port, database })
			});
			const data = await response.json();
			if (data.success) {
				testResult = { success: true, message: `Connected — ${data.issueCount} issues found` };
			} else {
				testResult = { success: false, message: data.error || 'Connection failed' };
			}
		} catch (e) {
			testResult = {
				success: false,
				message: e instanceof Error ? e.message : 'Connection test failed'
			};
		} finally {
			testing = false;
		}
	}

	async function save() {
		saving = true;
		error = null;
		try {
			const response = await fetch('/api/config/database', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ host, port, database })
			});
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to save config');
			}
			const data = await response.json();
			connected = data.connected;
			issueCount = data.issueCount;
			onclose?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose?.();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onclose?.();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		aria-label="Database Configuration"
		onkeydown={handleKeyDown}
		onclick={handleBackdropClick}
		bind:this={modalElement}
		tabindex="-1"
	>
		<div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Database Configuration
				</h2>
				<button
					type="button"
					onclick={() => onclose?.()}
					class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
					aria-label="Close"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{#if loading}
				<div class="py-8 text-center text-gray-500">Loading configuration...</div>
			{:else}
				<!-- Connection status -->
				<div class="mb-4 flex items-center gap-2 text-sm">
					<span
						class="inline-block h-2.5 w-2.5 rounded-full {connected
							? 'bg-green-500'
							: 'bg-red-500'}"
					></span>
					<span class="text-gray-600 dark:text-gray-400">
						{connected ? `Connected — ${issueCount} issues` : 'Disconnected'}
					</span>
					<span
						class="ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>
						{backend}
					</span>
				</div>

				<!-- Config form -->
				<div class="space-y-3">
					<div>
						<label
							for="db-host"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Host
						</label>
						<input
							id="db-host"
							type="text"
							bind:value={host}
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>

					<div>
						<label
							for="db-port"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Port
						</label>
						<input
							id="db-port"
							type="number"
							bind:value={port}
							min="1"
							max="65535"
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>

					<div>
						<label
							for="db-name"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Database
						</label>
						{#if databases.length > 0}
							<select
								id="db-name"
								bind:value={database}
								class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
							>
								{#each databases as db (db)}
									<option value={db}>{db}</option>
								{/each}
							</select>
						{:else}
							<input
								id="db-name"
								type="text"
								bind:value={database}
								class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
							/>
						{/if}
					</div>
				</div>

				<!-- Test result -->
				{#if testResult}
					<div
						class="mt-3 rounded-md p-3 text-sm {testResult.success
							? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400'
							: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'}"
					>
						{testResult.message}
					</div>
				{/if}

				<!-- Error -->
				{#if error}
					<div
						class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400"
					>
						{error}
					</div>
				{/if}

				<!-- Actions -->
				<div class="mt-5 flex items-center justify-between">
					<button
						type="button"
						onclick={testConnection}
						disabled={testing}
						class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						{testing ? 'Testing...' : 'Test Connection'}
					</button>

					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => onclose?.()}
							class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={save}
							disabled={saving}
							class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save & Apply'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
