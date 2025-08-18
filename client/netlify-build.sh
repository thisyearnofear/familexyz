#!/bin/bash

# Netlify build script for FamilyXYZ client
# This script ensures the client builds in complete isolation from the workspace

set -e

echo "🚀 Starting FamilyXYZ client build..."
echo "🔧 Node version: $(node --version)"
echo "📦 PNPM version: $(pnpm --version)"

# Completely isolate from workspace - remove ALL workspace traces
echo "📦 Completely isolating from workspace..."
rm -f ../pnpm-workspace.yaml ../pnpm-lock.yaml
rm -f ../package.json  # Remove root package.json to prevent workspace detection
rm -rf ../node_modules  # Remove any existing node_modules
rm -rf ../packages  # Remove packages directory reference

# Create a minimal package.json in parent to prevent workspace detection
echo '{}' > ../package.json

# Install dependencies using npm instead of pnpm to avoid workspace issues
echo "📥 Installing dependencies with npm (to avoid workspace detection)..."
npm install --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
