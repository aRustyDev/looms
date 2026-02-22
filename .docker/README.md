# Docker Configuration

This directory contains Docker Compose configuration for local development services.

## Penpot Self-Hosted

A local Penpot instance for design work with AI-assisted workflows.

### Services

| Service | Port | Purpose |
|---------|------|---------|
| penpot-frontend | 9001 | Penpot UI |
| penpot-backend | - | API server |
| penpot-exporter | - | PDF/SVG export |
| penpot-postgres | - | PostgreSQL 15 |
| penpot-valkey | - | Redis-compatible cache |
| penpot-mailcatch | 1080 | Dev email viewer |
| penpot-mcp | 4400-4403 | MCP server for AI integration |

### Quick Start

```bash
# Start all services
docker compose -f .docker/compose.yaml up -d

# View logs
docker compose -f .docker/compose.yaml logs -f

# Stop services
docker compose -f .docker/compose.yaml down
```

### Access

| Service | URL | Credentials |
|---------|-----|-------------|
| Penpot UI | http://localhost:9001 | `demo@example.com` / `123123` |
| Mailcatcher | http://localhost:1080 | - |
| MCP Plugin Manifest | http://localhost:4400/manifest.json | - |
| MCP HTTP Endpoint | http://localhost:4401/mcp | - |

## Penpot MCP Server

The `penpot-mcp` service provides AI-assisted design workflows via Model Context Protocol.

### Ports

| Port | Purpose |
|------|---------|
| 4400 | Plugin manifest server |
| 4401 | MCP HTTP/SSE endpoint |
| 4402 | WebSocket (plugin connection) |
| 4403 | REPL server (debugging) |

### Setup

1. **Start the services:**
   ```bash
   docker compose -f .docker/compose.yaml up -d
   ```

2. **Load the plugin in Penpot:**
   - Open http://localhost:9001
   - Navigate to a design file
   - Open Plugins menu → Install plugin
   - Enter: `http://localhost:4400/manifest.json`

3. **Connect the plugin:**
   - Open the plugin UI
   - Click "Connect to MCP server"
   - Status should change to "Connected"

4. **Connect Claude Code:**
   The `.mcp.json` is already configured with:
   ```json
   "penpot-plugin": {
     "command": "npx",
     "args": ["-y", "mcp-remote", "http://localhost:4401/mcp", "--allow-http"]
   }
   ```

### Available Tools

Once connected, the MCP server provides:
- `execute_code` - Run JavaScript in Penpot Plugin environment
- `high_level_overview` - Get Penpot API overview
- `penpot_api_info` - Query API documentation
- `export_shape` - Export shapes as images
- `import_image` - Import images into designs

## Data Storage & Version Control

Design data is stored in `.docker/data/` using bind mounts (not Docker volumes) so it can be version controlled:

```
.docker/data/
├── penpot-assets/     # Images, fonts, exported assets
└── penpot-postgres/   # PostgreSQL database files
```

**Important**: The `PENPOT_FILE_DATA_BACKEND: storage` setting stores actual design file data in the filesystem rather than the database, making designs version-controllable.

### Database Operations

```bash
# Backup database to SQL file
docker exec penpot-postgres pg_dump -U penpot penpot > .docker/data/backup.sql

# Restore database from SQL file
cat .docker/data/backup.sql | docker exec -i penpot-postgres psql -U penpot penpot

# Access PostgreSQL shell
docker exec -it penpot-postgres psql -U penpot penpot
```

### Reset Data

To start fresh:

```bash
docker compose -f .docker/compose.yaml down
rm -rf .docker/data/
docker compose -f .docker/compose.yaml up -d
```

## Configuration

Environment variables can be set in `.docker/.env` (copy from `.env.example`):

- `PENPOT_VERSION` - Penpot version tag (default: `latest`)
- `PENPOT_SECRET_KEY` - Session secret key
- `PENPOT_DB_PASSWORD` - PostgreSQL password

## Troubleshooting

**Permission issues with bind mounts:**
```bash
# Fix ownership (macOS/Linux)
sudo chown -R $(id -u):$(id -g) .docker/data/
```

**Container won't start:**
```bash
# Check logs
docker compose -f .docker/compose.yaml logs penpot-backend

# Recreate containers
docker compose -f .docker/compose.yaml up -d --force-recreate
```

**MCP server not connecting:**
```bash
# Check MCP server logs
docker compose -f .docker/compose.yaml logs penpot-mcp

# Rebuild MCP server image
docker compose -f .docker/compose.yaml build penpot-mcp
```
