#!/bin/bash

# Netlify build script for FamilyXYZ client
# This script ensures the client builds in isolation from the workspace

set -e

echo "🚀 Starting FamilyXYZ client build..."
echo "🔧 Node version: $(node --version)"
echo "📦 PNPM version: $(pnpm --version)"

# Remove workspace configuration to prevent pnpm from detecting the workspace
echo "📦 Removing workspace configuration..."
rm -f ../pnpm-workspace.yaml ../pnpm-lock.yaml

# Install dependencies in isolation
echo "📥 Installing dependencies..."
pnpm install --no-frozen-lockfile --shamefully-hoist

# Build the application
echo "🔨 Building application..."
pnpm run build

echo "✅ Build completed successfully!"
