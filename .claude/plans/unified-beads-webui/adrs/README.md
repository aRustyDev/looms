# Planning-Phase ADRs

These ADRs document decisions made during the planning phase that are specific to **how we planned** rather than **what we're building**.

For project architecture ADRs, see: [`docs/src/adrs/`](../../../../../docs/src/adrs/)

## ADRs in This Directory

| # | Title | Status | Note |
|---|-------|--------|------|
| ~~0001~~ | ~~Record architecture decisions~~ | Deleted | Duplicate of docs/src/adrs/0001 |
| ~~0002~~ | ~~Layerchart + D3 for charts~~ | Moved | → [ADR-0017](../../../../../docs/src/adrs/0017-use-layerchart-for-charts-and-d3-for-dependency-graphs.md) |
| 0003 | ASCII wireframes instead of Penpot | Accepted | Planning process decision |
| ~~0004~~ | ~~Storybook for visual docs~~ | Moved | → [ADR-0018](../../../../../docs/src/adrs/0018-use-storybook-for-visual-component-documentation.md) |
| 0005 | Single project scope for MVP | Accepted | Scope decision |

## Why Keep These Separate?

**Planning ADRs** (this directory):
- Decisions about the planning process itself
- Workarounds for tooling issues (e.g., Penpot MCP bugs)
- Scope decisions for MVP
- May become irrelevant after project ships

**Project ADRs** (`docs/src/adrs/`):
- Decisions about the product architecture
- Shipped with the code
- Permanent record of technical choices
- Managed via `adrs` CLI
