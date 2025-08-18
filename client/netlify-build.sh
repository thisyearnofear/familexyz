#!/bin/bash

# Netlify build script for FamilyXYZ client
# This script runs from repo root and completely isolates the client build

set -e

echo "🚀 Starting FamilyXYZ client build from root..."
echo "📁 Current directory: $(pwd)"
echo "🔧 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# STEP 1: Completely destroy workspace structure
echo "💥 Destroying workspace structure..."
rm -f pnpm-workspace.yaml || true
rm -f pnpm-lock.yaml || true
rm -f .pnpmrc || true
rm -f .npmrc || true
rm -rf node_modules || true
rm -rf packages || true

# Also remove any Discord-related cached files
rm -rf ~/.pnpm-store || true
rm -rf ~/.npm || true

# Backup original package.json and replace with minimal version
echo "📦 Replacing root package.json..."
mv package.json package.json.bak || true
echo '{
  "name": "temp-build",
  "private": true,
  "scripts": {}
}' > package.json

# STEP 2: Navigate to client and do clean build
echo "📁 Moving to client directory..."
cd client

echo "🧹 Cleaning client directory..."
rm -rf node_modules dist || true

# STEP 3: Install dependencies in isolation
echo "📥 Installing client dependencies with npm..."
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_UPDATE_NOTIFIER=false
export NPM_CONFIG_OPTIONAL=false
export NPM_CONFIG_PROGRESS=false
export SKIP_OPTIONAL_DEPS=true

# Try npm install with fallback options
if ! npm install --no-optional --legacy-peer-deps --production=false --ignore-engines --loglevel=warn; then
    echo "⚠️  First install attempt failed, trying with more aggressive options..."
    npm install --no-optional --legacy-peer-deps --production=false --ignore-engines --force --loglevel=error
fi

# STEP 4: Build the application
echo "🔨 Building application..."
echo "📋 Verifying package.json dependencies..."
if [ -f package.json ]; then
    echo "✅ Client package.json found"
    # Show only production dependencies for verification
    node -e "const pkg = require('./package.json'); console.log('Dependencies:', Object.keys(pkg.dependencies || {}).length); console.log('DevDependencies:', Object.keys(pkg.devDependencies || {}).length);"
else
    echo "❌ No package.json found in client directory!"
    exit 1
fi

echo "🔨 Starting build process..."
npm run build

# STEP 5: Verify build output
echo "📋 Build verification:"
ls -la dist/ || echo "❌ No dist directory found!"
echo "📊 Build size:"
du -sh dist/* 2>/dev/null || echo "No files to measure"

echo "✅ Client build completed successfully!"
