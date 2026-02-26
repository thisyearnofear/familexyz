#!/bin/bash
# FamilyXYZ - Rollback to Previous Release
# Instant rollback by switching symlink

set -e

VPS_HOST="${VPS_HOSTNAME:-snel-bot}"
VPS_USER="${VPS_USER:-deploy}"
VPS_TARGET="/opt/familexyz"

echo "=========================================="
echo "FamilyXYZ - Rollback Deployment"
echo "=========================================="

# List available releases
echo "📁 Available releases on ${VPS_HOST}:"
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}/releases
ls -lt
"

echo ""
echo "Enter release name to rollback to (or press Ctrl+C to cancel):"
read -r TARGET_RELEASE

# Verify release exists
if ! ssh "${VPS_USER}@${VPS_HOST}" "[ -d ${VPS_TARGET}/releases/${TARGET_RELEASE} ]"; then
    echo "❌ Release not found: ${TARGET_RELEASE}"
    exit 1
fi

# Switch symlink
echo "🔗 Switching symlink to ${TARGET_RELEASE}..."
ssh "${VPS_USER}@${VPS_HOST}" "
cd ${VPS_TARGET}
ln -sfn releases/${TARGET_RELEASE} current
pm2 restart familexyz-agent
pm2 save
"

echo ""
echo "✅ Rollback complete!"
echo "📦 Active release: ${TARGET_RELEASE}"
echo ""
echo "Verify: curl https://api.famile.xyz/health"
