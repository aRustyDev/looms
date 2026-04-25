<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import GlobalNav from '$lib/components/navigation/GlobalNav.svelte';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import CreateIssueModal from '$lib/components/issues/CreateIssueModal.svelte';
	import IssueDetailModal from '$lib/components/issues/IssueDetailModal.svelte';
	import DependenciesModal from '$lib/components/issues/DependenciesModal.svelte';
	import KeyboardHelp from '$lib/components/common/KeyboardHelp.svelte';
	import DatabaseConfigModal from '$lib/components/settings/DatabaseConfigModal.svelte';
	import { appStore } from '$lib/stores/app.svelte.js';
	import {
		getShortcutManager,
		DEFAULT_SHORTCUTS,
		type ShortcutHandler
	} from '$lib/shortcuts/ShortcutManager.js';

	type Tab = 'Issues' | 'Epics' | 'Board' | 'Dashboard' | 'Graph';
	type Theme = 'light' | 'dark' | 'system';
	type Density = 'compact' | 'standard' | 'comfortable';

	let { children }: { children: Snippet } = $props();

	// Derive active tab from current URL
	const ROUTE_TO_TAB: Record<string, Tab> = {
		'/': 'Issues',
		'/epics': 'Epics',
		'/kanban': 'Board',
		'/dashboard': 'Dashboard',
		'/graph': 'Graph'
	};
	const activeTab = $derived(ROUTE_TO_TAB[$page.url.pathname] ?? 'Issues');
	let theme = $state<Theme>('system');
	let density = $state<Density>('standard');

	// Modal state from app store
	const createModalOpen = $derived(appStore.createModalOpen);
	const detailModalOpen = $derived(appStore.issueDetailModalOpen);
	const depsModalOpen = $derived(appStore.depsModalOpen);
	const keyboardHelpOpen = $derived(appStore.keyboardHelpOpen);
	const selectedIssue = $derived(appStore.selectedIssueForDetail);
	const selectedIssueForDeps = $derived(appStore.selectedIssueForDeps);

	// Transform database Issue to modal Issue format
	const modalIssue = $derived(
		selectedIssue
			? {
					id: selectedIssue.id,
					title: selectedIssue.title,
					description: selectedIssue.description,
					status: selectedIssue.status,
					priority: `P${selectedIssue.priority}`,
					type: selectedIssue.issue_type,
					assignee: selectedIssue.assignee,
					created: selectedIssue.created_at,
					updated: selectedIssue.updated_at
				}
			: null
	);

	// Settings modal
	let settingsOpen = $state(false);

	// Dependencies data for the deps modal
	let depsBlockedBy = $state<{ id: string; title: string; status: string }[]>([]);
	let depsBlocking = $state<{ id: string; title: string; status: string }[]>([]);

	// Keyboard shortcuts
	let shortcutHandlers = $state<ShortcutHandler[]>([]);

	// Initialize from localStorage and system preferences
	$effect(() => {
		if (!browser) return;

		// Initialize app store
		appStore.init();

		// Load theme
		const storedTheme = localStorage.getItem('theme') as Theme | null;
		if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
			theme = storedTheme;
		}

		// Load density
		const storedDensity = localStorage.getItem('density') as Density | null;
		if (storedDensity && ['compact', 'standard', 'comfortable'].includes(storedDensity)) {
			density = storedDensity;
		}

		// Set density data attribute
		document.documentElement.dataset.density = density;

		// Apply theme
		applyTheme(theme);

		// Set up keyboard shortcuts
		const sm = getShortcutManager();
		sm.clear();

		sm.register({ key: 'c', description: 'Create new issue', category: 'Actions' }, () =>
			appStore.openCreateModal()
		);
		sm.register({ key: 'n', description: 'Create new issue', category: 'Actions' }, () =>
			appStore.openCreateModal()
		);
		sm.register({ key: '/', description: 'Focus search', category: 'Navigation' }, () => {
			const searchInput = document.querySelector<HTMLInputElement>(
				'[data-shortcut-target="search"]'
			);
			searchInput?.focus();
		});
		sm.register({ key: '?', description: 'Show keyboard shortcuts', category: 'Help' }, () =>
			appStore.openKeyboardHelp()
		);

		// Register remaining default shortcuts (j/k/Enter/e handled by individual pages)
		for (const config of DEFAULT_SHORTCUTS) {
			if (!sm.has(config)) {
				sm.register(config, () => {
					/* page-level handlers override */
				});
			}
		}

		shortcutHandlers = sm.getAll();
		sm.start();

		// Start real-time watching (WebSocket with polling fallback)
		appStore.startWatching({
			websocketUrl: `ws://localhost:5199`,
			pollingInterval: 10000
		});

		return () => {
			sm.stop();
			appStore.stopWatching();
		};
	});

	// Load deps data when deps modal opens
	$effect(() => {
		if (depsModalOpen && selectedIssueForDeps && browser) {
			loadDependencies(selectedIssueForDeps.id);
		}
	});

	async function loadDependencies(issueId: string) {
		try {
			const response = await fetch(`/api/issues/${encodeURIComponent(issueId)}/dependencies`);
			if (!response.ok) return;
			const data = await response.json();
			const deps = data.dependencies ?? [];

			// Separate into blocked-by and blocking
			const blockedBy: { id: string; title: string; status: string }[] = [];
			const blocking: { id: string; title: string; status: string }[] = [];

			for (const dep of deps) {
				if (dep.issue_id === issueId) {
					// This issue depends on dep.depends_on_id
					const targetIssue = appStore.issues.find((i) => i.id === dep.depends_on_id);
					if (targetIssue) {
						blockedBy.push({
							id: targetIssue.id,
							title: targetIssue.title,
							status: targetIssue.status
						});
					}
				} else if (dep.depends_on_id === issueId) {
					// dep.issue_id depends on this issue (this issue blocks it)
					const targetIssue = appStore.issues.find((i) => i.id === dep.issue_id);
					if (targetIssue) {
						blocking.push({
							id: targetIssue.id,
							title: targetIssue.title,
							status: targetIssue.status
						});
					}
				}
			}

			depsBlockedBy = blockedBy;
			depsBlocking = blocking;
		} catch {
			depsBlockedBy = [];
			depsBlocking = [];
		}
	}

	function applyTheme(t: Theme) {
		if (!browser) return;

		const isDark =
			t === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : t === 'dark';

		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function handleThemeChange(newTheme: Theme) {
		theme = newTheme;
		if (browser) {
			localStorage.setItem('theme', newTheme);
			applyTheme(newTheme);
		}
	}

	function handleNavigate(tab: Tab) {
		const routes: Record<Tab, string> = {
			Issues: '/',
			Epics: '/epics',
			Board: '/kanban',
			Dashboard: '/dashboard',
			Graph: '/graph'
		};
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(routes[tab]);
	}

	function handleCreateIssue() {
		appStore.openCreateModal();
	}

	function handleCreateEpic() {
		appStore.openCreateModal();
	}

	function handleSettings() {
		settingsOpen = true;
	}

	async function handleCreateSubmit(data: {
		title: string;
		issue_type: string;
		priority: number;
		description: string;
		assignee: string;
	}) {
		await appStore.create({
			title: data.title,
			issue_type: data.issue_type,
			priority: data.priority,
			description: data.description || undefined,
			assignee: data.assignee || undefined
		});
		appStore.closeCreateModal();
	}

	function handleCreateClose() {
		appStore.closeCreateModal();
	}

	function handleDetailClose() {
		appStore.closeDetailModal();
	}

	function handleDepsClose() {
		appStore.closeDepsModal();
	}

	async function handleDepsRemove(targetId: string, type: 'blockedBy' | 'blocking') {
		if (!selectedIssueForDeps) return;
		const issueId = selectedIssueForDeps.id;

		if (type === 'blockedBy') {
			await appStore.removeDependency(issueId, targetId);
		} else {
			await appStore.removeDependency(targetId, issueId);
		}
		// Reload deps
		await loadDependencies(issueId);
	}

	function handleDepsNavigate(issueId: string) {
		appStore.closeDepsModal();
		const issue = appStore.issues.find((i) => i.id === issueId);
		if (issue) {
			appStore.openDetailModal(issue);
		}
	}
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:focus:bg-gray-800"
>
	Skip to main content
</a>

<GlobalNav
	{activeTab}
	{theme}
	onnavigate={handleNavigate}
	oncreateissue={handleCreateIssue}
	oncreateepic={handleCreateEpic}
	onthemechange={handleThemeChange}
	onsettings={handleSettings}
	ondbswitch={() => appStore.load()}
/>

<main id="main-content" class="h-[calc(100vh-3.5rem)] overflow-hidden">
	{@render children?.()}
</main>

<CreateIssueModal
	open={createModalOpen}
	onsubmit={handleCreateSubmit}
	onclose={handleCreateClose}
/>

{#if modalIssue}
	<IssueDetailModal open={detailModalOpen} issue={modalIssue} onclose={handleDetailClose} />
{/if}

{#if selectedIssueForDeps}
	<DependenciesModal
		open={depsModalOpen}
		issue={{ id: selectedIssueForDeps.id, title: selectedIssueForDeps.title }}
		blockedBy={depsBlockedBy}
		blocking={depsBlocking}
		onclose={handleDepsClose}
		onremove={handleDepsRemove}
		onnavigate={handleDepsNavigate}
	/>
{/if}

<KeyboardHelp
	open={keyboardHelpOpen}
	shortcuts={shortcutHandlers}
	onclose={() => appStore.closeKeyboardHelp()}
/>

<DatabaseConfigModal open={settingsOpen} onclose={() => (settingsOpen = false)} />

<ToastContainer />
