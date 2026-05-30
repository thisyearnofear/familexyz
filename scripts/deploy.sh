#!/bin/bash
# FamilyXYZ - Deploy to Hetzner VPS (Lean)
# Syncs ONLY essential files: agent + core packages + adapters
# Excludes: other packages, tests, docs, dev files

set -e

VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/home/deploy/familexyz"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "FamilyXYZ - Deploy to Hetzner"
echo "=========================================="
echo "Target: ${VPS_HOST}:${VPS_TARGET}"
echo ""

# Create temp directory with only essential files
TEMP_DEPLOY=$(mktemp -d)
echo "Preparing lean deployment in ${TEMP_DEPLOY}..."

# Copy only essential files
mkdir -p "${TEMP_DEPLOY}/agent"
mkdir -p "${TEMP_DEPLOY}/packages/core"
mkdir -p "${TEMP_DEPLOY}/packages/clients/direct"
mkdir -p "${TEMP_DEPLOY}/packages/clients/telegram"
mkdir -p "${TEMP_DEPLOY}/packages/blockchain/hedera-core"
mkdir -p "${TEMP_DEPLOY}/packages/config"
mkdir -p "${TEMP_DEPLOY}/packages/adapters/sqlite"
mkdir -p "${TEMP_DEPLOY}/packages/agent"
mkdir -p "${TEMP_DEPLOY}/packages/family/metrics"
mkdir -p "${TEMP_DEPLOY}/packages/family/nlp-utils"
mkdir -p "${TEMP_DEPLOY}/packages/family/plugin-wisdom"
mkdir -p "${TEMP_DEPLOY}/packages/family/plugin-intimacy"
mkdir -p "${TEMP_DEPLOY}/packages/family/plugin-generational-bridge"
mkdir -p "${TEMP_DEPLOY}/packages/family/plugin-presence"
mkdir -p "${TEMP_DEPLOY}/packages/family/plugin-growth"

# Agent source
rsync -a \
    --exclude 'node_modules' \
    --exclude '**/node_modules' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '__tests__' \
    --exclude '*.test.ts' \
    --exclude '.turbo' \
    "${PROJECT_ROOT}/agent/src/" "${TEMP_DEPLOY}/agent/src/"

# Agent package.json
cp "${PROJECT_ROOT}/agent/package.json" "${TEMP_DEPLOY}/agent/" 2>/dev/null || true

# Characters
if [ -d "${PROJECT_ROOT}/characters" ]; then
    cp -r "${PROJECT_ROOT}/characters" "${TEMP_DEPLOY}/"
fi

# Essential packages (space-conscious - only what's needed for agent)
ESSENTIAL_PKGS="core blockchain/hedera-core clients/direct clients/telegram adapters/sqlite config family/metrics family/nlp-utils family/plugin-wisdom family/plugin-intimacy family/plugin-generational-bridge family/plugin-presence family/plugin-growth family/plugin-savings"

# Note: we include dist folder explicitly since many packages need it
for pkg in $ESSENTIAL_PKGS; do
    if [ -d "${PROJECT_ROOT}/packages/${pkg}" ]; then
        echo "  - Including packages/${pkg}"
        # First sync everything except node_modules
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
            "${PROJECT_ROOT}/packages/${pkg}/" "${TEMP_DEPLOY}/packages/${pkg}/"
    fi
done

# Also sync packages/agent if exists (workspace package for agent imports)
if [ -d "${PROJECT_ROOT}/packages/agent" ]; then
    echo "  - Including packages/agent"
    rsync -a \
        --exclude 'node_modules' \
        --exclude '**/node_modules' \
        --exclude '__tests__' \
        --exclude '*.test.ts' \
        --exclude '*.md' \
        --exclude '.turbo' \
        "${PROJECT_ROOT}/packages/agent/" "${TEMP_DEPLOY}/packages/agent/"
fi

# Root package files
cp "${PROJECT_ROOT}/package.json" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/pnpm-lock.yaml" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/pnpm-workspace.yaml" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/tsconfig.json" "${TEMP_DEPLOY}/" 2>/dev/null || true

# .npmrc for pnpm workspace hoisting (required for @elizaos/* packages)
cat > "${TEMP_DEPLOY}/.npmrc" << 'NPMRCEOF'
public-hoist-pattern[]=*@elizaos*
NPMRCEOF

# pnpm workspace config (hoist @elizaos packages for workspace linking)
echo 'public-hoist-pattern[]=*@elizaos*' > "${TEMP_DEPLOY}/.npmrc"

# .env files (don't copy secrets)
if [ -f "${PROJECT_ROOT}/.env.production" ]; then
    cp "${PROJECT_ROOT}/.env.production" "${TEMP_DEPLOY}/.env"
fi

# Show what we're deploying
echo ""
echo "Deployment size:"
du -sh "${TEMP_DEPLOY}"
echo ""

# Step 1: Create directory structure on VPS
echo "[1/5] Setting up VPS directory structure..."
ssh "${VPS_USER}@${VPS_HOST}" "
mkdir -p ${VPS_TARGET}/shared/data
mkdir -p ${VPS_TARGET}/shared/logs
mkdir -p ${VPS_TARGET}/shared/characters

# Create .env if it doesn't exist
if [ ! -f ${VPS_TARGET}/shared/.env ]; then
    echo 'Creating empty .env - please edit with your API keys'
    touch ${VPS_TARGET}/shared/.env
fi
"

# Step 2: Sync lean deployment
echo "[2/5] Syncing lean deployment to VPS..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '**/node_modules' \
    --exclude '**/node_modules/*' \
    --exclude 'cache' \
    --exclude '**/cache' \
    --exclude '.turbo' \
    --exclude '*.log' \
    --exclude '*.tsbuildinfo' \
    "${TEMP_DEPLOY}/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/current/"

# Cleanup temp
rm -rf "${TEMP_DEPLOY}"

# Step 3: Install dependencies on server
echo "[3/5] Installing production dependencies on server..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo 'Installing pnpm...'
    curl -fsSL https://get.pnpm.io/v6.js | node - add --global pnpm >/dev/null 2>&1
fi

# Fix PM2 if broken (common issue with symlinked node_modules)
if [ ! -f /usr/local/lib/node_modules/pm2/lib/ProcessContainerFork.js ]; then
    echo 'Fixing broken PM2 installation...'
    sudo rm -rf /usr/local/lib/node_modules/pm2 2>/dev/null || true
    sudo mkdir -p /usr/local/lib/node_modules
    if [ -d ~/.pm2/modules/pm2-logrotate/node_modules/pm2 ]; then
        sudo cp -r ~/.pm2/modules/pm2-logrotate/node_modules/pm2 /usr/local/lib/node_modules/
        sudo cp -r ~/.pm2/modules/pm2-logrotate/node_modules/@pm2 /usr/local/lib/node_modules/pm2/node_modules/ 2>/dev/null || true
        sudo cp -r ~/.pm2/modules/pm2-logrotate/node_modules/* /usr/local/lib/node_modules/pm2/node_modules/ 2>/dev/null || true
    fi
fi

# Install production dependencies only (exclude devDependencies)
echo 'Running pnpm install (production only)...'
pnpm install --prod --force 2>&1 | tail -10

# Install tsx separately (needed for PM2 to run TypeScript)
echo 'Installing tsx for TypeScript execution...'
pnpm add tsx -w --prod 2>&1 | tail -5

# Fix tsx symlink (pnpm --prod doesn't create .bin symlinks properly)
if [ ! -f node_modules/.bin/tsx ] && [ -d node_modules/.pnpm/tsx@*/node_modules/tsx/bin ]; then
    echo 'Fixing tsx symlink...'
    TSX_BIN=\$(find node_modules/.pnpm -name 'tsx.js' -path '*/tsx/bin/*' 2>/dev/null | head -1)
    if [ -n \"\$TSX_BIN\" ]; then
        ln -sf \"\$TSX_BIN\" node_modules/.bin/tsx
    fi
fi

# Rebuild native modules (better-sqlite3@11.6.0)
# Note: pnpm rebuild targets the hoisted version (9.6.0), not 11.6.0
# that workspace packages resolve to. Must use node-gyp directly.
echo 'Rebuilding better-sqlite3@11.6.0 native binary...'
NODE_GYP=$(find node_modules/.pnpm -name 'node-gyp.js' -path '*/node-gyp/bin/*' 2>/dev/null | head -1)
BETTER_SQLITE3_DIR="node_modules/.pnpm/better-sqlite3@11.6.0/node_modules/better-sqlite3"
if [ -n "$NODE_GYP" ] && [ -d "$BETTER_SQLITE3_DIR" ]; then
    node "$NODE_GYP" --directory "$BETTER_SQLITE3_DIR" rebuild --release 2>&1 | grep -E '(gyp info ok|gyp ERR|error:)' || true
    echo 'Native module rebuild complete'
else
    echo 'Warning: Could not find node-gyp or better-sqlite3@11.6.0 directory'
fi
"

# Step 4: Copy shared files
echo "[4/5] Copying shared files..."
if [ -d "${PROJECT_ROOT}/characters" ]; then
    rsync -avz "${PROJECT_ROOT}/characters/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/shared/characters/" 2>/dev/null || true
fi

# Step 5: Start/restart PM2
echo "[5/5] Starting application with PM2..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Create PM2 ecosystem config with absolute paths
cat > ecosystem.config.js << 'PM2EOF'
const path = require('path');
const TARGET = '/home/deploy/familexyz';
module.exports = {
  apps: [{
    name: 'familexyz-agent',
    cwd: path.join(TARGET, 'current'),
    script: './agent/src/index.ts',
    args: '--characters="./characters/wisdom.character.json"',
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

# Load environment variables from shared .env
# Using set -a / source / set +a to handle comments and spaces correctly
set -a
. ../shared/.env 2>/dev/null || . /home/deploy/familexyz/shared/.env 2>/dev/null || true
set +a

# Always start fresh with updated ecosystem config (delete+start picks up config changes)
pm2 delete familexyz-agent 2>/dev/null || true
echo 'Starting fresh PM2 process...'
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

echo ''
echo 'PM2 Status:'
pm2 status familexyz-agent
"

# Verify deployment
echo ""
echo "[Verification] Checking health endpoint..."
sleep 3
ssh "${VPS_USER}@${VPS_HOST}" "
curl -s http://localhost:31338/health 2>&1 | head -c 200 || echo 'Health check not ready yet'
echo ''
"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Path: ${VPS_TARGET}/current"
echo ""
echo "Commands:"
echo "  SSH:          ssh ${VPS_USER}@${VPS_HOST}"
echo "  PM2 logs:     pm2 logs familexyz-agent"
echo "  PM2 status:   pm2 status"
echo "  Health:       curl http://localhost:31338/health"
echo ""
echo "Next: Edit ${VPS_TARGET}/shared/.env with your API keys"
echo ""
