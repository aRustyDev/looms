# Borrowable Components from Existing Work

## Component Sources

| Component | Source | License | Status |
|-----------|--------|---------|--------|
| ProcessSupervisor | gastown_ui | MIT | Production-ready |
| 70+ Svelte components | gastown_ui | MIT | Full design system |
| Metrics calculations | beads-dashboard | MIT | Tested, 100% coverage |
| Date prefix parsing | beads-pm-ui | MIT | Complete logic |
| Gantt Chart component | beads-pm-ui | MIT | Interactive timeline |
| Terminal drawer | foolery | MIT | xterm.js integration |
| Keyboard shortcuts system | foolery | MIT | Full overlay |
| Scene orchestration UI | foolery | MIT | Wave-based execution |

---

## ProcessSupervisor (gastown_ui)

Safe CLI execution with circuit breaker pattern.

**Location**: `src/lib/server/cli/process-supervisor.ts`

**Features**:
- No-shell command execution via `execFile` (security)
- Configurable timeouts (30-second default)
- Concurrency limiting (max 4 simultaneous commands)
- Circuit breaker protection (5 failures → 60s reset)
- Request deduplication for identical commands
- Process tracking with cleanup on destruction

**Usage Pattern**:
```typescript
const supervisor = new ProcessSupervisor({
  timeout: 30000,
  maxConcurrent: 4,
  circuitBreaker: {
    threshold: 5,
    resetTimeout: 60000
  }
});

const result = await supervisor.execute('bd', ['list', '--json']);
```

---

## Metrics Calculations (beads-dashboard)

**Location**: `src/client/utils/metricsCalculations.ts`

**Functions**:
- `calculateLeadTime(issues)` - Average time from created to closed
- `calculateThroughput(issues, days)` - Closed issues per day
- `calculateCFDData(issues)` - Cumulative flow diagram data
- `calculateAgingWIP(issues)` - Work item age distribution
- `calculatePercentiles(values, [50, 85])` - P50/P85 calculations

**Test Coverage**: 100%

---

## Date Prefix Parsing (beads-pm-ui)

**Location**: `src/lib/dates.ts`

**Supported Prefixes**:
| Prefix | Level | Date Range |
|--------|-------|------------|
| `[3YR]` | Multi-year | 3 years from reference |
| `[1YR]` | Annual | Full year |
| `[H1]` | Half-year | Jan 1 - Jun 30 |
| `[H2]` | Half-year | Jul 1 - Dec 31 |
| `[Q1]` | Quarterly | Jan 1 - Mar 31 |
| `[Q2]` | Quarterly | Apr 1 - Jun 30 |
| `[Q3]` | Quarterly | Jul 1 - Sep 30 |
| `[Q4]` | Quarterly | Oct 1 - Dec 31 |
| `[JAN]`-`[DEC]` | Monthly | Full month |
| `[W1]`-`[W52]` | Weekly | 7-day period |

**Functions**:
- `parseDatePrefix(title)` - Returns `{ start, end, level }`
- `getHierarchyLevel(prefix)` - Returns numeric level for sorting
- `sortByHierarchy(issues)` - Sorts by level, then chronologically

---

## Gantt Chart (beads-pm-ui)

**Location**: `src/components/GanttChart.tsx`

**Features**:
- Drag to move/resize tasks
- Dependency arrows
- Zoom controls (day/week/month/quarter)
- Layer-based rendering
- Progress bar overlays

**Props**:
```typescript
interface GanttChartProps {
  issues: Issue[];
  dependencies: Dependency[];
  onIssueUpdate: (id: string, updates: Partial<Issue>) => void;
  zoomLevel: 'day' | 'week' | 'month' | 'quarter';
}
```

---

## Terminal Drawer (foolery)

**Location**: `src/components/Terminal.tsx`

**Features**:
- xterm.js integration
- Session persistence
- Output streaming
- Command history
- Keyboard shortcuts (Shift+T to toggle)

**Dependencies**:
- `xterm`
- `xterm-addon-fit`
- `xterm-addon-web-links`

---

## Keyboard Shortcuts (foolery)

**Location**: `src/lib/shortcuts.ts`

**Pattern**:
```typescript
const shortcuts = {
  'Shift+H': { action: 'toggleHelp', description: 'Toggle shortcut help' },
  'Shift+S': { action: 'startAgent', description: 'Take! (start agent session)' },
  'Shift+V': { action: 'verify', description: 'Verify focused beat' },
  // ...
};
```

**Features**:
- Global key listener
- Overlay display (Shift+H)
- Context-aware (different shortcuts per view)
- Chord support

---

## Scene Orchestration (foolery)

**Location**: `src/components/Scenes.tsx`

**Features**:
- Wave visualization (dependency-aware grouping)
- Keyboard navigation (arrow keys)
- Zoom in/out on depth
- Slug renaming
- Single-shortcut execution trigger

**Data Structure**:
```typescript
interface Scene {
  id: string;
  name: string;
  waves: Wave[];
}

interface Wave {
  depth: number;
  beats: Beat[];
  canExecute: boolean; // All dependencies resolved
}
```

---

## 70+ Svelte Components (gastown_ui)

**Location**: `src/lib/components/`

**Categories**:
- **Core UI**: Button, Badge, Input, Switch, Select, Dialog
- **Layout**: DashboardLayout, PageHeader, SplitView, Sidebar
- **Status**: StatusIndicator, HealthBadge, AgentStateIcon
- **Loading**: Spinner, Skeleton, ProgressBar
- **Accessibility**: FocusTrap, LiveRegion, SkipLink

**Design Tokens**:
```css
--success: /* green variants */
--warning: /* yellow variants */
--info: /* blue variants */
--destructive: /* red variants */
--status-online: /* agent online */
--status-offline: /* agent offline */
--status-pending: /* awaiting */
--status-idle: /* inactive */
```
