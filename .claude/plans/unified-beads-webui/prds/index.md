# Unified Beads WebUI - Product Requirements Document

## Executive Summary

Build a comprehensive WebUI that combines the capabilities of all existing Beads/Gas-Town tools into a single, unified interface. The tool will provide visual management for issues, analytics, Git integration, and multi-agent orchestration.

---

## Problem Statement

Currently, users must choose between multiple specialized tools:
- **beads-ui**: Simple, keyboard-focused, but no analytics
- **beads-dashboard**: Great metrics, but no agent features
- **Beads-Kanban-UI**: GitOps features, but missing metrics
- **beads-pm-ui**: Gantt charts, but no real-time sync
- **foolery**: Agent orchestration, but missing Kanban/metrics

No single tool provides the complete experience.

---

## Goals

1. **Unified Experience**: Single tool for all Beads/Gas-Town visualization needs
2. **Data Integrity**: Write operations always go through `bd` CLI
3. **Rich Analytics**: Lean metrics (CFD, Lead Time, Throughput, Aging WIP)
4. **Agent Support**: Session monitoring, verification, retry workflows
5. **Git Integration**: PR management, CI status, worktree support
6. **Gas-Town Ready**: Full integration with multi-agent orchestration

---

## Non-Goals

1. Replace the `bd` or `gt` CLI tools
2. Provide a hosted/cloud version
3. Support non-Beads issue trackers

---

## User Personas

### Developer (Primary)
- Uses Claude Code for AI-assisted development
- Tracks work in Beads
- Needs quick status visibility
- Wants keyboard-first navigation

### Team Lead
- Monitors team progress
- Needs metrics and analytics
- Tracks blockers and dependencies
- Reviews verification queue

### DevOps/Platform
- Manages Git operations (PRs, merges)
- Monitors CI status
- Coordinates multi-agent workflows

---

## Requirements by Category

### Core Requirements
See: [requirements.md](../references/requirements.md)

### Detailed Requirements
- [Feature Prioritization Matrix](./feature-prioritization-matrix.md) - **Complete**
- [Data Access Requirements](./data-access.md) - Pending
- [View Requirements](./views.md) - Pending
- [Analytics Requirements](./analytics.md) - Pending
- [Git Integration Requirements](./git-integration.md) - Pending
- [Agent Orchestration Requirements](./agent-orchestration.md) - Pending

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Issue list render time | < 100ms |
| Metrics calculation time | < 500ms |
| Real-time update latency | < 1s |
| CLI command execution | < 2s |
| User adoption (vs individual tools) | > 50% |

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: MVP Core | 4 weeks | Kanban, list, inline edit, CLI writes |
| Phase 2: Analytics | 3 weeks | CFD, Lead Time, Aging WIP, Gantt |
| Phase 3: Git | 3 weeks | PR, CI, Worktree, Dependency graph |
| Phase 4: Agents | 4 weeks | Terminal, verification, retry |
| Phase 5: Gas-Town | 4 weeks | Full orchestration integration |

**Total**: ~18 weeks

---

## Related Documents

- [Roadmap](../ROADMAP.md)
- [Tech Stack Analysis](../references/tech-stack-analysis.md)
- [Feature Matrix](../references/feature-matrix.md)
