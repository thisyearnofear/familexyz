#!/bin/bash
# FamilyXYZ - Deploy nginx config to existing api.famile.xyz
# ENHANCEMENT: Updates existing config, does NOT create new services
# SECURITY: Uses env variable for hostname (not hardcoded)

set -e

# Configuration (use env variable or default)
VPS_HOST="${VPS_HOSTNAME:-snel-bot}"

echo "=========================================="
echo "FamilyXYZ - Nginx Config Deployment"
echo "Target: ${VPS_HOST}"
echo "=========================================="

# Copy nginx config to VPS
echo "[1/3] Copying nginx config to VPS..."
scp docker/api.famile.xyz.nginx.conf "${VPS_HOST}:/tmp/familyxyz-nginx.conf"

# Deploy on VPS
ssh "${VPS_HOST}" "
echo '[2/3] Backing up existing config...'
sudo cp /etc/nginx/sites-available/api.famile.xyz /etc/nginx/sites-available/api.famile.xyz.backup.\$(date +%Y%m%d-%H%M%S)

echo '[3/3] Installing FamilyXYZ nginx config...'
sudo mv /tmp/familyxyz-nginx.conf /etc/nginx/sites-available/api.famile.xyz
sudo nginx -t && sudo systemctl reload nginx

echo ''
echo '=========================================='
echo 'Deployment Complete!'
echo '=========================================='
echo ''
echo 'Next Steps:'
echo '1. Start FamilyXYZ backend: docker compose up -d familexyz-backend'
echo '2. Test: curl https://api.famile.xyz/health'
echo ''
"

echo "Done!"
