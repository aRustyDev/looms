<script lang="ts">
	/**
	 * DependenciesModal - Modal showing issue dependencies
	 * @component
	 */
	import { STATUS_COLORS } from './types.js';

	interface Issue {
		id: string;
		title: string;
	}

	interface DependencyIssue {
		id: string;
		title: string;
		status: string;
	}

	interface Props {
		open: boolean;
		issue: Issue;
		blockedBy: DependencyIssue[];
		blocking: DependencyIssue[];
		onclose?: () => void;
		onnavigate?: (issueId: string) => void;
		onadd?: () => void;
		onremove?: (issueId: string, type: 'blockedBy' | 'blocking') => void;
	}

	let { open, issue, blockedBy, blocking, onclose, onnavigate, onadd, onremove }: Props = $props();

	let modalElement: HTMLDivElement | undefined = $state();

	function getStatusColor(status: string): string {
		return STATUS_COLORS[status] ?? 'text-gray-500';
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

	function handleNavigate(issueId: string) {
		onnavigate?.(issueId);
	}

	function handleRemove(issueId: string, type: 'blockedBy' | 'blocking') {
		onremove?.(issueId, type);
	}

	$effect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeyDown);
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-testid="modal-backdrop"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="deps-modal-title"
			tabindex="-1"
			bind:this={modalElement}
			class="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
				<div>
					<h2 id="deps-modal-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Dependencies for {issue.id}
					</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">{issue.title}</p>
				</div>
				<button
					type="button"
					aria-label="Close"
					onclick={() => onclose?.()}
					class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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

			<!-- Content -->
			<div class="flex-1 space-y-6 overflow-y-auto p-6">
				<!-- Blocked By Section -->
				<section>
					<div class="mb-3 flex items-center justify-between">
						<h3
							class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							<svg
								class="h-4 w-4 text-orange-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Blocked By
							<span
								class="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
							>
								{blockedBy.length}
							</span>
						</h3>
					</div>

					{#if blockedBy.length > 0}
						<div class="space-y-2">
							{#each blockedBy as dep (dep.id)}
								<div
									class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
								>
									<button
										type="button"
										onclick={() => handleNavigate(dep.id)}
										class="-m-3 flex-1 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<span class="font-mono text-xs text-gray-500 dark:text-gray-400">{dep.id}</span>
										<span class="mx-2 text-sm text-gray-900 dark:text-gray-100">{dep.title}</span>
										<span class={`text-xs font-medium ${getStatusColor(dep.status)}`}
											>{dep.status}</span
										>
									</button>
									<button
										type="button"
										aria-label="Remove dependency"
										onclick={() => handleRemove(dep.id, 'blockedBy')}
										class="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-500 italic dark:text-gray-400">No blocking issues</p>
					{/if}
				</section>

				<!-- Blocking Section -->
				<section>
					<div class="mb-3 flex items-center justify-between">
						<h3
							class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							<svg
								class="h-4 w-4 text-purple-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
							Blocking
							<span
								class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
							>
								{blocking.length}
							</span>
						</h3>
					</div>

					{#if blocking.length > 0}
						<div class="space-y-2">
							{#each blocking as dep (dep.id)}
								<div
									class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
								>
									<button
										type="button"
										onclick={() => handleNavigate(dep.id)}
										class="-m-3 flex-1 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
									>
										<span class="font-mono text-xs text-gray-500 dark:text-gray-400">{dep.id}</span>
										<span class="mx-2 text-sm text-gray-900 dark:text-gray-100">{dep.title}</span>
										<span class={`text-xs font-medium ${getStatusColor(dep.status)}`}
											>{dep.status}</span
										>
									</button>
									<button
										type="button"
										aria-label="Remove dependency"
										onclick={() => handleRemove(dep.id, 'blocking')}
										class="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-500 italic dark:text-gray-400">No blocked issues</p>
					{/if}
				</section>
			</div>

			<!-- Footer -->
			<div class="flex justify-between border-t px-6 py-4 dark:border-gray-700">
				<button
					type="button"
					onclick={() => onadd?.()}
					class="rounded-md px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
				>
					<svg
						class="mr-1 inline-block h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add Dependency
				</button>
				<button
					type="button"
					onclick={() => onclose?.()}
					class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
