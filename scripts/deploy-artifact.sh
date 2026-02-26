#!/bin/bash
# FamilyXYZ - Deploy Artifact to Hetzner VPS
# Uses symlink-based deployment for atomic updates and instant rollbacks
#
# Directory Structure:
#   /opt/familexyz/
#   ├── current -> releases/20260226-133000  (symlink to active release)
#   ├── releases/
#   │   ├── 20260226-133000/
#   │   ├── 20260226-140000/
#   │   └── ...
#   └── shared/
#       ├── .env
#       ├── data/
#       ├── logs/
#       └── characters/

set -e

# Configuration
VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/opt/familexyz"
ARTIFACT_NAME="${1:-latest}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "FamilyXYZ - Deploy to Hetzner"
echo "=========================================="
echo "🎯 Target: ${VPS_HOST}:${VPS_TARGET}"
echo "📦 Artifact: ${ARTIFACT_NAME}"
echo ""

# Find artifact
if [ "$ARTIFACT_NAME" = "latest" ]; then
    ARTIFACT_FILE=$(ls -t /tmp/familexyz-artifacts/*.tar.gz 2>/dev/null | head -1)
    if [ -z "$ARTIFACT_FILE" ]; then
        echo "❌ No artifact found. Run ./scripts/build-artifact.sh first"
        exit 1
    fi
    ARTIFACT_NAME=$(basename "$ARTIFACT_FILE" .tar.gz)
else
    ARTIFACT_FILE="/tmp/familexyz-artifacts/${ARTIFACT_NAME}.tar.gz"
fi

if [ ! -f "$ARTIFACT_FILE" ]; then
    echo "❌ Artifact not found: ${ARTIFACT_FILE}"
    exit 1
fi

ARTIFACT_SIZE=$(du -h "$ARTIFACT_FILE" | cut -f1)
echo "📊 Artifact size: ${ARTIFACT_SIZE}"
echo ""

# Step 1: Upload artifact
echo "[1/6] Uploading artifact to VPS..."
scp "$ARTIFACT_FILE" "${VPS_USER}@${VPS_HOST}:/tmp/${ARTIFACT_NAME}.tar.gz"

# Step 2: Deploy on VPS
echo "[2/6] Deploying on VPS..."
ssh "${VPS_USER}@${VPS_HOST}" "
set -e

echo '📁 Setting up directory structure...'
mkdir -p ${VPS_TARGET}/releases
mkdir -p ${VPS_TARGET}/shared/data
mkdir -p ${VPS_TARGET}/shared/logs
mkdir -p ${VPS_TARGET}/shared/characters

# Create .env if it doesn't exist
if [ ! -f ${VPS_TARGET}/shared/.env ]; then
    echo '⚠️  Creating empty .env - please edit with your API keys'
    touch ${VPS_TARGET}/shared/.env
fi

# Create release directory
RELEASE_DIR=${VPS_TARGET}/releases/${ARTIFACT_NAME}
echo '📦 Extracting artifact...'
mkdir -p \${RELEASE_DIR}
tar -xzf /tmp/${ARTIFACT_NAME}.tar.gz -C ${VPS_TARGET}/releases/
mv ${VPS_TARGET}/releases/${ARTIFACT_NAME} \${RELEASE_DIR}

echo '🔗 Switching symlink...'
# Atomically switch current symlink
ln -sfn \${RELEASE_DIR} ${VPS_TARGET}/current

echo '📦 Installing production dependencies...'
cd \${RELEASE_DIR}

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    curl -fsSL https://get.pnpm.io/v6.js | node - add --global pnpm
fi

# Install only production dependencies
pnpm install --frozen-lockfile --prod

echo '🧹 Cleaning up old releases (keeping last 3)...'
cd ${VPS_TARGET}/releases
ls -dt */ 2>/dev/null | head -n -3 | xargs -r rm -rf

echo '✅ Deployment complete!'
echo ''
echo 'Current release: ${ARTIFACT_NAME}'
echo 'Release path: \${RELEASE_DIR}'
"

# Step 3: Copy shared files (characters, .env)
echo "[3/6] Copying shared files..."
ssh "${VPS_USER}@${VPS_HOST}" "
# Copy characters if they exist locally
if [ -d '${PROJECT_ROOT}/characters' ]; then
    echo '📦 Copying characters...'
    scp -r ${PROJECT_ROOT}/characters/* ${VPS_HOST}:${VPS_TARGET}/shared/characters/
fi
"

# Step 4: Start/restart PM2
echo "[4/6] Starting application with PM2..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/current

# Copy PM2 ecosystem config if it exists
if [ -f 'ecosystem.config.js' ]; then
    echo '📋 Using existing PM2 config...'
else
    echo '📋 Creating PM2 config...'
    cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'familexyz-agent',
    script: './agent/dist/index.js',
    cwd: '.',
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
fi

# Load environment
echo '🔧 Loading environment...'
export \$(cat ../shared/.env | xargs)

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

# Step 5: Verify deployment
echo "[5/6] Verifying deployment..."
sleep 3
ssh "${VPS_USER}@${VPS_HOST}" "
echo '🔍 Checking health endpoint...'
curl -s http://localhost:3001/health | head -c 200 || echo '⚠️  Health check not ready yet'
echo ''
"

# Step 6: Cleanup
echo "[6/6] Cleaning up..."
ssh "${VPS_USER}@${VPS_HOST}" "rm -f /tmp/${ARTIFACT_NAME}.tar.gz"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📦 Release: ${ARTIFACT_NAME}"
echo "📁 Path: ${VPS_TARGET}/current"
echo "🔗 Symlink: ${VPS_TARGET}/current -> releases/${ARTIFACT_NAME}"
echo ""
echo "📊 Commands:"
echo "  SSH:          ssh ${VPS_USER}@${VPS_HOST}"
echo "  PM2 logs:     pm2 logs familexyz-agent"
echo "  PM2 status:   pm2 status"
echo "  Health:       curl https://api.famile.xyz/health"
echo ""
echo "🔄 Rollback:"
echo "  cd ${VPS_TARGET}/releases"
echo "  ls -lt  # Find previous release"
echo "  ln -sfn <previous-release> ${VPS_TARGET}/current"
echo "  pm2 restart familexyz-agent"
echo ""
