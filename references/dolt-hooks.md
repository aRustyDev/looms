# Dolt Hooks Reference

## Overview

Dolt hooks enable automatic synchronization between git operations and the Dolt database.

---

## Requirements

```bash
# 1. Beads configured with Dolt backend
bd init --dolt
# or migrate existing:
bd migrate --to dolt

# 2. Dolt remote configured
bd config set sync.git-remote <git-remote-url>

# 3. Run setup script (for Foolery)
bash scripts/setup-beads-dolt-hooks.sh
```

---

## Setup Script Behavior

The `setup-beads-dolt-hooks.sh` script:
- Sets `sync.git-remote` to the full URL for git remote `origin`
- Ensures Dolt remote `origin` exists in `dolt_remotes`
- Backs up existing hook files to `.bak-YYYYmmdd-HHMMSS`
- Replaces only: `pre-push`, `post-merge`, `post-checkout`
- Leaves `pre-commit` and `prepare-commit-msg` untouched

---

## Hook Behaviors

### pre-push
Triggered before `git push`.

1. Resolves active Dolt branch via `bd sql --csv "SELECT active_branch()"`
2. Runs checkpoint commit: `bd vc commit -m "hook: pre-push dolt checkpoint"`
3. Ignores `nothing to commit`
4. Runs `bd sql "CALL DOLT_PUSH('origin','<branch>')"`
5. Exits non-zero on push failure

### post-merge
Triggered after `git pull` (merge-style).

1. Resolves active Dolt branch
2. Runs `bd sql "CALL DOLT_PULL('origin','<branch>')"`
3. If pull fails with `cannot merge with uncommitted changes`, checkpoints once and retries once
4. Never blocks merge completion (warns and exits 0)

### post-checkout
- No-op, exits 0

---

## Hook Markers

All custom hooks include markers expected by Beads hook diagnostics:
```bash
# bd-shim v1
# bd-hooks-version: 0.55.1
```

---

## Capabilities Provided

| Capability | Without Dolt Hooks | With Dolt Hooks |
|------------|-------------------|-----------------|
| Push sync | Manual `bd sync` | Automatic on `git push` |
| Pull sync | Manual `bd sync` | Automatic on `git pull` |
| Cross-machine sync | JSONL in git | Native Dolt replication |
| Conflict resolution | JSONL merge conflicts | Dolt's 3-way merge |
| History | Git history of JSONL | Full Dolt versioning |
| Branch support | Dolt branch per git branch | Native branch tracking |

---

## Validation

After setup, verify with:
```bash
bd hooks list
bd doctor
.git/hooks/pre-push
```

---

## Caveats

- Hook changes are local to each clone (`.git/hooks`), not committed history
- `bd hooks install --force` will overwrite these custom hooks
- `git pull --rebase` does not trigger `post-merge`; only merge-style pull works
