---
number: 4
title: Use Svelte Stores for State Management
status: proposed
date: 2026-02-22
tags:
  - state
  - architecture
deciders:
  - aRustyDev
---

# Use Svelte Stores for State Management

## Context and Problem Statement

The application needs to manage complex state including issue lists, filter settings, real-time updates, and UI state. We need a state management approach that integrates well with SvelteKit and handles both client and server state.

## Decision Drivers

* **SvelteKit integration**: Native support without additional dependencies
* **Server state**: Handle data fetched from bd CLI and database
* **Real-time updates**: State must reflect file system changes
* **Simplicity**: Avoid over-engineering for our use case
* **Performance**: Efficient reactivity for large issue lists
* **Developer experience**: TypeScript support, debugging tools

## Considered Options

* **Svelte Stores (built-in)** - Native Svelte reactivity primitives
* **Svelte 5 Runes + Stores** - New fine-grained reactivity
* **Zustand** - Minimal state management library
* **TanStack Query** - Server state management

## Decision Outcome

Chosen option: **Svelte Stores with Svelte 5 Runes**, because they provide native integration with SvelteKit, require no additional dependencies, and handle our use cases elegantly.

### Consequences

* Good, because zero additional dependencies for state management
* Good, because Svelte 5 runes provide fine-grained reactivity
* Good, because server state handled naturally via `+page.server.ts` load functions
* Good, because stores are simple to understand and debug
* Good, because gastown_ui already uses this pattern
* Neutral, because requires understanding Svelte's reactivity model
* Bad, because no built-in devtools like Redux DevTools
* Bad, because caching/invalidation must be implemented manually

### Confirmation

* All state flows through defined stores
* Real-time updates propagate correctly to UI
* No memory leaks from store subscriptions

## Pros and Cons of the Options

### Svelte Stores with Svelte 5 Runes

Svelte's built-in reactivity system, enhanced in Svelte 5.

* Good, because native to Svelte (no dependencies)
* Good, because `$state`, `$derived`, `$effect` runes are intuitive
* Good, because automatic subscription cleanup in components
* Good, because works seamlessly with SvelteKit load functions
* Good, because gastown_ui demonstrates patterns at scale
* Neutral, because Svelte 5 runes are new syntax to learn
* Bad, because no time-travel debugging
* Bad, because manual cache invalidation

**Pattern Example:**
```typescript
// stores/issues.ts
import { writable, derived } from 'svelte/store';

export const issues = writable<Issue[]>([]);
export const filters = writable<FilterState>(defaultFilters);

export const filteredIssues = derived(
  [issues, filters],
  ([$issues, $filters]) => applyFilters($issues, $filters)
);
```

### Zustand

Minimal state management that works with any framework.

* Good, because tiny bundle size (~1KB)
* Good, because simple API similar to React hooks
* Good, because supports middleware (persist, devtools)
* Good, because framework-agnostic (transferable knowledge)
* Neutral, because requires adapter for Svelte
* Bad, because adds dependency when Svelte has built-in solution
* Bad, because foolery uses Zustand but we're using Svelte

### TanStack Query

Server state management with caching and synchronization.

* Good, because handles caching, refetching, invalidation
* Good, because excellent for server state
* Good, because stale-while-revalidate pattern built-in
* Good, because devtools available
* Neutral, because Svelte adapter available but less mature than React
* Bad, because overkill for our use case (we control the data source)
* Bad, because adds complexity for CLI-based data fetching
* Bad, because file watching already provides invalidation signals

## More Information

### Store Architecture

```
┌─────────────────────────────────────────┐
│  SvelteKit Server                       │
│  +page.server.ts load functions         │
└────────────────┬────────────────────────┘
                 │ Initial data
                 ▼
┌─────────────────────────────────────────┐
│  Client Stores                          │
├─────────────────────────────────────────┤
│  issues        - Issue data             │
│  filters       - Active filters         │
│  ui            - UI state (panels, etc) │
│  metrics       - Calculated metrics     │
│  realtime      - WebSocket connection   │
└────────────────┬────────────────────────┘
                 │ Derived stores
                 ▼
┌─────────────────────────────────────────┐
│  Derived State                          │
├─────────────────────────────────────────┤
│  filteredIssues                         │
│  kanbanColumns                          │
│  epicProgress                           │
└─────────────────────────────────────────┘
```

### Real-time Update Flow

```
File Change → Chokidar → WebSocket → Store Update → UI Reactivity
```

### References

* [Svelte Stores Documentation](https://svelte.dev/docs/svelte-store)
* [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
* [gastown_ui Store Patterns](../references/gastown-webuis.md)
* Related: [ADR-0003 Use SvelteKit](./0003-use-sveltekit-as-frontend-framework.md)
