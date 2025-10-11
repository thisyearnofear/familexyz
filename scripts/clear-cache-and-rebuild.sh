#!/bin/bash

# Clear all caches and force rebuild with disabled packages

echo "🧹 CACHE CLEANER - Clearing all caches and forcing rebuild"

# Clear Turbo cache
echo "🔥 Clearing Turbo cache..."
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf packages/*/.turbo
rm -rf packages/*/node_modules/.cache

# Clear pnpm cache
echo "🔥 Clearing pnpm cache..."
pnpm store prune

# Clear node_modules
echo "🔥 Clearing node_modules..."
rm -rf node_modules
rm -rf packages/*/node_modules

# Clear dist directories
echo "🔥 Clearing dist directories..."
find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear lock file
echo "🔥 Clearing lock file..."
rm -f pnpm-lock.yaml

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
pnpm install

echo ""
echo "✅ CACHE CLEARING COMPLETE!"
echo "🚀 All caches cleared, dependencies reinstalled"
echo "💡 Turbo should now use the disabled package.json scripts"
echo "🔧 Ready for Docker build with mega nuclear configuration"
