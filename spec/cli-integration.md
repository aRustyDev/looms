# CLI Integration Specification

This document defines how the Unified Beads WebUI integrates with the `bd` (Beads) and `gt` (Gas Town) command-line interfaces.

## Overview

The WebUI uses a **hybrid data access pattern**:
- **Writes**: All mutations flow through CLI commands via ProcessSupervisor
- **Reads**: Direct SQL queries for performance (see [data-flow.md](./data-flow.md))

This ensures data integrity (JSONL sync, Dolt commits, hooks) while maintaining query performance.

---

## ProcessSupervisor Integration

All CLI commands execute through ProcessSupervisor (borrowed from gastown_ui).

### Configuration

```typescript
const supervisor = new ProcessSupervisor({
  timeout: 30000,           // 30s default
  maxConcurrent: 4,         // Max simultaneous commands
  circuitBreaker: {
    threshold: 5,           // Failures before open
    resetTimeout: 60000     // 60s recovery period
  }
});
```

### Execution Pattern

```typescript
interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

// All commands use execFile (no shell injection)
const result = await supervisor.execute('bd', ['list', '--json']);
```

---

## bd CLI Commands

### Issue Management

#### `bd create` - Create Issue

**Purpose**: Create new issues with proper JSONL sync and Dolt commit.

| Flag | Type | Required | Description |
|------|------|----------|-------------|
| `[title]` | positional | Yes* | Issue title (*or use `--title`) |
| `-t, --type` | string | No | `bug\|feature\|task\|epic\|chore\|decision` (default: `task`) |
| `-p, --priority` | string | No | `0-4` or `P0-P4` (default: `2`) |
| `-d, --description` | string | No | Issue description |
| `-a, --assignee` | string | No | Assignee name |
| `-l, --labels` | strings | No | Comma-separated labels |
| `--parent` | string | No | Parent issue ID for hierarchy |
| `--deps` | strings | No | Dependencies in `type:id` format |
| `--due` | string | No | Due date (`+6h`, `tomorrow`, `2025-01-15`) |
| `--ephemeral` | bool | No | Create as wisp (not exported to JSONL) |
| `--silent` | bool | No | Output only issue ID |
| `--json` | bool | No | JSON output format |

**WebUI Usage**:
```typescript
// Create issue from form
await supervisor.execute('bd', [
  'create',
  '--title', form.title,
  '--type', form.type,
  '--priority', form.priority.toString(),
  '--description', form.description,
  '--labels', form.labels.join(','),
  '--json',
  '--silent'
]);
```

**Output Parsing**:
```typescript
// With --silent: returns just the ID
// stdout: "bd-abc123\n"

// With --json:
interface CreateResult {
  id: string;
  title: string;
  type: string;
  priority: number;
  created_at: string;
}
```

**Error Handling**:
| Exit Code | Meaning | Recovery |
|-----------|---------|----------|
| 0 | Success | Parse ID from stdout |
| 1 | Validation error | Show error to user |
| 2 | Database error | Retry with backoff |

**Timeout**: 10s (create is fast)

---

#### `bd update` - Update Issue

**Purpose**: Modify existing issues.

| Flag | Type | Description |
|------|------|-------------|
| `[id...]` | positional | Issue IDs (or uses last touched) |
| `-s, --status` | string | New status |
| `--title` | string | New title |
| `-d, --description` | string | New description |
| `-p, --priority` | string | New priority |
| `-a, --assignee` | string | New assignee |
| `--add-label` | strings | Add labels |
| `--remove-label` | strings | Remove labels |
| `--set-labels` | strings | Replace all labels |
| `--parent` | string | Reparent issue |
| `--claim` | bool | Atomic claim (assignee + in_progress) |
| `--due` | string | Due date |
| `--defer` | string | Defer until date |
| `--json` | bool | JSON output |

**WebUI Usage**:
```typescript
// Inline status change
await supervisor.execute('bd', [
  'update', issueId,
  '--status', newStatus,
  '--json'
]);

// Batch label update
await supervisor.execute('bd', [
  'update', ...issueIds,
  '--add-label', 'reviewed',
  '--json'
]);

// Drag-and-drop priority change
await supervisor.execute('bd', [
  'update', issueId,
  '--priority', newPriority.toString()
]);
```

**Optimistic Updates**:
```typescript
// Update UI immediately, revert on failure
store.optimisticUpdate(issueId, { status: newStatus });
try {
  await supervisor.execute('bd', ['update', issueId, '--status', newStatus]);
} catch (e) {
  store.revert(issueId);
  showError(e);
}
```

**Timeout**: 10s

---

#### `bd close` - Close Issue

**Purpose**: Close issues with reason tracking.

| Flag | Type | Description |
|------|------|-------------|
| `[id...]` | positional | Issue IDs |
| `-r, --reason` | string | Closure reason |
| `--continue` | bool | Auto-advance to next molecule step |
| `--suggest-next` | bool | Show newly unblocked issues |
| `-f, --force` | bool | Force close (ignore gates/pins) |
| `--session` | string | Claude session ID |

**WebUI Usage**:
```typescript
// Close with reason
await supervisor.execute('bd', [
  'close', issueId,
  '--reason', 'Implemented in PR #123'
]);

// Close from agent session
await supervisor.execute('bd', [
  'close', issueId,
  '--session', sessionId,
  '--suggest-next'
]);
```

**Timeout**: 10s

---

#### `bd list` - List Issues

**Purpose**: Query issues with filters. Use for simple queries; prefer direct SQL for analytics.

| Flag | Type | Description |
|------|------|-------------|
| `-s, --status` | string | Filter by status |
| `-t, --type` | string | Filter by type |
| `-p, --priority` | string | Filter by priority |
| `-a, --assignee` | string | Filter by assignee |
| `-l, --label` | strings | Filter by labels (AND) |
| `--label-any` | strings | Filter by labels (OR) |
| `--parent` | string | Filter by parent |
| `--ready` | bool | Show ready issues only |
| `--overdue` | bool | Show overdue only |
| `-n, --limit` | int | Result limit (default 50) |
| `--sort` | string | Sort field |
| `-r, --reverse` | bool | Reverse sort |
| `--json` | bool | JSON output |
| `--pretty` | bool | Tree format |

**WebUI Usage**:
```typescript
// Quick filter for UI
const result = await supervisor.execute('bd', [
  'list',
  '--status', 'open',
  '--assignee', currentUser,
  '--json',
  '--limit', '100'
]);

const issues = JSON.parse(result.stdout);
```

**Output Format** (--json):
```typescript
interface ListResult {
  issues: Issue[];
  total: number;
  truncated: boolean;
}
```

**Timeout**: 15s (may be slow for large datasets)

**Note**: For analytics dashboards, use direct SQL instead:
```sql
SELECT * FROM issues WHERE status = 'open' ORDER BY priority;
```

---

#### `bd query` - Query with Expression Language

**Purpose**: Complex filtering with boolean operators.

**Syntax**:
```
field=value       Equality
field!=value      Inequality
field>value       Greater than
field<value       Less than
expr AND expr     Both match
expr OR expr      Either matches
NOT expr          Negation
(expr)            Grouping
```

**Supported Fields**: `status`, `priority`, `type`, `assignee`, `owner`, `label`, `title`, `description`, `created`, `updated`, `closed`, `id`, `parent`

**Date Values**: `7d`, `24h`, `2w`, `tomorrow`, `2025-01-15`

**WebUI Usage**:
```typescript
// Advanced search
const result = await supervisor.execute('bd', [
  'query',
  'status=open AND priority<2 AND updated>7d',
  '--json'
]);

// Find unassigned bugs
const result = await supervisor.execute('bd', [
  'query',
  'type=bug AND assignee=none AND NOT status=closed',
  '--json'
]);
```

**Timeout**: 15s

---

### Dependency Management

#### `bd dep add` - Add Dependency

```typescript
// blocker blocks blocked
await supervisor.execute('bd', [
  'dep', 'add', blockedId, blockerId
]);

// Or using shorthand
await supervisor.execute('bd', [
  'dep', blockerId, '--blocks', blockedId
]);
```

#### `bd dep list` - List Dependencies

```typescript
const result = await supervisor.execute('bd', [
  'dep', 'list', issueId, '--json'
]);

interface DepListResult {
  blocks: string[];      // Issues this blocks
  blocked_by: string[];  // Issues blocking this
  relates_to: string[];  // Related issues
}
```

#### `bd dep remove` - Remove Dependency

```typescript
await supervisor.execute('bd', [
  'dep', 'remove', blockedId, blockerId
]);
```

#### `bd dep tree` - Dependency Tree

```typescript
// For visualization
const result = await supervisor.execute('bd', [
  'dep', 'tree', issueId, '--json'
]);
```

**Timeout**: 10s for all dep commands

---

### Label Management

#### `bd label add`

```typescript
await supervisor.execute('bd', [
  'label', 'add', issueId, 'urgent', 'needs-review'
]);
```

#### `bd label remove`

```typescript
await supervisor.execute('bd', [
  'label', 'remove', issueId, 'needs-review'
]);
```

#### `bd label list`

```typescript
const result = await supervisor.execute('bd', [
  'label', 'list', issueId, '--json'
]);
// Returns: string[]
```

#### `bd label list-all`

```typescript
// For autocomplete
const result = await supervisor.execute('bd', [
  'label', 'list-all', '--json'
]);
// Returns: { label: string; count: number }[]
```

**Timeout**: 5s

---

### SQL Access

#### `bd sql` - Execute Raw SQL

**Purpose**: Direct database queries. Supports both SQLite and Dolt backends.

| Flag | Type | Description |
|------|------|-------------|
| `<query>` | positional | SQL query |
| `--json` | bool | JSON output |
| `--csv` | bool | CSV output |

**WebUI Usage**:
```typescript
// Analytics query
const result = await supervisor.execute('bd', [
  'sql', '--json',
  `SELECT
     DATE(closed_at) as date,
     COUNT(*) as count
   FROM issues
   WHERE closed_at > DATE('now', '-30 days')
   GROUP BY DATE(closed_at)`
]);
```

**Input Validation**:
```typescript
// CRITICAL: Validate queries are SELECT-only for safety
function validateReadOnlyQuery(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return normalized.startsWith('SELECT') &&
         !normalized.includes('INSERT') &&
         !normalized.includes('UPDATE') &&
         !normalized.includes('DELETE') &&
         !normalized.includes('DROP') &&
         !normalized.includes('ALTER');
}
```

**Timeout**: 30s (complex queries)

**Note**: For writes, always use the appropriate `bd` command, never `bd sql` with INSERT/UPDATE.

---

### Git Operations

#### `bd hooks install`

```typescript
// During setup
await supervisor.execute('bd', ['hooks', 'install']);
```

#### `bd hooks list`

```typescript
const result = await supervisor.execute('bd', [
  'hooks', 'list', '--json'
]);

interface HooksStatus {
  pre_commit: boolean;
  post_merge: boolean;
  pre_push: boolean;
  post_checkout: boolean;
  prepare_commit_msg: boolean;
}
```

#### `bd worktree create`

```typescript
await supervisor.execute('bd', [
  'worktree', 'create', worktreeName,
  '--branch', branchName
]);
```

#### `bd worktree list`

```typescript
const result = await supervisor.execute('bd', [
  'worktree', 'list', '--json'
]);

interface Worktree {
  path: string;
  branch: string;
  head: string;
  beads_redirect: boolean;
}
```

**Timeout**: 30s (git operations can be slow)

---

### Molecule Operations

#### `bd mol pour` - Instantiate Molecule

```typescript
// Create persistent molecule from formula
const result = await supervisor.execute('bd', [
  'mol', 'pour', formulaId,
  '--var', 'component=auth',
  '--var', 'sprint=2',
  '--json'
]);

interface MolPourResult {
  molecule_id: string;
  children: string[];
}
```

#### `bd mol wisp` - Create Ephemeral Molecule

```typescript
// For temporary work (auto-expires)
const result = await supervisor.execute('bd', [
  'mol', 'wisp', formulaId,
  '--var', 'task=review',
  '--json'
]);
```

#### `bd mol show`

```typescript
const result = await supervisor.execute('bd', [
  'mol', 'show', moleculeId, '--json'
]);

interface MolShowResult {
  id: string;
  type: 'swarm' | 'patrol' | 'work';
  children: { id: string; status: string }[];
  variables: Record<string, string>;
  progress: { done: number; total: number };
}
```

**Timeout**: 15s

---

## gt CLI Commands

### Status and Health

#### `gt status` - Town Status

```typescript
const result = await supervisor.execute('gt', [
  'status', '--json', '--fast'
]);

interface TownStatus {
  name: string;
  rigs: RigStatus[];
  polecats: PolecatStatus[];
  daemon_running: boolean;
  dolt_server: boolean;
}
```

**Timeout**: 10s (--fast skips mail lookups)

#### `gt doctor` - Health Checks

```typescript
const result = await supervisor.execute('gt', [
  'doctor', '--json'
]);

interface DoctorResult {
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    fixable: boolean;
  }[];
  overall: 'healthy' | 'degraded' | 'unhealthy';
}
```

**Timeout**: 60s (runs many checks)

---

### Mail System

#### `gt mail inbox`

```typescript
const result = await supervisor.execute('gt', [
  'mail', 'inbox', '--json'
]);

interface MailInbox {
  messages: {
    id: string;
    from: string;
    subject: string;
    timestamp: string;
    read: boolean;
  }[];
  unread_count: number;
}
```

#### `gt mail send`

```typescript
await supervisor.execute('gt', [
  'mail', 'send',
  '--to', recipient,
  '--subject', subject,
  '--body', body
]);
```

#### `gt mail read`

```typescript
const result = await supervisor.execute('gt', [
  'mail', 'read', messageId, '--json'
]);
```

**Timeout**: 10s

---

### Convoy Management

#### `gt convoy create`

```typescript
const result = await supervisor.execute('gt', [
  'convoy', 'create',
  '--title', 'Feature: Auth System',
  ...issueIds,
  '--json'
]);

interface ConvoyCreateResult {
  convoy_id: string;
  tracked_issues: string[];
}
```

#### `gt convoy status`

```typescript
const result = await supervisor.execute('gt', [
  'convoy', 'status', convoyId, '--json'
]);

interface ConvoyStatus {
  id: string;
  title: string;
  status: 'active' | 'landed' | 'stranded';
  issues: {
    id: string;
    status: string;
    assignee: string;
  }[];
  progress: { done: number; total: number };
}
```

#### `gt convoy list`

```typescript
const result = await supervisor.execute('gt', [
  'convoy', 'list', '--json'
]);
```

**Timeout**: 15s

---

### Agent Operations

#### `gt sling` - Dispatch Work

The primary command for assigning work to agents.

```typescript
// Sling to polecat (auto-spawn)
await supervisor.execute('gt', [
  'sling', issueId, rigName,
  '--create',  // Create polecat if needed
  '--json'
]);

// Sling with merge strategy
await supervisor.execute('gt', [
  'sling', issueId, rigName,
  '--merge', 'mr',  // or 'direct', 'local'
  '--json'
]);

// Sling with natural language args
await supervisor.execute('gt', [
  'sling', issueId, rigName,
  '--args', 'focus on security review',
  '--json'
]);
```

**Timeout**: 30s (may spawn polecat)

#### `gt polecat list`

```typescript
const result = await supervisor.execute('gt', [
  'polecat', 'list', '--rig', rigName, '--json'
]);

interface PolecatList {
  polecats: {
    name: string;
    status: 'working' | 'stalled' | 'zombie' | 'nuked';
    current_issue: string | null;
    session_id: string | null;
  }[];
}
```

#### `gt polecat status`

```typescript
const result = await supervisor.execute('gt', [
  'polecat', 'status', polecatName, '--json'
]);
```

**Timeout**: 10s

---

### Rig Management

#### `gt rig list`

```typescript
const result = await supervisor.execute('gt', [
  'rig', 'list', '--json'
]);

interface RigList {
  rigs: {
    name: string;
    prefix: string;
    path: string;
    status: 'active' | 'parked' | 'docked';
    witness_running: boolean;
    refinery_running: boolean;
  }[];
}
```

#### `gt rig status`

```typescript
const result = await supervisor.execute('gt', [
  'rig', 'status', rigName, '--json'
]);

interface RigStatus {
  name: string;
  prefix: string;
  polecats: { name: string; status: string }[];
  witness: { running: boolean; pid: number };
  refinery: { running: boolean; pid: number };
  open_issues: number;
  active_convoys: number;
}
```

#### `gt rig start/stop`

```typescript
// Start rig agents
await supervisor.execute('gt', ['rig', 'start', rigName]);

// Stop rig agents
await supervisor.execute('gt', ['rig', 'stop', rigName]);
```

**Timeout**: 30s

---

## Error Handling

### Exit Codes

| Code | Meaning | bd | gt |
|------|---------|----|----|
| 0 | Success | ✓ | ✓ |
| 1 | General error / invalid args | ✓ | ✓ |
| 2 | Database error | ✓ | ✓ |
| 3 | Resource not found | ✓ | ✓ |
| 4 | Permission denied | ✓ | ✓ |
| 5 | Timeout | ✓ | ✓ |

### Error Categories

```typescript
type CLIErrorCategory =
  | 'validation'      // Invalid input
  | 'not_found'       // Resource doesn't exist
  | 'conflict'        // Concurrent modification
  | 'database'        // DB connection/query error
  | 'permission'      // Access denied
  | 'timeout'         // Command exceeded timeout
  | 'circuit_open';   // Circuit breaker tripped

function categorizeError(result: CommandResult): CLIErrorCategory {
  if (result.exitCode === 0) return null;

  const stderr = result.stderr.toLowerCase();

  if (stderr.includes('not found') || stderr.includes('no such'))
    return 'not_found';
  if (stderr.includes('already exists') || stderr.includes('conflict'))
    return 'conflict';
  if (stderr.includes('database') || stderr.includes('sql'))
    return 'database';
  if (stderr.includes('permission') || stderr.includes('denied'))
    return 'permission';
  if (result.duration >= supervisor.timeout)
    return 'timeout';

  return 'validation';
}
```

### Recovery Strategies

| Category | Strategy |
|----------|----------|
| `validation` | Show error to user, no retry |
| `not_found` | Refresh data, show error |
| `conflict` | Refresh data, show conflict resolution UI |
| `database` | Retry 3x with exponential backoff |
| `permission` | Show error, suggest reauthentication |
| `timeout` | Retry once with 2x timeout |
| `circuit_open` | Show degraded mode, retry after reset |

---

## Timeout and Retry Policies

### Default Timeouts

| Command Category | Timeout | Retries |
|-----------------|---------|---------|
| Create/Update/Close | 10s | 2 |
| List/Query | 15s | 1 |
| SQL queries | 30s | 1 |
| Git operations | 30s | 1 |
| Molecule operations | 15s | 1 |
| gt agent operations | 30s | 0 |
| gt doctor | 60s | 0 |

### Retry Logic

```typescript
async function executeWithRetry(
  cmd: string,
  args: string[],
  options: {
    maxRetries: number;
    baseTimeout: number;
    backoffMultiplier: number;
  }
): Promise<CommandResult> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    const timeout = options.baseTimeout * Math.pow(options.backoffMultiplier, attempt);

    try {
      return await supervisor.execute(cmd, args, { timeout });
    } catch (e) {
      lastError = e;

      // Don't retry validation errors
      if (categorizeError(e.result) === 'validation') throw e;

      // Wait before retry
      if (attempt < options.maxRetries) {
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}
```

---

## Input Validation

### Issue ID Format

```typescript
const ISSUE_ID_PATTERN = /^[a-z]+-[a-z0-9]+$/i;

function validateIssueId(id: string): boolean {
  return ISSUE_ID_PATTERN.test(id);
}
```

### Status Values

```typescript
const VALID_STATUSES = ['open', 'in_progress', 'blocked', 'deferred', 'closed'];

function validateStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}
```

### Priority Values

```typescript
function validatePriority(priority: string | number): boolean {
  const p = typeof priority === 'string'
    ? priority.replace(/^P/i, '')
    : priority.toString();
  const num = parseInt(p, 10);
  return num >= 0 && num <= 4;
}
```

### Type Values

```typescript
const VALID_TYPES = ['bug', 'feature', 'task', 'epic', 'chore', 'decision'];

function validateType(type: string): boolean {
  return VALID_TYPES.includes(type);
}
```

### Shell Injection Prevention

```typescript
// ProcessSupervisor uses execFile, not exec
// Arguments are passed as array, never interpolated into shell command
// This prevents injection attacks

// SAFE:
supervisor.execute('bd', ['create', '--title', userInput]);

// NEVER DO THIS (and ProcessSupervisor doesn't support it):
// exec(`bd create --title "${userInput}"`);
```

---

## Output Parsing

### JSON Output

All commands support `--json` flag for structured output.

```typescript
async function parseJsonOutput<T>(result: CommandResult): Promise<T> {
  if (!result.success) {
    throw new CLIError(result.stderr, result.exitCode);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (e) {
    throw new ParseError(`Failed to parse JSON: ${result.stdout}`);
  }
}
```

### Issue Format

```typescript
interface Issue {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: number;
  assignee: string | null;
  labels: string[];
  description: string | null;
  notes: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_at: string | null;
  defer_until: string | null;
}
```

### Date Parsing

```typescript
// bd outputs ISO 8601 dates
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr);
}
```

---

## WebUI Integration Patterns

### Issue Creation Form

```typescript
async function createIssue(form: IssueFormData): Promise<string> {
  const args = ['create', '--json', '--silent'];

  args.push('--title', form.title);
  args.push('--type', form.type);
  args.push('--priority', form.priority.toString());

  if (form.description) args.push('--description', form.description);
  if (form.assignee) args.push('--assignee', form.assignee);
  if (form.labels.length) args.push('--labels', form.labels.join(','));
  if (form.parent) args.push('--parent', form.parent);
  if (form.due) args.push('--due', form.due);

  const result = await supervisor.execute('bd', args);
  return result.stdout.trim();
}
```

### Inline Status Change

```typescript
async function changeStatus(issueId: string, newStatus: string): Promise<void> {
  // Optimistic update
  issueStore.update(issueId, { status: newStatus });

  try {
    await supervisor.execute('bd', ['update', issueId, '--status', newStatus]);
  } catch (e) {
    // Revert on failure
    issueStore.revert(issueId);
    throw e;
  }
}
```

### Batch Operations

```typescript
async function batchAddLabel(issueIds: string[], label: string): Promise<void> {
  // bd update supports multiple IDs
  await supervisor.execute('bd', [
    'update',
    ...issueIds,
    '--add-label', label
  ]);
}
```

### Agent Dispatch

```typescript
async function dispatchToAgent(issueId: string, rig: string): Promise<void> {
  await supervisor.execute('gt', [
    'sling', issueId, rig,
    '--create',
    '--merge', 'mr'
  ]);
}
```

---

## References

- [Data Flow Diagrams](./data-flow.md)
- [ProcessSupervisor Pattern](../references/borrowable-components.md#processsupervisor-gastownui)
- [ADR-0005: CLI for Writes](../adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [bd CLI Documentation](https://github.com/your-org/beads)
- [gt CLI Documentation](https://github.com/your-org/gastown)
