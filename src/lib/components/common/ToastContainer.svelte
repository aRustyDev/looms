<script lang="ts">
	/**
	 * ToastContainer - Container for rendering all toasts
	 * @component
	 */
	import Toast from './Toast.svelte';
	import { toastStore } from '$lib/stores/toast.svelte.js';

	const toasts = $derived(toastStore.toasts);

	function handleDismiss(id: string) {
		toastStore.dismiss(id);
	}
</script>

<div
	aria-live="polite"
	aria-label="Notifications"
	class="pointer-events-none fixed top-0 right-0 z-50 flex flex-col gap-2 p-4"
>
	{#each toasts as toast (toast.id)}
		<div class="pointer-events-auto">
			<Toast id={toast.id} message={toast.message} type={toast.type} ondismiss={handleDismiss} />
		</div>
	{/each}
</div>
