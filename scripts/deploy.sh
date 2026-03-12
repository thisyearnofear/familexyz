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
mkdir -p "${TEMP_DEPLOY}/packages"

# Agent source
rsync -a \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '__tests__' \
    --exclude '*.test.ts' \
    "${PROJECT_ROOT}/agent/src/" "${TEMP_DEPLOY}/agent/src/"

# Agent package.json
cp "${PROJECT_ROOT}/agent/package.json" "${TEMP_DEPLOY}/agent/" 2>/dev/null || true

# Characters
if [ -d "${PROJECT_ROOT}/characters" ]; then
    cp -r "${PROJECT_ROOT}/characters" "${TEMP_DEPLOY}/"
fi

# Essential packages (space-conscious - only what's needed for agent)
ESSENTIAL_PKGS="core hedera-core client-direct adapters/sqlite family/metrics family/nlp-utils family/plugin-wisdom family/plugin-intimacy family/plugin-generational-bridge family/plugin-presence family/plugin-growth"
for pkg in $ESSENTIAL_PKGS; do
    if [ -d "${PROJECT_ROOT}/packages/${pkg}" ]; then
        echo "  - Including packages/${pkg}"
        rsync -a \
            --exclude 'node_modules' \
            --exclude 'dist' \
            --exclude '__tests__' \
            --exclude '*.test.ts' \
            --exclude '*.md' \
            "${PROJECT_ROOT}/packages/${pkg}/" "${TEMP_DEPLOY}/packages/${pkg}/"
    fi
done

# Also sync packages/agent if exists (workspace package for agent imports)
if [ -d "${PROJECT_ROOT}/packages/agent" ]; then
    echo "  - Including packages/agent"
    rsync -a \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude '__tests__' \
        --exclude '*.test.ts' \
        --exclude '*.md' \
        "${PROJECT_ROOT}/packages/agent/" "${TEMP_DEPLOY}/packages/agent/"
fi

# Root package files
cp "${PROJECT_ROOT}/package.json" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/pnpm-lock.yaml" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/pnpm-workspace.yaml" "${TEMP_DEPLOY}/"
cp "${PROJECT_ROOT}/tsconfig.json" "${TEMP_DEPLOY}/" 2>/dev/null || true

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

# Install only production dependencies
echo 'Running pnpm install...'
pnpm install --frozen-lockfile --prod 2>&1 | tail -10
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

# Create PM2 ecosystem config (using exotic ports 31337/31338)
cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'familexyz-agent',
    script: './agent/src/index.ts',
    interpreter: 'tsx',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      SERVER_PORT: '31337',
      HEALTH_PORT: '31338',
    },
    error_file: '../shared/logs/error.log',
    out_file: '../shared/logs/out.log',
    log_file: '../shared/logs/combined.log',
    time: true,
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }],
};
PM2EOF

# Load environment
export \$(cat ../shared/.env | xargs 2>/dev/null || true)

# Start or restart PM2
if pm2 describe familexyz-agent > /dev/null 2>&1; then
    echo 'Restarting existing PM2 process...'
    pm2 restart familexyz-agent
else
    echo 'Starting new PM2 process...'
    pm2 start ecosystem.config.js
fi

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
