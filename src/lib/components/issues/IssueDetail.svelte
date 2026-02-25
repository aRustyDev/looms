<script lang="ts">
	/**
	 * IssueDetail - Full issue detail view with tabs
	 * @component
	 */
	import { STATUS_COLORS } from './types.js';

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
		issue: Issue;
		onshowdependencies?: () => void;
	}

	let { issue, onshowdependencies }: Props = $props();

	let activeTab = $state<'description' | 'comments'>('description');
	let tabs: HTMLElement[] = [];

	function getStatusColor(status: string): string {
		return STATUS_COLORS[status] ?? 'text-gray-500';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function parseMarkdown(text: string): string {
		// Simple markdown parsing for MVP
		// Replace ## headings
		let html = text.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
		// Replace ### headings
		html = html.replace(/^### (.+)$/gm, '<h3 class="text-md font-medium mt-3 mb-1">$1</h3>');
		// Replace paragraphs (double newlines)
		html = html.replace(/\n\n/g, '</p><p class="mb-2">');
		// Wrap in paragraph if not already
		if (!html.startsWith('<')) {
			html = '<p class="mb-2">' + html + '</p>';
		}
		return html;
	}

	function handleTabKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			const nextIndex = (index + 1) % tabs.length;
			tabs[nextIndex]?.focus();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			const prevIndex = (index - 1 + tabs.length) % tabs.length;
			tabs[prevIndex]?.focus();
		}
	}

	const blockedByCount = $derived(issue.blockedBy?.length ?? 0);
	const blockingCount = $derived(issue.blocking?.length ?? 0);
	const hasDependencies = $derived(blockedByCount > 0 || blockingCount > 0);
</script>

<div class="flex h-full flex-col">
	<!-- Header - with padding-right to avoid close button -->
	<div class="border-b px-6 py-4 pr-14 dark:border-gray-700">
		<div class="flex items-start gap-3">
			<div class="flex-1">
				<div class="flex items-center gap-2">
					<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{issue.id}</span>
					<span
						class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize dark:bg-blue-900/50 dark:text-blue-300"
					>
						{issue.type}
					</span>
				</div>
				<h2 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{issue.title}</h2>
			</div>
		</div>

		<!-- Meta info - improved contrast -->
		<div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
			<span
				class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(
					issue.status
				)} bg-gray-100 dark:bg-gray-800"
			>
				{issue.status}
			</span>
			<span
				class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/50 dark:text-red-300"
			>
				{issue.priority}
			</span>
			<span class="text-gray-700 dark:text-gray-300">
				{#if issue.assignee}
					<span class="font-medium">{issue.assignee}</span>
				{:else}
					<span class="text-gray-500 italic dark:text-gray-400">Unassigned</span>
				{/if}
			</span>
		</div>

		<!-- Timestamps -->
		<div class="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
			<span>Created: {formatDate(issue.created)}</span>
			<span>Updated: {formatDate(issue.updated)}</span>
		</div>
	</div>

	<!-- Dependencies -->
	<div class="border-b bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800/50">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4 text-sm">
				<span class="font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
				{#if hasDependencies}
					{#if blockedByCount > 0}
						<span
							class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
						>
							{blockedByCount} blocked by
						</span>
					{/if}
					{#if blockingCount > 0}
						<span
							class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
						>
							{blockingCount} blocking
						</span>
					{/if}
				{:else}
					<span class="text-gray-500 italic dark:text-gray-400">None</span>
				{/if}
			</div>
			<button
				type="button"
				onclick={() => onshowdependencies?.()}
				aria-label={hasDependencies ? 'Manage dependencies' : 'Add dependencies'}
				class="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
			>
				{hasDependencies ? 'Manage' : 'Add'}
			</button>
		</div>
	</div>

	<!-- Tabs -->
	<div class="border-b dark:border-gray-700">
		<div role="tablist" class="flex px-6">
			<button
				role="tab"
				id="tab-description"
				aria-selected={activeTab === 'description'}
				aria-controls="panel-description"
				tabindex={activeTab === 'description' ? 0 : -1}
				bind:this={tabs[0]}
				onclick={() => (activeTab = 'description')}
				onkeydown={(e) => handleTabKeyDown(e, 0)}
				class="border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
				'description'
					? 'border-blue-500 text-blue-600 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				Description
			</button>
			<button
				role="tab"
				id="tab-comments"
				aria-selected={activeTab === 'comments'}
				aria-controls="panel-comments"
				tabindex={activeTab === 'comments' ? 0 : -1}
				bind:this={tabs[1]}
				onclick={() => (activeTab = 'comments')}
				onkeydown={(e) => handleTabKeyDown(e, 1)}
				class="border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'comments'
					? 'border-blue-500 text-blue-600 dark:text-blue-400'
					: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
			>
				Comments ({issue.comments?.length ?? 0})
			</button>
		</div>
	</div>

	<!-- Tab content -->
	<div class="flex-1 overflow-auto px-6 py-4">
		{#if activeTab === 'description'}
			<div
				role="tabpanel"
				id="panel-description"
				aria-labelledby="tab-description"
				class="prose prose-sm dark:prose-invert max-w-none"
			>
				{#if issue.description}
					{@html parseMarkdown(issue.description)}
				{:else}
					<p class="text-gray-500 italic dark:text-gray-400">No description provided.</p>
				{/if}
			</div>
		{:else if activeTab === 'comments'}
			<div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments">
				{#if issue.comments && issue.comments.length > 0}
					<div class="space-y-4">
						{#each issue.comments as comment (comment.timestamp)}
							<div class="rounded-lg border p-4 dark:border-gray-700">
								<div class="mb-2 flex items-center justify-between">
									<span class="font-medium text-gray-900 dark:text-gray-100">{comment.author}</span>
									<span class="text-xs text-gray-500 dark:text-gray-400"
										>{formatDate(comment.timestamp)}</span
									>
								</div>
								<p class="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 italic dark:text-gray-400">No comments yet.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
