---
number: 13
title: Justfile Patterns and Conventions
status: proposed
date: 2026-02-24
tags:
  - tooling
  - conventions
  - developer-experience
deciders:
  - aRustyDev
links:
  - rel: Implements
    target: 12
---

# Justfile Patterns and Conventions

## Context and Problem Statement

Having chosen Just as our command runner (ADR-0012), we need to establish patterns and conventions for organizing recipes, handling arguments, and structuring the justfile for maintainability as the project grows.

## Decision Drivers

* **Maintainability**: Justfile should remain readable as it grows
* **Discoverability**: Recipes should be easy to find and understand
* **Consistency**: Similar tasks should follow similar patterns
* **Flexibility**: Support both simple and complex use cases
* **Modern features**: Leverage Just v1.45.0+ capabilities

## Considered Options

For each pattern area, we considered multiple approaches:

* **Arguments**: Positional arguments vs `[arg()]` attributes
* **Structure**: Single file vs modular imports
* **Naming**: Various case conventions
* **Complex logic**: Inline vs shebang scripts

## Decision Outcome

Chosen option: **Modern patterns with `[arg()]` syntax and modular structure**, because they provide the best developer experience while maintaining clarity and scalability.

### Consequences

* Good, because `--flag` syntax is intuitive for developers
* Good, because modules keep related recipes together
* Good, because consistent patterns reduce cognitive load
* Good, because interactive menu aids discoverability
* Neutral, because requires Just v1.45.0 or newer
* Bad, because multiple files to navigate

### Confirmation

* Code review checks for pattern compliance
* `just --list` output reviewed for clarity
* New recipes follow established patterns

## Pattern Decisions

### 1. Use `[arg()]` Attribute Syntax for Flags

Use the `[arg()]` attribute syntax (Just v1.45.0+) instead of positional arguments with defaults.

```just
# Good: [arg()] syntax
[arg("full", long, value="true")]
test full="false":
    {{ if full == "true" { "just _test-full" } else { "" } }}

# Usage: just test --full

# Avoided: Positional arguments
test full="false":
    # Usage: just test true (less intuitive)
```

* Good, because `--flag` syntax is familiar from other CLI tools
* Good, because supports short flags (`-f`) alongside long flags
* Good, because boolean flags work naturally
* Bad, because requires Just v1.45.0 or newer

### 2. Use Modular Justfile Structure

Split justfile into modules using `mod` imports for domain-specific recipe groups.

```just
# Main justfile
mod docker '.docker/mod.just'
mod db '.beads/mod.database.just'

# Usage:
# just docker up
# just db status
```

**Module naming convention**:
* Module files named `mod.just` or `mod.<domain>.just`
* Located in the domain's directory
* Use `justfile_directory()` for relative paths within modules

* Good, because recipes are organized by domain
* Good, because modules can be developed independently
* Good, because main justfile stays concise
* Bad, because module names become command prefixes

### 3. Recipe Naming Conventions

Use lowercase with hyphens for multi-word recipes, verbs for actions.

```just
# Good
test-coverage:
dev:
clean:

# Avoided
testCoverage:  # camelCase
test_coverage: # snake_case
```

**Private recipes**: Prefix with underscore and use `[private]` attribute.

```just
[private]
_test-full:
    # Only called by other recipes
```

### 4. Recipe Documentation

Every public recipe has a comment description. Use ASCII section headers for grouping.

```just
# ─────────────────────────────────────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────────────────────────────────────

# Start development server with hot reload
dev:
    bun run dev
```

### 5. Shell Configuration

Set strict shell options at the top of every justfile.

```just
set shell := ["bash", "-euo", "pipefail", "-c"]
set dotenv-load := true
```

* `-e`: Exit on error
* `-u`: Error on undefined variables
* `-o pipefail`: Fail on pipe errors
* `dotenv-load`: Auto-load `.env` files

### 6. Multi-line Scripts

Use shebang syntax for complex multi-line scripts.

```just
backup:
    #!/usr/bin/env bash
    set -euo pipefail
    timestamp=$(date +%Y%m%d_%H%M%S)
    # ... complex logic
```

### 7. Conditional Execution

Use inline conditionals for simple branching, private recipes for complex branches.

```just
# Simple: inline conditional
[arg("force", long, value="true")]
clean force="false":
    rm -rf build
    {{ if force == "true" { "just _clean-force" } else { "" } }}

# Complex: delegate to private recipe
[private]
_clean-force:
    rm -rf node_modules
    docker system prune -f
```

### 8. Interactive Menu

Provide an interactive menu using `gum` with fallback to `just --choose`.

```just
[private]
_menu:
    #!/usr/bin/env bash
    if ! command -v gum &> /dev/null; then
        just --choose  # Fallback
        exit 0
    fi
    # ... gum-based menu
```

## Summary Table

| Pattern | Convention | Example |
|---------|------------|---------|
| Flag arguments | `[arg()]` syntax | `[arg("full", long)]` |
| Module location | `<domain>/mod.just` | `.docker/mod.just` |
| Recipe names | lowercase-hyphenated | `test-coverage` |
| Private recipes | underscore prefix + `[private]` | `_clean-force` |
| Shell config | strict bash | `bash -euo pipefail` |
| Multi-line | shebang syntax | `#!/usr/bin/env bash` |
| Interactive | gum with fallback | `gum choose` / `just --choose` |

## More Information

### References

* [ADR-0012: Use Just as Command Runner](./0012-use-just-as-command-runner.md)
* [Just Manual](https://just.systems/man/en/)
* [Justfile](../../../justfile)
* [Docker Module](../../../.docker/mod.just)
* [Database Module](../../../.beads/mod.database.just)
