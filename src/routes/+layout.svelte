<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import GlobalNav from '$lib/components/navigation/GlobalNav.svelte';
	import ToastContainer from '$lib/components/common/ToastContainer.svelte';
	import CreateIssueModal from '$lib/components/issues/CreateIssueModal.svelte';
	import { appStore } from '$lib/stores/app.svelte.js';

	type Tab = 'Issues' | 'Epics' | 'Board' | 'Dashboard' | 'Graph';
	type Theme = 'light' | 'dark' | 'system';
	type Density = 'compact' | 'standard' | 'comfortable';

	let { children }: { children: Snippet } = $props();

	// Reactive state
	let activeTab = $state<Tab>('Issues');
	let theme = $state<Theme>('system');
	let density = $state<Density>('standard');

	// Modal state from app store
	const createModalOpen = $derived(appStore.createModalOpen);

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
	});

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
		activeTab = tab;
		// Navigate to corresponding route (static routes don't need resolve)
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
		// Open create modal with epic type pre-selected
		// For now, just open the create modal
		appStore.openCreateModal();
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
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:shadow-lg focus:ring-blue-500 focus:outline-none dark:focus:bg-gray-800"
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
/>

<main id="main-content" class="min-h-[calc(100vh-3.5rem)]">
	{@render children?.()}
</main>

<CreateIssueModal
	open={createModalOpen}
	onsubmit={handleCreateSubmit}
	onclose={handleCreateClose}
/>

<ToastContainer />
