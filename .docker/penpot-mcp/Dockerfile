# Penpot MCP Server (Official)
# Builds and runs the official Penpot MCP server from penpot/penpot repo
#
# Ports:
#   4400 - Plugin preview server (serves manifest.json)
#   4401 - MCP HTTP/SSE endpoint
#   4402 - WebSocket server (plugin connection)
#   4403 - REPL server (debugging)

FROM node:22-slim

# Install git and corepack dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Clone the penpot repo (mcp-prod branch)
RUN git clone --depth 1 --branch mcp-prod https://github.com/penpot/penpot.git .

WORKDIR /app/mcp

# Run setup script (installs dependencies via corepack/pnpm)
RUN ./scripts/setup

# Approve build scripts for esbuild and sharp
RUN pnpm approve-builds esbuild sharp || true

# Install and build
RUN pnpm -r install && pnpm run build

# Expose ports
EXPOSE 4400 4401 4402 4403

# Environment variables for configuration
ENV PENPOT_MCP_SERVER_LISTEN_ADDRESS=0.0.0.0
ENV PENPOT_MCP_SERVER_PORT=4401
ENV PENPOT_MCP_WEBSOCKET_PORT=4402
ENV PENPOT_MCP_REPL_PORT=4403
ENV PENPOT_MCP_PLUGIN_SERVER_LISTEN_ADDRESS=0.0.0.0
ENV PENPOT_MCP_LOG_LEVEL=info

# Start the MCP server
CMD ["pnpm", "run", "start"]
