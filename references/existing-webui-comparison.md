# Existing Beads WebUI Comparison

## Overview Summary

| Project | Stars | Tech Stack | Focus | Write Support |
|---------|-------|------------|-------|---------------|
| **[mantoni/beads-ui](https://github.com/mantoni/beads-ui)** | 426 | Node.js/JavaScript | General-purpose local UI | Yes (via CLI) |
| **[rhydlewis/beads-dashboard](https://github.com/rhydlewis/beads-dashboard)** | 9 | TypeScript/React/Vite | Lean metrics & analytics | Yes (via CLI) |
| **[AvivK5498/Beads-Kanban-UI](https://github.com/AvivK5498/Beads-Kanban-UI)** | 57 | Next.js/Rust | GitOps + multi-project dashboard | Yes (via CLI) |
| **[qosha1/beads-pm-ui](https://github.com/qosha1/beads-pm-ui)** | 1 | Next.js 15/React 19 | Gantt/PM visualization | Yes (direct SQLite) |
| **[acartine/foolery](https://github.com/acartine/foolery)** | 8 | Next.js 16/React 19 | Agent orchestration | Yes (via CLI) |

---

## Database Interaction Methods

| Project | CLI (`bd`) | JSONL | SQLite | Dolt |
|---------|------------|-------|--------|------|
| **beads-ui** | Primary | - | - | - |
| **beads-dashboard** | Primary (writes) | Watches | Reads directly | - |
| **Beads-Kanban-UI** | Primary | Watches `.beads/issues.jsonl` | - | - |
| **beads-pm-ui** | - | - | Direct read/write | - |
| **foolery** | Primary | - | - | Supports Dolt hooks |

---

## Detailed Breakdown

### beads-ui (mantoni)
- **Goal**: Simple, zero-setup web interface for the `bd` CLI
- **Audience**: Developers who want a quick visual companion to CLI
- **Philosophy**: Minimal, keyboard-navigable, stays out of the way
- **Interacts via**: `bd` CLI exclusively
- **Uses**: `BD_BIN` env var to locate binary
- **Database Access**: Zero direct database access

### beads-dashboard (rhydlewis)
- **Goal**: Flow metrics and continuous improvement analytics
- **Audience**: Team leads, scrum masters, process improvement focus
- **Philosophy**: Data-driven insights (CFD, lead time, aging WIP, throughput)
- **Unique Value**: The only tool focused on **measuring flow health**
- **Primary**: Reads SQLite database (`.beads/beads.db`) directly
- **Writes**: Executes `bd` CLI commands for mutations
- **Watches**: File system for real-time updates
- **Requires**: `bd` in PATH

### Beads-Kanban-UI (AvivK5498)
- **Goal**: Full-featured project management with Git/GitHub integration
- **Audience**: Teams using Beads with multi-agent workflows
- **Philosophy**: Everything in one place (PRs, CI, agents, memory)
- **Unique Value**: Only tool with **PR management, CI status, agent config editing**
- **Related**: Works with [Beads Orchestration](https://github.com/AvivK5498/Claude-Code-Beads-Orchestration)
- **Primary**: Executes `bd` CLI for all beads operations
- **Watches**: `.beads/issues.jsonl` for live updates
- **Also reads/writes**: `.claude/agents/*.md` files directly
- **Also reads**: `.beads/memory/knowledge.jsonl`
- **Backend**: Rust (Actix-web) + Next.js frontend

### beads-pm-ui (qosha1)
- **Goal**: Traditional project management with timeline views
- **Audience**: Project managers, roadmap planning
- **Philosophy**: Hierarchical time-based planning (3YR → Q1 → W1)
- **Unique Value**: Only tool with **Gantt charts and hierarchical date prefixes**
- **Built with**: debugg.ai
- **Direct SQLite access** via `better-sqlite3`
- **Does NOT use** `bd` CLI at all
- **Custom REST API** (`/api/beads`) for CRUD
- **Most "raw" database access** of all tools

### foolery (acartine)
- **Goal**: Product-focused agent orchestration (between 8-terminal chaos and full Gas-Town)
- **Audience**: Developers managing multiple AI agents, verification workflows
- **Philosophy**: "Beats" as work units, wave-based parallel execution
- **Unique Value**: Only tool with **built-in terminal, verification queue, scene orchestration, Claude planning integration**
- **Primary**: `bd` CLI for all operations
- **Supports**: Dolt-native sync hooks (see `docs/BEADS_DOLT_HOOKS.md`)
- **Reads from**: Any Beads-enabled repos registered with `foolery setup`
