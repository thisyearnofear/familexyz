# Multi-stage build for @familexyz/agent
# --- base: sets up pnpm and workspace tools
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# Build tools for native deps like better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- deps: install only prod deps for the agent via filter to avoid monorepo bloat
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY agent/package.json ./agent/package.json
# Copy only the packages needed to resolve filtered dependencies
# Add more package.json files if pnpm needs them for workspace resolution
COPY packages ./packages
COPY characters ./characters
# Install dev deps for the agent only (ts-node), prod deps for its workspace deps
RUN pnpm -r --filter "@familexyz/agent" install --frozen-lockfile

# --- build: (optional) if we ever switch to a compiled build; currently ts-node runs
FROM deps AS build
COPY agent ./agent
# no separate build step needed; start uses ts-node

# --- runtime: minimal image
FROM node:22-slim AS runtime
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

# Persist database/data inside container path; recommend mounting a volume
VOLUME ["/app/data"]

# Copy node_modules and sources from build
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/agent/node_modules /app/agent/node_modules
COPY --from=deps /app/packages /app/packages
COPY --from=build /app/agent /app/agent
COPY characters ./characters

# Expose backend port
EXPOSE 3000

# Default envs (override via compose)
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD curl -fsS http://localhost:3001/health || exit 1

# Start the agent (characters are relative to /app/agent)
WORKDIR /app/agent
CMD ["pnpm", "start"]

