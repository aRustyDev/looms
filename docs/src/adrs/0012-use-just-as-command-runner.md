---
number: 12
title: Use Just as Command Runner
status: proposed
date: 2026-02-24
tags:
  - tooling
  - developer-experience
deciders:
  - aRustyDev
---

# Use Just as Command Runner

## Context and Problem Statement

The Unified Beads WebUI project requires a command runner to standardize common development tasks (build, test, lint, dev server, Docker management, etc.). We need a tool that provides a consistent interface for all developers regardless of their shell environment.

## Decision Drivers

* **Simplicity**: Easy to learn and use for all team members
* **Cross-platform**: Works on macOS, Linux, and Windows
* **Shell agnostic**: Recipes work the same regardless of user's shell
* **Discoverability**: Easy to see available commands
* **Composability**: Ability to chain and parameterize tasks
* **No runtime dependencies**: Should not require Node.js/Python to run

## Considered Options

* **Just** - Modern command runner inspired by make
* **Make** - Traditional build system
* **npm scripts** - Package.json scripts via Bun/npm
* **Task** - Go-based task runner (Taskfile.yml)
* **Mise** - Polyglot task runner and version manager

## Decision Outcome

Chosen option: **Just**, because it provides the best balance of simplicity, discoverability, and modern features while remaining shell-agnostic and dependency-free.

### Consequences

* Good, because `just --list` provides instant discoverability of all commands
* Good, because `just --choose` enables interactive recipe selection
* Good, because recipes are shell-agnostic (same behavior everywhere)
* Good, because no runtime dependencies (single binary)
* Good, because supports modules for organizing large justfiles
* Good, because supports modern features like `[arg()]` attributes
* Neutral, because team needs to learn justfile syntax
* Bad, because less universal than Make (some developers unfamiliar)
* Bad, because requires installation (not bundled with OS)

### Confirmation

* Ensure `just` is in Brewfile and installed via `just init`
* CI runs `just test` and `just lint` for validation
* README documents available recipes

## Pros and Cons of the Options

### Just

Just is a modern command runner that provides a convenient way to save and run project-specific commands.

* Good, because intuitive syntax (similar to make but simpler)
* Good, because `--list` shows all recipes with descriptions
* Good, because `--choose` provides fzf-style interactive selection
* Good, because supports modules for organization (`mod name 'path'`)
* Good, because `[arg()]` attributes for typed CLI arguments (v1.45.0+)
* Good, because recipes run in consistent shell regardless of user's shell
* Good, because single statically-linked binary (no dependencies)
* Good, because supports recipe dependencies and chaining
* Neutral, because requires v1.45.0+ for `[arg()]` syntax
* Bad, because not pre-installed on most systems

### Make

Make is the traditional Unix build automation tool.

* Good, because pre-installed on most Unix systems
* Good, because extremely well-documented
* Good, because familiar to most developers
* Bad, because syntax is arcane and error-prone (tabs vs spaces)
* Bad, because shell-dependent behavior
* Bad, because phony targets require explicit declaration
* Bad, because poor discoverability without custom help target
* Bad, because no native argument parsing for recipes

### npm scripts (package.json)

Using the scripts field in package.json with Bun.

* Good, because no additional tool needed
* Good, because familiar to JavaScript developers
* Good, because `bun run` lists available scripts
* Bad, because limited composability
* Bad, because requires JSON escaping for complex commands
* Bad, because no conditional logic without external tools
* Bad, because no support for arguments/parameters
* Bad, because ties task running to JavaScript runtime

### Task (Taskfile.yml)

Task is a Go-based task runner using YAML configuration.

* Good, because YAML syntax is familiar
* Good, because supports task dependencies
* Good, because cross-platform
* Neutral, because YAML verbosity for simple tasks
* Bad, because less intuitive for shell commands
* Bad, because smaller community than Make or Just
* Bad, because no interactive chooser built-in

### Mise

Mise is a polyglot development tool manager with task running capabilities.

* Good, because combines version management with task running
* Good, because TOML-based configuration
* Good, because can replace multiple tools (asdf, direnv, make)
* Neutral, because task running is secondary feature
* Bad, because more complex than dedicated task runners
* Bad, because newer tool with smaller community
* Bad, because overkill if only task running is needed

## More Information

### Installation

```bash
# macOS
brew install just

# Via Brewfile (recommended)
just init  # runs `brew bundle --file=Brewfile`
```

### Quick Reference

```bash
# List all recipes
just --list

# Interactive selection
just --choose

# Run specific recipe
just test
just test --full

# Module recipes
just docker up
just db status
```

### References

* [Just Documentation](https://just.systems/man/en/)
* [Just Cheatsheet](https://cheatography.com/linux-china/cheat-sheets/justfile/)
* [ADR-0013: Justfile Patterns and Conventions](./0013-justfile-patterns-and-conventions.md)
