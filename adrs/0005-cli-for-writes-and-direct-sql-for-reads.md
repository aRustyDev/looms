---
number: 5
title: CLI for Writes and Direct SQL for Reads
status: proposed
date: 2026-02-22
tags:
  - data
  - architecture
deciders:
  - aRustyDev
---

# CLI for Writes and Direct SQL for Reads

## Context and Problem Statement

The application needs to read and write data from Beads databases (SQLite or Dolt). We must balance performance (direct database access is faster) with data integrity (bd CLI ensures proper sync, hooks, and JSONL export).

## Decision Drivers

* **Data integrity**: Writes must trigger JSONL sync and Dolt commits
* **Performance**: Complex analytics queries need direct SQL access
* **Compatibility**: Support both SQLite and Dolt backends
* **Consistency**: Prevent drift between database and JSONL
* **Simplicity**: Minimize complexity in data access layer

## Considered Options

* **CLI-only** - All operations via bd CLI
* **Direct-only** - All operations via SQL (bypassing CLI)
* **Hybrid** - CLI for writes, direct SQL for reads
* **CLI with caching** - CLI operations with application-level caching

## Decision Outcome

Chosen option: **Hybrid (CLI for writes, direct SQL for reads)**, because it provides the best balance of data integrity and query performance.

### Consequences

* Good, because writes always maintain JSONL sync and trigger hooks
* Good, because complex analytics queries are fast (no CLI overhead)
* Good, because `bd sql` command works for both SQLite and Dolt
* Good, because read operations don't modify any state
* Neutral, because requires two code paths (CLI wrapper + SQL layer)
* Bad, because read data could be stale during concurrent writes
* Bad, because need to handle two database drivers (SQLite + MySQL)

### Confirmation

* All mutations flow through ProcessSupervisor → bd CLI
* Direct SQL queries are read-only (SELECT only)
* Staleness window is <1s (file watching triggers refresh)

## Pros and Cons of the Options

### CLI-only

All operations through `bd` CLI commands.

* Good, because guaranteed data integrity
* Good, because single code path
* Good, because works identically for SQLite and Dolt
* Bad, because slow for complex queries (~50-200ms per command)
* Bad, because no aggregate functions (must fetch all, compute in JS)
* Bad, because bd CLI lacks metrics commands (lead time, CFD, etc.)

### Direct-only

All operations directly against the database.

* Good, because fastest possible performance
* Good, because full SQL power for analytics
* Bad, because bypasses JSONL sync (data drift)
* Bad, because bypasses Dolt auto-commit
* Bad, because bypasses git hooks
* Bad, because different drivers for SQLite vs Dolt

### Hybrid (CLI writes, SQL reads) ← Chosen

Write via CLI, read via direct SQL.

* Good, because writes maintain all integrity guarantees
* Good, because reads are fast and support complex queries
* Good, because `bd sql` provides unified interface for both backends
* Good, because read-only access is inherently safe
* Neutral, because need ProcessSupervisor for CLI execution
* Bad, because potential staleness during writes
* Bad, because two mental models for data access

### CLI with caching

CLI operations with application-level result caching.

* Good, because data integrity preserved
* Good, because reduces CLI calls for repeated reads
* Bad, because cache invalidation complexity
* Bad, because memory overhead for large datasets
* Bad, because still can't do complex SQL aggregations

## More Information

### Data Access Layer Architecture

```typescript
// dataAccess.ts
interface DataAccessLayer {
  // Read operations - direct SQL
  queryIssues(sql: string): Promise<Issue[]>;
  getMetrics(): Promise<MetricsData>;

  // Write operations - via CLI
  createIssue(title: string, opts: CreateOptions): Promise<string>;
  updateIssue(id: string, updates: IssueUpdates): Promise<void>;
  closeIssue(id: string, reason?: string): Promise<void>;
}
```

### SQL Query Strategy

```typescript
// For SQLite backend
import Database from 'bun:sqlite';
const db = new Database('.beads/beads.db', { readonly: true });

// For Dolt backend (or unified approach)
const result = await supervisor.execute('bd', [
  'sql', '--json',
  'SELECT * FROM issues WHERE status = "open"'
]);
```

### Write Flow

```
UI Action
    ↓
ProcessSupervisor.execute('bd', ['update', id, '--status', 'closed'])
    ↓
bd CLI executes
    ↓
Database updated + JSONL exported + Dolt committed
    ↓
File watcher detects change
    ↓
UI refreshes via WebSocket
```

### Staleness Mitigation

1. File watcher triggers immediate refresh on `.beads/` changes
2. Optimistic UI updates before CLI completes
3. WebSocket broadcasts completion to all clients
4. Maximum staleness window: ~500ms

### References

* [Beads Schema](../references/beads-schema.md)
* [Constraints: Data Access](../docs/constraints/index.md)
* Related: [ADR-0002 Use Bun](./0002-use-bun-as-primary-runtime.md) (SQLite driver)
