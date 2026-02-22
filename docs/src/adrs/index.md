# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Unified Beads WebUI project.

## ADR Index

| ID | Title | Status | Tags |
|----|-------|--------|------|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | - |
| [0002](./0002-use-bun-as-primary-runtime.md) | Use Bun as Primary Runtime | Proposed | runtime, infrastructure |
| [0003](./0003-use-sveltekit-as-frontend-framework.md) | Use SvelteKit as Frontend Framework | Proposed | frontend, framework |
| [0004](./0004-use-svelte-stores-for-state-management.md) | Use Svelte Stores for State Management | Proposed | state, architecture |
| [0005](./0005-cli-for-writes-and-direct-sql-for-reads.md) | CLI for Writes and Direct SQL for Reads | Proposed | data, architecture |
| [0006](./0006-use-file-watching-with-websocket-broadcast.md) | Use File Watching with WebSocket Broadcast | Proposed | realtime, architecture |
| [0007](./0007-borrow-components-from-gastown-ui-with-custom-extensions.md) | Borrow Components from gastown_ui | Proposed | ui, components |

## Summary

### Decisions Made

1. **Runtime**: Bun (with Node.js fallback)
2. **Frontend**: SvelteKit 2.x with Svelte 5
3. **State**: Svelte stores with runes
4. **Data Access**: CLI for writes, direct SQL for reads
5. **Real-time**: File watching + WebSocket broadcast
6. **Components**: Borrow from gastown_ui, extend as needed

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Beads WebUI                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend: SvelteKit 2.x                                    │
│  Components: gastown_ui + custom                            │
│  State: Svelte stores                                       │
├─────────────────────────────────────────────────────────────┤
│  Server: SvelteKit (Bun runtime)                            │
│  Real-time: Chokidar + WebSocket                            │
│  CLI: ProcessSupervisor                                     │
├─────────────────────────────────────────────────────────────┤
│  Data: SQLite/Dolt (reads) + bd CLI (writes)                │
└─────────────────────────────────────────────────────────────┘
```

## ADR Format

All ADRs use MADR 4.0.0 format with YAML frontmatter (NextGen mode):

```yaml
---
number: N
title: Title of Decision
status: proposed | accepted | deprecated | superseded
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
deciders:
  - name
---
```

## Usage

```bash
# List all ADRs
adrs list

# Create new ADR
adrs --ng new --format madr "Title" -t tag1,tag2

# Change status
adrs status 2 accepted

# Link ADRs
adrs link 3 "Amends" 2
```
