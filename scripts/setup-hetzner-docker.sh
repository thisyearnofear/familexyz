#!/bin/bash

# FamilyXYZ Hetzner Server Setup Script - Docker Edition
# Optimized setup for Docker-based deployment
# Version 3.0 - Clean, Modern, Resource-Efficient

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

log "🚀 Starting FamilyXYZ Hetzner Server Setup v3.0 (Docker Edition)..."

# Update system packages
log "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "🔧 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common \
    htop iotop nethogs tree jq zip unzip fail2ban ufw certbot nginx-full \
    logrotate rsync cron ca-certificates gnupg lsb-release

# Install Docker and Docker Compose
log "🐳 Installing Docker and Docker Compose..."
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl enable docker
systemctl start docker

# Add current user to docker group (if not root)
if [ "$USER" != "root" ]; then
    usermod -aG docker $USER
fi

success "Docker installed and configured"

# Create deployment directory structure
log "📁 Creating deployment directories..."
mkdir -p /opt/familexyz/{logs,backups,data}
chown -R root:root /opt/familexyz
chmod -R 755 /opt/familexyz

# Create .env template
log "📝 Creating .env template..."
cat > /opt/familexyz/.env.template << 'EOF'
# FamilyXYZ Production Environment Configuration
# Copy this file to .env and fill in your actual values

# Server Configuration
NODE_ENV=production
PORT=3000
HEALTH_PORT=3001
PREVENT_UNHANDLED_EXIT=true

# Database Configuration
DATABASE_URL=sqlite:///app/data/familexyz.db

# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional AI Model Providers
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
OLLAMA_SERVER_URL=

# Social Media Integration
TWITTER_USERNAME=
TWITTER_PASSWORD=
TWITTER_EMAIL=
TWITTER_2FA_SECRET=
TELEGRAM_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_API_TOKEN=

# Blockchain Configuration
EVM_PRIVATE_KEY=
SOLANA_PRIVATE_KEY=
SOLANA_PUBLIC_KEY=

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://familexyz.netlify.app,https://famile.xyz
TRUST_PROXY=true

# Logging
LOG_LEVEL=info

# Performance
MAX_MEMORY_USAGE=1024
EOF

success ".env template created"

# Configure firewall
log "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
success "Firewall configured"

# Configure fail2ban
log "🔒 Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

systemctl enable fail2ban
systemctl start fail2ban
success "Fail2ban configured and started"

# Setup log rotation for Docker containers
log "📋 Setting up log rotation..."
cat > /etc/logrotate.d/familexyz << 'EOF'
/opt/familexyz/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
success "Log rotation configured"

# Create Docker management scripts
log "📜 Creating Docker management scripts..."

# Deployment script
cat > /opt/familexyz/deploy.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Docker Deployment Script
# Zero-downtime deployment with Docker

set -e

DEPLOY_DIR="/opt/familexyz"
IMAGE_NAME="familexyz/agent:latest"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

cd "$DEPLOY_DIR"

log "🚀 Starting Docker deployment..."

# Pull latest image (if using registry)
# docker pull "$IMAGE_NAME"

# Stop and remove old container
log "⏹️  Stopping existing container..."
docker compose down --timeout 30 || true

# Start new container
log "▶️  Starting new container..."
docker compose up -d

# Wait for health check
log "🏥 Waiting for health check..."
sleep 30

if docker compose ps | grep -q "healthy\|Up"; then
    log "✅ Deployment successful!"
else
    log "❌ Deployment failed! Check logs:"
    docker compose logs --tail=50
    exit 1
fi

log "🎉 Deployment completed successfully!"
EOF

chmod +x /opt/familexyz/deploy.sh
success "Deployment script created"

# Monitoring script
cat > /opt/familexyz/monitor.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Docker Monitoring Script

DEPLOY_DIR="/opt/familexyz"
LOG_FILE="$DEPLOY_DIR/logs/monitor.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd "$DEPLOY_DIR"

# Check container health
if ! docker compose ps | grep -q "healthy\|Up"; then
    log "❌ Container health check failed"
    docker compose restart
    log "🔄 Container restarted"
else
    log "✅ Container health check passed"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️  Disk usage is ${DISK_USAGE}%"
    # Clean up old Docker images
    docker image prune -f
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2 }')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    log "⚠️  Memory usage is ${MEM_USAGE}%"
fi
EOF

chmod +x /opt/familexyz/monitor.sh
success "Monitoring script created"

# Backup script
cat > /opt/familexyz/backup.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Docker Backup Script

BACKUP_DIR="/opt/familexyz/backups"
DATE=$(date +"%Y%m%d")
BACKUP_FILE="$BACKUP_DIR/familexyz_backup_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

# Backup data volumes and configuration
docker run --rm \
    -v familexyz_familexyz-data:/data:ro \
    -v familexyz_familexyz-logs:/logs:ro \
    -v /opt/familexyz/.env:/env:ro \
    -v "$BACKUP_DIR":/backup \
    alpine:latest \
    tar -czf "/backup/familexyz_backup_$DATE.tar.gz" /data /logs /env

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "familexyz_backup_*.tar.gz" -mtime +30 -delete

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILE" >> /opt/familexyz/logs/backup.log
EOF

chmod +x /opt/familexyz/backup.sh
success "Backup script created"

# Create additional management scripts
log "📜 Creating additional management scripts..."

# Status script
cat > /opt/familexyz/status.sh << 'EOF'
#!/bin/bash
echo "🐳 Docker Status:"
docker compose ps
echo ""
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:3001/health || echo "Health check failed"
EOF

# Logs script
cat > /opt/familexyz/logs.sh << 'EOF'
#!/bin/bash
echo "📋 Recent logs (last 50 lines):"
docker compose logs --tail=50 -f
EOF

# Restart script
cat > /opt/familexyz/restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting FamilyXYZ..."
docker compose down --timeout 30
docker compose up -d
echo "✅ Restart completed"
EOF

# Update script
cat > /opt/familexyz/update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating FamilyXYZ..."
docker compose pull
docker compose down --timeout 30
docker compose up -d
echo "✅ Update completed"
EOF

# Make all scripts executable
chmod +x /opt/familexyz/*.sh
success "Management scripts created"

# Create systemd service for auto-start
log "🔧 Creating systemd service..."
cat > /etc/systemd/system/familexyz.service << 'EOF'
[Unit]
Description=FamilyXYZ Docker Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/familexyz
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable familexyz.service
success "Systemd service created and enabled"

# Setup cron jobs
log "⏰ Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/familexyz/monitor.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/familexyz/backup.sh") | crontab -
success "Cron jobs configured"

# Create nginx reverse proxy configuration
log "🌐 Setting up nginx reverse proxy..."
cat > /etc/nginx/sites-available/familexyz << 'EOF'
# FamilyXYZ Nginx Configuration
# Reverse proxy for Docker backend

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Default route
    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/familexyz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
success "Nginx reverse proxy configured"

success "✅ FamilyXYZ Hetzner server setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy /opt/familexyz/.env.template to /opt/familexyz/.env"
echo "2. Edit /opt/familexyz/.env with your actual API keys and configuration"
echo "3. Set up GitHub repository secrets for deployment:"
echo "   - HETZNER_HOST: your-server-ip"
echo "   - HETZNER_USERNAME: root"
echo "   - HETZNER_SSH_KEY: your-private-ssh-key"
echo "4. Push to GitHub main branch to trigger deployment"
echo ""
echo "🐳 Docker Commands:"
echo "   - View logs: docker compose logs -f"
echo "   - Restart: docker compose restart"
echo "   - Stop: docker compose down"
echo "   - Status: docker compose ps"
echo ""
echo "📊 Server Status:"
echo "   - Docker version: $(docker --version)"
echo "   - Available disk space: $(df -h / | awk 'NR==2{print $4}')"
echo "   - Available memory: $(free -h | awk 'NR==2{print $7}')"
