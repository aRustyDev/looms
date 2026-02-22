# Unified Beads WebUI Requirements

## Core Requirements

### Data Access
- **Read Operations**: Direct against SQLite or Dolt for complex analytics
- **Write Operations**: Always via `bd` CLI to prevent drift
- **Context Awareness**: Tool is aware of beads and gastown configs

### Views
- Kanban Board
- Task dependency graph
- Metrics Dashboard (query-only)
- Gantt Chart / Timeline View
- Direct SQL table interaction for exploration

### Analytics
- Lean Metrics Dashboard (CFD, Lead Time, Throughput)
- Aging WIP Scatterplot
- Health Status (RAG)

### Git Integration
- PR create/view/merge, CI status
- Worktree Status + Listing

### Agent/Orchestration
- Agent session monitoring
- Verification Queue
- Direct Claude planning assistance (Claude-code CLI, session-aware)
- Agent retry workflow

### Knowledge Management
- Knowledge browsing (JSONL, SQLite, or Dolt)
- Related Tasks Links

### Issue Management
- Inline Editing of beads Issues, Epics, etc
- Drag-and-Drop functionality
- Batch Issue Creation

### Date/Time
- Strongly typed Date Prefix Parsing ([Q1], [H1], [W1])

### Integration
- Integrate with Gastown for Multi-Agent Orchestration

---

## Feature Categories

### MVP (Phase 1)
1. Core Kanban Board
2. Issue list with filters
3. Basic inline editing
4. `bd` CLI integration for writes
5. Direct SQL read for basic queries
6. Real-time file watching

### Phase 2
1. Metrics Dashboard (CFD, Lead Time, Throughput)
2. Aging WIP Scatterplot
3. Gantt Chart / Timeline View
4. Date Prefix Parsing
5. Health Status (RAG)

### Phase 3
1. Git Integration (PR, CI, Worktree)
2. Dependency Graph visualization
3. Batch Issue Creation
4. Drag-and-Drop

### Phase 4
1. Agent Session Monitoring
2. Verification Queue
3. Agent Retry Workflow
4. Claude Planning Assistance

### Phase 5
1. Gas-Town Integration
2. Knowledge Browsing
3. Multi-Agent Orchestration
4. SQL Explorer

---

## Non-Functional Requirements

### Performance
- < 100ms for issue list rendering
- < 500ms for dashboard metrics calculation
- Real-time updates within 1s of file change

### Security
- No shell execution (execFile only)
- CLI command whitelisting
- Input sanitization

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

### Compatibility
- SQLite backend support
- Dolt backend support
- JSONL file support
- macOS, Linux primary; Windows secondary
