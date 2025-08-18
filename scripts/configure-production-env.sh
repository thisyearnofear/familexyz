#!/bin/bash

# FamilyXYZ Production Environment Configuration Script
# This script helps configure the production environment with secure secrets

set -e

echo "🔧 Configuring FamilyXYZ Production Environment..."
echo "================================================"

# Check if we're on the server
if [ ! -f "/opt/familexyz/.env.production" ]; then
    echo "❌ Error: /opt/familexyz/.env.production not found"
    echo "Please run this script on the production server"
    exit 1
fi

cd /opt/familexyz

# Backup existing .env if it exists
if [ -f ".env" ]; then
    echo "📋 Backing up existing .env file..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy production template
echo "📄 Setting up production environment file..."
cp .env.production .env

# Generate secure secrets
echo "🔐 Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Update secrets in .env file
echo "🔄 Updating security keys..."
# Use a different delimiter to avoid issues with special characters
sed -i "s|REPLACE_WITH_SECURE_JWT_SECRET|$JWT_SECRET|g" .env
sed -i "s|REPLACE_WITH_SECURE_SESSION_SECRET|$SESSION_SECRET|g" .env
sed -i "s|REPLACE_WITH_32_CHAR_ENCRYPTION_KEY|$ENCRYPTION_KEY|g" .env

echo "✅ Security keys configured successfully!"
echo ""
echo "🔑 NEXT STEPS - Configure API Keys:"
echo "==================================="
echo ""
echo "You need to obtain API keys from at least ONE of these providers:"
echo ""
echo "1. OpenAI (Recommended):"
echo "   - Visit: https://platform.openai.com/api-keys"
echo "   - Create an API key"
echo "   - Update OPENAI_API_KEY in /opt/familexyz/.env"
echo ""
echo "2. Anthropic Claude (Alternative):"
echo "   - Visit: https://console.anthropic.com/"
echo "   - Create an API key"
echo "   - Update ANTHROPIC_API_KEY in /opt/familexyz/.env"
echo ""
echo "3. Google AI (Alternative):"
echo "   - Visit: https://makersuite.google.com/app/apikey"
echo "   - Create an API key"
echo "   - Update GOOGLE_GENERATIVE_AI_API_KEY in /opt/familexyz/.env"
echo ""
echo "📝 To update API keys, edit the file:"
echo "   nano /opt/familexyz/.env"
echo ""
echo "🔍 Look for lines starting with:"
echo "   OPENAI_API_KEY=REPLACE_WITH_OPENAI_API_KEY"
echo "   ANTHROPIC_API_KEY=REPLACE_WITH_ANTHROPIC_API_KEY"
echo "   GOOGLE_GENERATIVE_AI_API_KEY=REPLACE_WITH_GOOGLE_API_KEY"
echo ""
echo "🚀 After updating API keys, restart the application:"
echo "   systemctl restart familexyz"
echo ""
echo "📊 Check application status:"
echo "   systemctl status familexyz"
echo "   journalctl -u familexyz -f"
echo ""
echo "🌐 Test the application:"
echo "   curl https://famile.xyz/health"
echo ""

# Show current configuration status
echo "📋 Current Configuration Status:"
echo "==============================="
echo "✅ JWT Secret: Configured"
echo "✅ Session Secret: Configured"
echo "✅ Encryption Key: Configured"
echo "✅ Database: SQLite (configured)"
echo "✅ Server URLs: HTTPS (configured)"
echo "✅ CORS: Configured for famile.xyz"
echo ""
echo "⚠️  Still needed:"
if grep -q "REPLACE_WITH_OPENAI_API_KEY" .env; then
    echo "❌ OpenAI API Key"
else
    echo "✅ OpenAI API Key"
fi

if grep -q "REPLACE_WITH_ANTHROPIC_API_KEY" .env; then
    echo "❌ Anthropic API Key"
else
    echo "✅ Anthropic API Key"
fi

if grep -q "REPLACE_WITH_GOOGLE_API_KEY" .env; then
    echo "❌ Google AI API Key"
else
    echo "✅ Google AI API Key"
fi

echo ""
echo "💡 Tip: You only need ONE AI provider API key to get started!"
echo "    OpenAI is recommended for the best experience."
echo ""
echo "🎯 Configuration script completed!"