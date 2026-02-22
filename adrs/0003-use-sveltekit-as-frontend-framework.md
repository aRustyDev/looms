---
number: 3
title: Use SvelteKit as Frontend Framework
status: proposed
date: 2026-02-22
tags:
  - frontend
  - framework
deciders:
  - aRustyDev
---

# Use SvelteKit as Frontend Framework

## Context and Problem Statement

The Unified Beads WebUI needs a frontend framework that supports server-side rendering, API routes, and efficient client-side reactivity. The choice must balance developer experience, performance, and compatibility with our chosen runtime (Bun).

## Decision Drivers

* **Bun compatibility**: First-class support with our chosen runtime
* **Performance**: Fast initial load and runtime reactivity
* **API routes**: Built-in server-side API handling
* **Component reuse**: Ability to borrow from existing gastown_ui (70+ Svelte components)
* **Learning curve**: Reasonable for team adoption
* **Bundle size**: Minimal JavaScript shipped to client

## Considered Options

* **SvelteKit 2.x** - Full-stack Svelte framework
* **Next.js 15+** - React-based full-stack framework
* **Nuxt 3** - Vue-based full-stack framework
* **Astro** - Content-focused with framework flexibility

## Decision Outcome

Chosen option: **SvelteKit 2.x**, because it provides the best combination of performance, Bun compatibility, and component reuse potential from gastown_ui.

### Consequences

* Good, because 70+ production-ready components available from gastown_ui
* Good, because Svelte 5 runes provide excellent reactivity with minimal boilerplate
* Good, because Bun adapter is first-class and well-maintained
* Good, because smallest bundle sizes of any major framework
* Good, because server-side rendering and API routes built-in
* Neutral, because smaller ecosystem than React/Next.js
* Bad, because team may need to learn Svelte if coming from React
* Bad, because fewer third-party component libraries available

### Confirmation

* Scaffold SvelteKit project with Bun adapter
* Verify gastown_ui components can be imported/adapted
* Performance budget: <100KB initial JS bundle

## Pros and Cons of the Options

### SvelteKit 2.x

SvelteKit is the official full-stack framework for Svelte applications.

* Good, because Svelte compiles to vanilla JS (no virtual DOM overhead)
* Good, because gastown_ui provides 70+ production Svelte components
* Good, because native Bun adapter with excellent performance
* Good, because smallest bundle sizes (~30% smaller than Next.js)
* Good, because Svelte 5 runes simplify state management
* Good, because built-in form actions and progressive enhancement
* Neutral, because Svelte 5 is relatively new (Oct 2024)
* Bad, because smaller community than React ecosystem
* Bad, because fewer pre-built component libraries

### Next.js 15+

Next.js is the most popular React-based full-stack framework.

* Good, because largest ecosystem and community
* Good, because extensive documentation and tutorials
* Good, because used by 4/7 existing Beads WebUIs (familiar patterns)
* Good, because Bun support available
* Good, because many component libraries (shadcn/ui, Radix, etc.)
* Neutral, because React 19 introduces complexity (server components)
* Bad, because larger bundle sizes than Svelte
* Bad, because React virtual DOM overhead
* Bad, because cannot directly use gastown_ui components

### Nuxt 3

Nuxt is Vue's full-stack framework.

* Good, because Vue is approachable for beginners
* Good, because good TypeScript support
* Good, because built-in state management (Pinia)
* Neutral, because Bun support exists but less mature
* Bad, because no existing component library to borrow
* Bad, because smaller ecosystem than React
* Bad, because Vue 3 composition API learning curve

### Astro

Astro is a content-focused framework with framework flexibility.

* Good, because can use components from any framework
* Good, because zero JS by default (islands architecture)
* Good, because excellent for content-heavy sites
* Bad, because less suited for highly interactive applications
* Bad, because more complex mental model (islands)
* Bad, because no existing component library to borrow

## More Information

### gastown_ui Component Categories

From our research, gastown_ui provides:

| Category | Components | Reusable? |
|----------|------------|-----------|
| Core UI | Button, Badge, Input, Switch, Select, Dialog | Yes |
| Layout | DashboardLayout, PageHeader, SplitView, Sidebar | Yes |
| Status | StatusIndicator, HealthBadge, AgentStateIcon | Yes |
| Loading | Spinner, Skeleton, ProgressBar | Yes |
| Accessibility | FocusTrap, LiveRegion, SkipLink | Yes |

### Migration Path

If SvelteKit proves problematic:
1. Components can be rewritten in React (patterns transfer)
2. API routes use standard Request/Response (framework-agnostic)
3. State management patterns are similar across frameworks

### References

* [SvelteKit Documentation](https://kit.svelte.dev/)
* [gastown_ui Component Library](../references/gastown-webuis.md)
* [Tech Stack Analysis](../references/tech-stack-analysis.md)
* Related: [ADR-0002 Use Bun as Primary Runtime](./0002-use-bun-as-primary-runtime.md)
