# syntax=docker/dockerfile:1

# =============================================================================
# Looms SvelteKit Application
# Multi-stage build: install → build → runtime
# =============================================================================

# --- Base ---
FROM oven/bun:1 AS base
WORKDIR /app

# --- Install dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production=false

# --- Build ---
FROM deps AS build
COPY . .
RUN bun run build

# --- Production runtime ---
FROM base AS runtime

# Copy only production deps + built output
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

# SvelteKit adapter-node reads PORT
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Health check — SvelteKit serves on PORT
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "build/index.js"]
