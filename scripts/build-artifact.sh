#!/bin/bash
# FamilyXYZ - Build Production Artifact (Lean)
# Creates minimal artifact - just agent source + package.json
# Server will install all dependencies

set -e

echo "=========================================="
echo "FamilyXYZ - Build Lean Artifact"
echo "=========================================="

# Configuration
ARTIFACT_NAME="familexyz-agent-$(date +%Y%m%d-%H%M%S)"
ARTIFACT_DIR="/tmp/familexyz-artifacts/${ARTIFACT_NAME}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "📦 Building artifact: ${ARTIFACT_NAME}"

# Clean previous builds
rm -rf /tmp/familexyz-artifacts
mkdir -p "${ARTIFACT_DIR}"

# Copy ONLY agent source
echo "📦 Copying agent source..."
mkdir -p "${ARTIFACT_DIR}"
rsync -a \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '*.log' \
    agent/src "${ARTIFACT_DIR}/"

# Copy agent package.json
cp agent/package.json "${ARTIFACT_DIR}/"

# Copy root package files (for workspace resolution)
cp package.json "${ARTIFACT_DIR}/"
cp pnpm-lock.yaml "${ARTIFACT_DIR}/"
cp pnpm-workspace.yaml "${ARTIFACT_DIR}/"

# Copy only package source (no node_modules)
echo "📦 Copying essential packages (source only)..."
mkdir -p "${ARTIFACT_DIR}/packages"

# Copy package source without node_modules or dist
for pkg in core hedera-core client-direct plugin-node; do
    if [ -d "packages/${pkg}" ]; then
        echo "  - ${pkg}"
        mkdir -p "${ARTIFACT_DIR}/packages/${pkg}"
        rsync -a \
            --exclude 'node_modules' \
            --exclude 'dist' \
            --exclude '*.log' \
            "packages/${pkg}/" "${ARTIFACT_DIR}/packages/${pkg}/"
    fi
done

# Create deployment metadata
cat > "${ARTIFACT_DIR}/.deployment.json" << EOF
{
  "artifact": "${ARTIFACT_NAME}",
  "built_at": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Compress with better compression
echo "📦 Compressing artifact..."
cd /tmp/familexyz-artifacts
tar -cf - "${ARTIFACT_NAME}" | gzip -9 > "${ARTIFACT_NAME}.tar.gz"

# Show size
ARTIFACT_SIZE=$(du -h "${ARTIFACT_NAME}.tar.gz" | cut -f1)
echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo "📦 Artifact: ${ARTIFACT_NAME}.tar.gz"
echo "📊 Size: ${ARTIFACT_SIZE}"
echo ""
