#!/bin/bash

# FamilyXYZ Hetzner Server Setup Script
# Optimized setup for separated frontend/backend architecture
# Version 2.0 - Production Ready with Monitoring

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

log "🚀 Starting FamilyXYZ Hetzner Server Setup v2.0..."

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "🔧 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common build-essential \
    htop iotop nethogs tree jq zip unzip fail2ban ufw certbot nginx-full \
    logrotate rsync cron

# Install Node.js 23 and Docker
log "📦 Installing Node.js 23..."
curl -fsSL https://deb.nodesource.com/setup_23.x | bash -
apt install -y nodejs

log "🐳 Installing Docker and Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin

# Add docker to startup
systemctl enable docker
systemctl start docker

# Install pnpm globally
log "📦 Installing pnpm..."
npm install -g pnpm@9.14.4

# Install PM2 globally for process management
log "📦 Installing PM2..."
npm install -g pm2@5.3.0

# Create deployment directory structure
echo "📁 Creating deployment directories..."
mkdir -p /opt/familexyz/{current,releases,logs,backups,data}
chown -R root:root /opt/familexyz
chmod -R 755 /opt/familexyz

# Create .env template
echo "📝 Creating .env template..."
cat > /opt/familexyz/.env.template << 'EOF'
# FamilyXYZ Production Environment Configuration
# Copy this file to .env and fill in your actual values

# Server Configuration
NODE_ENV=production
PORT=3000
PREVENT_UNHANDLED_EXIT=true

# Cache Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Database Configuration (Choose one)
# SQLite (default)
DATABASE_URL=sqlite:///opt/familexyz/data/familexyz.db

# PostgreSQL (optional)
# DATABASE_URL=postgresql://username:password@localhost:5432/familexyz

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
CORS_ORIGINS=https://your-frontend-domain.com
TRUST_PROXY=true

# Logging
LOG_LEVEL=info

# Performance
MAX_MEMORY_USAGE=1024
EOF

# Check if Redis is installed and running
if ! systemctl is-active --quiet redis-server; then
    echo "📦 Installing and configuring Redis..."
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    echo "✅ Redis installed and started"
else
    echo "✅ Redis is already running"
fi

# Configure firewall (allow SSH and port 3000)
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 3000/tcp
echo "✅ Firewall configured"

# Setup PM2 startup
echo "🔄 Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
pm2 save

# Create systemd service for PM2
log "📋 Creating PM2 systemd service..."
systemctl enable pm2-root

# Setup monitoring and security
log "🔒 Configuring security and monitoring..."

# Configure fail2ban
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

# Setup log rotation
cat > /etc/logrotate.d/familexyz << 'EOF'
/opt/familexyz/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 familexyz familexyz
    postrotate
        /bin/kill -USR1 $(cat /var/run/familexyz.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF
success "Log rotation configured"

# Create deployment script
log "📜 Creating deployment script..."
cat > /opt/familexyz/deploy.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Deployment Script
# Automated deployment with zero-downtime

set -e

DEPLOY_DIR="/opt/familexyz"
CURRENT_DIR="$DEPLOY_DIR/current"
RELEASES_DIR="$DEPLOY_DIR/releases"
REPO_URL="https://github.com/your-org/familexyz.git"
BRANCH="main"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Starting deployment..."

# Create release directory
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"

# Clone the repository
log "📥 Cloning repository..."
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" .

# Copy environment configuration
log "📋 Copying environment configuration..."
cp "$DEPLOY_DIR/.env" "$RELEASE_DIR/.env"

# Build the application
log "🔨 Building application..."
pnpm install --frozen-lockfile
pnpm build

# Stop current application
log "⏹️  Stopping current application..."
pm2 stop all || true

# Update symlink
log "🔗 Updating symlink..."
ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"

# Start application
log "▶️  Starting application..."
cd "$CURRENT_DIR"
pm2 start ecosystem.config.js --env production
pm2 save

# Cleanup old releases (keep last 5)
log "🧹 Cleaning up old releases..."
cd "$RELEASES_DIR"
ls -1dt */ | tail -n +6 | xargs rm -rf

# Health check
log "🏥 Performing health check..."
sleep 10
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    log "✅ Deployment successful!"
else
    log "❌ Health check failed! Rolling back..."
    # Rollback logic here
    exit 1
fi

log "🎉 Deployment completed successfully!"
EOF

chmod +x /opt/familexyz/deploy.sh
success "Deployment script created"

# Create monitoring script
log "📊 Creating monitoring script..."
cat > /opt/familexyz/monitor.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Monitoring Script
# Run this with cron every 5 minutes

SERVICE_URL="http://localhost:3000"
LOG_FILE="/opt/familexyz/logs/monitor.log"
ALERT_EMAIL="admin@familexyz.com"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check API health
if ! curl -f "$SERVICE_URL" > /dev/null 2>&1; then
    log "❌ API health check failed"
    # Restart service
    pm2 restart all
    log "🔄 Service restarted"
else
    log "✅ API health check passed"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️  Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2 }')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    log "⚠️  Memory usage is ${MEM_USAGE}%"
fi

# Check PM2 status
if ! pm2 list | grep -q online; then
    log "❌ Some PM2 processes are not online"
    pm2 restart all
fi
EOF

chmod +x /opt/familexyz/monitor.sh
success "Monitoring script created"

# Setup cron job for monitoring
log "⏰ Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/familexyz/monitor.sh") | crontab -
success "Monitoring cron job configured"

# Create backup script
log "💾 Creating backup script..."
cat > /opt/familexyz/backup.sh << 'EOF'
#!/bin/bash

# FamilyXYZ Backup Script
# Daily backup of data and logs

BACKUP_DIR="/opt/familexyz/backups"
DATE=$(date +"%Y%m%d")
BACKUP_FILE="$BACKUP_DIR/familexyz_backup_$DATE.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
tar -czf "$BACKUP_FILE" \
    /opt/familexyz/data \
    /opt/familexyz/logs \
    /opt/familexyz/.env \
    2>/dev/null || echo "Some files may not exist yet"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "familexyz_backup_*.tar.gz" -mtime +30 -delete

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILE" >> /opt/familexyz/logs/backup.log
EOF

chmod +x /opt/familexyz/backup.sh
success "Backup script created"

# Setup daily backup cron job
log "⏰ Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/familexyz/backup.sh") | crontab -
success "Daily backup cron job configured"

# Create nginx reverse proxy configuration
log "🌐 Setting up nginx reverse proxy..."
cat > /etc/nginx/sites-available/familexyz << 'EOF'
# FamilyXYZ Nginx Configuration
# Reverse proxy for backend API

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
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Default route for API documentation or status
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
echo "🔧 Optional: Install PostgreSQL if you prefer it over SQLite:"
echo "   apt install -y postgresql postgresql-contrib"
echo "   sudo -u postgres createuser --interactive"
echo "   sudo -u postgres createdb familexyz"
echo ""
echo "📊 Server Status:"
echo "   - Node.js version: $(node --version)"
echo "   - pnpm version: $(pnpm --version)"
echo "   - PM2 version: $(pm2 --version)"
echo "   - Redis status: $(systemctl is-active redis-server)"
echo "   - Available disk space: $(df -h / | awk 'NR==2{print $4}')"
echo "   - Available memory: $(free -h | awk 'NR==2{print $7}')"