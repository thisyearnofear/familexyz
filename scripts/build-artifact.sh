#!/bin/bash
# FamilyXYZ - Build Production Artifact (Lean + Dist)
# Builds locally, then packages compiled dist + agent source for deployment.
# Server only needs to install deps and start with tsx.

set -e

echo "=========================================="
echo "FamilyXYZ - Build Lean Artifact"
echo "=========================================="

ARTIFACT_NAME="familexyz-agent-$(date +%Y%m%d-%H%M%S)"
ARTIFACT_DIR="/tmp/familexyz-artifacts/${ARTIFACT_NAME}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building artifact: ${ARTIFACT_NAME}"

rm -rf /tmp/familexyz-artifacts
mkdir -p "${ARTIFACT_DIR}"

# Step 1: Copy agent source (preserve agent/ path)
echo "Copying agent source..."
mkdir -p "${ARTIFACT_DIR}/agent"
rsync -a --exclude 'node_modules' --exclude '*.log' agent/src "${ARTIFACT_DIR}/agent/"
cp agent/package.json "${ARTIFACT_DIR}/agent/"

# Step 2: Copy root workspace files
echo "Copying workspace files..."
cp package.json "${ARTIFACT_DIR}/"
cp pnpm-lock.yaml "${ARTIFACT_DIR}/"
cp pnpm-workspace.yaml "${ARTIFACT_DIR}/"

# Step 3: Copy built package dist files
echo "Copying essential packages (source + dist)..."
mkdir -p "${ARTIFACT_DIR}/packages"

# Map workspace package names to their actual file paths
PKG_MAP=(
  "core:core"
  "config:config"
  "plugin-node:plugin-node"
  "agent:agent"
  "blockchain/hedera-core:blockchain/hedera-core"
  "clients/direct:clients/direct"
  "clients/telegram:clients/telegram"
  "adapters/sqlite:adapters/sqlite"
  "family/plugin-wisdom:family/plugin-wisdom"
  "family/plugin-intimacy:family/plugin-intimacy"
  "family/plugin-generational-bridge:family/plugin-generational-bridge"
  "family/plugin-presence:family/plugin-presence"
  "family/plugin-growth:family/plugin-growth"
  "family/plugin-savings:family/plugin-savings"
  "family/metrics:family/metrics"
  "family/nlp-utils:family/nlp-utils"
)

for entry in "${PKG_MAP[@]}"; do
    pkg_path="${entry#*:}"
    src="packages/${pkg_path}"
    dst="${ARTIFACT_DIR}/packages/${pkg_path}"
    if [ -d "${src}" ]; then
        echo "  - ${src}"
        mkdir -p "${dst}"
        rsync -a --exclude 'node_modules' --exclude '*.log' "${src}/" "${dst}/"
    else
        echo "  [SKIP] ${src} not found"
    fi
done

# Step 4: Copy characters
if [ -d "characters" ]; then
    echo "Copying character files..."
    rsync -a characters "${ARTIFACT_DIR}/"
fi

# Step 5: Deployment metadata
cat > "${ARTIFACT_DIR}/.deployment.json" << EOF
{
  "artifact": "${ARTIFACT_NAME}",
  "built_at": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Compress
echo "Compressing artifact..."
cd /tmp/familexyz-artifacts
tar -czf "${ARTIFACT_NAME}.tar.gz" "${ARTIFACT_NAME}"

ARTIFACT_SIZE=$(du -h "${ARTIFACT_NAME}.tar.gz" | cut -f1)
echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo "Artifact: ${ARTIFACT_NAME}.tar.gz"
echo "Size: ${ARTIFACT_SIZE}"
echo ""
