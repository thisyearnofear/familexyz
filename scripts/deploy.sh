#!/bin/bash
# FamilyXYZ - Deploy (Build local, rsync)
# Syncs only agent runtime packages, installs prod deps on server.
# Requires: pnpm, rsync, ssh access to $VPS_HOST

set -e

VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/home/deploy/familexyz"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "FamilyXYZ - Deploy"
echo "=========================================="
echo "Target: ${VPS_HOST}:${VPS_TARGET}"
echo ""

# --- Build temp directory with only essential files ---
TEMP_DEPLOY=$(mktemp -d)
echo "Preparing lean deployment in ${TEMP_DEPLOY}..."

# Agent package (the entrypoint, runs via tsx)
mkdir -p "${TEMP_DEPLOY}/agent"
cp "${PROJECT_ROOT}/agent/package.json" "${TEMP_DEPLOY}/agent/" 2>/dev/null || true
rsync -a \
    --exclude 'node_modules' \
    --exclude '**/node_modules' \
    --exclude 'dist' \
    --exclude '__tests__' \
    --exclude '*.test.ts' \
    --exclude '.turbo' \
    "${PROJECT_ROOT}/agent/src/" "${TEMP_DEPLOY}/agent/src/"

# Characters
if [ -d "${PROJECT_ROOT}/characters" ]; then
    cp -r "${PROJECT_ROOT}/characters" "${TEMP_DEPLOY}/"
fi

# i18n
if [ -d "${PROJECT_ROOT}/i18n" ]; then
    cp -r "${PROJECT_ROOT}/i18n" "${TEMP_DEPLOY}/"
fi

# Config
if [ -d "${PROJECT_ROOT}/config" ]; then
    cp -r "${PROJECT_ROOT}/config" "${TEMP_DEPLOY}/"
fi

# Workspace packages needed at runtime (agent + its transitive deps)
ESSENTIAL_PKGS="
  core
  config
  blockchain/hedera-core
  blockchain/plugin-familyxyz
  clients/direct
  clients/telegram
  adapters/sqlite
  agent
  family/metrics
  family/nlp-utils
  family/plugin-wisdom
  family/plugin-intimacy
  family/plugin-generational-bridge
  family/plugin-presence
  family/plugin-growth
  family/plugin-savings
"

for pkg in $ESSENTIAL_PKGS; do
    src="${PROJECT_ROOT}/packages/${pkg}"
    dst="${TEMP_DEPLOY}/packages/${pkg}"
    if [ -d "$src" ]; then
        echo "  + packages/${pkg}"
        mkdir -p "$dst"
        rsync -a \
            --exclude 'node_modules' \
            --exclude '**/node_modules' \
            --exclude 'cache' \
            --exclude '**/cache' \
            --exclude '__tests__' \
            --exclude '*.test.ts' \
            --exclude '*.md' \
            --exclude '.turbo' \
            --exclude '*.tsbuildinfo' \
            "$src/" "$dst/"
    fi
done

# Root files
cp "${PROJECT_ROOT}/package.json" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/pnpm-lock.yaml" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/tsconfig.json" "${TEMP_DEPLOY}/" 2>/dev/null || true

# Minimal workspace config (only agent runtime packages)
cat > "${TEMP_DEPLOY}/pnpm-workspace.yaml" << 'WORKSPACE'
packages:
  - "packages/core"
  - "packages/config"
  - "packages/adapters/sqlite"
  - "packages/clients/direct"
  - "packages/clients/telegram"
  - "packages/blockchain/hedera-core"
  - "packages/blockchain/plugin-familyxyz"
  - "packages/family/*"
  - "packages/agent"
  - "agent"
WORKSPACE

# .npmrc
cat > "${TEMP_DEPLOY}/.npmrc" << 'NPMRCEOF'
public-hoist-pattern[]=*@elizaos*
NPMRCEOF

echo ""
echo "Deployment size:"
du -sh "${TEMP_DEPLOY}"
echo ""

# --- Rsync to server ---
echo "[1/4] Syncing to server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '**/node_modules' \
    --exclude 'cache' \
    --exclude '**/cache' \
    --exclude '.turbo' \
    --exclude '*.log' \
    --exclude '*.tsbuildinfo' \
    "${TEMP_DEPLOY}/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/current/"

rm -rf "${TEMP_DEPLOY}"

# --- Install production deps on server ---
echo "[2/4] Installing production dependencies..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Create shared dir symlinks (persistent data)
ln -sfn ${VPS_TARGET}/shared/env/.env .env 2>/dev/null || true
ln -sfn ${VPS_TARGET}/shared/data ./data 2>/dev/null || true

# Install prod deps (tsx+typescript in root deps so .bin/tsx works)
pnpm install --prod 2>&1 | tail -5

# Fix tsx/typescript symlinks (pnpm --prod sometimes skips .bin symlinks)
mkdir -p node_modules/.bin
TSX_DIR=\$(ls -d node_modules/.pnpm/tsx@*/node_modules/tsx 2>/dev/null | head -1)
if [ -n \"\$TSX_DIR\" ] && [ ! -f node_modules/.bin/tsx ]; then
  ln -sf \"../.pnpm/tsx@\$(ls -d node_modules/.pnpm/tsx@*/node_modules/tsx 2>/dev/null | head -1 | sed 's|.*node_modules/\\.pnpm/tsx@||' | sed 's|/node_modules.*||')/node_modules/tsx/dist/cli.mjs\" node_modules/.bin/tsx 2>/dev/null || true
fi
TS_DIR=\$(ls -d node_modules/.pnpm/typescript@*/node_modules/typescript 2>/dev/null | head -1)
if [ -n \"\$TS_DIR\" ] && [ ! -f node_modules/.bin/tsc ]; then
  ln -sf \"../.pnpm/typescript@\$(ls -d node_modules/.pnpm/typescript@*/node_modules/typescript 2>/dev/null | head -1 | sed 's|.*node_modules/\\.pnpm/typescript@||' | sed 's|/node_modules.*||')/node_modules/typescript/bin/tsc\" node_modules/.bin/tsc 2>/dev/null || true
fi

# Rebuild native modules (better-sqlite3 needs node-gyp for target Node version)
# pnpm rebuild can fail on canvas etc, so target specific packages
for ver in 9.6.0 11.6.0; do
  BETTER_DIR=\"node_modules/.pnpm/better-sqlite3@\${ver}/node_modules/better-sqlite3\"
  if [ -d \"\$BETTER_DIR\" ] && [ ! -f \"\$BETTER_DIR/build/Release/better_sqlite3.node\" ]; then
    echo \"  Building better-sqlite3@\${ver}...\"
    cd \"\$BETTER_DIR\"
    rm -rf build 2>/dev/null
    /usr/bin/node /usr/lib/node_modules/pnpm/dist/node_modules/node-gyp/bin/node-gyp.js configure --release 2>&1 | tail -1
    mkdir -p build/node_gyp_bins
    ln -sf /usr/bin/node build/node_gyp_bins/node
    ln -sf /usr/bin/npm build/node_gyp_bins/npm
    /usr/bin/node /usr/lib/node_modules/pnpm/dist/node_modules/node-gyp/bin/node-gyp.js build --release 2>&1 | tail -1
    cd ${VPS_TARGET}/current
  fi
done
"

# --- Regenerate ecosystem config (rsync --delete may have removed it) ---
echo "[3/4] Regenerating PM2 ecosystem config and restarting..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current
cat > ecosystem.config.js << 'PM2EOF'
const path = require('path');
const TARGET = '${VPS_TARGET}';
module.exports = {
  apps: [{
    name: 'familexyz-agent',
    cwd: path.join(TARGET, 'current'),
    script: './agent/src/index.ts',
    args: '--characters=\"./characters/wisdom.character.json\"',
    interpreter: path.join(TARGET, 'current', 'node_modules', '.bin', 'tsx'),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      SERVER_PORT: '31337',
      HEALTH_PORT: '31338',
    },
    error_file: path.join(TARGET, 'shared', 'logs', 'error.log'),
    out_file: path.join(TARGET, 'shared', 'logs', 'out.log'),
    log_file: path.join(TARGET, 'shared', 'logs', 'combined.log'),
    time: true,
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }],
};
PM2EOF

# Reload .env into pm2's env
set -a
. ${VPS_TARGET}/shared/env/.env 2>/dev/null || true
set +a

pm2 restart familexyz-agent 2>/dev/null || pm2 start ecosystem.config.js
pm2 save
echo ''
pm2 status familexyz-agent
"

# --- Verify ---
echo "[4/4] Verifying health endpoint..."
sleep 3
ssh "${VPS_USER}@${VPS_HOST}" "curl -s http://localhost:31338/health 2>&1 | head -c 200" || echo 'Health check not ready yet'

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo "  SSH:   ssh ${VPS_USER}@${VPS_HOST}"
echo "  Logs:  pm2 logs familexyz-agent"
echo "=========================================="
