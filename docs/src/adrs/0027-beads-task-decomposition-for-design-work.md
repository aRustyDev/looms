---
number: 27
title: Beads Task Decomposition for Design Work
status: accepted
date: 2026-02-26
tags:
  - beads
  - process
  - design
---

# Beads Task Decomposition for Design Work

## Context and Problem Statement

Design tasks like "Create Phase 1 components" are too coarse-grained. When a task covers 13 components, there's no visibility into progress, no checkpoint for quality, and failures affect the entire batch. We need rules for decomposing design work into atomic, verifiable tasks.

## Decision Drivers

* Coarse tasks ("Complete Phase 1") hide problems until too late
* No acceptance criteria means no definition of "done"
* Missing blocking dependencies allows skipping verification
* Large batches make it hard to identify which component caused issues

## Considered Options

* **Phase-level tasks**: One task per phase (6-13 components each)
* **Component-level tasks**: One task per component
* **Component + Verification tasks**: Separate create and verify tasks with hard blocking

## Decision Outcome

Chosen option: "Component + Verification tasks", because it enforces visual verification through hard blocking dependencies and provides maximum granularity for tracking and debugging.

### Task Structure Rules

1. **Maximum scope**: 1 component per creation task
2. **Mandatory verification**: Every create task has a paired verify task
3. **Hard blocking**: Verify task blocks next create task (`bd dep add`)
4. **Layout first**: Layout planning task blocks all component tasks
5. **Phase checkpoints**: Checkpoint task at end of each phase blocks next phase
6. **Acceptance criteria**: Every task description includes size, position, and visual specs

### Task Naming Convention

```
[Phase N.0]  Plan layout for {Section} on 8px grid
[Phase N.1]  Create {Component/Name} component
[Phase N.1v] Verify {Component/Name} component
[Phase N.2]  Create {Component/Name} component
[Phase N.2v] Verify {Component/Name} component
...
[Phase N.99] CHECKPOINT: Phase N Visual Audit
```

### Dependency Chain

```
Layout Plan
    ↓
Create Component 1 → Verify Component 1
                          ↓
                     Create Component 2 → Verify Component 2
                                              ↓
                                         ... (continues)
                                              ↓
                                         Phase Checkpoint
                                              ↓
                                         Next Phase Layout Plan
```

### Consequences

* Good, because errors caught at smallest scope
* Good, because clear progress visibility (X of Y tasks complete)
* Good, because hard blocking prevents skipping verification
* Good, because easy to identify which component has issues
* Bad, because high task count (2N+2 tasks per N components)
* Bad, because more overhead in task management
* Neutral, because requires `bd dep add` commands to set up chain

### Confirmation

* Run `bd dep tree projx-jhi.2` to verify blocking chain is intact
* Every `.Xv` task must follow a `.X` task
* No component task should be unblocked unless previous verify is closed

## Example: Phase 1 Decomposition

Original task:
```
projx-jhi.2: [Phase 1] Foundations & Feedback Components (13 components)
```

Decomposed into 28 tasks:
```
projx-jhi.2.1:  [Phase 1.0] Plan layout for Feedback section
projx-jhi.2.2:  [Phase 1.1] Create Toast/Info
projx-jhi.2.3:  [Phase 1.1v] Verify Toast/Info
projx-jhi.2.4:  [Phase 1.2] Create Toast/Success
projx-jhi.2.5:  [Phase 1.2v] Verify Toast/Success
... (20 more create/verify pairs)
projx-jhi.2.28: [Phase 1.99] CHECKPOINT: Phase 1 Visual Audit
```

## More Information

This decision was made after the Component Library Expansion failure where coarse-grained tasks allowed 55 components to be created without any visual verification.

Related:
* ADR-0026: Design Task Workflow with Visual Verification
* ADR-0025: Component Naming Conventions
* Epic: projx-jhi (Component Library Expansion)
