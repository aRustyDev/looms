---
number: 6
title: Use File Watching with WebSocket Broadcast
status: proposed
date: 2026-02-22
tags:
  - realtime
  - architecture
deciders:
  - aRustyDev
---

# Use File Watching with WebSocket Broadcast

## Context and Problem Statement

The application needs real-time updates when the Beads database changes. Changes can come from the UI (via bd CLI), from external agents (Claude Code), or from git operations. We need to detect these changes and propagate them to all connected clients.

## Decision Drivers

* **Source agnostic**: Detect changes regardless of source (UI, agents, git)
* **Low latency**: Updates should appear within 1 second
* **Reliability**: Must not miss changes
* **Efficiency**: Avoid polling or excessive resource usage
* **Multi-client**: Broadcast to all connected browser tabs/windows

## Considered Options

* **File watching + WebSocket** - Watch files, broadcast via WS
* **Polling** - Periodically query database for changes
* **Database triggers** - Dolt/SQLite triggers notify application
* **bd daemon integration** - Hook into existing bd daemon

## Decision Outcome

Chosen option: **File watching with WebSocket broadcast**, because it reliably detects all changes regardless of source and efficiently propagates to clients.

### Consequences

* Good, because detects changes from any source (UI, agents, git pull)
* Good, because Chokidar is proven reliable for file watching
* Good, because WebSocket provides instant client updates
* Good, because matches pattern used by beads-ui and beads-dashboard
* Neutral, because requires WebSocket connection management
* Bad, because file watching has OS-specific behavior
* Bad, because very rapid changes may cause debounce delays

### Confirmation

* Changes from bd CLI appear in UI within 1s
* Changes from external agents appear in UI within 1s
* git pull with JSONL changes triggers UI refresh
* Multiple browser tabs stay synchronized

## Pros and Cons of the Options

### File Watching + WebSocket ← Chosen

Watch `.beads/` directory for changes, broadcast via WebSocket.

* Good, because source-agnostic (any change detected)
* Good, because Chokidar handles cross-platform watching
* Good, because WebSocket is native to browsers
* Good, because proven pattern (beads-ui, beads-dashboard use it)
* Good, because low latency (<100ms detection)
* Neutral, because requires debouncing for rapid changes
* Bad, because file system events can be noisy
* Bad, because macOS FSEvents has known quirks

**Implementation:**
```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch('.beads/', {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 100 }
});

watcher.on('change', (path) => {
  if (path.endsWith('.jsonl') || path.endsWith('.db')) {
    broadcastToClients({ type: 'refresh', path });
  }
});
```

### Polling

Periodically query the database for changes.

* Good, because simple to implement
* Good, because works everywhere
* Bad, because wastes resources when nothing changes
* Bad, because latency equals poll interval
* Bad, because doesn't scale well with many clients

### Database Triggers

Use SQLite/Dolt triggers to notify application.

* Good, because precise change detection
* Good, because efficient (only fires on actual changes)
* Bad, because SQLite triggers can't call external code
* Bad, because Dolt triggers are different from SQLite
* Bad, because doesn't detect JSONL file changes

### bd Daemon Integration

Hook into the existing bd daemon's event system.

* Good, because bd daemon already watches for changes
* Good, because could reuse existing infrastructure
* Bad, because daemon might not be running
* Bad, because tight coupling to bd internals
* Bad, because daemon API not stable/documented

## More Information

### Watch Targets

| Path | Purpose | Debounce |
|------|---------|----------|
| `.beads/issues.jsonl` | Issue changes | 100ms |
| `.beads/beads.db` | SQLite database | 100ms |
| `.beads/dolt/` | Dolt database | 200ms |
| `.beads/memory/` | Knowledge base | 100ms |

### WebSocket Protocol

```typescript
// Server → Client messages
type ServerMessage =
  | { type: 'connected', clientId: string }
  | { type: 'refresh', path: string, timestamp: number }
  | { type: 'issues:updated', issues: Issue[] }
  | { type: 'metrics:updated', metrics: Metrics };

// Client → Server messages
type ClientMessage =
  | { type: 'subscribe', topics: string[] }
  | { type: 'ping' };
```

### Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  bd CLI         │     │  External Agent │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
    ┌────────────────────────────────┐
    │  .beads/ Directory             │
    │  ├── issues.jsonl              │
    │  ├── beads.db                  │
    │  └── dolt/                     │
    └────────────────┬───────────────┘
                     │ Chokidar
                     ▼
    ┌────────────────────────────────┐
    │  SvelteKit Server              │
    │  └── File Watcher Service      │
    └────────────────┬───────────────┘
                     │ WebSocket
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Client 1│ │ Client 2│ │ Client 3│
    └─────────┘ └─────────┘ └─────────┘
```

### Reconnection Strategy

From gastown_ui research:
- Exponential backoff: 1s base, 30s max, 20% jitter
- Heartbeat: 30s interval, 5s timeout
- Browser online/offline event integration

### References

* [Chokidar Documentation](https://github.com/paulmillr/chokidar)
* [gastown_ui WebSocket Pattern](../references/gastown-webuis.md)
* [beads-dashboard Real-time](../references/existing-webui-comparison.md)
* Related: [ADR-0005 Data Access](./0005-cli-for-writes-and-direct-sql-for-reads.md)
