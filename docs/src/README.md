# ProjX Documentation

ProjX is the Unified Beads WebUI - a comprehensive web interface combining the best features from existing Beads and Gas-Town tools.

## Overview

This documentation covers:

- **Architecture Decision Records (ADRs)** - Formal decisions about the tech stack and architecture
- **Constraints** - Known limitations and design constraints

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun (with Node.js fallback) |
| Frontend | SvelteKit 2.x with Svelte 5 |
| Styling | Tailwind CSS 4 |
| State | Svelte stores with runes |
| Data | SQLite/Dolt (reads) + bd CLI (writes) |
| Real-time | Chokidar + WebSocket |
| Components | gastown_ui + custom |

## Quick Links

- [GitHub Repository](https://github.com/aRustyDev/projx)
- [Planning Documentation](../.claude/plans/unified-beads-webui/index.md)
- [Roadmap](../.claude/plans/unified-beads-webui/ROADMAP.md)
