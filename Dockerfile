# Multi-stage build for @familexyz/agent
# --- base: sets up pnpm and workspace tools
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# Build tools for native deps like better-sqlite3 and @discordjs/opus
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
    libopus-dev libopus0 opus-tools \
    libsodium-dev libsodium23 \
    libtool autoconf automake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables to force @discordjs/opus to use system opus
ENV OPUS_INCLUDE_DIR=/usr/include/opus
ENV OPUS_LIB_DIR=/usr/lib/x86_64-linux-gnu
ENV npm_config_opus_include_dir=/usr/include/opus
ENV npm_config_opus_lib_dir=/usr/lib/x86_64-linux-gnu

WORKDIR /app

# --- deps: install only essential deps for family agents
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY agent/package.json ./agent/package.json
# Copy only essential packages for family agents
COPY packages/core ./packages/core
COPY packages/config ./packages/config
COPY packages/family ./packages/family
COPY packages/clients/direct ./packages/clients/direct
COPY packages/adapters/sqlite ./packages/adapters/sqlite
COPY packages/blockchain/hedera-core ./packages/blockchain/hedera-core
COPY characters ./characters
# Install only essential workspace dependencies
ENV DOCKER_BUILD=true
RUN pnpm install --frozen-lockfile --ignore-scripts
# Build all packages using turbo which handles dependencies
RUN pnpm turbo run build

# --- build: (optional) if we ever switch to a compiled build; currently ts-node runs
FROM deps AS build
COPY agent ./agent
# no separate build step needed; start uses ts-node

# --- runtime: minimal image
FROM node:22-slim AS runtime
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Persist database/data inside container path; recommend mounting a volume
VOLUME ["/app/data"]

# Copy only essential built packages and sources
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/agent/node_modules /app/agent/node_modules
COPY --from=deps /app/packages/core /app/packages/core
COPY --from=deps /app/packages/config /app/packages/config
COPY --from=deps /app/packages/family /app/packages/family
COPY --from=deps /app/packages/clients/direct /app/packages/clients/direct
COPY --from=deps /app/packages/adapters/sqlite /app/packages/adapters/sqlite
COPY --from=deps /app/packages/blockchain/hedera-core /app/packages/blockchain/hedera-core
COPY --from=build /app/agent /app/agent
COPY characters ./characters

# Expose backend and health check ports
EXPOSE 3000 3001

# Default envs (override via compose)
ENV NODE_ENV=production
ENV HEALTH_PORT=3001

# Create logs directory
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:${HEALTH_PORT:-3001}/ || exit 1

# Start the agent (characters are relative to /app/agent)
WORKDIR /app/agent
CMD ["pnpm", "start"]

