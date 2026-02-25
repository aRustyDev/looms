<script lang="ts">
	/**
	 * IssueDetailModal - Modal wrapper for IssueDetail
	 * @component
	 */
	import IssueDetail from './IssueDetail.svelte';

	interface Comment {
		author: string;
		content: string;
		timestamp: string;
	}

	interface Issue {
		id: string;
		title: string;
		description?: string;
		status: string;
		priority: string;
		type: string;
		assignee?: string | null;
		created: string;
		updated: string;
		comments?: Comment[];
		blockedBy?: string[];
		blocking?: string[];
	}

	interface Props {
		open: boolean;
		issue: Issue;
		onclose?: () => void;
		onshowdependencies?: () => void;
	}

	let { open, issue, onclose, onshowdependencies }: Props = $props();

	let modalElement: HTMLDivElement | undefined = $state();
	let previousActiveElement: HTMLElement | null = null;
	const modalTitleId = $derived(`issue-modal-title-${issue.id}`);

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

	function trapFocus(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !modalElement) return;

		const focusableElements = modalElement.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement?.focus();
		} else if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement?.focus();
		}
	}

	$effect(() => {
		if (open) {
			previousActiveElement = document.activeElement as HTMLElement;
			document.addEventListener('keydown', handleKeyDown);

			// Prevent body scroll when modal is open
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';

			// Focus the modal or close button after mount
			requestAnimationFrame(() => {
				const closeButton = modalElement?.querySelector<HTMLElement>('button[aria-label="Close"]');
				closeButton?.focus();
			});

			return () => {
				document.removeEventListener('keydown', handleKeyDown);
				document.body.style.overflow = originalOverflow;
				previousActiveElement?.focus();
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
		onkeydown={trapFocus}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={modalTitleId}
			tabindex="-1"
			bind:this={modalElement}
			class="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Hidden title for accessibility -->
			<span id={modalTitleId} class="sr-only">{issue.id}: {issue.title}</span>

			<!-- Close button -->
			<button
				type="button"
				aria-label="Close"
				onclick={() => onclose?.()}
				class="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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

			<!-- Issue detail content -->
			<IssueDetail {issue} {onshowdependencies} />
		</div>
	</div>
{/if}
