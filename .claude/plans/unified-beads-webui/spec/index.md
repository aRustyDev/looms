# Unified Beads WebUI - Technical Specification

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (SvelteKit)                     │
├─────────────────────────────────────────────────────────────┤
│  Components    │  State (Zustand)  │  WebSocket Client      │
└────────┬───────┴─────────┬─────────┴──────────┬─────────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   SvelteKit Server                          │
├─────────────────────────────────────────────────────────────┤
│  API Routes    │  ProcessSupervisor │  File Watcher         │
│  /api/*        │  (CLI execution)   │  (Chokidar)           │
└────────┬───────┴─────────┬──────────┴──────────┬────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐
│  Direct SQL  │  │   bd CLI     │  │   File System           │
│  (read-only) │  │   gt CLI     │  │   .beads/issues.jsonl   │
└──────┬───────┘  └──────────────┘  │   .beads/memory/        │
       │                            └─────────────────────────┘
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├──────────────────┬──────────────────┬───────────────────────┤
│  SQLite          │  Dolt            │  JSONL Files          │
│  (.beads/*.db)   │  (MySQL proto)   │  (issues, memory)     │
└──────────────────┴──────────────────┴───────────────────────┘
```

---

## Component Specifications

| Component | Spec Document |
|-----------|---------------|
| ProcessSupervisor | [process-supervisor.md](./process-supervisor.md) |
| Data Access Layer | [data-access.md](./data-access.md) |
| Kanban Board | [kanban.md](./kanban.md) |
| Metrics Engine | [metrics.md](./metrics.md) |
| Gantt Chart | [gantt.md](./gantt.md) |
| Terminal Integration | [terminal.md](./terminal.md) |
| Git Integration | [git.md](./git.md) |
| Real-time Sync | [realtime.md](./realtime.md) |

---

## Tech Stack

### Runtime
- **Bun** (primary) - Fastest, native SQLite
- Node.js 18+ (fallback)

### Frontend
- **SvelteKit 2.x** - SSR + API routes
- Tailwind CSS 4 - Styling
- Zustand - State management
- Lucide - Icons

### Visualization
- Recharts - Charts (CFD, scatterplots)
- D3.js - Custom visualizations
- @dnd-kit - Drag-and-drop

### Terminal
- xterm.js - Terminal emulation
- xterm-addon-fit - Auto-sizing
- xterm-addon-web-links - Clickable links

### Real-time
- Native WebSocket - Client-server
- Chokidar - File watching

---

## Data Access Patterns

### Read Operations

```typescript
// Option 1: Via bd sql (works with SQLite and Dolt)
const result = await supervisor.execute('bd', [
  'sql', '--json',
  'SELECT * FROM issues WHERE status = "open"'
]);

// Option 2: Direct SQLite (SQLite backend only)
import Database from 'better-sqlite3';
const db = new Database('.beads/beads.db', { readonly: true });
const issues = db.prepare('SELECT * FROM issues').all();

// Option 3: Direct Dolt (Dolt backend only)
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'beads_project'
});
const [rows] = await conn.query('SELECT * FROM issues');
```

### Write Operations

```typescript
// ALWAYS via bd CLI
await supervisor.execute('bd', ['create', title, '--description', desc]);
await supervisor.execute('bd', ['update', id, '--status', 'in_progress']);
await supervisor.execute('bd', ['close', id]);
```

---

## API Contract

### Issues

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/issues` | GET | List issues with filters |
| `/api/issues/:id` | GET | Get single issue |
| `/api/issues` | POST | Create issue (via bd) |
| `/api/issues/:id` | PATCH | Update issue (via bd) |
| `/api/issues/:id/close` | POST | Close issue (via bd) |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/cfd` | GET | Cumulative flow data |
| `/api/metrics/lead-time` | GET | Lead time statistics |
| `/api/metrics/throughput` | GET | Throughput data |
| `/api/metrics/aging-wip` | GET | Aging WIP data |

### Git

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/worktrees` | GET | List worktrees |
| `/api/git/prs` | GET | List PRs |
| `/api/git/prs` | POST | Create PR |
| `/api/git/prs/:id/merge` | POST | Merge PR |

### WebSocket

| Event | Direction | Payload |
|-------|-----------|---------|
| `issues:changed` | Server→Client | `{ type, issue }` |
| `file:changed` | Server→Client | `{ path }` |
| `metrics:updated` | Server→Client | `{ metrics }` |

---

## Security Considerations

1. **No shell execution**: Use `execFile` only
2. **Command whitelisting**: Only allow known `bd`/`gt` commands
3. **Input sanitization**: Validate all user input
4. **Read-only DB connections**: For direct SQL access
5. **Local-only by default**: Bind to 127.0.0.1

---

## Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Issue list (1000 items) | < 100ms | Time to interactive |
| Metrics calculation | < 500ms | Server response |
| File change → UI update | < 1s | End-to-end |
| CLI command | < 2s | Execution time |
| Initial page load | < 2s | First contentful paint |
