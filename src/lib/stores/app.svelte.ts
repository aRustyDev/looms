/**
 * App Store - Application-level shared state
 * @module stores/app.svelte
 *
 * Provides global state that needs to be shared across layout and pages,
 * such as modal states and issue creation that happens from the nav bar.
 *
 * All write operations go through API endpoints to avoid importing server
 * modules in browser code.
 */

import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';
import { createRealtimeClient, type RealtimeClient } from '$lib/realtime/useRealtime.js';
import { toastStore } from './toast.svelte.js';
import type { Issue, IssueFilter } from '$lib/db/types.js';

export interface CreateIssueInput {
	title: string;
	issue_type: string;
	description?: string;
	priority?: number;
	assignee?: string;
	status?: string;
}

export interface AppStoreConfig {
	/** Base URL for API calls (defaults to '' for same-origin) */
	apiBase?: string;
}

/**
 * Application-level store for shared state
 */
class AppStore {
	#apiBase = '';
	#realtimeClient: RealtimeClient | null = null;
	#pollingInterval: ReturnType<typeof setInterval> | null = null;
	#initialized = false;
	#watching = false;

	// Modal states
	#createModalOpen = $state(false);
	#issueDetailModalOpen = $state(false);
	#selectedIssueForDetail = $state<Issue | null>(null);

	// Issues state (shared across pages)
	#issues = $state<Issue[]>([]);
	#filter = $state<IssueFilter>({});
	#loading = $state(false);

	// Event listeners for store changes
	#listeners: SvelteSet<() => void> = new SvelteSet();

	get createModalOpen(): boolean {
		return this.#createModalOpen;
	}

	get issueDetailModalOpen(): boolean {
		return this.#issueDetailModalOpen;
	}

	get selectedIssueForDetail(): Issue | null {
		return this.#selectedIssueForDetail;
	}

	get issues(): Issue[] {
		return this.#issues;
	}

	get filter(): IssueFilter {
		return this.#filter;
	}

	get loading(): boolean {
		return this.#loading;
	}

	// Derived: filtered issues
	get filtered(): Issue[] {
		return this.#issues.filter((issue) => {
			if (this.#filter.status) {
				const statuses = Array.isArray(this.#filter.status)
					? this.#filter.status
					: [this.#filter.status];
				if (!statuses.includes(issue.status)) return false;
			}

			if (this.#filter.issueType) {
				const types = Array.isArray(this.#filter.issueType)
					? this.#filter.issueType
					: [this.#filter.issueType];
				if (!types.includes(issue.issue_type)) return false;
			}

			if (this.#filter.priority !== undefined) {
				const priorities = Array.isArray(this.#filter.priority)
					? this.#filter.priority
					: [this.#filter.priority];
				if (!priorities.includes(issue.priority)) return false;
			}

			if (this.#filter.assignee) {
				const assignees = Array.isArray(this.#filter.assignee)
					? this.#filter.assignee
					: [this.#filter.assignee];
				if (!assignees.includes(issue.assignee || '')) return false;
			}

			if (this.#filter.search) {
				const searchLower = this.#filter.search.toLowerCase();
				const matchesId = issue.id.toLowerCase().includes(searchLower);
				const matchesTitle = issue.title.toLowerCase().includes(searchLower);
				const matchesDescription = issue.description?.toLowerCase().includes(searchLower);
				if (!matchesId && !matchesTitle && !matchesDescription) return false;
			}

			return true;
		});
	}

	/**
	 * Initialize the store with configuration
	 */
	init(config: AppStoreConfig = {}): void {
		if (this.#initialized) return;

		this.#apiBase = config.apiBase ?? '';
		this.#initialized = true;
	}

	/**
	 * Reset for testing
	 */
	reset(config: AppStoreConfig = {}): void {
		this.stopWatching();
		this.#apiBase = config.apiBase ?? '';
		this.#initialized = false;
		this.#issues = [];
		this.#filter = {};
		this.#loading = false;
		this.#createModalOpen = false;
		this.#issueDetailModalOpen = false;
		this.#selectedIssueForDetail = null;
	}

	// Modal controls
	openCreateModal(): void {
		this.#createModalOpen = true;
	}

	closeCreateModal(): void {
		this.#createModalOpen = false;
	}

	openDetailModal(issue: Issue): void {
		this.#selectedIssueForDetail = issue;
		this.#issueDetailModalOpen = true;
	}

	closeDetailModal(): void {
		this.#issueDetailModalOpen = false;
		this.#selectedIssueForDetail = null;
	}

	// Issue operations
	setFilter(filter: IssueFilter): void {
		this.#filter = filter;
	}

	/**
	 * Set issues directly (used when server-loaded data is available)
	 */
	setIssues(issues: Issue[]): void {
		this.#issues = issues;
		this.#notifyListeners();
	}

	/**
	 * Load issues from API
	 */
	async load(): Promise<void> {
		if (!browser) return;

		this.#loading = true;
		try {
			const response = await fetch(`${this.#apiBase}/api/issues`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to fetch issues: ${response.status}`);
			}
			const data = await response.json();
			this.#issues = data.issues ?? [];
			this.#notifyListeners();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to load issues';
			toastStore.error(message);
		} finally {
			this.#loading = false;
		}
	}

	/**
	 * Create a new issue via API
	 */
	async create(input: CreateIssueInput): Promise<Issue | null> {
		if (!browser) {
			toastStore.error('Cannot create issues outside browser');
			return null;
		}

		try {
			const response = await fetch(`${this.#apiBase}/api/issues`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to create issue: ${response.status}`);
			}

			const data = await response.json();
			const issue = data.issue;

			// Add to local state
			this.#issues = [...this.#issues, issue];
			this.#notifyListeners();

			toastStore.success(`Created issue ${issue.id}`);
			return issue;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Update an existing issue via API
	 */
	async update(id: string, changes: Partial<CreateIssueInput>): Promise<void> {
		if (!browser) {
			toastStore.error('Cannot update issues outside browser');
			return;
		}

		const original = this.#issues.find((i) => i.id === id);
		if (!original) {
			throw new Error(`Issue ${id} not found in local state`);
		}

		// Optimistic update
		this.#issues = this.#issues.map((issue) =>
			issue.id === id ? { ...issue, ...changes } : issue
		);
		this.#notifyListeners();

		try {
			const response = await fetch(`${this.#apiBase}/api/issues/${encodeURIComponent(id)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changes)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to update issue: ${response.status}`);
			}

			const data = await response.json();
			// Update with server response to ensure consistency
			if (data.issue) {
				this.#issues = this.#issues.map((issue) => (issue.id === id ? data.issue : issue));
				this.#notifyListeners();
			}

			toastStore.success(`Updated issue ${id}`);
		} catch (error) {
			// Rollback on failure
			this.#issues = this.#issues.map((issue) => (issue.id === id ? original : issue));
			this.#notifyListeners();

			const message = error instanceof Error ? error.message : 'Failed to update issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Close (delete) an issue via API
	 */
	async delete(id: string): Promise<void> {
		if (!browser) {
			toastStore.error('Cannot close issues outside browser');
			return;
		}

		const original = this.#issues.find((i) => i.id === id);
		if (!original) {
			throw new Error(`Issue ${id} not found in local state`);
		}

		// Optimistic update - store the original list for rollback
		const originalIssues = [...this.#issues];
		this.#issues = this.#issues.filter((issue) => issue.id !== id);
		this.#notifyListeners();

		try {
			const response = await fetch(`${this.#apiBase}/api/issues/${encodeURIComponent(id)}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Failed to close issue: ${response.status}`);
			}

			toastStore.success(`Closed issue ${id}`);
		} catch (error) {
			// Rollback on failure
			this.#issues = originalIssues;
			this.#notifyListeners();

			const message = error instanceof Error ? error.message : 'Failed to close issue';
			toastStore.error(message);
			throw error;
		}
	}

	/**
	 * Subscribe to store changes
	 */
	subscribe(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	/**
	 * Get available statuses (derived from current issues or defaults)
	 */
	getStatuses(): string[] {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- temporary set for deduplication
		const fromIssues = [...new Set(this.#issues.map((i) => i.status))].filter(Boolean);
		if (fromIssues.length > 0) return fromIssues.sort();
		return ['open', 'in_progress', 'blocked', 'closed'];
	}

	/**
	 * Get available assignees (derived from current issues)
	 */
	getAssignees(): string[] {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- temporary set for deduplication
		return [...new Set(this.#issues.map((i) => i.assignee).filter(Boolean) as string[])].sort();
	}

	/**
	 * Get available issue types (derived from current issues or defaults)
	 */
	getIssueTypes(): string[] {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- temporary set for deduplication
		const fromIssues = [...new Set(this.#issues.map((i) => i.issue_type))].filter(Boolean);
		if (fromIssues.length > 0) return fromIssues.sort();
		return ['task', 'bug', 'feature', 'epic'];
	}

	#notifyListeners(): void {
		this.#listeners.forEach((listener) => listener());
	}

	/**
	 * Start watching for external changes (via WebSocket or polling)
	 * @param options Watch options
	 */
	startWatching(options: { websocketUrl?: string; pollingInterval?: number } = {}): void {
		if (this.#watching) return;

		const { websocketUrl, pollingInterval = 5000 } = options;

		if (websocketUrl && browser) {
			// Try WebSocket connection
			this.#realtimeClient = createRealtimeClient({
				url: websocketUrl,
				reconnectDelay: 1000,
				maxReconnectDelay: 30000
			});

			this.#realtimeClient.on('issues-changed', () => {
				this.load();
			});

			this.#realtimeClient.on('connected', () => {
				toastStore.info('Connected to real-time updates');
			});

			this.#realtimeClient.on('disconnected', () => {
				// Fallback to polling when WebSocket disconnects
				if (!this.#pollingInterval) {
					this.#startPolling(pollingInterval);
				}
			});

			this.#realtimeClient.connect();
		} else if (browser) {
			// Use polling as fallback
			this.#startPolling(pollingInterval);
		}

		this.#watching = true;
	}

	/**
	 * Stop watching for changes
	 */
	stopWatching(): void {
		if (this.#realtimeClient) {
			this.#realtimeClient.disconnect();
			this.#realtimeClient = null;
		}

		if (this.#pollingInterval) {
			clearInterval(this.#pollingInterval);
			this.#pollingInterval = null;
		}

		this.#watching = false;
	}

	/**
	 * Start polling for changes
	 */
	#startPolling(intervalMs: number): void {
		if (this.#pollingInterval) return;

		this.#pollingInterval = setInterval(async () => {
			try {
				await this.load();
			} catch {
				// Silently ignore polling errors
			}
		}, intervalMs);
	}

	/**
	 * Check if currently watching for changes
	 */
	get isWatching(): boolean {
		return this.#watching;
	}
}

// Export singleton instance
export const appStore = new AppStore();

// Export class for testing
export { AppStore };
