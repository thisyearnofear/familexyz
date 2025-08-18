# ====================================
# Backend-only Dockerfile for Production
# ====================================
# Use a specific Node.js version for better reproducibility
FROM node:23.3.0-slim AS builder

# Install pnpm globally and necessary build tools
RUN npm install -g pnpm@9.4.0 && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        git \
        python3 \
        python3-pip \
        curl \
        node-gyp \
        ffmpeg \
        libtool-bin \
        autoconf \
        automake \
        libopus-dev \
        make \
        g++ \
        build-essential \
        libcairo2-dev \
        libjpeg-dev \
        libpango1.0-dev \
        libgif-dev \
        openssl \
        libssl-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Python 3 as the default python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/
COPY agent/package.json ./agent/

# Install dependencies (backend only)
RUN pnpm install --frozen-lockfile --filter="!familexyz-client"

# Copy source code
COPY packages ./packages
COPY agent ./agent
COPY characters ./characters
COPY scripts ./scripts
COPY config ./config
COPY .eslintrc.json eslint.config.mjs .npmrc ./

# Build backend packages only
RUN pnpm --filter="!familexyz-client" build

# Prune to production dependencies
RUN pnpm prune --prod --filter="!familexyz-client"

# ====================================
# Production Runtime Image
# ====================================
FROM node:23.3.0-slim AS production

# Install runtime dependencies and PM2
RUN npm install -g pnpm@9.4.0 pm2@5.3.0 && \
    apt-get update && \
    apt-get install -y \
        git \
        python3 \
        ffmpeg \
        curl \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r familexyz && useradd -r -g familexyz familexyz

# Set the working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder --chown=familexyz:familexyz /app/package.json ./
COPY --from=builder --chown=familexyz:familexyz /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=familexyz:familexyz /app/.npmrc ./
COPY --from=builder --chown=familexyz:familexyz /app/node_modules ./node_modules
COPY --from=builder --chown=familexyz:familexyz /app/packages ./packages
COPY --from=builder --chown=familexyz:familexyz /app/agent ./agent
COPY --from=builder --chown=familexyz:familexyz /app/characters ./characters
COPY --from=builder --chown=familexyz:familexyz /app/scripts ./scripts

# Create data directories
RUN mkdir -p /app/data/uploads /app/data/characters /app/logs && \
    chown -R familexyz:familexyz /app

# Copy PM2 ecosystem file
COPY --chown=familexyz:familexyz ecosystem.config.js ./

# Switch to non-root user
USER familexyz

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose backend port only
EXPOSE 3000

# Start with PM2 for production process management
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
