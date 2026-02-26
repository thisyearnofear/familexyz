#!/bin/bash
# FamilyXYZ - Deploy to Hetzner VPS (Simple)
# Direct deploy: copy source → install deps → restart PM2
# No pre-built artifacts, no complexity

set -e

VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/opt/familexyz"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "FamilyXYZ - Deploy to Hetzner"
echo "=========================================="
echo "🎯 Target: ${VPS_HOST}:${VPS_TARGET}"
echo ""

# Step 1: Create directory structure on VPS
echo "[1/5] Setting up VPS directory structure..."
ssh "${VPS_USER}@${VPS_HOST}" "
mkdir -p ${VPS_TARGET}/shared/data
mkdir -p ${VPS_TARGET}/shared/logs
mkdir -p ${VPS_TARGET}/shared/characters

# Create .env if it doesn't exist
if [ ! -f ${VPS_TARGET}/shared/.env ]; then
    echo '⚠️  Creating empty .env - please edit with your API keys'
    touch ${VPS_TARGET}/shared/.env
fi
"

# Step 2: Sync source code (excludes node_modules, dist, etc.)
echo "[2/5] Syncing source code to VPS..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '.turbo' \
    --exclude 'coverage' \
    --exclude '.git' \
    "${PROJECT_ROOT}/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/current/"

# Step 3: Install dependencies on server
echo "[3/5] Installing production dependencies on server..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo '📦 Installing pnpm...'
    curl -fsSL https://get.pnpm.io/v6.js | node - add --global pnpm
fi

# Install only production dependencies
echo '📦 Running pnpm install --prod...'
pnpm install --frozen-lockfile --prod
"

# Step 4: Copy shared files
echo "[4/5] Copying shared files..."
ssh "${VPS_USER}@${VPS_HOST}" "
# Copy characters if they exist
if [ -d '${PROJECT_ROOT}/characters' ]; then
    echo '📦 Copying characters...'
fi
"

# Copy characters
rsync -avz "${PROJECT_ROOT}/characters/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/shared/characters/" 2>/dev/null || true

# Step 5: Start/restart PM2
echo "[5/5] Starting application with PM2..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Create PM2 ecosystem config
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
      PORT: process.env.PORT || '3000',
      HEALTH_PORT: process.env.HEALTH_PORT || '3001',
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
echo '🔧 Loading environment...'
export \$(cat ../shared/.env | xargs 2>/dev/null || true)

# Start or restart PM2
if pm2 describe familexyz-agent > /dev/null 2>&1; then
    echo '🔄 Restarting existing PM2 process...'
    pm2 restart familexyz-agent
else
    echo '🚀 Starting new PM2 process...'
    pm2 start ecosystem.config.js
fi

# Save PM2 process list
pm2 save

echo ''
echo '📊 PM2 Status:'
pm2 status familexyz-agent
"

# Verify deployment
echo ""
echo "[Verification] Checking health endpoint..."
sleep 3
ssh "${VPS_USER}@${VPS_HOST}" "
curl -s http://localhost:3001/health 2>&1 | head -c 200 || echo '⚠️  Health check not ready yet'
echo ''
"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📁 Path: ${VPS_TARGET}/current"
echo ""
echo "📊 Commands:"
echo "  SSH:          ssh ${VPS_USER}@${VPS_HOST}"
echo "  PM2 logs:     pm2 logs familexyz-agent"
echo "  PM2 status:   pm2 status"
echo "  Health:       curl https://api.famile.xyz/health"
echo ""
echo "⚙️  Next: Edit /opt/familexyz/shared/.env with your API keys"
echo ""
