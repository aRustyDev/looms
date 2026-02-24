<script lang="ts">
	/**
	 * Toast - Individual toast notification
	 * @component
	 */
	import type { ToastType } from '$lib/stores/toast.svelte.js';

	interface Props {
		id: string;
		message: string;
		type?: ToastType;
		ondismiss?: (id: string) => void;
	}

	let { id, message, type = 'info', ondismiss }: Props = $props();

	const typeStyles: Record<ToastType, string> = {
		success: 'bg-green-500 text-white',
		error: 'bg-red-500 text-white',
		warning: 'bg-yellow-500 text-black',
		info: 'bg-blue-500 text-white'
	};

	const typeIcons: Record<ToastType, string> = {
		success: '✓',
		error: '✕',
		warning: '⚠',
		info: 'ℹ'
	};

	function handleDismiss() {
		ondismiss?.(id);
	}
</script>

<div
	role="alert"
	aria-live="polite"
	class="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg {typeStyles[type]}"
>
	<span class="text-lg">{typeIcons[type]}</span>
	<span class="flex-1">{message}</span>
	<button
		type="button"
		aria-label="Dismiss notification"
		onclick={handleDismiss}
		class="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
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
