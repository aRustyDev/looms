# Beads Database Schema Reference

## Tables Overview (Dolt Backend)

```
Tables_in_beads_dotfiles
------------------------
blocked_issues
child_counters
comments
compaction_snapshots
config
dependencies
events
federation_peers
interactions
issue_snapshots
issues
labels
metadata
ready_issues
repo_mtimes
routes
(16 rows)
```

---

## Core Tables

### issues (53 columns)

Primary issue storage table.

| Field | Type | Null | Key | Default | Notes |
|-------|------|------|-----|---------|-------|
| id | varchar(255) | NO | PRI | | Issue ID |
| content_hash | varchar(64) | YES | | | Content hash for change detection |
| title | varchar(500) | NO | | | Issue title |
| description | text | NO | | | Issue description |
| design | text | NO | | | Design document |
| acceptance_criteria | text | NO | | | Acceptance criteria |
| notes | text | NO | | | Notes |
| status | varchar(32) | NO | MUL | 'open' | Status (open, in_progress, blocked, deferred, closed) |
| priority | int | NO | MUL | 2 | Priority (0-4) |
| issue_type | varchar(32) | NO | MUL | 'task' | Type (bug, feature, task, epic, etc.) |
| assignee | varchar(255) | YES | MUL | | Assigned user |
| estimated_minutes | int | YES | | | Time estimate |
| created_at | datetime | NO | MUL | CURRENT_TIMESTAMP | Creation time |
| created_by | varchar(255) | YES | | '' | Creator |
| owner | varchar(255) | YES | | '' | Owner |
| updated_at | datetime | NO | | CURRENT_TIMESTAMP | Last update |
| closed_at | datetime | YES | | | Close time |
| closed_by_session | varchar(255) | YES | | '' | Session that closed |
| external_ref | varchar(255) | YES | MUL | | External reference |
| spec_id | varchar(1024) | YES | MUL | | Spec ID |
| compaction_level | int | YES | | 0 | Compaction level |
| compacted_at | datetime | YES | | | Compaction time |
| compacted_at_commit | varchar(64) | YES | | | Compaction commit |
| original_size | int | YES | | | Original size |
| sender | varchar(255) | YES | | '' | Sender |
| ephemeral | tinyint(1) | YES | | 0 | Is ephemeral |
| wisp_type | varchar(32) | YES | | '' | Wisp type |
| pinned | tinyint(1) | YES | | 0 | Is pinned |
| is_template | tinyint(1) | YES | | 0 | Is template |
| crystallizes | tinyint(1) | YES | | 0 | Crystallizes |
| mol_type | varchar(32) | YES | | '' | Molecule type |
| work_type | varchar(32) | YES | | 'mutex' | Work type |
| quality_score | double | YES | | | Quality score |
| source_system | varchar(255) | YES | | '' | Source system |
| metadata | json | YES | | (json_object()) | Metadata JSON |
| source_repo | varchar(512) | YES | | '' | Source repo |
| close_reason | text | YES | | '' | Close reason |
| event_kind | varchar(32) | YES | | '' | Event kind |
| actor | varchar(255) | YES | | '' | Actor |
| target | varchar(255) | YES | | '' | Target |
| payload | text | YES | | '' | Payload |
| await_type | varchar(32) | YES | | '' | Await type |
| await_id | varchar(255) | YES | | '' | Await ID |
| timeout_ns | bigint | YES | | 0 | Timeout in nanoseconds |
| waiters | text | YES | | '' | Waiters |
| hook_bead | varchar(255) | YES | | '' | Hook bead |
| role_bead | varchar(255) | YES | | '' | Role bead |
| agent_state | varchar(32) | YES | | '' | Agent state |
| last_activity | datetime | YES | | | Last activity |
| role_type | varchar(32) | YES | | '' | Role type |
| rig | varchar(255) | YES | | '' | Rig |
| due_at | datetime | YES | | | Due date |
| defer_until | datetime | YES | | | Defer until date |

---

### dependencies

Issue relationships.

| Field | Type | Null | Key | Default | Notes |
|-------|------|------|-----|---------|-------|
| issue_id | varchar(255) | NO | PRI | | Parent issue |
| depends_on_id | varchar(255) | NO | PRI | | Dependent issue |
| type | varchar(32) | NO | | 'blocks' | Dependency type |
| created_at | datetime | NO | | CURRENT_TIMESTAMP | Creation time |
| created_by | varchar(255) | NO | | | Creator |
| metadata | json | YES | | (json_object()) | Metadata |
| thread_id | varchar(255) | YES | MUL | '' | Thread ID |

---

### labels

Issue tagging.

| Field | Type | Null | Key | Default |
|-------|------|------|-----|---------|
| issue_id | varchar(255) | NO | PRI | |
| label | varchar(255) | NO | PRI | |

---

### events

Audit trail for issue changes.

| Field | Type | Null | Key | Default | Notes |
|-------|------|------|-----|---------|-------|
| id | bigint | NO | PRI | | Auto-increment |
| issue_id | varchar(255) | NO | MUL | | Issue ID |
| event_type | varchar(32) | NO | | | Event type |
| actor | varchar(255) | NO | | | Actor |
| old_value | text | YES | | | Previous value |
| new_value | text | YES | | | New value |
| comment | text | YES | | | Comment |
| created_at | datetime | NO | MUL | CURRENT_TIMESTAMP | Creation time |

---

### interactions

Agent interaction log.

| Field | Type | Null | Key | Default | Notes |
|-------|------|------|-----|---------|-------|
| id | varchar(32) | NO | PRI | | Interaction ID |
| kind | varchar(64) | NO | MUL | | Interaction kind |
| created_at | datetime | NO | MUL | | Creation time |
| actor | varchar(255) | YES | | | Actor |
| issue_id | varchar(255) | YES | MUL | | Related issue |
| model | varchar(255) | YES | | | AI model used |
| prompt | text | YES | | | Prompt sent |
| response | text | YES | | | Response received |
| error | text | YES | | | Error message |
| tool_name | varchar(255) | YES | | | Tool name |
| exit_code | int | YES | | | Exit code |
| parent_id | varchar(32) | YES | MUL | | Parent interaction |
| label | varchar(64) | YES | | | Label |
| reason | text | YES | | | Reason |
| extra | json | YES | | | Extra data |

---

## Common Analytics Queries

### Lead Time Calculation
```sql
SELECT
  AVG(TIMESTAMPDIFF(HOUR, created_at, closed_at)) as avg_lead_time_hours,
  COUNT(*) as total_closed
FROM issues
WHERE status = 'closed'
  AND closed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
```

### Throughput Over Time
```sql
SELECT
  DATE(closed_at) as close_date,
  COUNT(*) as issues_closed
FROM issues
WHERE status = 'closed'
GROUP BY DATE(closed_at)
ORDER BY close_date DESC
LIMIT 30
```

### Aging WIP
```sql
SELECT
  id, title, status, priority,
  TIMESTAMPDIFF(DAY, created_at, NOW()) as age_days
FROM issues
WHERE status IN ('open', 'in_progress', 'blocked')
ORDER BY age_days DESC
```

### CFD Data (Cumulative Flow)
```sql
SELECT
  DATE(updated_at) as date,
  status,
  COUNT(*) as count
FROM issues
GROUP BY DATE(updated_at), status
ORDER BY date
```

### Blocked Issues
```sql
SELECT i.*, d.depends_on_id as blocked_by
FROM issues i
JOIN dependencies d ON i.id = d.depends_on_id
JOIN issues blocker ON d.issue_id = blocker.id
WHERE i.status != 'closed'
  AND blocker.status != 'closed'
  AND d.type = 'blocks'
```
