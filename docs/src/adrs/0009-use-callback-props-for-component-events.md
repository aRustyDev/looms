---
number: 9
title: Use Callback Props for Component Events
status: accepted
date: 2026-02-24
tags:
  - testing
  - components
  - svelte
  - patterns
deciders:
  - aRustyDev
---

# Use Callback Props for Component Events

## Context and Problem Statement

Svelte components need to communicate events to parent components. Svelte 5 introduces the runes API ($props) which changes how components receive and expose data. We need a consistent pattern for component events that works well with both the new Svelte 5 patterns and our testing strategy.

## Decision Drivers

* **Testability**: Events must be easy to test with @testing-library/svelte
* **Svelte 5 idioms**: Should align with Svelte 5 runes patterns
* **Type safety**: Full TypeScript support for event payloads
* **Simplicity**: Easy to understand and implement
* **Consistency**: Same pattern across all components

## Considered Options

* **Callback props** - Pass functions via $props
* **createEventDispatcher** - Svelte 4 event pattern
* **Custom events + dispatch** - DOM custom events
* **Svelte 5 event syntax** - on:event={() => {}} in templates

## Decision Outcome

Chosen option: **Callback props**, because it provides the best testability, type safety, and alignment with Svelte 5's functional approach.

### Consequences

* Good, because callbacks are trivially testable with vi.fn()
* Good, because TypeScript can fully type callback signatures
* Good, because consistent with React/functional patterns familiar to most developers
* Good, because no special test utilities needed for event handling
* Good, because props destructuring in $props() makes callbacks explicit
* Neutral, because requires optional chaining (?.) when calling callbacks
* Bad, because differs from some Svelte 4 tutorials and documentation

### Confirmation

* Component tests use `render(Component, { props: { onclick: vi.fn() } })`
* All event handlers verified with `expect(callback).toHaveBeenCalledWith(...)`

## Pros and Cons of the Options

### Callback Props

Functions passed as props that components call directly.

```typescript
interface Props {
  onselect?: (id: string) => void;
  onsort?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
}

let { onselect, onsort }: Props = $props();

function handleClick(id: string) {
  onselect?.(id);
}
```

* Good, because direct function calls are trivially testable
* Good, because TypeScript fully types the callback signature
* Good, because no special syntax or utilities needed
* Good, because aligns with Svelte 5's functional $props() pattern
* Good, because optional chaining makes missing handlers safe
* Neutral, because naming convention (onselect vs onSelect) varies by project
* Bad, because doesn't use Svelte's built-in event system

### createEventDispatcher

Svelte's built-in event dispatching mechanism.

```typescript
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher<{
  select: string;
  sort: { field: string; direction: 'asc' | 'desc' };
}>();

function handleClick(id: string) {
  dispatch('select', id);
}
```

* Good, because built into Svelte
* Good, because familiar from Svelte 4
* Good, because events bubble through DOM
* Bad, because harder to test - requires component instance access
* Bad, because events wrapped in CustomEvent with detail property
* Bad, because @testing-library/svelte event handling is complex
* Bad, because less aligned with Svelte 5 runes patterns

### Custom Events + dispatch

Direct DOM event dispatching.

```typescript
function handleClick(event: Event) {
  const target = event.currentTarget as HTMLElement;
  target.dispatchEvent(new CustomEvent('select', { detail: id }));
}
```

* Good, because native DOM events
* Good, because events bubble naturally
* Bad, because verbose implementation
* Bad, because requires DOM node reference
* Bad, because harder to type
* Bad, because testing requires waitFor and DOM queries

### Svelte 5 Event Syntax

Using on:event in templates with inline handlers.

```svelte
<button on:click={() => parent.handleSelect(id)}>
```

* Good, because declarative
* Neutral, because works for simple cases
* Bad, because requires parent reference
* Bad, because doesn't solve component-to-parent communication
* Bad, because not applicable for component APIs

## More Information

### Naming Convention

We use lowercase event handler names (onselect, onsort) to:
1. Match DOM event naming (onclick, onchange)
2. Avoid confusion with JavaScript naming conventions
3. Stay consistent within the codebase

### Testing Pattern

```typescript
it('emits select event when row is clicked', async () => {
  const onSelect = vi.fn();
  render(IssueTable, { props: { issues: mockIssues, onselect: onSelect } });

  const row = screen.getByText('test-1').closest('tr');
  await fireEvent.click(row!);

  expect(onSelect).toHaveBeenCalledWith('test-1');
});
```

### Migration from createEventDispatcher

When updating existing components:

```typescript
// Before (Svelte 4 / createEventDispatcher)
const dispatch = createEventDispatcher<{ select: string }>();
dispatch('select', id);

// After (Callback props)
let { onselect }: Props = $props();
onselect?.(id);
```

### References

* [Svelte 5 $props](https://svelte.dev/docs/svelte/$props)
* [Testing Library - Testing Events](https://testing-library.com/docs/svelte-testing-library/api#events)
