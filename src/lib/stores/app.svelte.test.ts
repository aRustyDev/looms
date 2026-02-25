/**
 * App Store Tests
 * @module stores/app.svelte.test
 *
 * Tests for the AppStore which uses API endpoints for all operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppStore } from './app.svelte.js';
import type { Issue } from '$lib/db/types.js';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock toast store
vi.mock('./toast.svelte.js', () => ({
	toastStore: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn()
	}
}));

import { toastStore } from './toast.svelte.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'TEST-1',
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 3,
		issue_type: 'task',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		...overrides
	};
}

function mockFetchResponse(data: unknown, status = 200) {
	return Promise.resolve({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(data)
	});
}

describe('AppStore', () => {
	let store: AppStore;

	beforeEach(() => {
		store = new AppStore();
		store.reset();
		vi.clearAllMocks();
	});

	afterEach(() => {
		store.stopWatching();
	});

	describe('Modal State', () => {
		it('createModalOpen starts as false', () => {
			expect(store.createModalOpen).toBe(false);
		});

		it('openCreateModal sets createModalOpen to true', () => {
			store.openCreateModal();
			expect(store.createModalOpen).toBe(true);
		});

		it('closeCreateModal sets createModalOpen to false', () => {
			store.openCreateModal();
			store.closeCreateModal();
			expect(store.createModalOpen).toBe(false);
		});

		it('issueDetailModalOpen starts as false', () => {
			expect(store.issueDetailModalOpen).toBe(false);
		});

		it('openDetailModal sets issue and opens modal', () => {
			const issue = createMockIssue();
			store.openDetailModal(issue);
			expect(store.issueDetailModalOpen).toBe(true);
			expect(store.selectedIssueForDetail).toEqual(issue);
		});

		it('closeDetailModal clears issue and closes modal', () => {
			const issue = createMockIssue();
			store.openDetailModal(issue);
			store.closeDetailModal();
			expect(store.issueDetailModalOpen).toBe(false);
			expect(store.selectedIssueForDetail).toBeNull();
		});
	});

	describe('Loading Issues', () => {
		it('load() fetches issues from API', async () => {
			const issues = [createMockIssue()];
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ issues }));

			await store.load();

			expect(mockFetch).toHaveBeenCalledWith('/api/issues');
			expect(store.issues).toEqual(issues);
		});

		it('load() sets loading state', async () => {
			mockFetch.mockImplementationOnce(
				() =>
					new Promise((resolve) => setTimeout(() => resolve(mockFetchResponse({ issues: [] })), 10))
			);

			const loadPromise = store.load();
			expect(store.loading).toBe(true);

			await loadPromise;
			expect(store.loading).toBe(false);
		});

		it('load() handles API errors', async () => {
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ message: 'Server error' }, 500));

			await store.load();

			expect(toastStore.error).toHaveBeenCalled();
		});
	});

	describe('Filtering', () => {
		it('filtered returns all issues when no filter', () => {
			const issues = [createMockIssue({ id: '1' }), createMockIssue({ id: '2' })];
			store.setIssues(issues);

			expect(store.filtered).toEqual(issues);
		});

		it('setFilter updates filter state', () => {
			store.setFilter({ status: 'open' });
			expect(store.filter).toEqual({ status: 'open' });
		});

		it('filtered applies status filter', () => {
			const issues = [
				createMockIssue({ id: '1', status: 'open' }),
				createMockIssue({ id: '2', status: 'done' })
			];
			store.setIssues(issues);
			store.setFilter({ status: 'open' });

			expect(store.filtered).toHaveLength(1);
			expect(store.filtered[0]?.id).toBe('1');
		});

		it('filtered applies search filter', () => {
			const issues = [
				createMockIssue({ id: '1', title: 'Fix bug' }),
				createMockIssue({ id: '2', title: 'Add feature' })
			];
			store.setIssues(issues);
			store.setFilter({ search: 'bug' });

			expect(store.filtered).toHaveLength(1);
			expect(store.filtered[0]?.id).toBe('1');
		});
	});

	describe('Creating Issues', () => {
		it('create() calls API with correct body', async () => {
			const newIssue = createMockIssue({ id: 'TEST-NEW' });
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ issue: newIssue }, 201));

			await store.create({
				title: 'New Issue',
				issue_type: 'bug',
				priority: 2
			});

			expect(mockFetch).toHaveBeenCalledWith('/api/issues', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'New Issue',
					issue_type: 'bug',
					priority: 2
				})
			});
		});

		it('create() adds issue to store on success', async () => {
			const newIssue = createMockIssue({ id: 'TEST-NEW', title: 'New Issue' });
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ issue: newIssue }, 201));

			const result = await store.create({
				title: 'New Issue',
				issue_type: 'task'
			});

			expect(result).toEqual(newIssue);
			expect(store.issues).toContainEqual(newIssue);
		});

		it('create() shows success toast', async () => {
			const newIssue = createMockIssue({ id: 'TEST-NEW' });
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ issue: newIssue }, 201));

			await store.create({ title: 'Test', issue_type: 'task' });

			expect(toastStore.success).toHaveBeenCalledWith('Created issue TEST-NEW');
		});

		it('create() shows error toast on failure', async () => {
			mockFetch.mockImplementationOnce(() =>
				mockFetchResponse({ message: 'Failed to create' }, 500)
			);

			await expect(store.create({ title: 'Test', issue_type: 'task' })).rejects.toThrow();

			expect(toastStore.error).toHaveBeenCalled();
		});
	});

	describe('Updating Issues', () => {
		it('update() performs optimistic update', async () => {
			const issue = createMockIssue({ id: '1', title: 'Old Title' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() =>
				mockFetchResponse({ issue: { ...issue, title: 'New Title' } })
			);

			await store.update('1', { title: 'New Title' });

			expect(store.issues[0]?.title).toBe('New Title');
		});

		it('update() calls API with correct body', async () => {
			const issue = createMockIssue({ id: '1' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() =>
				mockFetchResponse({ issue: { ...issue, status: 'in_progress' } })
			);

			await store.update('1', { status: 'in_progress' });

			expect(mockFetch).toHaveBeenCalledWith('/api/issues/1', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'in_progress' })
			});
		});

		it('update() rolls back on failure', async () => {
			const issue = createMockIssue({ id: '1', title: 'Old Title' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ message: 'Failed' }, 500));

			await expect(store.update('1', { title: 'New Title' })).rejects.toThrow();

			expect(store.issues[0]?.title).toBe('Old Title');
		});
	});

	describe('Deleting Issues', () => {
		it('delete() removes issue from store', async () => {
			const issue = createMockIssue({ id: '1' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ success: true, id: '1' }));

			await store.delete('1');

			expect(store.issues).toHaveLength(0);
		});

		it('delete() calls API DELETE endpoint', async () => {
			const issue = createMockIssue({ id: '1' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ success: true, id: '1' }));

			await store.delete('1');

			expect(mockFetch).toHaveBeenCalledWith('/api/issues/1', {
				method: 'DELETE'
			});
		});

		it('delete() rolls back on failure', async () => {
			const issue = createMockIssue({ id: '1' });
			store.setIssues([issue]);
			mockFetch.mockImplementationOnce(() => mockFetchResponse({ message: 'Failed' }, 500));

			await expect(store.delete('1')).rejects.toThrow();

			expect(store.issues).toHaveLength(1);
		});
	});

	describe('Metadata Methods', () => {
		it('getStatuses() returns unique statuses from issues', () => {
			store.setIssues([
				createMockIssue({ id: '1', status: 'open' }),
				createMockIssue({ id: '2', status: 'closed' }),
				createMockIssue({ id: '3', status: 'open' })
			]);

			const result = store.getStatuses();

			expect(result).toEqual(['closed', 'open']);
		});

		it('getStatuses() returns defaults when no issues', () => {
			const result = store.getStatuses();

			expect(result).toEqual(['open', 'in_progress', 'blocked', 'closed']);
		});

		it('getAssignees() returns unique assignees from issues', () => {
			store.setIssues([
				createMockIssue({ id: '1', assignee: 'alice' }),
				createMockIssue({ id: '2', assignee: 'bob' }),
				createMockIssue({ id: '3', assignee: 'alice' })
			]);

			const result = store.getAssignees();

			expect(result).toEqual(['alice', 'bob']);
		});

		it('getIssueTypes() returns unique types from issues', () => {
			store.setIssues([
				createMockIssue({ id: '1', issue_type: 'task' }),
				createMockIssue({ id: '2', issue_type: 'bug' }),
				createMockIssue({ id: '3', issue_type: 'task' })
			]);

			const result = store.getIssueTypes();

			expect(result).toEqual(['bug', 'task']);
		});

		it('getIssueTypes() returns defaults when no issues', () => {
			const result = store.getIssueTypes();

			expect(result).toEqual(['task', 'bug', 'feature', 'epic']);
		});
	});

	describe('Subscription', () => {
		it('subscribe() adds listener', async () => {
			const listener = vi.fn();
			store.subscribe(listener);

			// Setting issues notifies listeners
			store.setIssues([createMockIssue()]);

			expect(listener).toHaveBeenCalled();
		});

		it('unsubscribe removes listener', () => {
			const listener = vi.fn();
			const unsubscribe = store.subscribe(listener);

			unsubscribe();

			// Make a change
			store.setIssues([createMockIssue()]);

			// Listener should not be called after unsubscribe
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('Real-time Watching', () => {
		it('isWatching starts as false', () => {
			expect(store.isWatching).toBe(false);
		});

		it('startWatching sets isWatching to true', () => {
			store.startWatching({ pollingInterval: 10000 });
			expect(store.isWatching).toBe(true);
			store.stopWatching();
		});

		it('stopWatching sets isWatching to false', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.stopWatching();
			expect(store.isWatching).toBe(false);
		});

		it('startWatching is idempotent', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.startWatching({ pollingInterval: 10000 }); // Should not throw
			expect(store.isWatching).toBe(true);
			store.stopWatching();
		});

		it('reset() stops watching', () => {
			store.startWatching({ pollingInterval: 10000 });
			store.reset();
			expect(store.isWatching).toBe(false);
		});
	});
});
