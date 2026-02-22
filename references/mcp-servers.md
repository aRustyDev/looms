# MCP Servers for Development

This document catalogs MCP servers relevant to Unified Beads WebUI development.

## Core Stack Servers

These directly support our SvelteKit + Tailwind + SQLite stack.

### Tailwind-Svelte-Assistant

**Repository**: [CaullenOmdahl/Tailwind-Svelte-Assistant](https://mcpservers.org/servers/CaullenOmdahl/Tailwind-Svelte-Assistant)

**Purpose**: Complete SvelteKit and Tailwind CSS documentation with code snippets.

**Features**:
- 100% SvelteKit coverage (1.04 MB LLM-optimized docs)
- 100% Tailwind CSS coverage (2.1 MB, all 249 files)
- Intelligent search within documentation
- Input validation and security features
- LRU caching (80-95% hit rates)

**Configuration**:
```json
{
  "mcpServers": {
    "tailwind-svelte": {
      "command": "npx",
      "args": ["-y", "tailwind-svelte-assistant-mcp"]
    }
  }
}
```

---

### sveltejs/mcp

**Repository**: [sveltejs/mcp](https://mcpservers.org/servers/sveltejs/mcp)

**Purpose**: Official Svelte MCP server from Anthropic.

**Features**:
- Svelte documentation access
- Code generation suggestions
- Embeddings via Voyage API
- MCP Inspector at `http://localhost:6274/`

**Configuration**:
```json
{
  "mcpServers": {
    "svelte": {
      "command": "npx",
      "args": ["-y", "@anthropic/svelte-mcp"]
    }
  }
}
```

---

### mcp-server-sqlite-npx

**Repository**: [johnnyoshika/mcp-server-sqlite-npx](https://mcpservers.org/servers/johnnyoshika/mcp-server-sqlite-npx)

**Purpose**: Query and interact with SQLite databases.

**Features**:
- Query local SQLite databases
- Node.js implementation (works where Python UVX unavailable)
- MCP Inspector for testing
- Cross-platform (macOS, Windows, Linux)

**Use Case**: Debug and explore `.beads/beads.db` during development.

**Configuration**:
```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    }
  }
}
```

---

### shadcn-ui-mcp-server

**Repository**: [Jpisnice/shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server)

**Purpose**: Access shadcn/ui components across frameworks.

**Features**:
- Multi-framework: React, **Svelte**, Vue, React Native
- Component source code retrieval
- Usage examples and metadata
- shadcn/ui v4 support

**Use Case**: Reference shadcn-svelte patterns for component implementation.

**Configuration**:
```json
{
  "mcpServers": {
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    }
  }
}
```

---

### llmctx

**Repository**: [khromov/llmctx](https://mcpservers.org/servers/khromov/llmctx)

**Purpose**: LLM-optimized Svelte/SvelteKit documentation.

**Features**:
- Transforms documentation into AI-ready formats
- Preset URLs for quick access
- Regular updates from official sources
- Customizable presets via glob patterns

**Configuration**:
```json
{
  "mcpServers": {
    "llmctx": {
      "command": "npx",
      "args": ["-y", "llmctx-mcp"]
    }
  }
}
```

---

## Development Tools

### mcp-nodejs-debugger

**Repository**: [hyperdrive-eng/mcp-nodejs-debugger](https://mcpservers.org/servers/hyperdrive-eng/mcp-nodejs-debugger)

**Purpose**: Runtime debugging for Node.js applications.

**Features**:
- Set breakpoints at file:line locations
- Execute JavaScript in running context
- Inspect variables at runtime
- Monitor connection states

**Use Case**: Debug SvelteKit server routes when using Node.js fallback.

**Configuration**:
```json
{
  "mcpServers": {
    "nodejs-debugger": {
      "command": "npx",
      "args": ["-y", "mcp-nodejs-debugger"]
    }
  }
}
```

---

### DevRAG

**Repository**: [tomohiro-owada/devrag](https://github.com/tomohiro-owada/devrag)

**Purpose**: Lightweight RAG system for documentation search.

**Features**:
- Semantic vector search over markdown docs
- 40x fewer tokens vs traditional reading
- 15x faster searches (~95ms for 100 files)
- Automatic indexing of `.md` files
- GPU/CPU auto-detection
- 100+ language support

**Use Case**: Search project documentation in `/plans/unified-beads-webui/`.

**Configuration**:
```json
{
  "mcpServers": {
    "devrag": {
      "command": "devrag",
      "args": ["serve", "--dir", ".claude/plans"]
    }
  }
}
```

---

## Design & Assets

### penpot-mcp

**Repository**: [penpot/penpot-mcp](https://github.com/penpot/penpot-mcp)

**Purpose**: AI integration with Penpot design files.

**Features**:
- Query design data from Penpot files
- Modify existing design elements
- Create new design components
- WebSocket connection to Penpot plugin
- Execute code snippets in plugin environment

**Endpoints**:
- HTTP: `localhost:4401/mcp`
- SSE: `localhost:4401/sse`

**Use Case**: Design-to-code workflows, component design iteration.

**Configuration**:
```json
{
  "mcpServers": {
    "penpot": {
      "command": "npx",
      "args": ["-y", "@penpot/mcp-server"]
    }
  }
}
```

---

### icogenie

**Repository**: [albertnahas/icogenie](https://mcpservers.org/servers/albertnahas/icogenie)

**Purpose**: PWA icon and asset generation.

**Features**:
- Generate PWA icons from source image
- Multiple sizes and formats
- Favicon generation
- Manifest.json icon entries

**Use Case**: Generate app icons for PWA deployment.

**Configuration**:
```json
{
  "mcpServers": {
    "icogenie": {
      "command": "npx",
      "args": ["-y", "icogenie-mcp"]
    }
  }
}
```

---

## Internationalization

### intlayer

**Repository**: [aymericzip/intlayer](https://mcpservers.org/servers/aymericzip/intlayer)

**Purpose**: Internationalization (i18n) tooling.

**Features**:
- Content declaration management
- Translation key extraction
- Multi-language support
- Framework integrations

**Use Case**: Add multi-language support to WebUI (Phase 5+).

**Configuration**:
```json
{
  "mcpServers": {
    "intlayer": {
      "command": "npx",
      "args": ["-y", "intlayer-mcp"]
    }
  }
}
```

---

## Recommended Configuration

### Minimal Setup (Core Development)

```json
{
  "mcpServers": {
    "tailwind-svelte": {
      "command": "npx",
      "args": ["-y", "tailwind-svelte-assistant-mcp"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    },
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    }
  }
}
```

### Full Setup (All Features)

```json
{
  "mcpServers": {
    "tailwind-svelte": {
      "command": "npx",
      "args": ["-y", "tailwind-svelte-assistant-mcp"]
    },
    "svelte": {
      "command": "npx",
      "args": ["-y", "@anthropic/svelte-mcp"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"]
    },
    "shadcn-svelte": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"]
    },
    "llmctx": {
      "command": "npx",
      "args": ["-y", "llmctx-mcp"]
    },
    "devrag": {
      "command": "devrag",
      "args": ["serve", "--dir", ".claude/plans"]
    },
    "nodejs-debugger": {
      "command": "npx",
      "args": ["-y", "mcp-nodejs-debugger"]
    },
    "penpot": {
      "command": "npx",
      "args": ["-y", "@penpot/mcp-server"]
    },
    "icogenie": {
      "command": "npx",
      "args": ["-y", "icogenie-mcp"]
    },
    "intlayer": {
      "command": "npx",
      "args": ["-y", "intlayer-mcp"]
    }
  }
}
```

---

## Server Categories by Phase

| Phase | Recommended Servers |
|-------|---------------------|
| **Phase 1: MVP** | tailwind-svelte, sqlite, shadcn-svelte |
| **Phase 2: Analytics** | + devrag (for doc search) |
| **Phase 3: Git Integration** | + nodejs-debugger |
| **Phase 4: Agents** | (no additional) |
| **Phase 5: Gas-Town** | + intlayer, icogenie, penpot |

---

## References

- [MCP Servers Directory](https://mcpservers.org/)
- [MCP Market](https://mcpmarket.com/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [ADR-0002: Use Bun as Runtime](../adrs/0002-use-bun-as-primary-runtime.md)
- [ADR-0003: Use SvelteKit](../adrs/0003-use-sveltekit-as-frontend-framework.md)
