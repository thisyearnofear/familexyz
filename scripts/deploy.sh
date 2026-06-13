#!/bin/bash
# FamilyXYZ - Deploy (Build local, rsync)
# Syncs only agent runtime packages, installs prod deps on server.
# Uses releases/ + current symlink for atomic deployments.
# Requires: pnpm, rsync, ssh access to $VPS_HOST

set -e

VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/home/deploy/familexyz"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_NAME="familexyz-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo "FamilyXYZ - Deploy"
echo "=========================================="
echo "Target: ${VPS_HOST}:${VPS_TARGET}"
echo "Release: ${RELEASE_NAME}"
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
  monetization
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

cat > "${TEMP_DEPLOY}/.deployment.json" << EOF
{
  "release": "${RELEASE_NAME}",
  "deployed_from": "$(git -C "${PROJECT_ROOT}" branch --show-current 2>/dev/null || echo "unknown")",
  "git_commit": "$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")",
  "git_commit_short": "$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")",
  "built_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deploy_script": "scripts/deploy.sh"
}
EOF

# Minimal workspace config (only agent runtime packages)
cat > "${TEMP_DEPLOY}/pnpm-workspace.yaml" << 'WORKSPACE'
packages:
  - "packages/core"
  - "packages/config"
  - "packages/monetization"
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

# --- Rsync to new release dir on server ---
echo "[1/5] Syncing to server (releases/${RELEASE_NAME})..."
ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_TARGET}/releases/${RELEASE_NAME}"
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '**/node_modules' \
    --exclude '.turbo' \
    --exclude '*.log' \
    --exclude '*.tsbuildinfo' \
    "${TEMP_DEPLOY}/" "${VPS_USER}@${VPS_HOST}:${VPS_TARGET}/releases/${RELEASE_NAME}/"

rm -rf "${TEMP_DEPLOY}"

# --- Install deps and set up release on server ---
echo "[2/5] Installing production dependencies..."
ssh "${VPS_USER}@${VPS_HOST}" "
RELEASE_DIR=${VPS_TARGET}/releases/${RELEASE_NAME}
cd \$RELEASE_DIR

# Create shared dir symlinks (persistent data)
ln -sfn ${VPS_TARGET}/shared/env/.env .env 2>/dev/null || true
ln -sfn ${VPS_TARGET}/shared/data ./data 2>/dev/null || true

# Install deps (--no-frozen-lockfile in case lockfile drifts)
pnpm install --no-frozen-lockfile 2>&1 | tail -5

# Rebuild native modules (better-sqlite3 needs node-gyp for target Node version)
for ver in 9.6.0 11.6.0; do
  BETTER_DIR=\"node_modules/.pnpm/better-sqlite3@\${ver}/node_modules/better-sqlite3\"
  if [ -d \"\$BETTER_DIR\" ] && [ ! -f \"\$BETTER_DIR/build/Release/better_sqlite3.node\" ]; then
    echo \"  Building better-sqlite3@\${ver}...\"
    cd \"\$BETTER_DIR\"
    /usr/bin/node /usr/lib/node_modules/pnpm/dist/node_modules/node-gyp/bin/node-gyp.js configure --release 2>&1 | tail -1
    /usr/bin/node /usr/lib/node_modules/pnpm/dist/node_modules/node-gyp/bin/node-gyp.js build --release 2>&1 | tail -1
    cd \$RELEASE_DIR
  fi
done
"

# --- Atomically switch current symlink ---
echo "[3/5] Switching current symlink to new release..."
ssh "${VPS_USER}@${VPS_HOST}" "
# Point current to the new release
ln -sfn releases/${RELEASE_NAME} ${VPS_TARGET}/current.new
mv -T ${VPS_TARGET}/current.new ${VPS_TARGET}/current 2>/dev/null || \
  mv ${VPS_TARGET}/current.new ${VPS_TARGET}/current

# Clean up old releases (keep last 3)
cd ${VPS_TARGET}/releases
ls -t | tail -n +4 | xargs -r rm -rf
"

# --- Restart PM2 ---
echo "[4/5] Restarting application..."
ssh "${VPS_USER}@${VPS_HOST}" "
# Reload .env into pm2's env
set -a
. ${VPS_TARGET}/shared/env/.env 2>/dev/null || true
set +a

pm2 restart familexyz-agent --update-env 2>/dev/null || pm2 start ${VPS_TARGET}/current/ecosystem.config.cjs
pm2 save
echo ''
pm2 status familexyz-agent
"

# --- Verify ---
echo "[5/5] Verifying health endpoint..."
sleep 5
ssh "${VPS_USER}@${VPS_HOST}" "curl -s http://localhost:31338/health 2>&1 | head -c 200" || echo 'Health check not ready yet'

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo "  Release: ${RELEASE_NAME}"
echo "  SSH:     ssh ${VPS_USER}@${VPS_HOST}"
echo "  Logs:    pm2 logs familexyz-agent"
echo "  Rollback: ln -sfn releases/<old-release> ${VPS_TARGET}/current && pm2 restart familexyz-agent"
echo "=========================================="
