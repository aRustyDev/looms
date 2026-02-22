# Data Flow Diagrams

## Overview

This document describes how data flows through the Unified Beads WebUI system, covering read operations, write operations, real-time synchronization, and error handling.

---

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        SvelteKit Client                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   Views     │  │   Stores    │  │  WebSocket  │  │   Actions   │  │  │
│  │  │  - Kanban   │  │  - issues   │  │   Client    │  │  - create   │  │  │
│  │  │  - List     │  │  - filters  │  │             │  │  - update   │  │  │
│  │  │  - Gantt    │  │  - metrics  │  │             │  │  - close    │  │  │
│  │  │  - Metrics  │  │  - ui       │  │             │  │             │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │  │
│  │         │                │                │                │         │  │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────┘  │
│            │                │                │                │            │
└────────────┼────────────────┼────────────────┼────────────────┼────────────┘
             │ HTTP/SSR       │ Reactive       │ WS             │ HTTP POST
             │                │                │                │
┌────────────┼────────────────┼────────────────┼────────────────┼────────────┐
│            ▼                ▼                ▼                ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      SvelteKit Server (Bun)                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │   Loaders   │  │    Data     │  │  WebSocket  │  │   Process   │  │ │
│  │  │ +page.ts    │  │   Access    │  │   Server    │  │  Supervisor │  │ │
│  │  │ +server.ts  │  │   Layer     │  │             │  │             │  │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │ │
│  │         │                │                │                │         │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼─────────┘ │
│            │                │                │                │           │
│  SERVER    │                │                │                │           │
└────────────┼────────────────┼────────────────┼────────────────┼───────────┘
             │                │                │                │
             │                │                │                ▼
             │                │                │      ┌─────────────────────┐
             │                │                │      │      CLI Layer      │
             │                │                │      │  ┌───────────────┐  │
             │                │                │      │  │    bd CLI     │  │
             │                │                │      │  │    gt CLI     │  │
             │                │                │      │  │    gh CLI     │  │
             │                │                │      │  └───────┬───────┘  │
             │                │                │      └──────────┼──────────┘
             │                │                │                 │
             ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │      SQLite         │  │        Dolt         │  │       JSONL         │  │
│  │   .beads/beads.db   │  │    .beads/dolt/     │  │  .beads/issues.jsonl│  │
│  │                     │  │   (MySQL protocol)  │  │  .beads/memory/     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         File System                                 │    │
│  │  Chokidar watches: .beads/*.jsonl, .beads/*.db, .beads/dolt/**     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Read Path: Database → UI

### 2.1 Initial Page Load

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Browser  │     │ SvelteKit    │     │ Data Access  │     │  Database    │
│          │     │ Server       │     │ Layer        │     │              │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │                    │
     │  GET /issues     │                    │                    │
     │─────────────────>│                    │                    │
     │                  │                    │                    │
     │                  │  load() in         │                    │
     │                  │  +page.server.ts   │                    │
     │                  │───────────────────>│                    │
     │                  │                    │                    │
     │                  │                    │  detectBackend()   │
     │                  │                    │───────────────────>│
     │                  │                    │                    │
     │                  │                    │  SQLite or Dolt?   │
     │                  │                    │<───────────────────│
     │                  │                    │                    │
     │                  │                    │  SELECT * FROM     │
     │                  │                    │  issues WHERE...   │
     │                  │                    │───────────────────>│
     │                  │                    │                    │
     │                  │                    │  Issue[]           │
     │                  │                    │<───────────────────│
     │                  │                    │                    │
     │                  │  { issues, ... }   │                    │
     │                  │<───────────────────│                    │
     │                  │                    │                    │
     │  HTML + data     │                    │                    │
     │<─────────────────│                    │                    │
     │                  │                    │                    │
     │  Hydrate stores  │                    │                    │
     │  (client-side)   │                    │                    │
     │                  │                    │                    │
```

### 2.2 Backend Detection Logic

```typescript
// src/lib/server/data/detect.ts

async function detectBackend(): Promise<'sqlite' | 'dolt'> {
  // Check for Dolt directory
  if (await exists('.beads/dolt/')) {
    // Check if Dolt server is running
    if (await canConnect('127.0.0.1', 3307)) {
      return 'dolt';
    }
    // Dolt directory exists but server not running
    // Fall through to check for SQLite
  }

  // Check for SQLite database
  if (await exists('.beads/beads.db')) {
    return 'sqlite';
  }

  throw new Error('No beads database found');
}
```

### 2.3 Query Execution by Backend

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Access Layer                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  queryIssues(filters: FilterState): Promise<Issue[]>            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │ detectBackend() │                                  │
│                    └────────┬────────┘                                  │
│                             │                                           │
│              ┌──────────────┴──────────────┐                            │
│              │                             │                            │
│              ▼                             ▼                            │
│  ┌───────────────────────┐    ┌───────────────────────┐                │
│  │  SQLite Path          │    │  Dolt Path            │                │
│  │                       │    │                       │                │
│  │  import Database      │    │  import mysql from    │                │
│  │    from 'bun:sqlite'; │    │    'mysql2/promise';  │                │
│  │                       │    │                       │                │
│  │  const db = new       │    │  const conn = await   │                │
│  │    Database(path,     │    │    mysql.createConn({ │                │
│  │    { readonly: true })│    │      host, port,      │                │
│  │                       │    │      user, database   │                │
│  │  return db.prepare(   │    │    });                │                │
│  │    sql).all(params);  │    │                       │                │
│  │                       │    │  const [rows] = await │                │
│  │                       │    │    conn.query(sql);   │                │
│  │                       │    │  return rows;         │                │
│  └───────────────────────┘    └───────────────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Metrics Calculation Flow

```
┌───────────┐     ┌───────────────┐     ┌───────────────┐     ┌──────────┐
│  Metrics  │     │ Data Access   │     │   Database    │     │  Charts  │
│  Request  │     │ Layer         │     │               │     │  (UI)    │
└─────┬─────┘     └───────┬───────┘     └───────┬───────┘     └────┬─────┘
      │                   │                     │                   │
      │  getMetrics()     │                     │                   │
      │──────────────────>│                     │                   │
      │                   │                     │                   │
      │                   │  Raw SQL queries:   │                   │
      │                   │                     │                   │
      │                   │  -- Lead Time       │                   │
      │                   │  SELECT id,         │                   │
      │                   │    created_at,      │                   │
      │                   │    closed_at        │                   │
      │                   │  FROM issues        │                   │
      │                   │  WHERE closed_at    │                   │
      │                   │    IS NOT NULL      │                   │
      │                   │──────────────────-->│                   │
      │                   │                     │                   │
      │                   │  rows               │                   │
      │                   │<────────────────────│                   │
      │                   │                     │                   │
      │                   │  -- CFD data        │                   │
      │                   │  SELECT             │                   │
      │                   │    DATE(updated_at),│                   │
      │                   │    status,          │                   │
      │                   │    COUNT(*)         │                   │
      │                   │  FROM issues        │                   │
      │                   │  GROUP BY 1, 2      │                   │
      │                   │──────────────────-->│                   │
      │                   │                     │                   │
      │                   │  rows               │                   │
      │                   │<────────────────────│                   │
      │                   │                     │                   │
      │                   │  Calculate:         │                   │
      │                   │  - P50, P85         │                   │
      │                   │  - Throughput       │                   │
      │                   │  - Aging WIP        │                   │
      │                   │                     │                   │
      │  MetricsData      │                     │                   │
      │<──────────────────│                     │                   │
      │                   │                     │                   │
      │  Update stores    │                     │                   │
      │  Render charts    │                     │                   │
      │─────────────────────────────────────────────────────────────>│
      │                   │                     │                   │
```

---

## 3. Write Path: UI → CLI → Database

### 3.1 Create Issue Flow

```
┌──────────┐     ┌───────────┐     ┌───────────────┐     ┌─────────┐     ┌──────────┐
│   UI     │     │ SvelteKit │     │ Process       │     │  bd CLI │     │ Database │
│  Form    │     │ API Route │     │ Supervisor    │     │         │     │          │
└────┬─────┘     └─────┬─────┘     └───────┬───────┘     └────┬────┘     └────┬─────┘
     │                 │                   │                  │               │
     │  Submit form    │                   │                  │               │
     │  { title,       │                   │                  │               │
     │    description, │                   │                  │               │
     │    type, ... }  │                   │                  │               │
     │────────────────>│                   │                  │               │
     │                 │                   │                  │               │
     │                 │  execute('bd', [  │                  │               │
     │                 │    'create',      │                  │               │
     │                 │    title,         │                  │               │
     │                 │    '--description'│                  │               │
     │                 │    ...            │                  │               │
     │                 │  ])               │                  │               │
     │                 │──────────────────>│                  │               │
     │                 │                   │                  │               │
     │                 │                   │  Check circuit   │               │
     │                 │                   │  breaker state   │               │
     │                 │                   │                  │               │
     │                 │                   │  Check           │               │
     │                 │                   │  concurrency     │               │
     │                 │                   │  (max 4)         │               │
     │                 │                   │                  │               │
     │                 │                   │  execFile()      │               │
     │                 │                   │  (no shell)      │               │
     │                 │                   │─────────────────>│               │
     │                 │                   │                  │               │
     │                 │                   │                  │  INSERT INTO  │
     │                 │                   │                  │  issues ...   │
     │                 │                   │                  │──────────────>│
     │                 │                   │                  │               │
     │                 │                   │                  │  Export JSONL │
     │                 │                   │                  │               │
     │                 │                   │                  │  Dolt commit  │
     │                 │                   │                  │  (if Dolt)    │
     │                 │                   │                  │               │
     │                 │                   │  stdout:         │               │
     │                 │                   │  "Created: id"   │               │
     │                 │                   │<─────────────────│               │
     │                 │                   │                  │               │
     │                 │  { success, id }  │                  │               │
     │                 │<──────────────────│                  │               │
     │                 │                   │                  │               │
     │  { id }         │                   │                  │               │
     │<────────────────│                   │                  │               │
     │                 │                   │                  │               │
     │  Optimistic     │                   │                  │               │
     │  UI update      │                   │                  │               │
     │                 │                   │                  │               │
```

### 3.2 ProcessSupervisor Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ProcessSupervisor                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Configuration                                                       │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │   │
│  │  │ timeout: 30s    │ │ maxConcurrent: 4│ │ circuitBreaker: │        │   │
│  │  │                 │ │                 │ │  threshold: 5   │        │   │
│  │  │                 │ │                 │ │  resetMs: 60000 │        │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  execute(cmd, args) ─────────────────────────────────────────────────────  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │ Circuit Open?   │──── YES ──> throw CircuitOpenError                     │
│  └────────┬────────┘                                                        │
│           │ NO                                                              │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Dedup Check     │──── DUPLICATE ──> return cached Promise               │
│  │ (same cmd/args) │                                                        │
│  └────────┬────────┘                                                        │
│           │ NEW                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Concurrency     │──── FULL ──> queue.push(request)                       │
│  │ (active < 4?)   │              └──> wait for slot                        │
│  └────────┬────────┘                                                        │
│           │ AVAILABLE                                                       │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  const child = spawn(cmd, args, { shell: false })                   │   │
│  │                                                                      │   │
│  │  - Track in activeProcesses Map                                      │   │
│  │  - Set timeout (30s default)                                         │   │
│  │  - Collect stdout/stderr                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │ Exit code 0?    │──── NO ──> recordFailure()                             │
│  └────────┬────────┘            │                                           │
│           │ YES                 │ failures >= threshold?                    │
│           │                     └──> openCircuit()                          │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Parse output    │                                                        │
│  │ Return result   │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Update Issue Flow (Optimistic UI)

```
┌───────────┐          ┌───────────┐          ┌───────────┐          ┌───────────┐
│  Kanban   │          │  Stores   │          │  API      │          │  bd CLI   │
│  Board    │          │           │          │           │          │           │
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │                      │
      │  Drag card to        │                      │                      │
      │  "In Progress"       │                      │                      │
      │                      │                      │                      │
      │  OPTIMISTIC UPDATE   │                      │                      │
      │  issues.update(id,   │                      │                      │
      │    { status: 'in_progress' })               │                      │
      │─────────────────────>│                      │                      │
      │                      │                      │                      │
      │  UI immediately      │                      │                      │
      │  reflects change     │                      │                      │
      │                      │                      │                      │
      │                      │  POST /api/issues/   │                      │
      │                      │  { status: '...' }   │                      │
      │                      │─────────────────────>│                      │
      │                      │                      │                      │
      │                      │                      │  bd update id        │
      │                      │                      │  --status in_progress│
      │                      │                      │─────────────────────>│
      │                      │                      │                      │
      │                      │                      │                      │
      │                      │                      │  success             │
      │                      │                      │<─────────────────────│
      │                      │                      │                      │
      │                      │  { success: true }   │                      │
      │                      │<─────────────────────│                      │
      │                      │                      │                      │
      │                      │  Confirm optimistic  │                      │
      │                      │  update              │                      │
      │                      │                      │                      │
      │         OR IF ERROR:                        │                      │
      │                      │                      │                      │
      │                      │  { error: "..." }    │                      │
      │                      │<─────────────────────│                      │
      │                      │                      │                      │
      │  ROLLBACK            │                      │                      │
      │  Revert to           │                      │                      │
      │  previous state      │                      │                      │
      │<─────────────────────│                      │                      │
      │                      │                      │                      │
      │  Show error toast    │                      │                      │
      │                      │                      │                      │
```

---

## 4. Real-time Sync Flow

### 4.1 File Watcher → WebSocket → UI

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  External     │     │  File System  │     │  WebSocket    │     │  Browser      │
│  Agent        │     │  (Chokidar)   │     │  Server       │     │  Clients      │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │                     │
        │  bd create          │                     │                     │
        │  "New task"         │                     │                     │
        │                     │                     │                     │
        │  ─────────────────> │                     │                     │
        │  writes to          │                     │                     │
        │  .beads/issues.jsonl│                     │                     │
        │                     │                     │                     │
        │                     │  'change' event     │                     │
        │                     │  path: issues.jsonl │                     │
        │                     │────────────────────>│                     │
        │                     │                     │                     │
        │                     │                     │  debounce(100ms)    │
        │                     │                     │                     │
        │                     │                     │  Read new issues    │
        │                     │                     │  from database      │
        │                     │                     │                     │
        │                     │                     │  Broadcast to all   │
        │                     │                     │  connected clients: │
        │                     │                     │                     │
        │                     │                     │  {                  │
        │                     │                     │   type: 'refresh',  │
        │                     │                     │   path: '...',      │
        │                     │                     │   timestamp: ...    │
        │                     │                     │  }                  │
        │                     │                     │────────────────────>│
        │                     │                     │                     │
        │                     │                     │                     │  Client 1
        │                     │                     │────────────────────>│  Client 2
        │                     │                     │                     │  Client 3
        │                     │                     │────────────────────>│
        │                     │                     │                     │
        │                     │                     │                     │  Invalidate
        │                     │                     │                     │  stores
        │                     │                     │                     │
        │                     │                     │                     │  Re-fetch
        │                     │                     │                     │  data
        │                     │                     │                     │
        │                     │                     │                     │  Update UI
        │                     │                     │                     │
```

### 4.2 WebSocket Connection Lifecycle

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                        WebSocket Connection Lifecycle                         │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  INITIAL CONNECTION                                                           │
│  ═══════════════════                                                          │
│                                                                               │
│  Client                          Server                                       │
│    │                               │                                          │
│    │  WS upgrade request           │                                          │
│    │──────────────────────────────>│                                          │
│    │                               │                                          │
│    │  Connection established       │                                          │
│    │<──────────────────────────────│                                          │
│    │                               │                                          │
│    │  { type: 'connected',         │                                          │
│    │    clientId: 'abc123' }       │                                          │
│    │<──────────────────────────────│                                          │
│    │                               │                                          │
│                                                                               │
│  HEARTBEAT (every 30s)                                                        │
│  ═════════════════════                                                        │
│                                                                               │
│    │  { type: 'ping' }             │                                          │
│    │──────────────────────────────>│                                          │
│    │                               │                                          │
│    │  { type: 'pong' }             │                                          │
│    │<──────────────────────────────│                                          │
│    │                               │                                          │
│    │  (5s timeout - no pong = reconnect)                                      │
│                                                                               │
│  RECONNECTION (on disconnect)                                                 │
│  ════════════════════════════                                                 │
│                                                                               │
│    │  Connection lost              │                                          │
│    │         ✕                     │                                          │
│    │                               │                                          │
│    │  Attempt 1: wait 1s           │                                          │
│    │──────────────────────────────>│  ✕ fail                                  │
│    │                               │                                          │
│    │  Attempt 2: wait 2s           │                                          │
│    │──────────────────────────────>│  ✕ fail                                  │
│    │                               │                                          │
│    │  Attempt 3: wait 4s (+ jitter)│                                          │
│    │──────────────────────────────>│  ✓ success                               │
│    │                               │                                          │
│    │  { type: 'connected', ... }   │                                          │
│    │<──────────────────────────────│                                          │
│    │                               │                                          │
│    │  Full refresh triggered       │                                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Watch Targets and Debouncing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           File Watcher Configuration                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  const watcher = chokidar.watch([                                           │
│    '.beads/issues.jsonl',      // Primary issue store                       │
│    '.beads/interactions.jsonl', // Agent interactions                       │
│    '.beads/beads.db',          // SQLite database                           │
│    '.beads/dolt/**',           // Dolt database files                       │
│    '.beads/memory/**',         // Knowledge base                            │
│  ], {                                                                       │
│    ignoreInitial: true,        // Don't fire for existing files             │
│    awaitWriteFinish: {         // Wait for write to complete                │
│      stabilityThreshold: 100,  // 100ms of no changes                       │
│      pollInterval: 50          // Check every 50ms                          │
│    },                                                                       │
│    ignored: [                                                               │
│      '.beads/dolt-access.lock', // Ignore lock files                        │
│      '.beads/**/*.tmp'          // Ignore temp files                        │
│    ]                                                                        │
│  });                                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Event Debouncing                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  File changes during batch operations (e.g., bd import):                    │
│                                                                             │
│  T=0ms    change: issues.jsonl                                              │
│  T=10ms   change: issues.jsonl  ─┐                                          │
│  T=20ms   change: issues.jsonl   │ All coalesced                            │
│  T=30ms   change: issues.jsonl   │ into single                              │
│  T=50ms   change: issues.jsonl  ─┘ broadcast                                │
│  T=150ms  ─────────────────────────> broadcast({ type: 'refresh' })         │
│                                      (100ms after last change)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Error Handling Paths

### 5.1 CLI Execution Errors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLI Error Handling Flow                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ProcessSupervisor.execute('bd', [...])                                     │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Error Types                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │ CircuitOpenError │ ──> Return cached error, don't execute         │   │
│  │  │                  │     UI shows "Service temporarily unavailable" │   │
│  │  └──────────────────┘                                                │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │ TimeoutError     │ ──> Kill process, record failure               │   │
│  │  │ (30s exceeded)   │     UI shows "Operation timed out"             │   │
│  │  └──────────────────┘                                                │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │ NonZeroExit      │ ──> Parse stderr for user-friendly message     │   │
│  │  │ (exit code != 0) │     Record failure, check circuit threshold    │   │
│  │  └──────────────────┘     UI shows parsed error message              │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                                │   │
│  │  │ CommandNotFound  │ ──> Fatal error                                │   │
│  │  │ (bd not in PATH) │     UI shows setup instructions                │   │
│  │  └──────────────────┘                                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Error Response Format:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                   │   │
│  │    success: false,                                                   │   │
│  │    error: {                                                          │   │
│  │      code: 'TIMEOUT' | 'CLI_ERROR' | 'CIRCUIT_OPEN' | ...,           │   │
│  │      message: "User-friendly message",                               │   │
│  │      details: "Technical details for debugging",                     │   │
│  │      retryable: boolean                                              │   │
│  │    }                                                                 │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Connection Errors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Database Error Handling                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SQLite Errors                           Dolt Errors                        │
│  ═════════════                           ═══════════                        │
│                                                                             │
│  ┌──────────────────────┐               ┌──────────────────────┐           │
│  │ SQLITE_BUSY          │               │ ECONNREFUSED         │           │
│  │ Database locked      │               │ Server not running   │           │
│  │                      │               │                      │           │
│  │ Retry with backoff   │               │ Fall back to SQLite? │           │
│  │ Max 3 attempts       │               │ Or show setup guide  │           │
│  └──────────────────────┘               └──────────────────────┘           │
│                                                                             │
│  ┌──────────────────────┐               ┌──────────────────────┐           │
│  │ SQLITE_CORRUPT       │               │ ER_LOCK_WAIT_TIMEOUT │           │
│  │ Database corrupted   │               │ Transaction timeout  │           │
│  │                      │               │                      │           │
│  │ Fatal - show         │               │ Retry with backoff   │           │
│  │ recovery options     │               │                      │           │
│  └──────────────────────┘               └──────────────────────┘           │
│                                                                             │
│  ┌──────────────────────┐               ┌──────────────────────┐           │
│  │ SQLITE_NOTFOUND      │               │ ER_NO_SUCH_TABLE     │           │
│  │ No database file     │               │ Schema mismatch      │           │
│  │                      │               │                      │           │
│  │ Run 'bd init'        │               │ Run 'bd migrate'     │           │
│  └──────────────────────┘               └──────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Performance Considerations

### 6.1 Query Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Query Performance                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INDEXED COLUMNS (from schema analysis)                                     │
│  ═══════════════════════════════════════                                    │
│  issues: status, priority, issue_type, assignee, created_at, external_ref  │
│  dependencies: thread_id                                                    │
│  events: issue_id, created_at                                               │
│  interactions: kind, created_at, issue_id, parent_id                        │
│                                                                             │
│  QUERY PATTERNS                                                             │
│  ══════════════                                                             │
│                                                                             │
│  ✓ FAST (uses index):                                                       │
│    SELECT * FROM issues WHERE status = 'open'                               │
│    SELECT * FROM issues WHERE status = 'open' AND priority <= 2             │
│    SELECT * FROM issues WHERE assignee = 'alice'                            │
│                                                                             │
│  ⚠ MODERATE (partial index use):                                            │
│    SELECT * FROM issues WHERE title LIKE '%auth%'                           │
│    SELECT * FROM issues WHERE created_at > '2026-01-01'                     │
│                                                                             │
│  ✗ SLOW (full table scan):                                                  │
│    SELECT * FROM issues WHERE description LIKE '%authentication%'           │
│    SELECT * FROM issues WHERE JSON_EXTRACT(metadata, '$.custom') = 'x'      │
│                                                                             │
│  PAGINATION                                                                 │
│  ══════════                                                                 │
│  - Default limit: 100 issues per page                                       │
│  - Use keyset pagination for large datasets:                                │
│    SELECT * FROM issues WHERE id > :lastId ORDER BY id LIMIT 100            │
│                                                                             │
│  CACHING                                                                    │
│  ═══════                                                                    │
│  - Metrics cached for 30 seconds (expensive calculations)                   │
│  - Issue list invalidated on any file change                                │
│  - No caching for individual issue reads (always fresh)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Latency Targets

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Latency Targets                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Operation                              Target        Measurement Point     │
│  ═════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  Initial page load (SSR)                < 500ms       First contentful paint│
│  Issue list render (1000 items)         < 100ms       Time to interactive   │
│  Filter change                          < 50ms        UI update complete    │
│  Create issue (form submit to confirm)  < 2s          Includes CLI          │
│  Update issue status                    < 1s          Includes CLI          │
│  Real-time update propagation           < 1s          File change to UI     │
│  Metrics dashboard load                 < 500ms       Charts rendered       │
│  Gantt chart render (500 items)         < 200ms       Interactive           │
│  Search (full-text)                     < 300ms       Results displayed     │
│                                                                             │
│  Breakdown: Create Issue                                                    │
│  ════════════════════════                                                   │
│  UI validation                          ~10ms                               │
│  API request                            ~20ms                               │
│  ProcessSupervisor queue                ~5ms                                │
│  bd CLI execution                       ~800ms                              │
│  JSONL export (bd internal)             ~100ms                              │
│  File watcher detection                 ~100ms                              │
│  WebSocket broadcast                    ~10ms                               │
│  Client store update                    ~10ms                               │
│  UI re-render                           ~50ms                               │
│  ─────────────────────────────────────────────                              │
│  Total                                  ~1.1s                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Gas-Town Integration (Phase 5)

### 7.1 Dual-CLI Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Gas-Town Data Flow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ProcessSupervisor                             │   │
│  │                                                                      │   │
│  │   ┌──────────────────────┐      ┌──────────────────────┐            │   │
│  │   │   bd CLI             │      │   gt CLI             │            │   │
│  │   │   ~/.local/bin/bd    │      │   ~/go/bin/gt        │            │   │
│  │   ├──────────────────────┤      ├──────────────────────┤            │   │
│  │   │ Issues               │      │ Town operations      │            │   │
│  │   │ Dependencies         │      │ Agent status         │            │   │
│  │   │ Labels               │      │ Convoys              │            │   │
│  │   │ Molecules            │      │ Mail                 │            │   │
│  │   │ Workflows            │      │ Rigs                 │            │   │
│  │   └──────────────────────┘      └──────────────────────┘            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Detection Logic:                                                           │
│  ════════════════                                                           │
│  1. Check for GT_ROOT environment variable                                  │
│  2. Check for gt binary in PATH                                             │
│  3. Check for .gastown/ directory in workspace                              │
│  4. If Gas-Town detected, enable gt CLI commands                            │
│  5. If not, disable Gas-Town features gracefully                            │
│                                                                             │
│  Data Flow:                                                                 │
│  ══════════                                                                 │
│  - Agent status: gt status → parse → Agent dashboard                        │
│  - Convoys: gt convoy list → parse → Convoy tracking                        │
│  - Mail: gt mail inbox/send → Mail UI                                       │
│  - Merge queue: gt queue list → Queue visualization                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## References

- [ADR-0005: CLI for Writes and Direct SQL for Reads](../adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [ADR-0006: Use File Watching with WebSocket Broadcast](../adrs/0006-use-file-watching-with-websocket-broadcast.md)
- [Beads Schema Reference](../references/beads-schema.md)
- [ProcessSupervisor Pattern](../references/borrowable-components.md)
