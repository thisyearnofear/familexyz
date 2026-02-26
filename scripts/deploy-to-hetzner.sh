#!/bin/bash
# FamilyXYZ - Hetzner VPS Production Deployment Script
# Sets up nginx reverse proxy with Let's Encrypt TLS

set -e

# Configuration
DOMAIN="api.famile.xyz"
EMAIL="admin@famile.xyz"  # Update with your email
PROJECT_DIR="/opt/familexyz"

echo "=========================================="
echo "FamilyXYZ Production Deployment"
echo "Domain: $DOMAIN"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./deploy-to-hetzner.sh)"
    exit 1
fi

# Create project directory
echo "[1/7] Creating project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Copy deployment files from local
echo "[2/7] Copying deployment files..."
# Run this from your local machine instead:
# scp docker-compose.production.yml snel-bot:/tmp/
# scp -r docker/nginx snel-bot:/tmp/

# Create directories for nginx/certbot
mkdir -p docker/nginx/certbot/www
mkdir -p docker/nginx/certbot/conf

# Install Docker if not present
echo "[3/7] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
else
    echo "Docker already installed"
fi

# Get SSL certificate (initial setup)
echo "[4/7] Obtaining Let's Encrypt certificate..."
docker run --rm \
    -v "$PROJECT_DIR/docker/nginx/certbot/www:/var/www/certbot" \
    -v "$PROJECT_DIR/docker/nginx/certbot/conf:/etc/letsencrypt" \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --domain $DOMAIN \
    --non-interactive \
    --agree-tos \
    --force-renewal

if [ $? -eq 0 ]; then
    echo "Certificate obtained successfully!"
else
    echo "Failed to obtain certificate. Check DNS settings."
    exit 1
fi

# Copy nginx config
echo "[5/7] Setting up nginx configuration..."
# Copy from local or create placeholder
if [ -f "/tmp/nginx.conf" ]; then
    mv /tmp/nginx.conf docker/nginx/nginx.conf
fi

# Start services
echo "[6/7] Starting services..."
if [ -f "/tmp/docker-compose.production.yml" ]; then
    mv /tmp/docker-compose.production.yml .
fi

docker compose -f docker-compose.production.yml up -d

# Verify deployment
echo "[7/7] Verifying deployment..."
sleep 5

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services:"
docker compose -f docker-compose.production.yml ps
echo ""
echo "Endpoints:"
echo "  Health:   https://$DOMAIN/health"
echo "  API:      https://$DOMAIN/api/*"
echo ""
echo "Logs:"
echo "  Backend:  docker logs familexyz-backend"
echo "  Nginx:    docker logs familexyz-nginx"
echo ""
echo "Next Steps:"
echo "  1. Update DNS: Point api.famile.xyz to your Hetzner IP"
echo "  2. Test: curl https://$DOMAIN/health"
echo "  3. Update client/.env: VITE_API_BASE_URL=https://$DOMAIN"
echo ""
