# Git Integration Specification

This document specifies the Git integration layer for the Unified Beads WebUI, including worktree management, PR operations, and CI status tracking.

---

## Overview

Git integration provides:
- Worktree listing and status
- Pull request management via `gh` CLI
- CI/CD status display
- Dependency graph visualization

---

## gh CLI Authentication

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ App Start   │────▶│ Check Auth   │────▶│ Auth Status │
└─────────────┘     │ gh auth status│     │ Endpoint    │
                    └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┴───────────────────────────┐
                    │                                                       │
                    ▼                                                       ▼
            ┌───────────────┐                                     ┌─────────────────┐
            │ Authenticated │                                     │ Not Authenticated│
            │ Enable PR UI  │                                     │ Show Login Prompt│
            └───────────────┘                                     └────────┬────────┘
                                                                           │
                                                                           ▼
                                                                  ┌─────────────────┐
                                                                  │ gh auth login   │
                                                                  │ --web           │
                                                                  └─────────────────┘
```

### Auth Status Check

```typescript
// src/lib/git/auth.ts
interface GitHubAuthStatus {
  authenticated: boolean;
  user: string | null;
  scopes: string[];
  enterprise: boolean;
  host: string;
}

async function checkGitHubAuth(): Promise<GitHubAuthStatus> {
  try {
    const result = await supervisor.execute('gh', ['auth', 'status', '--json'], {
      timeout: 5000
    });

    if (result.exitCode === 0) {
      const data = JSON.parse(result.stdout);
      return {
        authenticated: true,
        user: data.user,
        scopes: data.scopes || [],
        enterprise: data.host !== 'github.com',
        host: data.host
      };
    }
  } catch (e) {
    // gh CLI not installed or not authenticated
  }

  return {
    authenticated: false,
    user: null,
    scopes: [],
    enterprise: false,
    host: 'github.com'
  };
}
```

### Login Flow

```typescript
// Trigger browser-based OAuth flow
async function initiateGitHubLogin(): Promise<void> {
  // This opens browser for OAuth
  await supervisor.execute('gh', ['auth', 'login', '--web'], {
    timeout: 120000  // 2 minutes for user interaction
  });
}

// Check required scopes for PR operations
function hasRequiredScopes(status: GitHubAuthStatus): boolean {
  const required = ['repo', 'read:org'];
  return required.every(scope => status.scopes.includes(scope));
}
```

### API Endpoint

```typescript
// GET /api/git/auth/status
interface AuthStatusResponse {
  authenticated: boolean;
  user: string | null;
  canCreatePR: boolean;
  canMergePR: boolean;
  loginUrl: string | null;
}
```

---

## Worktree Management

### Data Model

```typescript
interface Worktree {
  path: string;
  branch: string;
  head: string;          // Current commit SHA
  isMain: boolean;       // Is this the main worktree?
  beadsRedirect: boolean; // Is .beads symlinked to main?
  status: WorktreeStatus;
}

interface WorktreeStatus {
  ahead: number;         // Commits ahead of upstream
  behind: number;        // Commits behind upstream
  modified: number;      // Modified files count
  untracked: number;     // Untracked files count
  conflicted: number;    // Files with merge conflicts
  stashed: number;       // Stash entries
}
```

### Commands

| Command | Purpose | Timeout |
|---------|---------|---------|
| `bd worktree list --json` | List all worktrees | 10s |
| `git -C <path> status --porcelain` | Get file status | 5s |
| `git -C <path> rev-list --left-right --count HEAD...@{upstream}` | Ahead/behind | 5s |
| `bd worktree create <name> --branch <branch>` | Create worktree | 30s |
| `bd worktree remove <name>` | Remove worktree | 15s |

### beadsRedirect Explanation

When a worktree has `beadsRedirect: true`, its `.beads/` directory is a symlink to the main worktree's `.beads/` directory. This ensures all worktrees share the same issue database.

```
main-worktree/
├── .beads/           # Actual database
│   ├── beads.db
│   └── issues.jsonl
└── src/

feature-worktree/
├── .beads -> ../main-worktree/.beads  # Symlink
└── src/
```

---

## Pull Request Operations

### Data Model

```typescript
interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  author: string;
  branch: string;
  baseBranch: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  mergeable: boolean | null;
  mergeableState: 'clean' | 'dirty' | 'unstable' | 'blocked' | 'unknown';
  checks: CheckStatus;
  reviews: ReviewStatus;
  linkedIssues: string[];  // Beads issue IDs
}

interface CheckStatus {
  state: 'pending' | 'success' | 'failure' | 'error';
  total: number;
  passed: number;
  failed: number;
  pending: number;
  checks: Check[];
}

interface Check {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
  url: string;
}

interface ReviewStatus {
  state: 'approved' | 'changes_requested' | 'pending' | 'dismissed';
  approvals: number;
  required: number;
  reviews: Review[];
}

interface Review {
  author: string;
  state: 'approved' | 'changes_requested' | 'commented' | 'pending' | 'dismissed';
  submittedAt: Date;
}
```

### Commands

| Operation | Command | Timeout |
|-----------|---------|---------|
| List PRs | `gh pr list --json number,title,state,author,headRefName,baseRefName,url,isDraft,createdAt,updatedAt` | 15s |
| Get PR | `gh pr view <number> --json ...` | 10s |
| Create PR | `gh pr create --title <t> --body <b> --base <base> --head <head>` | 30s |
| Create Draft | `gh pr create --draft --title <t> --body <b>` | 30s |
| Merge PR | `gh pr merge <number> --squash\|--merge\|--rebase` | 30s |
| Get Checks | `gh pr checks <number> --json name,state,conclusion,detailsUrl` | 10s |

### PR-Issue Linking

Issues are linked to PRs via:

1. **Branch naming convention**: `<issue-id>/<description>` (e.g., `bd-123/add-login`)
2. **Commit message**: `[bd-123]` or `Fixes bd-123`
3. **PR body**: References like `Closes bd-123` or `Fixes #bd-123`

```typescript
function extractLinkedIssues(pr: PullRequest): string[] {
  const patterns = [
    /\b(bd-[a-z0-9]+)\b/gi,                    // bd-xxx anywhere
    /(?:closes?|fixes?|resolves?)\s+#?(bd-[a-z0-9]+)/gi  // Action keywords
  ];

  const sources = [pr.branch, pr.title, pr.body];
  const issues = new Set<string>();

  for (const source of sources) {
    for (const pattern of patterns) {
      const matches = source.matchAll(pattern);
      for (const match of matches) {
        issues.add(match[1].toLowerCase());
      }
    }
  }

  return Array.from(issues);
}
```

### Merge Conflict Handling

```typescript
interface MergeConflict {
  prNumber: number;
  files: string[];
  canResolveOnline: boolean;  // GitHub web editor
  resolutionUrl: string;
}

// Detect via mergeableState
function hasMergeConflicts(pr: PullRequest): boolean {
  return pr.mergeableState === 'dirty' || pr.mergeable === false;
}
```

---

## CI Status Integration

### Polling Strategy

```typescript
const CI_POLL_CONFIG = {
  interval: 30000,          // 30s between polls
  backoffMultiplier: 2,     // Double on rate limit
  maxInterval: 300000,      // Max 5 minutes
  activeOnly: true,         // Only poll open PRs with pending checks
};

class CIStatusPoller {
  private intervals = new Map<number, NodeJS.Timer>();

  startPolling(prNumber: number): void {
    if (this.intervals.has(prNumber)) return;

    const poll = async () => {
      try {
        const checks = await this.fetchChecks(prNumber);
        this.emit('checks:updated', { prNumber, checks });

        // Stop polling if all checks complete
        if (checks.pending === 0) {
          this.stopPolling(prNumber);
        }
      } catch (e) {
        if (e.status === 429) {
          // Rate limited - back off
          this.adjustInterval(prNumber, CI_POLL_CONFIG.backoffMultiplier);
        }
      }
    };

    this.intervals.set(prNumber, setInterval(poll, CI_POLL_CONFIG.interval));
    poll(); // Initial fetch
  }

  stopPolling(prNumber: number): void {
    const interval = this.intervals.get(prNumber);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(prNumber);
    }
  }
}
```

### Rate Limit Handling

```typescript
interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

async function executeWithRateLimit(
  command: string[],
  options?: ExecuteOptions
): Promise<CommandResult> {
  const result = await supervisor.execute('gh', command, options);

  // gh CLI includes rate limit info in headers
  // Parse from stderr if rate limited
  if (result.exitCode !== 0 && result.stderr.includes('rate limit')) {
    const resetMatch = result.stderr.match(/try again in (\d+)s/);
    const waitSeconds = resetMatch ? parseInt(resetMatch[1]) : 60;

    throw new RateLimitError(waitSeconds);
  }

  return result;
}
```

---

## WebSocket Events

### Git/PR Events

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `git:worktree:created` | Server → Client | `{ worktree: Worktree }` | `bd worktree create` |
| `git:worktree:removed` | Server → Client | `{ path: string }` | `bd worktree remove` |
| `git:worktree:updated` | Server → Client | `{ worktree: Worktree }` | File change in worktree |
| `git:pr:created` | Server → Client | `{ pr: PullRequest }` | `gh pr create` |
| `git:pr:updated` | Server → Client | `{ pr: PullRequest }` | PR state change |
| `git:pr:merged` | Server → Client | `{ prNumber: number }` | `gh pr merge` |
| `git:pr:closed` | Server → Client | `{ prNumber: number }` | PR closed |
| `git:checks:updated` | Server → Client | `{ prNumber: number, checks: CheckStatus }` | CI status change |
| `git:auth:changed` | Server → Client | `{ status: AuthStatus }` | Auth state change |

### Error Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `git:error` | Server → Client | `{ code: string, message: string, recoverable: boolean }` |
| `git:rate_limited` | Server → Client | `{ resetAt: Date, scope: 'pr' \| 'checks' }` |

---

## Dependency Graph

### Data Model

```typescript
interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  rootIds: string[];      // Entry point nodes
  leafIds: string[];      // Terminal nodes
}

interface DependencyNode {
  id: string;             // Issue ID
  label: string;          // Issue title (truncated)
  type: IssueType;
  status: IssueStatus;
  priority: number;
  assignee: string | null;
  isBlocked: boolean;     // Has unfulfilled blockedBy
  isBlocking: boolean;    // Has unfulfilled blocks
}

interface DependencyEdge {
  id: string;             // Unique edge ID
  source: string;         // Blocking issue ID
  target: string;         // Blocked issue ID
  type: 'blocks' | 'relates_to';
  satisfied: boolean;     // Source is closed
}
```

### Fetch Command

```typescript
// Get dependency tree for an issue
const result = await supervisor.execute('bd', [
  'dep', 'tree', issueId, '--json', '--depth', '5'
]);

interface DepTreeResult {
  root: string;
  nodes: {
    id: string;
    title: string;
    type: string;
    status: string;
    priority: number;
    assignee: string | null;
  }[];
  edges: {
    source: string;
    target: string;
    type: string;
  }[];
}
```

### Graph Layout

Using D3.js force-directed layout with constraints:

```typescript
import * as d3 from 'd3';

interface GraphOptions {
  width: number;
  height: number;
  nodeRadius: 20;
  linkDistance: 100;
  chargeStrength: -300;
}

function createForceSimulation(
  nodes: DependencyNode[],
  edges: DependencyEdge[],
  options: GraphOptions
): d3.Simulation<DependencyNode, DependencyEdge> {
  return d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges)
      .id(d => d.id)
      .distance(options.linkDistance))
    .force('charge', d3.forceManyBody()
      .strength(options.chargeStrength))
    .force('center', d3.forceCenter(options.width / 2, options.height / 2))
    .force('collision', d3.forceCollide(options.nodeRadius * 1.5));
}
```

### Performance Limits

| Metric | Limit | Behavior |
|--------|-------|----------|
| Max nodes | 100 | Paginate or collapse clusters |
| Max depth | 5 | Collapse deeper levels |
| Render target | < 500ms | Use Web Worker for layout |
| Memory | < 50MB | Virtual rendering for large graphs |

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/auth/status` | GET | Get GitHub auth status |
| `/api/git/auth/login` | POST | Initiate OAuth login |
| `/api/git/auth/logout` | POST | Clear GitHub credentials |

### Worktrees

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/worktrees` | GET | List all worktrees |
| `/api/git/worktrees` | POST | Create worktree |
| `/api/git/worktrees/[path]` | GET | Get worktree details |
| `/api/git/worktrees/[path]` | DELETE | Remove worktree |
| `/api/git/worktrees/[path]/status` | GET | Get worktree git status |

### Pull Requests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/prs` | GET | List PRs (with filters) |
| `/api/git/prs` | POST | Create PR |
| `/api/git/prs/[number]` | GET | Get PR details |
| `/api/git/prs/[number]/merge` | POST | Merge PR |
| `/api/git/prs/[number]/close` | POST | Close PR |
| `/api/git/prs/[number]/checks` | GET | Get CI status |
| `/api/git/prs/[number]/reviews` | GET | Get review status |

### Dependencies

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/dependencies/[issueId]` | GET | Get dependency graph |
| `/api/git/dependencies/[issueId]/tree` | GET | Get dependency tree |

---

## Error Handling

### Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `GH_NOT_INSTALLED` | gh CLI not found | Show installation instructions |
| `GH_NOT_AUTHENTICATED` | Not logged in | Show login prompt |
| `GH_RATE_LIMITED` | API rate limit hit | Back off, show countdown |
| `GH_NOT_FOUND` | PR/repo not found | Refresh data |
| `GH_PERMISSION_DENIED` | Insufficient permissions | Show required scopes |
| `GH_NETWORK_ERROR` | Network unreachable | Retry with backoff |
| `MERGE_CONFLICT` | PR has conflicts | Show conflict resolution UI |
| `CHECKS_FAILING` | CI checks failing | Show failing checks |
| `REVIEWS_REQUIRED` | More approvals needed | Show review status |

### Error Response Schema

```typescript
interface GitErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
    retryAfter?: number;  // Seconds until retry (rate limit)
  };
}
```

---

## Accessibility Requirements

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between graph nodes |
| `Enter` | Select/expand node |
| `Escape` | Deselect/close |
| `Arrow keys` | Navigate connected nodes |
| `+/-` | Zoom in/out |
| `Home` | Reset view |

### Screen Reader Support

- Graph nodes have `role="treeitem"` with `aria-label` describing issue
- Edges announced via `aria-describedby` on target nodes
- CI status badges have `aria-live="polite"` for updates
- PR list uses `role="list"` with proper item labeling

---

## References

- [CLI Integration](./cli-integration.md)
- [API Contract](./api-contract.md)
- [Phase 3: Git Integration](../phase/03-git-integration.md)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
