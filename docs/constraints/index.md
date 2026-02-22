# Known Constraints & Limitations

This directory documents constraints, limitations, and known issues for the Unified Beads WebUI project.

## Constraint Categories

### Data Access Constraints
- [data-access.md](./data-access.md) - Database backend limitations

### CLI Constraints
- [cli.md](./cli.md) - bd/gt CLI limitations

### Platform Constraints
- [platform.md](./platform.md) - OS and runtime constraints

### Integration Constraints
- [integration.md](./integration.md) - Third-party integration limits

---

## Quick Reference

### Hard Constraints (Cannot Work Around)

| Constraint | Impact | Source |
|------------|--------|--------|
| Custom schema extensions SQLite-only | Cannot add tables to Dolt | Beads docs |
| Dolt uses MySQL protocol | Different driver than SQLite | Dolt design |
| bd CLI required for writes | Must shell out for mutations | Data integrity |

### Soft Constraints (Can Work Around)

| Constraint | Impact | Workaround |
|------------|--------|------------|
| No metrics in bd CLI | Must compute in app | Direct SQL queries |
| gt CLI may not exist | Gas-Town features unavailable | Feature-flag, graceful degradation |
| .claude/agents/ not managed by bd | Must read/write directly | Direct file I/O |

### Performance Constraints

| Constraint | Limit | Mitigation |
|------------|-------|------------|
| CLI command latency | ~50-200ms per command | Batch operations, caching |
| Large issue lists | >10k issues slow | Pagination, virtual scrolling |
| Metrics calculation | Complex queries slow | Background workers, caching |
