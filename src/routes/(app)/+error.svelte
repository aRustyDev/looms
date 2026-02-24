<script lang="ts">
	/**
	 * Error Page - Error boundary for app routes
	 * @component
	 */
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	const error = $derived($page.error);
	const status = $derived($page.status);

	function handleGoBack() {
		if (browser) {
			history.back();
		}
	}

	function handleTryAgain() {
		if (browser) {
			location.reload();
		}
	}

	// Log error for debugging
	$effect(() => {
		if (error && browser) {
			console.error('Application error:', error);
		}
	});
</script>

<div class="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-8 text-center">
	<div class="max-w-md">
		<h1 class="mb-4 text-6xl font-bold text-gray-300 dark:text-gray-600">
			{status}
		</h1>

		<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
			{#if status === 404}
				Page Not Found
			{:else if status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h2>

		<p class="mb-8 text-gray-600 dark:text-gray-400">
			{#if error?.message}
				{error.message}
			{:else if status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else}
				An unexpected error occurred. Please try again.
			{/if}
		</p>

		<div class="flex justify-center gap-4">
			<button
				type="button"
				onclick={handleGoBack}
				class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
			>
				Go Back
			</button>

			<button
				type="button"
				onclick={handleTryAgain}
				class="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				Try Again
			</button>
		</div>
	</div>
</div>
