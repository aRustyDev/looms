---
number: 7
title: Borrow Components from gastown_ui with Custom Extensions
status: proposed
date: 2026-02-22
tags:
  - ui
  - components
deciders:
  - aRustyDev
---

# Borrow Components from gastown_ui with Custom Extensions

## Context and Problem Statement

Building a comprehensive WebUI requires many UI components (buttons, inputs, modals, tables, etc.). We can build from scratch, use a third-party library, or adapt existing components from the Gas-Town ecosystem.

## Decision Drivers

* **Time to market**: Reduce development time for MVP
* **Consistency**: Unified design language across the application
* **Svelte compatibility**: Must work with SvelteKit
* **Customization**: Ability to extend for our specific needs
* **Maintenance**: Manageable ongoing maintenance burden

## Considered Options

* **gastown_ui components** - Borrow 70+ existing Svelte components
* **shadcn/ui for Svelte** - Community port of shadcn components
* **Skeleton UI** - Svelte-native component library
* **Build from scratch** - Custom components using Tailwind

## Decision Outcome

Chosen option: **Borrow from gastown_ui with custom extensions**, because it provides production-tested components specifically designed for the Beads/Gas-Town ecosystem.

### Consequences

* Good, because 70+ components already built and tested
* Good, because designed for same use case (agent orchestration)
* Good, because MIT licensed, freely available
* Good, because Svelte 5 with tailwind-variants (modern patterns)
* Good, because design system includes semantic tokens for status/health
* Neutral, because may need to adapt to our specific needs
* Bad, because dependency on external repository's patterns
* Bad, because may include components we don't need

### Confirmation

* Successfully import core components (Button, Badge, Input, etc.)
* Design tokens integrate with our Tailwind config
* Custom components follow same patterns
* No licensing issues

## Pros and Cons of the Options

### gastown_ui Components ← Chosen

Borrow components from the Avyukth/gastown_ui repository.

* Good, because 70+ production-ready components
* Good, because same tech stack (SvelteKit, Tailwind, Svelte 5)
* Good, because designed for Gas-Town/Beads use cases
* Good, because includes status indicators, health badges, agent states
* Good, because accessibility built-in (WCAG 2.5.5 AAA)
* Good, because tailwind-variants for consistent styling
* Neutral, because need to extract and adapt components
* Bad, because tight coupling if we import directly

**Available Components:**

| Category | Components |
|----------|------------|
| Core UI | Button, Badge, Input, Switch, Select, Dialog |
| Layout | DashboardLayout, PageHeader, SplitView, Sidebar |
| Status | StatusIndicator, HealthBadge, AgentStateIcon |
| Loading | Spinner, Skeleton, ProgressBar |
| Accessibility | FocusTrap, LiveRegion, SkipLink |

### shadcn/ui for Svelte

Community port of the popular shadcn/ui components.

* Good, because popular patterns with good documentation
* Good, because copy-paste model (no dependency)
* Good, because accessible by default
* Neutral, because React-first (Svelte port is community)
* Bad, because not designed for our specific use case
* Bad, because no agent/status-specific components

### Skeleton UI

Svelte-native component library.

* Good, because comprehensive component set
* Good, because Svelte-native
* Good, because good documentation
* Bad, because opinionated styling (harder to customize)
* Bad, because no agent/orchestration-specific components
* Bad, because adds dependency overhead

### Build from Scratch

Custom components using Tailwind CSS.

* Good, because complete control over design
* Good, because no external dependencies
* Good, because exactly what we need
* Bad, because significant development time
* Bad, because need to handle accessibility ourselves
* Bad, because reinventing solved problems

## More Information

### Component Adoption Strategy

**Phase 1: Core Components (MVP)**
- Button, Badge, Input, Switch, Select
- Dialog, Modal
- Spinner, Skeleton
- StatusIndicator

**Phase 2: Layout Components**
- DashboardLayout
- Sidebar, SplitView
- PageHeader
- Navigation

**Phase 3: Specialized Components**
- HealthBadge (for RAG status)
- AgentStateIcon (for Gas-Town)
- ProgressBar (for epics)
- Custom: Gantt, Terminal, Charts

### Design Token Integration

From gastown_ui:
```css
/* Semantic colors */
--success: /* green variants */
--warning: /* yellow variants */
--info: /* blue variants */
--destructive: /* red variants */

/* Agent states */
--status-online: /* agent online */
--status-offline: /* agent offline */
--status-pending: /* awaiting */
--status-idle: /* inactive */
```

### tailwind-variants Pattern

```typescript
import { tv } from 'tailwind-variants';

const button = tv({
  base: 'font-medium rounded-lg',
  variants: {
    color: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
      destructive: 'bg-red-500 text-white',
    },
    size: {
      sm: 'text-sm px-3 py-1',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-5 py-3',
    },
  },
  defaultVariants: {
    color: 'primary',
    size: 'md',
  },
});
```

### References

* [gastown_ui Components](../references/gastown-webuis.md)
* [Borrowable Components](../references/borrowable-components.md)
* [tailwind-variants](https://www.tailwind-variants.org/)
* Related: [ADR-0003 SvelteKit](./0003-use-sveltekit-as-frontend-framework.md)
