# Unified Beads WebUI - Roadmap

## Overview

Phased delivery over ~18 weeks, building from core functionality to full Gas-Town integration.

---

## Phase 1: MVP Core (4 weeks)

**Goal**: Basic functional UI with issue management

### Deliverables
- [ ] Project scaffolding (SvelteKit + Bun)
- [ ] ProcessSupervisor for CLI execution
- [ ] Data access layer (SQLite/Dolt detection)
- [ ] Issue list view with filters
- [ ] Kanban board (basic)
- [ ] Inline editing
- [ ] Real-time file watching
- [ ] Basic keyboard shortcuts

### Exit Criteria
- Can view, create, edit issues
- Changes via UI persist correctly
- Real-time updates work

---

## Phase 2: Analytics & Timeline (3 weeks)

**Goal**: Lean metrics and Gantt visualization

### Deliverables
- [ ] Metrics engine (port from beads-dashboard)
- [ ] CFD chart
- [ ] Lead Time scatterplot with percentiles
- [ ] Throughput chart
- [ ] Aging WIP scatterplot
- [ ] Health status (RAG) badges
- [ ] Gantt chart component
- [ ] Date prefix parsing ([Q1], [H1], etc.)
- [ ] Hierarchical sorting

### Exit Criteria
- Metrics dashboard functional
- Gantt chart with drag/resize
- Date prefixes parsed and displayed

---

## Phase 3: Git Integration (3 weeks)

**Goal**: PR management and worktree support

### Deliverables
- [ ] Worktree listing
- [ ] Worktree status (ahead/behind)
- [ ] PR creation (via gh CLI)
- [ ] PR listing and viewing
- [ ] CI status display
- [ ] Merge conflict alerts
- [ ] Dependency graph visualization
- [ ] Batch issue creation

### Exit Criteria
- Can manage PRs from UI
- CI status visible on cards
- Dependency graph renders

---

## Phase 4: Agent Orchestration (4 weeks)

**Goal**: Agent session management and verification

### Deliverables
- [ ] Terminal drawer (xterm.js)
- [ ] Agent session launch
- [ ] Session output streaming
- [ ] Agent history view
- [ ] Verification queue
- [ ] Approve/reject workflow
- [ ] ReTake (retry) workflow
- [ ] Claude planning integration
- [ ] Session persistence/resumption

### Exit Criteria
- Can launch and monitor agent sessions
- Verification workflow functional
- Claude planning works

---

## Phase 5: Gas-Town Integration (4 weeks)

**Goal**: Full multi-agent orchestration

### Deliverables
- [ ] Gas-Town detection and config
- [ ] Agent monitoring dashboard
- [ ] Convoy tracking
- [ ] Mail system integration
- [ ] Merge queue visualization
- [ ] Scene/wave orchestration
- [ ] Knowledge panel (memory browsing)
- [ ] SQL explorer for advanced queries
- [ ] Multi-rig support

### Exit Criteria
- Full Gas-Town feature parity
- Multi-agent workflows manageable
- SQL exploration works

---

## Future Considerations

### v2.0+
- Plugin system for custom views
- Remote collaboration features
- Mobile-responsive design
- Custom dashboard builder
- Integration with external tools (Linear, Jira)

---

## Dependencies

### External
- `bd` CLI (required)
- `gt` CLI (Phase 5)
- `gh` CLI (Phase 3)

### Libraries
- SvelteKit 2.x
- Bun runtime
- Tailwind CSS 4
- Recharts
- xterm.js
- @dnd-kit
- Chokidar
- mysql2 (for Dolt)
- better-sqlite3 (for SQLite)
