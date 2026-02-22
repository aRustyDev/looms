# Gas-Town WebUI Reference

## Overview

Gas-Town is Steve Yegge's multi-agent orchestration framework for AI-assisted coding. It manages colonies of 20-30 parallel AI coding agents (primarily Claude Code) through a hierarchy of roles.

---

## Available Gas-Town WebUIs

### 1. bigsky77/gastown-frontend

**Repository**: https://github.com/bigsky77/gastown-frontend

**Description**: "Gas Town Control Center - Web dashboard for multi-agent orchestration"

#### Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Express.js (Node.js) |
| Frontend | Next.js with React |
| Real-time | WebSocket protocol |
| Styling | Custom CSS with dark theme |
| Languages | 95.9% JavaScript, 3.6% CSS, 0.5% Shell |

#### Architecture
```
gastown-frontend/
├── api/          # Express server wrapping gt CLI
├── frontend/     # Next.js React application
└── lib/          # Shared utilities
```

#### Features
- Convoy tracking with progress indicators
- Issue list with filtering (status, type, assignee)
- Agent message inbox
- Real-time event feed
- Rig overview

#### API Endpoints (18+)
- `/api/status` - System status
- `/api/convoys` - Convoy CRUD
- `/api/issues` - Issue tracking
- `/api/mail` - Agent messaging
- `/api/agents` - Agent listing
- `/api/polecats` - Sub-agents
- `/api/sling` - Work distribution

#### Real-time Communication
- WebSocket: `ws://localhost:3001/ws`
- Streams: Convoy updates (5s), new events, status changes

---

### 2. Avyukth/gastown_ui

**Repository**: https://github.com/Avyukth/gastown_ui

**Description**: "Operator console for the Gas Town multi-agent orchestration system"

#### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2.x |
| Build | Vite 6.x |
| Styling | Tailwind CSS + tailwind-variants |
| Icons | lucide-svelte |
| Validation | Zod schemas |
| Runtime | Bun (preferred) or Node.js 18+ |

#### Core Features (12 major areas)
1. **Agent Monitoring**: Dashboard for Mayor, Deacon, Witness, Refinery, Polecat
2. **Work Management**: Issue browsing with filtering
3. **Queue Operations**: Merge queue tracking per rig
4. **Communication**: Agent mailbox with compose
5. **Escalation Handling**: Decisions, conflicts, failures
6. **Batch Operations**: Convoy tracking across rigs
7. **Workflow Management**: Molecule and formula orchestration
8. **System Health**: Daemon heartbeat, three-tier watchdog
9. **Activity Feed**: Real-time event logging

#### ProcessSupervisor Pattern
```typescript
// Safe CLI execution with protections
ProcessSupervisor:
├── No-shell execution (execFile) // Security
├── 30-second timeout per command
├── Max 4 concurrent commands
├── Circuit breaker (5 failures → 60s reset)
├── Request deduplication
└── Process tracking with cleanup
```

#### CLI Integration
Communicates with two CLIs:
- `gt` (~`~/go/bin/gt`): Town operations (status, mail, convoys, agents)
- `bd` (~`~/.local/bin/bd`): Beads operations (issues, workflows, molecules)

#### API Routes
```
/api/gastown/
├── /status
├── /agents, /agents/[id], /agents/[id]/logs, /agents/[id]/reboot
├── /mail, /mail/[id]
├── /convoys, /convoys/[id]
├── /queue
├── /rigs
├── /health
├── /workflows
├── /work/issues
├── /escalations/[id]/resolve
├── /diagnostics
└── /snapshot
```

#### Real-time Communication
- WebSocket with exponential backoff (1s base, 30s max, 20% jitter)
- Heartbeat/ping-pong (30s interval, 5s timeout)
- Browser online/offline integration

#### Security
- Content Security Policy headers
- CSRF double-submit cookies
- HttpOnly authentication cookies
- HSTS in production

#### Design System
- 70+ Svelte 5 components
- Semantic color tokens (success, warning, info, destructive)
- Agent state colors (online, offline, pending, idle)
- Typography: Inter (body), Space Grotesk (headlines), JetBrains Mono (code)

---

## Key Patterns to Borrow

### From gastown-frontend
- Simple Express → CLI wrapper pattern
- WebSocket event streaming
- Convoy progress visualization

### From gastown_ui
- **ProcessSupervisor**: Robust CLI execution
- **70+ Component Library**: Full design system
- **Circuit Breaker**: Failure protection
- **SvelteKit Architecture**: Server-side rendering + API routes
- **Tailwind-variants**: Component styling patterns
