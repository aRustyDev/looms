# Feature Prioritization Matrix

## Prioritization Framework

### Value Scoring (1-5)

- **5**: Core functionality, blocks other features
- **4**: High user impact, frequently used
- **3**: Important but not critical
- **2**: Nice to have, occasional use
- **1**: Edge case, rare use

### Complexity Scoring (1-5)

- **1**: Simple, < 1 day
- **2**: Moderate, 1-3 days
- **3**: Medium, 3-5 days
- **4**: Complex, 1-2 weeks
- **5**: Very complex, 2+ weeks

### Priority Score

`Priority = Value × (6 - Complexity)`

Higher score = higher priority.

---

## Phase 1: MVP Core

**Target**: 4 weeks | **Theme**: Basic functional UI

| Feature                                | Value | Complexity | Score | Dependencies      | Source                    |
| -------------------------------------- | ----- | ---------- | ----- | ----------------- | ------------------------- |
| Project scaffolding                    | 5     | 2          | 20    | None              | -                         |
| ProcessSupervisor (CLI execution)      | 5     | 3          | 15    | Scaffolding       | gastown_ui                |
| Data access layer (SQLite/Dolt detect) | 5     | 3          | 15    | Scaffolding       | -                         |
| Issues List/Table                      | 5     | 2          | 20    | Data access       | All tools                 |
| Basic filters (status, type, priority) | 5     | 2          | 20    | Issue list        | All tools                 |
| Text search                            | 4     | 1          | 20    | Issue list        | All tools                 |
| Create Issue (via bd)                  | 5     | 2          | 20    | ProcessSupervisor | All tools                 |
| Quick Status Change                    | 4     | 1          | 20    | ProcessSupervisor | All tools                 |
| Inline Editing                         | 4     | 3          | 12    | ProcessSupervisor | beads-ui, beads-dashboard |
| Kanban Board (basic)                   | 4     | 3          | 12    | Issue list        | beads-ui, beads-dashboard |
| Epics View                             | 3     | 2          | 12    | Issue list        | All tools                 |
| File watching (real-time)              | 4     | 2          | 16    | Data access       | beads-ui, beads-dashboard |
| Basic keyboard shortcuts               | 3     | 2          | 12    | UI complete       | beads-ui, foolery         |
| Owner/Assignee Filter                  | 3     | 1          | 15    | Issue list        | All tools                 |

**MVP Total Features**: 14
**MVP Must-Have**: Scaffolding, ProcessSupervisor, Data access, Issue list, Filters, Create, Status change

---

## Phase 2: Analytics & Timeline

**Target**: 3 weeks | **Theme**: Metrics and planning views

| Feature                           | Value | Complexity | Score | Dependencies   | Source                       |
| --------------------------------- | ----- | ---------- | ----- | -------------- | ---------------------------- |
| Metrics engine (calculations)     | 5     | 3          | 15    | Data access    | beads-dashboard              |
| Lead Time Scatterplot             | 4     | 3          | 12    | Metrics engine | beads-dashboard              |
| Throughput chart                  | 4     | 2          | 16    | Metrics engine | beads-dashboard              |
| CFD (Cumulative Flow)             | 4     | 3          | 12    | Metrics engine | beads-dashboard              |
| Aging WIP Scatterplot             | 4     | 3          | 12    | Metrics engine | beads-dashboard              |
| Percentile calculations (P50/P85) | 3     | 2          | 12    | Metrics engine | beads-dashboard              |
| Health Status (RAG) badges        | 3     | 2          | 12    | Data access    | beads-dashboard, beads-pm-ui |
| Progress Bars                     | 3     | 1          | 15    | Issue list     | beads-dashboard, Kanban-UI   |
| Date Prefix Parsing               | 4     | 3          | 12    | Data access    | beads-pm-ui                  |
| Hierarchical Sorting              | 3     | 2          | 12    | Date Prefix    | beads-pm-ui                  |
| Gantt Chart (basic)               | 4     | 4          | 8     | Date Prefix    | beads-pm-ui                  |
| Gantt drag/resize                 | 3     | 4          | 6     | Gantt basic    | beads-pm-ui                  |
| Due Date Management               | 3     | 2          | 12    | Inline editing | beads-dashboard, beads-pm-ui |
| Quick Filters (presets)           | 3     | 2          | 12    | Filters        | beads-dashboard, Kanban-UI   |

**Phase 2 Total Features**: 14
**Phase 2 Must-Have**: Metrics engine, Lead Time, Throughput, CFD, Aging WIP, Gantt basic

---

## Phase 3: Git Integration

**Target**: 3 weeks | **Theme**: Git operations and dependencies

| Feature                        | Value | Complexity | Score | Dependencies      | Source                     |
| ------------------------------ | ----- | ---------- | ----- | ----------------- | -------------------------- |
| Worktree listing               | 4     | 2          | 16    | ProcessSupervisor | Beads-Kanban-UI            |
| Worktree status (ahead/behind) | 3     | 2          | 12    | Worktree listing  | Beads-Kanban-UI            |
| Dependency Graph (basic)       | 4     | 3          | 12    | Data access       | beads-pm-ui, foolery       |
| Dependency arrows              | 3     | 3          | 9     | Dependency Graph  | beads-pm-ui                |
| PR listing (via gh)            | 4     | 3          | 12    | ProcessSupervisor | Beads-Kanban-UI            |
| PR Create                      | 3     | 3          | 9     | PR listing        | Beads-Kanban-UI            |
| PR Merge                       | 3     | 3          | 9     | PR listing        | Beads-Kanban-UI            |
| CI Status display              | 3     | 2          | 12    | PR listing        | Beads-Kanban-UI            |
| Merge Conflict Alerts          | 3     | 2          | 12    | PR listing        | Beads-Kanban-UI            |
| Drag-and-Drop (Kanban)         | 3     | 3          | 9     | Kanban board      | beads-dashboard, Kanban-UI |
| Batch Issue Creation           | 3     | 3          | 9     | Create Issue      | beads-dashboard            |
| Related Tasks Links            | 3     | 2          | 12    | Issue list        | Beads-Kanban-UI            |

**Phase 3 Total Features**: 12
**Phase 3 Must-Have**: Worktree listing, Dependency Graph, PR listing, CI Status

---

## Phase 4: Agent Orchestration

**Target**: 4 weeks | **Theme**: Agent session management

| Feature                        | Value | Complexity | Score | Dependencies                | Source          |
| ------------------------------ | ----- | ---------- | ----- | --------------------------- | --------------- |
| Terminal drawer (xterm.js)     | 5     | 4          | 10    | UI complete                 | foolery         |
| Agent session launch           | 5     | 3          | 15    | Terminal, ProcessSupervisor | foolery         |
| Session output streaming       | 4     | 3          | 12    | Terminal                    | foolery         |
| Agent History view             | 3     | 2          | 12    | Data access                 | foolery         |
| Verification Queue             | 4     | 3          | 12    | Issue list                  | foolery         |
| Approve/Reject workflow        | 4     | 2          | 16    | Verification Queue          | foolery         |
| ReTake (retry) workflow        | 3     | 3          | 9     | Verification Queue          | foolery         |
| Claude planning integration    | 4     | 4          | 8     | Terminal, ProcessSupervisor | foolery         |
| Session persistence/resumption | 3     | 4          | 6     | Terminal                    | foolery         |
| Agent Config UI                | 3     | 3          | 9     | ProcessSupervisor           | Beads-Kanban-UI |
| Interaction History            | 3     | 2          | 12    | Data access                 | foolery         |

**Phase 4 Total Features**: 11
**Phase 4 Must-Have**: Terminal drawer, Agent session launch, Verification Queue, Approve/Reject

---

## Phase 5: Gas-Town Integration

**Target**: 4 weeks | **Theme**: Full orchestration

| Feature                    | Value | Complexity | Score | Dependencies      | Source                   |
| -------------------------- | ----- | ---------- | ----- | ----------------- | ------------------------ |
| Gas-Town detection         | 5     | 2          | 20    | ProcessSupervisor | gastown_ui               |
| gt CLI integration         | 5     | 3          | 15    | ProcessSupervisor | gastown_ui               |
| Agent monitoring dashboard | 4     | 3          | 12    | gt CLI            | gastown_ui               |
| Convoy tracking            | 4     | 3          | 12    | gt CLI            | gastown-frontend         |
| Mail system integration    | 3     | 3          | 9     | gt CLI            | gastown_ui               |
| Scene/Wave orchestration   | 4     | 4          | 8     | Dependency Graph  | foolery                  |
| Knowledge Panel (memory)   | 3     | 3          | 9     | Data access       | Beads-Kanban-UI          |
| SQL Explorer               | 3     | 4          | 6     | Data access       | -                        |
| Multi-rig support          | 3     | 4          | 6     | gt CLI            | gastown_ui               |
| Merge Queue visualization  | 3     | 3          | 9     | gt CLI            | gastown_ui               |
| Project Tags               | 2     | 2          | 8     | Issue list        | Beads-Kanban-UI          |
| Cross-Project View         | 3     | 4          | 6     | Multi-project     | Beads-Kanban-UI, foolery |

**Phase 5 Total Features**: 12
**Phase 5 Must-Have**: Gas-Town detection, gt CLI, Agent monitoring, Convoy tracking

---

## Future / Backlog

| Feature                              | Value | Complexity | Notes                          |
| ------------------------------------ | ----- | ---------- | ------------------------------ |
| URL State Sync                       | 2     | 2          | Nice for sharing views         |
| Dark Theme toggle                    | 2     | 2          | Theme already dark by default  |
| Multi-workspace auto-registration    | 2     | 3          | beads-ui feature               |
| Aging alerts (configurable)          | 2     | 3          | Email/notification integration |
| Plugin system                        | 2     | 5          | v2.0 feature                   |
| Mobile responsive                    | 2     | 4          | Low priority, desktop-first    |
| Custom dashboard builder             | 2     | 5          | v2.0 feature                   |
| External integrations (Linear, Jira) | 2     | 5          | Beads already has these        |

---

## Infrastructure / Cross-Cutting

These are required across all phases:

| Feature              | Complexity | Notes                          |
| -------------------- | ---------- | ------------------------------ |
| Keyboard navigation  | 2          | Implement incrementally        |
| Dark theme (default) | 1          | Built into design system       |
| Error handling       | 2          | ProcessSupervisor handles this |
| Loading states       | 1          | Standard Svelte patterns       |
| Responsive layout    | 2          | Desktop-first, basic mobile    |
| Accessibility (a11y) | 3          | WCAG 2.1 AA target             |

---

## Summary by Phase

| Phase              | Features | Must-Have | Time         |
| ------------------ | -------- | --------- | ------------ |
| Phase 1: MVP Core  | 14       | 7         | 4 weeks      |
| Phase 2: Analytics | 14       | 6         | 3 weeks      |
| Phase 3: Git       | 12       | 4         | 3 weeks      |
| Phase 4: Agents    | 11       | 4         | 4 weeks      |
| Phase 5: Gas-Town  | 12       | 4         | 4 weeks      |
| **Total**          | **63**   | **25**    | **18 weeks** |

---

## Feature Dependencies Graph

```
Phase 1 (Foundation)
├── Scaffolding
│   ├── ProcessSupervisor
│   │   ├── Create Issue
│   │   ├── Quick Status Change
│   │   └── Inline Editing
│   └── Data Access Layer
│       ├── Issue List
│       │   ├── Filters
│       │   ├── Search
│       │   ├── Kanban Board
│       │   └── Epics View
│       └── File Watching

Phase 2 (Analytics) ─────────────────────┐
├── Metrics Engine                       │
│   ├── Lead Time                        │
│   ├── Throughput                       │
│   ├── CFD                              │
│   └── Aging WIP                        │
└── Date Prefix Parsing                  │
    ├── Hierarchical Sorting             │
    └── Gantt Chart ─────────────────────┤
                                         │
Phase 3 (Git) ───────────────────────────┤
├── Worktree Listing                     │
│   └── Worktree Status                  │
├── PR Listing (gh)                      │
│   ├── PR Create/Merge                  │
│   └── CI Status                        │
└── Dependency Graph ◄───────────────────┤
    └── Dependency Arrows                │
                                         │
Phase 4 (Agents) ────────────────────────┤
├── Terminal Drawer                      │
│   ├── Agent Session Launch             │
│   ├── Session Streaming                │
│   └── Claude Planning                  │
└── Verification Queue                   │
    ├── Approve/Reject                   │
    └── ReTake                           │
                                         │
Phase 5 (Gas-Town) ◄─────────────────────┘
├── gt CLI Integration
│   ├── Agent Monitoring
│   ├── Convoy Tracking
│   └── Mail System
└── Scene/Wave Orchestration (uses Dependency Graph)
```

---

## Risk Assessment

### High Risk Features

| Feature              | Risk                 | Mitigation                         |
| -------------------- | -------------------- | ---------------------------------- |
| Terminal drawer      | xterm.js complexity  | Use foolery's implementation       |
| Gantt Chart          | Complex interactions | Start basic, iterate               |
| Claude Planning      | Session management   | Leverage existing Claude Code CLI  |
| Gas-Town integration | gt CLI stability     | Feature-flag, graceful degradation |

### Technical Debt Watch

| Area              | Risk                      | Prevention                      |
| ----------------- | ------------------------- | ------------------------------- |
| ProcessSupervisor | Concurrent command issues | Circuit breaker from gastown_ui |
| Data access       | SQLite/Dolt drift         | Unified abstraction layer       |
| Real-time updates | Race conditions           | Single source of truth pattern  |

---

## Next Steps

1. **Validate MVP feature set** with stakeholders
2. **Create detailed specs** for Phase 1 features
3. **Identify borrowable code** from existing tools
4. **Set up project scaffolding** and CI/CD
