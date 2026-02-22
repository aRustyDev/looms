# Complete Feature Matrix

## Master Feature List

| Category                | Feature                  | beads-ui | beads-dashboard | Beads-Kanban-UI | beads-pm-ui | foolery    |
| ----------------------- | ------------------------ | -------- | --------------- | --------------- | ----------- | ---------- |
| **Core Views**          |                          |          |                 |                 |             |            |
|                         | Issues List/Table        | Y        | Y               | Y               | Y           | Y          |
|                         | Kanban Board             | Y        | Y               | Y               | Y           | -          |
|                         | Epics View               | Y        | Y               | Y               | Y           | Y          |
|                         | Gantt/Timeline           | -        | -               | -               | Y           | -          |
|                         | Metrics Dashboard        | -        | Y               | -               | -           | -          |
|                         | Dependency Graph         | -        | -               | -               | Y           | Y (Scenes) |
| **Issue Management**    |                          |          |                 |                 |             |            |
|                         | Create Issues            | Y        | Y               | Y               | Y           | Y          |
|                         | Batch Creation           | -        | Y               | -               | -           | -          |
|                         | Inline Editing           | Y        | Y               | Y               | Y           | -          |
|                         | Drag-and-Drop            | -        | Y               | Y               | Y           | -          |
|                         | Quick Status Change      | Y        | Y               | Y               | Y           | Y          |
| **Filtering**           |                          |          |                 |                 |             |            |
|                         | Text Search              | Y        | Y               | Y               | Y           | Y          |
|                         | Status Filter            | Y        | Y               | Y               | Y           | Y          |
|                         | Type Filter              | Y        | Y               | Y               | Y           | Y          |
|                         | Priority Filter          | Y        | Y               | Y               | Y           | Y          |
|                         | Owner/Assignee Filter    | Y        | Y               | Y               | Y           | Y          |
|                         | Quick Filters (presets)  | -        | Y               | Y               | Y           | -          |
| **Analytics**           |                          |          |                 |                 |             |            |
|                         | Lead Time Scatterplot    | -        | Y               | -               | -           | -          |
|                         | Aging WIP                | -        | Y               | -               | -           | -          |
|                         | CFD                      | -        | Y               | -               | -           | -          |
|                         | Throughput               | -        | Y               | -               | -           | -          |
|                         | Health Status (RAG)      | -        | Y               | -               | Y           | -          |
|                         | Progress Bars            | -        | Y               | Y               | Y           | -          |
| **Git Integration**     |                          |          |                 |                 |             |            |
|                         | Worktree Status          | -        | -               | Y               | -           | -          |
|                         | PR Create/View/Merge     | -        | -               | Y               | -           | -          |
|                         | CI Status                | -        | -               | Y               | -           | -          |
|                         | Merge Conflict Alerts    | -        | -               | Y               | -           | -          |
| **Agent/Orchestration** |                          |          |                 |                 |             |            |
|                         | Agent Config UI          | -        | -               | Y               | -           | -          |
|                         | Agent Session Terminal   | -        | -               | -               | -           | Y          |
|                         | Agent History            | -        | -               | -               | -           | Y          |
|                         | Scene/Wave Orchestration | -        | -               | -               | -           | Y          |
|                         | Claude Planning (Direct) | -        | -               | -               | -           | Y          |
|                         | Verification Queue       | -        | -               | -               | -           | Y          |
|                         | ReTake (retry workflow)  | -        | -               | -               | -           | Y          |
| **Knowledge/Memory**    |                          |          |                 |                 |             |            |
|                         | Memory Panel             | -        | -               | Y               | -           | -          |
|                         | Interaction History      | -        | -               | -               | -           | Y          |
| **Multi-Project**       |                          |          |                 |                 |             |            |
|                         | Project Switching        | Y        | Y               | Y               | -           | Y          |
|                         | Cross-Project View       | -        | -               | Y               | -           | Y          |
|                         | Project Tags             | -        | -               | Y               | -           | -          |
| **Real-time**           |                          |          |                 |                 |             |            |
|                         | File Watching            | Y        | Y               | Y               | -           | Y          |
|                         | WebSocket Updates        | -        | Y               | -               | -           | -          |
|                         | Auto-refresh             | Y        | Y               | Y               | -           | -          |
| **UX**                  |                          |          |                 |                 |             |            |
|                         | Keyboard Navigation      | Y        | -               | -               | Y           | Y          |
|                         | Keyboard Shortcuts       | Y        | -               | -               | Y           | Y          |
|                         | Dark Theme               | -        | Y               | -               | -           | Y          |
|                         | URL State Sync           | -        | -               | -               | Y           | -          |
| **Date/Time**           |                          |          |                 |                 |             |            |
|                         | Date Prefix Parsing      | -        | -               | -               | Y           | -          |
|                         | Hierarchical Sorting     | -        | -               | -               | Y           | -          |
|                         | Due Date Management      | -        | Y               | -               | Y           | -          |

---

## Unique Features by Project

### beads-ui Only

- Zero-setup design (`bdui start`)
- Multi-workspace auto-registration

### beads-dashboard Only

- Lean Metrics Dashboard (CFD, Lead Time, Throughput)
- Aging WIP Scatterplot
- Percentile calculations (P50, P85)
- Batch issue creation
- Aging alerts (configurable thresholds)

### Beads-Kanban-UI Only

- GitOps (PR create/view/merge, CI status)
- Memory Panel (knowledge.jsonl browsing)
- Agents Panel (.claude/agents/\*.md management)
- Related tasks links (bidirectional "see also")
- Worktree status (ahead/behind)
- Project tagging with colors

### beads-pm-ui Only

- Gantt Chart / Timeline View
- Date Prefix Parsing ([Q1], [H1], [W1], etc.)
- Hierarchical sorting (3YR → 1YR → H1 → Q1 → Month → Week)
- Health status calculation (RAG based on progress vs schedule)
- URL parameter sync for shareable views
- Dependency arrows visualization

### foolery Only

- Built-in Terminal (agent session monitoring)
- Scene/Wave Orchestration (dependency-aware execution)
- Direct Mode (Claude planning assistance)
- Verification Queue (Final Cut)
- ReTake (agent retry workflow)
- Beats table (main issue interface)
- Keyboard-first workflow design
