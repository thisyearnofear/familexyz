#!/bin/bash

# Simple test to verify client build works like Netlify
echo "🧪 Testing client build (Netlify simulation)..."

# Change to client directory like Netlify does
cd client

# Test the exact commands Netlify will run
echo "📦 Installing client dependencies with npm..."
npm install

echo "🔨 Building client..."
npm run build

echo "📋 Verifying build output..."
if [ -d "dist" ]; then
    echo "✅ Build successful! Output in client/dist:"
    ls -la dist/
else
    echo "❌ Build failed - no dist directory found"
    exit 1
fi

echo "✅ Client build test completed successfully!"
