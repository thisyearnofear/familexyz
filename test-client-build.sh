#!/bin/bash

# Simple test to verify client build works with pnpm filter
echo "🧪 Testing client build with pnpm filter..."

# Test the exact command Netlify will run
echo "📦 Installing client dependencies..."
pnpm install --filter './client...' --no-frozen-lockfile

echo "🔨 Building client..."
pnpm --filter './client...' run build

echo "📋 Verifying build output..."
if [ -d "client/dist" ]; then
    echo "✅ Build successful! Output in client/dist:"
    ls -la client/dist/
else
    echo "❌ Build failed - no dist directory found"
    exit 1
fi

echo "✅ Client build test completed successfully!"
