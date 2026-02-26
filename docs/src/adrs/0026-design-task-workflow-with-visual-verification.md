---
number: 26
title: Design Task Workflow with Visual Verification
status: accepted
date: 2026-02-26
tags:
  - wireframes
  - process
  - beads
---

# Design Task Workflow with Visual Verification

## Context and Problem Statement

During the Component Library Expansion project, 55 components were created programmatically without visual verification. The result was a disorganized library with overlapping elements, inconsistent sizing, broken components (black rectangles), and poor grid alignment. We need a workflow that prevents this by enforcing visual checkpoints.

## Decision Drivers

* Components created without visual inspection resulted in unusable output
* Batch creation without verification compounds errors across many components
* No mechanism existed to catch layout/spacing issues before they accumulated
* The plan had explicit acceptance criteria that were never actually verified

## Considered Options

* **Batch-then-verify**: Create all components, then verify at the end
* **Verify-per-phase**: Create phase components, verify at phase end
* **Verify-per-component**: Verify each component immediately after creation

## Decision Outcome

Chosen option: "Verify-per-component", because it catches errors at the smallest possible scope, preventing error accumulation and making issues easy to fix while context is fresh.

### Workflow Structure

```
1. PLAN LAYOUT (task)
   └── Export: layout diagram with X,Y positions on 8px grid

2. For each component:
   a. CREATE (task)
      └── Create single component at planned position
   b. VERIFY (task)
      └── Export screenshot
      └── Confirm size, position, colors match spec
      └── Hard-blocked until verification passes

3. PHASE CHECKPOINT (task)
   └── Export full page screenshot
   └── Audit all phase components together
   └── Sign-off before next phase begins
```

### Consequences

* Good, because errors are caught immediately when context is fresh
* Good, because no error accumulation - bad component can't spawn more bad components
* Good, because hard blocking prevents "I'll fix it later" syndrome
* Bad, because more tasks to manage (2x tasks per component)
* Bad, because slower overall throughput
* Neutral, because requires discipline to actually look at exports

### Confirmation

* Every component creation task must have a corresponding verification task
* Verification tasks must include "Export screenshot" as first step
* `bd blocked` command will show any tasks that skipped verification
* Phase checkpoints require full-page export before sign-off

## Pros and Cons of the Options

### Batch-then-verify

Create all components in a phase, then verify at the end.

* Good, because faster initial throughput
* Good, because fewer task management overhead
* Bad, because errors compound - one bad position shifts everything
* Bad, because hard to debug which component caused cascade
* Bad, because context is lost by verification time

### Verify-per-phase

Create all phase components, verify together before next phase.

* Good, because moderate checkpoint frequency
* Good, because can see component relationships
* Neutral, because errors still compound within phase
* Bad, because 6-13 components created before any verification
* Bad, because still significant context loss

### Verify-per-component

Verify immediately after each component creation.

* Good, because smallest possible error scope
* Good, because context is maximally fresh
* Good, because hard blocking enforces discipline
* Bad, because 2x task count
* Bad, because context switching overhead

## More Information

This decision was made after the Component Library Expansion failure where 55 components were created without visual verification, resulting in an unusable library that required complete reset.

Related:
* ADR-0025: Component Naming Conventions
* ADR-0027: Beads Task Decomposition for Design Work
* Epic: projx-jhi (Component Library Expansion)
