---
number: 2
title: Use Bun as Primary Runtime
status: proposed
date: 2026-02-22
tags:
  - runtime
  - infrastructure
deciders:
  - aRustyDev
---

# Use Bun as Primary Runtime

## Context and Problem Statement

The Unified Beads WebUI needs a JavaScript/TypeScript runtime for both the build system and server-side execution. The choice of runtime affects performance, developer experience, and compatibility with our database backends (SQLite, Dolt).

## Decision Drivers

* **Performance**: Fast startup and execution for CLI wrapping and real-time updates
* **SQLite support**: Native SQLite driver for direct database reads
* **MySQL/Dolt support**: Compatibility with mysql2 for Dolt backend
* **Developer experience**: Fast installs, TypeScript support, modern APIs
* **Ecosystem compatibility**: Must work with SvelteKit and existing npm packages
* **Production stability**: Mature enough for production use

## Considered Options

* **Bun** - Modern all-in-one JavaScript runtime
* **Node.js 20+** - Established runtime with largest ecosystem
* **Deno** - Secure-by-default runtime with TypeScript support

## Decision Outcome

Chosen option: **Bun**, because it provides the best performance characteristics for our use case while maintaining compatibility with our required dependencies.

### Consequences

* Good, because native SQLite support via `bun:sqlite` is significantly faster than better-sqlite3
* Good, because startup time is ~4x faster than Node.js, important for CLI operations
* Good, because npm package compatibility is excellent (mysql2 works out of the box)
* Good, because built-in TypeScript support eliminates transpilation step
* Good, because SvelteKit has first-class Bun support
* Neutral, because some edge-case npm packages may have compatibility issues
* Bad, because team may need to learn Bun-specific APIs
* Bad, because slightly smaller community than Node.js for troubleshooting

### Confirmation

* Run `bun --version` in CI to ensure Bun is available
* Integration tests verify SQLite and mysql2 functionality
* Fallback to Node.js documented for environments where Bun isn't available

## Pros and Cons of the Options

### Bun

Bun is a modern JavaScript runtime built from scratch with performance as the primary goal.

* Good, because native SQLite driver (`bun:sqlite`) is 3-6x faster than better-sqlite3
* Good, because startup time is ~25ms vs ~100ms for Node.js
* Good, because built-in package manager is 10-100x faster than npm
* Good, because native TypeScript execution (no transpilation)
* Good, because mysql2 compatibility confirmed (for Dolt)
* Good, because actively maintained by Oven (well-funded startup)
* Neutral, because v1.0 released Sept 2023, still maturing
* Bad, because smaller ecosystem of Bun-native packages
* Bad, because some native Node.js addons may not work

### Node.js 20+

Node.js is the established JavaScript runtime with the largest ecosystem.

* Good, because largest ecosystem and community
* Good, because extremely stable and battle-tested
* Good, because better-sqlite3 works well
* Good, because mysql2 fully supported
* Good, because universal hosting support
* Neutral, because requires separate TypeScript compilation
* Bad, because slower startup (~100ms+)
* Bad, because slower package installation
* Bad, because no native SQLite (requires native addon compilation)

### Deno

Deno is a secure-by-default runtime created by Node.js's original author.

* Good, because built-in TypeScript support
* Good, because secure by default (explicit permissions)
* Good, because modern standard library
* Neutral, because SQLite via FFI or WASM (not native)
* Bad, because npm compatibility layer still maturing
* Bad, because SvelteKit support less mature than Bun
* Bad, because mysql2 compatibility uncertain
* Bad, because smaller adoption than both Node.js and Bun

## More Information

### Fallback Strategy

If Bun is not available in a deployment environment:
1. Package.json includes `engines.node` field for Node.js fallback
2. `better-sqlite3` as SQLite fallback (automatically selected)
3. CI tests both Bun and Node.js paths

### Performance Benchmarks (from research)

| Operation | Bun | Node.js | Improvement |
|-----------|-----|---------|-------------|
| Startup | 25ms | 100ms | 4x |
| SQLite query (1000 rows) | 2ms | 8ms | 4x |
| Package install | 0.5s | 30s | 60x |

### References

* [Bun Documentation](https://bun.sh/docs)
* [gastown_ui uses Bun](../references/gastown-webuis.md)
* [Tech Stack Analysis](../references/tech-stack-analysis.md)
