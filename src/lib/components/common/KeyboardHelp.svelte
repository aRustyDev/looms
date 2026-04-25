<script lang="ts">
	/**
	 * KeyboardHelp - Modal showing all keyboard shortcuts
	 * @component
	 */
	import { SvelteMap } from 'svelte/reactivity';
	import type { ShortcutHandler, ShortcutConfig } from '$lib/shortcuts/ShortcutManager.js';

	interface Props {
		open: boolean;
		shortcuts: ShortcutHandler[];
		onclose?: () => void;
	}

	let { open, shortcuts, onclose }: Props = $props();

	let modalElement: HTMLDivElement | undefined = $state();

	// Group shortcuts by category
	function getShortcutsByCategory(): SvelteMap<string, ShortcutHandler[]> {
		const categories = new SvelteMap<string, ShortcutHandler[]>();

		for (const shortcut of shortcuts) {
			const category = shortcut.config.category ?? 'General';
			if (!categories.has(category)) {
				categories.set(category, []);
			}
			categories.get(category)!.push(shortcut);
		}

		return categories;
	}

	// Format key combination for display
	function formatKey(config: ShortcutConfig): string {
		const parts: string[] = [];
		if (config.ctrl) parts.push('Ctrl');
		if (config.alt) parts.push('Alt');
		if (config.shift) parts.push('Shift');
		if (config.meta) parts.push('\u2318');

		// Format special keys nicely
		let key = config.key;
		if (key === 'Escape') key = 'Esc';
		if (key === 'Enter') key = '\u21B5';
		if (key === ' ') key = 'Space';

		parts.push(key.toUpperCase());
		return parts.join(' + ');
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose?.();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === modalElement) {
			onclose?.();
		}
	}

	$effect(() => {
		if (open && modalElement) {
			modalElement.focus();
		}
	});
</script>

{#if open}
	<div
		bind:this={modalElement}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		role="dialog"
		aria-modal="true"
		aria-labelledby="keyboard-help-title"
		tabindex="-1"
		onkeydown={handleKeyDown}
		onclick={handleBackdropClick}
	>
		<div
			class="flex max-h-[80vh] w-[90%] max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900"
		>
			<header
				class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
			>
				<h2 id="keyboard-help-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Keyboard Shortcuts
				</h2>
				<button
					type="button"
					class="rounded-md p-1 text-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
					aria-label="Close keyboard shortcuts"
					onclick={() => onclose?.()}
				>
					&times;
				</button>
			</header>

			<div class="overflow-y-auto px-5 py-4">
				{#each Array.from(getShortcutsByCategory().entries()) as [category, categoryShortcuts] (category)}
					<section class="mb-5 last:mb-0">
						<h3
							class="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							{category}
						</h3>
						<dl>
							{#each categoryShortcuts as shortcut (shortcut.config.key)}
								<div
									class="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-800"
								>
									<dt>
										<kbd
											class="inline-block rounded border border-gray-200 bg-gray-100 px-2 py-1 font-mono text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800"
										>
											{formatKey(shortcut.config)}
										</kbd>
									</dt>
									<dd class="text-sm text-gray-500 dark:text-gray-400">
										{shortcut.config.description}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>

			<footer
				class="border-t border-gray-200 px-5 py-3 text-center text-xs text-gray-400 dark:border-gray-700"
			>
				Press <kbd
					class="inline-block rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[0.625rem] dark:border-gray-700 dark:bg-gray-800"
					>Esc</kbd
				>
				or
				<kbd
					class="inline-block rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[0.625rem] dark:border-gray-700 dark:bg-gray-800"
					>?</kbd
				> to close
			</footer>
		</div>
	</div>
{/if}
