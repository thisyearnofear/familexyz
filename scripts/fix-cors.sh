#!/bin/bash

# Script to fix CORS configuration on Hetzner server
# Run this script on your Hetzner server to update CORS settings

set -e

echo "🔧 Fixing CORS configuration for FamilyXYZ backend..."

# Define the correct CORS origins
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://familexyz.netlify.app,https://famile.xyz"

# Check if we're running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo "✅ Running with root privileges"
else
    echo "❌ This script needs to be run with sudo privileges"
    echo "Please run: sudo $0"
    exit 1
fi

# Function to update environment file
update_env_file() {
    local env_file="$1"
    
    if [[ -f "$env_file" ]]; then
        echo "📝 Updating $env_file..."
        
        # Backup the original file
        cp "$env_file" "${env_file}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update or add CORS_ORIGINS
        if grep -q "^CORS_ORIGINS=" "$env_file"; then
            sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=$CORS_ORIGINS|" "$env_file"
            echo "✅ Updated existing CORS_ORIGINS in $env_file"
        else
            echo "CORS_ORIGINS=$CORS_ORIGINS" >> "$env_file"
            echo "✅ Added CORS_ORIGINS to $env_file"
        fi
        
        # Ensure TRUST_PROXY is set
        if grep -q "^TRUST_PROXY=" "$env_file"; then
            sed -i "s|^TRUST_PROXY=.*|TRUST_PROXY=true|" "$env_file"
        else
            echo "TRUST_PROXY=true" >> "$env_file"
        fi
        
        echo "✅ Updated $env_file"
    else
        echo "⚠️  $env_file not found, skipping..."
    fi
}

# Common locations for environment files
ENV_FILES=(
    "/opt/familexyz/.env"
    "/opt/familexyz/current/.env"
    "/home/familexyz/.env"
    "/root/.env"
    ".env"
)

echo "🔍 Looking for environment files..."

for env_file in "${ENV_FILES[@]}"; do
    update_env_file "$env_file"
done

# Check if PM2 is running the application
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting PM2 application..."
    pm2 restart familexyz-backend || pm2 restart all
    echo "✅ PM2 application restarted"
else
    echo "⚠️  PM2 not found. You may need to manually restart your application."
fi

# Check if Docker is running
if command -v docker &> /dev/null && docker ps | grep -q familexyz; then
    echo "🐳 Restarting Docker containers..."
    docker-compose -f /opt/familexyz/docker/docker-compose.yaml restart backend
    echo "✅ Docker containers restarted"
fi

# Check if systemd service exists
if systemctl list-units --type=service | grep -q familexyz; then
    echo "🔄 Restarting systemd service..."
    systemctl restart familexyz
    echo "✅ Systemd service restarted"
fi

echo ""
echo "🎉 CORS configuration update completed!"
echo ""
echo "📋 Summary of changes:"
echo "   - Updated CORS_ORIGINS to: $CORS_ORIGINS"
echo "   - Ensured TRUST_PROXY=true"
echo "   - Restarted application services"
echo ""
echo "🧪 Test your frontend now at: https://familexyz.netlify.app"
echo ""
echo "📝 If you still see CORS errors, check:"
echo "   1. Your backend logs for any startup errors"
echo "   2. That your backend is accessible at https://famile.xyz"
echo "   3. That your SSL certificate is valid"
echo ""
