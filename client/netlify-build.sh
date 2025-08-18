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
rm -f .npmrc || true
rm -rf node_modules || true
rm -rf packages || true

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
npm install --no-optional --legacy-peer-deps --production=false

# STEP 4: Build the application
echo "🔨 Building application..."
npm run build

# STEP 5: Verify build output
echo "📋 Build verification:"
ls -la dist/ || echo "❌ No dist directory found!"
echo "📊 Build size:"
du -sh dist/* 2>/dev/null || echo "No files to measure"

echo "✅ Client build completed successfully!"
