#!/bin/bash
# FamilyXYZ - Deploy Artifact to Hetzner VPS
# Uses symlink-based deployment for atomic updates and instant rollbacks

set -e

# Configuration
VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="${VPS_TARGET:-/home/deploy/familexyz}"
ARTIFACT_NAME="${1:-latest}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "FamilyXYZ - Deploy to Hetzner"
echo "=========================================="
echo "Target: ${VPS_HOST}:${VPS_TARGET}"
echo "Artifact: ${ARTIFACT_NAME}"
echo ""

# Find artifact
if [ "$ARTIFACT_NAME" = "latest" ]; then
    ARTIFACT_FILE=$(ls -t /tmp/familexyz-artifacts/*.tar.gz 2>/dev/null | head -1)
    if [ -z "$ARTIFACT_FILE" ]; then
        echo "No artifact found. Run ./scripts/build-artifact.sh first"
        exit 1
    fi
    ARTIFACT_NAME=$(basename "$ARTIFACT_FILE" .tar.gz)
else
    ARTIFACT_FILE="/tmp/familexyz-artifacts/${ARTIFACT_NAME}.tar.gz"
fi

if [ ! -f "$ARTIFACT_FILE" ]; then
    echo "Artifact not found: ${ARTIFACT_FILE}"
    exit 1
fi

ARTIFACT_SIZE=$(du -h "$ARTIFACT_FILE" | cut -f1)
echo "Artifact size: ${ARTIFACT_SIZE}"
echo ""

# Step 1: Upload
echo "[1/6] Uploading artifact to VPS..."
scp "$ARTIFACT_FILE" "${VPS_USER}@${VPS_HOST}:/tmp/${ARTIFACT_NAME}.tar.gz"

# Step 2: Extract on VPS
echo "[2/6] Extracting and setting up on VPS..."
ssh "${VPS_USER}@${VPS_HOST}" "
set -e

echo 'Setting up directory structure...'
mkdir -p ${VPS_TARGET}/releases
mkdir -p ${VPS_TARGET}/shared/data
mkdir -p ${VPS_TARGET}/shared/logs
mkdir -p ${VPS_TARGET}/shared/characters
mkdir -p ${VPS_TARGET}/shared/env

# Copy .env to shared/.env (the path agent/index.ts reads from dotenv)
if [ -f ${VPS_TARGET}/shared/env/.env ]; then
    cp ${VPS_TARGET}/shared/env/.env ${VPS_TARGET}/shared/.env 2>/dev/null || true
fi

RELEASE_DIR=${VPS_TARGET}/releases/${ARTIFACT_NAME}
echo 'Extracting artifact...'
mkdir -p \${RELEASE_DIR}
tar -xzf /tmp/${ARTIFACT_NAME}.tar.gz -C \${RELEASE_DIR} --strip-components=1

echo 'Switching symlink...'
ln -sfn \${RELEASE_DIR} ${VPS_TARGET}/current

echo 'Installing production dependencies...'
cd \${RELEASE_DIR}
rm -f pnpm-lock.yaml
pnpm install 2>&1 | tail -15

# Upgrade zod to fix ai@3.4.33 compatibility (needs zod ^3.25.28)
pnpm add zod@^3.25.0 2>&1 | tail -5

# Fix: pnpm hoisting may not create top-level zod symlink
# Create it manually so @elizaos/core's config validation works
if [ -d \"node_modules/.pnpm\" ]; then
    ZOD_DIR=\$(ls -d node_modules/.pnpm/zod@*/node_modules/zod 2>/dev/null | head -1)
    if [ -n \"\$ZOD_DIR\" ] && [ ! -L \"node_modules/zod\" ] && [ ! -d \"node_modules/zod\" ]; then
        ln -sfn \"\$ZOD_DIR\" node_modules/zod
        echo \"  Created zod symlink from .pnpm store\"
    fi
fi

# Write workspace symlink helper
cat > /tmp/link-workspace.sh << 'SCRIPT'
#!/bin/bash
R="$(pwd)"
set -e

echo "Creating workspace symlinks in ${R}..."
mkdir -p "${R}/node_modules/@elizaos"

for entry in client-direct:clients/direct client-telegram:clients/telegram core:core config:config adapter-sqlite:adapters/sqlite hedera-core:blockchain/hedera-core plugin-node:plugin-node family-metrics:family/metrics family-nlp-utils:family/nlp-utils; do
  pkg_name="${entry%%:*}"
  pkg_path="${entry#*:}"
  target="${R}/packages/${pkg_path}"
  link="${R}/node_modules/@elizaos/${pkg_name}"
  if [ -d "${target}" ] && [ ! -L "${link}" ]; then
    ln -sfn "${target}" "${link}"
    echo "  Linked @elizaos/${pkg_name}"
  fi
done

# Family plugins
mkdir -p "${R}/node_modules/@elizaos/family"
for plugin in plugin-wisdom plugin-intimacy plugin-generational-bridge plugin-presence plugin-growth plugin-savings; do
  target="${R}/packages/family/${plugin}"
  link="${R}/node_modules/@elizaos/family/${plugin}"
  if [ -d "${target}" ] && [ ! -L "${link}" ]; then
    ln -sfn "${target}" "${link}"
    echo "  Linked @elizaos/family/${plugin}"
  fi
done

# @familexyz scoped packages
mkdir -p "${R}/node_modules/@familexyz"
for entry in core-lite:core-lite agent-services:agent; do
  pkg_name="${entry%%:*}"
  pkg_dir="${entry#*:}"
  target="${R}/packages/${pkg_dir}"
  link="${R}/node_modules/@familexyz/${pkg_name}"
  if [ -d "${target}" ] && [ ! -L "${link}" ]; then
    ln -sfn "${target}" "${link}"
    echo "  Linked @familexyz/${pkg_name}"
  fi
done

echo "Workspace symlinks created."
SCRIPT
chmod +x /tmp/link-workspace.sh
cd \${RELEASE_DIR} && bash /tmp/link-workspace.sh

echo 'Cleaning up old releases (keeping last 3)...'
cd ${VPS_TARGET}/releases
ls -dt */ 2>/dev/null | head -n -3 | xargs -r rm -rf
"

# Step 3: Copy shared files
echo "[3/6] Copying shared files..."
if [ -d "${PROJECT_ROOT}/characters" ]; then
    scp -r ${PROJECT_ROOT}/characters/* "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/shared/characters/" 2>/dev/null || true
fi

# Step 4: Start with PM2 using tsx
echo "[4/6] Starting application with PM2..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Create PM2 ecosystem config with env vars baked in
# (required because ESM imports are hoisted, so dotenv load runs after
#  @elizaos/config validates env vars at module level)
cat > ecosystem.config.cjs << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'familexyz-agent',
    script: 'src/index.ts',
    interpreter: 'node',
    interpreter_args: '--import tsx',
    cwd: '/home/deploy/familexyz/current/agent',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '31337',
      HEALTH_PORT: '31338',
      SERVER_PORT: '31337',
      DATABASE_PROVIDER: 'sqlite',
      CACHE_STORE: 'database',
      MODEL_PROVIDER: 'venice',
      VENICE_API_KEY: 'dIc30f3ibGlNEuZs-HiSMK4KRJVXP-Whsme-KpdOoG',
      TELEGRAM_BOT_TOKEN: '8369925666:AAE91ZKO3RAi8-cRYwykmjd4Jv4j-Vi9ONY',
      DEFAULT_LOG_LEVEL: 'info',
      LOG_JSON_FORMAT: 'false',
    },
    error_file: '/home/deploy/familexyz/shared/logs/error.log',
    out_file: '/home/deploy/familexyz/shared/logs/out.log',
    combine_logs: true,
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }],
};
PM2EOF

# Also copy .env to the location agent/index.ts reads from
if [ -f ../shared/env/.env ]; then
    cp ../shared/env/.env ../shared/.env 2>/dev/null || true
fi

if pm2 describe familexyz-agent > /dev/null 2>&1; then
    echo 'Restarting existing PM2 process...'
    pm2 restart familexyz-agent --update-env
else
    echo 'Starting new PM2 process...'
    pm2 start ecosystem.config.cjs
fi

pm2 save

echo ''
echo 'PM2 Status:'
pm2 status familexyz-agent
"

# Step 5: Verify
echo "[5/6] Verifying deployment..."
sleep 8
ssh "${VPS_USER}@${VPS_HOST}" "
echo 'Checking health endpoint...'
curl -s http://localhost:31338/health | head -c 300 || echo 'Health check not ready yet'
echo ''
echo 'PM2 Status:'
pm2 status familexyz-agent 2>/dev/null | head -5
"

# Step 6: Cleanup temp file
echo "[6/6] Cleaning up..."
ssh "${VPS_USER}@${VPS_HOST}" "rm -f /tmp/${ARTIFACT_NAME}.tar.gz"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Release: ${ARTIFACT_NAME}"
echo "Path: ${VPS_TARGET}/current"
echo ""
echo "Commands:"
echo "  SSH:          ssh ${VPS_USER}@${VPS_HOST}"
echo "  PM2 logs:     pm2 logs familexyz-agent"
echo "  PM2 status:   pm2 status"
echo "  Health:       curl https://api.famile.xyz/health"
echo ""
echo "Rollback:"
echo "  cd ${VPS_TARGET}/releases"
echo "  ls -lt  # Find previous release"
echo "  ln -sfn <previous-release> ${VPS_TARGET}/current"
echo "  pm2 restart familexyz-agent"
echo ""
