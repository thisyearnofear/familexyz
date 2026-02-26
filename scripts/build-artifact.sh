#!/bin/bash
# FamilyXYZ - Build Production Artifact
# Creates a deployable artifact (dist + package.json + production deps)

set -e

echo "=========================================="
echo "FamilyXYZ - Build Production Artifact"
echo "=========================================="

# Configuration
ARTIFACT_NAME="familexyz-agent-$(date +%Y%m%d-%H%M%S)"
ARTIFACT_DIR="/tmp/familexyz-artifacts/${ARTIFACT_NAME}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "📦 Building artifact: ${ARTIFACT_NAME}"
echo "📁 Project root: ${PROJECT_ROOT}"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf /tmp/familexyz-artifacts
mkdir -p "${ARTIFACT_DIR}"

# Build agent package
echo "🔨 Building agent package..."
cd "${PROJECT_ROOT}"

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Build the agent
echo "🏗️  Running build..."
pnpm --filter @elizaos/agent build

# Copy built files to artifact
echo "📦 Copying built files to artifact..."
mkdir -p "${ARTIFACT_DIR}/agent"

# Copy agent dist
if [ -d "agent/dist" ]; then
    cp -r agent/dist "${ARTIFACT_DIR}/agent/"
fi

# Copy agent source (for PM2)
cp -r agent/src "${ARTIFACT_DIR}/agent/" 2>/dev/null || true
cp -r agent/characters "${ARTIFACT_DIR}/agent/" 2>/dev/null || true

# Copy package files
cp package.json "${ARTIFACT_DIR}/"
cp pnpm-lock.yaml "${ARTIFACT_DIR}/"
cp pnpm-workspace.yaml "${ARTIFACT_DIR}/"

# Copy necessary packages (only what's needed)
echo "📦 Copying required packages..."
mkdir -p "${ARTIFACT_DIR}/packages"

# Copy core packages that agent depends on
for pkg in core hedera-core client-direct; do
    if [ -d "packages/${pkg}" ]; then
        cp -r "packages/${pkg}" "${ARTIFACT_DIR}/packages/"
    fi
done

# Copy plugins if they exist
if [ -d "packages/plugin-node" ]; then
    cp -r packages/plugin-node "${ARTIFACT_DIR}/packages/"
fi

# Create deployment metadata
cat > "${ARTIFACT_DIR}/.deployment.json" << EOF
{
  "artifact": "${ARTIFACT_NAME}",
  "built_at": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Create compressed artifact
echo "📦 Compressing artifact..."
cd /tmp/familexyz-artifacts
tar -czf "${ARTIFACT_NAME}.tar.gz" "${ARTIFACT_NAME}"

# Show artifact size
ARTIFACT_SIZE=$(du -h "${ARTIFACT_NAME}.tar.gz" | cut -f1)
echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo "📦 Artifact: /tmp/familexyz-artifacts/${ARTIFACT_NAME}.tar.gz"
echo "📊 Size: ${ARTIFACT_SIZE}"
echo "📝 Contents:"
tar -tzf "${ARTIFACT_NAME}.tar.gz" | head -20
echo "..."
echo ""
echo "Next step: ./scripts/deploy-artifact.sh ${ARTIFACT_NAME}"
