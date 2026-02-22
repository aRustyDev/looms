# Tech Stack Analysis

## Existing WebUI Architectures

| Project | Frontend | Backend | Styling | Build Tool |
|---------|----------|---------|---------|------------|
| **beads-ui** | Vanilla JS | Node.js | CSS | npm scripts |
| **beads-dashboard** | React 18 | Express 5 | Tailwind (CDN) | Vite |
| **Beads-Kanban-UI** | Next.js | Rust (Actix) | CSS | Vite + Cargo |
| **beads-pm-ui** | Next.js 15/React 19 | Next.js API routes | CSS | Next.js |
| **foolery** | Next.js 16/React 19 | Next.js | Tailwind CSS 4 | Next.js |
| **gastown-frontend** | Next.js/React | Express.js | Custom CSS | npm |
| **gastown_ui** | SvelteKit 2.x | SvelteKit | Tailwind + variants | Vite 6.x |

---

## Gas-Town Specific WebUIs

### bigsky77/gastown-frontend
- **Tech Stack**: Express.js (API) + Next.js (React)
- **Languages**: 95.9% JavaScript, 3.6% CSS
- **Real-time**: WebSocket (ws://localhost:3001/ws)
- **Features**: Convoy tracking, Issue list, Agent inbox, Event feed, Rig overview
- **API Endpoints**: 18+ REST endpoints wrapping `gt` CLI

### Avyukth/gastown_ui
- **Tech Stack**: SvelteKit 2.x + Vite 6.x + Tailwind CSS
- **Runtime**: Bun (preferred) or Node.js 18+
- **Real-time**: WebSocket with exponential backoff reconnection
- **Components**: 70+ Svelte 5 components
- **Security**: CSP headers, CSRF protection, HttpOnly cookies

**ProcessSupervisor Pattern (gastown_ui):**
```
ProcessSupervisor:
├── No-shell execution (execFile)
├── 30-second timeout per command
├── Max 4 concurrent commands
├── Circuit breaker (5 failures → 60s reset)
├── Request deduplication
└── Process tracking with cleanup
```

---

## Charting/Visualization Libraries

| Library | Used By | Purpose |
|---------|---------|---------|
| **Recharts 2** | beads-dashboard | CFD, scatterplots, charts |
| **D3.js** | bd CLI (graph --html) | Interactive dependency graphs |
| **@dnd-kit** | beads-dashboard | Drag-and-drop |
| **xterm.js** | foolery | Terminal emulation |
| **Lucide React** | beads-dashboard, foolery | Icons |

---

## Real-time Communication Patterns

| Pattern | Used By | Implementation |
|---------|---------|----------------|
| **Socket.IO** | beads-dashboard | WebSocket + fallback |
| **Native WebSocket** | gastown-frontend, gastown_ui | Raw WS with reconnection |
| **File Watching (Chokidar)** | beads-dashboard, beads-ui | Filesystem events |
| **Polling** | Beads-Kanban-UI | 30s interval for PR status |

---

## Language/Framework Compatibility with Data Backends

### SQLite Support

| Language/Runtime | Library | Notes |
|------------------|---------|-------|
| **Node.js** | better-sqlite3 | Synchronous, fast, used by beads-pm-ui |
| **Node.js** | sql.js | WASM-based, browser compatible |
| **Bun** | bun:sqlite | Native, very fast |
| **Rust** | rusqlite, sqlx | Native, used by Beads-Kanban-UI |
| **Go** | modernc.org/sqlite | Pure Go, used by bd itself |

### Dolt Support

Dolt uses **MySQL wire protocol**, so any MySQL client works:

| Language/Runtime | Library | Notes |
|------------------|---------|-------|
| **Node.js** | mysql2 | Recommended, Promise support |
| **Node.js** | Prisma | ORM, works with Dolt |
| **Bun** | mysql2 | Same as Node.js |
| **Rust** | mysql_async, sqlx | Async MySQL support |
| **Go** | database/sql + mysql driver | Native |

### JSONL Support

All languages support JSONL (newline-delimited JSON):
- Read line-by-line, parse each line as JSON
- Append-only writes are trivial

---

## Recommended Tech Stack

Based on the research:

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | **Bun** | Fastest, native SQLite, mysql2 compatible |
| **Frontend** | **SvelteKit 2.x** | gastown_ui proves it works well, 70+ components available |
| **Alternative** | **Next.js 15+** | Most familiar, used by 4/7 tools |
| **Styling** | **Tailwind CSS 4** | Used by foolery, gastown_ui |
| **Charts** | **Recharts** or **Apache ECharts** | beads-dashboard proves Recharts works |
| **Drag-n-Drop** | **@dnd-kit** | beads-dashboard uses it |
| **Terminal** | **xterm.js** | foolery uses it |
| **Icons** | **Lucide** | Universal across projects |
