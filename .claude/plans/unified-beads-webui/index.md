# Unified Beads WebUI Plan

> A comprehensive WebUI combining the best features from all existing Beads/Gas-Town tools.

## Status: Planning

**Created**: 2026-02-21
**Last Updated**: 2026-02-22

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [PRD Index](./prds/index.md) | Product Requirements |
| [Spec Index](./spec/index.md) | Technical Specifications |
| [Roadmap](./ROADMAP.md) | Phased delivery plan |
| [ADRs](./adrs/) | Architecture Decision Records |
| [Constraints](./docs/constraints/) | Known limitations and constraints |

---

## Phase Documents

| Phase | Title | Status |
|-------|-------|--------|
| [Phase 01](./phase/01-mvp-core.md) | MVP Core | Pending |
| [Phase 02](./phase/02-analytics.md) | Analytics & Metrics | Pending |
| [Phase 03](./phase/03-git-integration.md) | Git Integration | Pending |
| [Phase 04](./phase/04-agent-orchestration.md) | Agent Orchestration | Pending |
| [Phase 05](./phase/05-gastown-integration.md) | Gas-Town Integration | Pending |

---

## Reference Documents

| Document | Description |
|----------|-------------|
| [Existing WebUI Comparison](./references/existing-webui-comparison.md) | Analysis of 5 Beads WebUIs |
| [Feature Matrix](./references/feature-matrix.md) | Complete feature comparison |
| [Tech Stack Analysis](./references/tech-stack-analysis.md) | Framework/library evaluation |
| [Beads Schema](./references/beads-schema.md) | Database schema reference |
| [Gas-Town WebUIs](./references/gastown-webuis.md) | Gas-Town specific UIs |
| [Dolt Hooks](./references/dolt-hooks.md) | Dolt synchronization hooks |
| [Borrowable Components](./references/borrowable-components.md) | Reusable code from existing tools |
| [Requirements](./references/requirements.md) | Full requirements list |
| [MCP Servers](./references/mcp-servers.md) | Development MCP servers for AI-assisted coding |

---

## Key Decisions

### Data Access Strategy
- **Reads**: Direct SQL via `bd sql` or native drivers
- **Writes**: Always via `bd` CLI to maintain sync

### Tech Stack (Proposed)
- **Runtime**: Bun
- **Frontend**: SvelteKit 2.x or Next.js 15+
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Terminal**: xterm.js
- **Drag-and-Drop**: @dnd-kit

---

## Beads Epics

Tracked in Beads under prefix `ubw-` (Unified Beads WebUI):

- Feature Prioritization Matrix
- Architecture Decision Records
- Data Flow Diagrams
- Component Wireframes
- API Contract Definition
- CLI Integration Specification

Use `bd list --label ubw` to view all related issues.
