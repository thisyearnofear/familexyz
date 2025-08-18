#!/bin/bash

# Test script to simulate Netlify build locally
echo "🧪 Testing build configuration locally..."

# Set environment variables like Netlify would
export NODE_VERSION="22"
export NPM_CONFIG_FUND="false"
export NPM_CONFIG_AUDIT="false"
export NPM_CONFIG_UPDATE_NOTIFIER="false"
export NPM_CONFIG_OPTIONAL="false"
export SKIP_OPTIONAL_DEPS="true"
export PNPM_CONFIG_OPTIONAL="false"
export PNPM_CONFIG_AUTO_INSTALL_PEERS="false"
export PNPM_CONFIG_STRICT_PEER_DEPENDENCIES="false"
export CI="true"

echo "📋 Environment variables set:"
echo "NODE_VERSION: $NODE_VERSION"
echo "CI: $CI"
echo "NPM_CONFIG_OPTIONAL: $NPM_CONFIG_OPTIONAL"

# Test the build script
echo "🚀 Running build script..."
chmod +x client/netlify-build.sh
bash client/netlify-build.sh

echo "✅ Build test completed!"
