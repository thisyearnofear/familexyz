#!/bin/bash

# FamilyXYZ Hetzner Server Setup Script
# This script prepares a Hetzner server for FamilyXYZ backend deployment

set -e  # Exit on any error

echo "🚀 Starting FamilyXYZ Hetzner Server Setup..."

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y curl wget git unzip software-properties-common build-essential

# Install Node.js 23 (latest LTS)
echo "📦 Installing Node.js 23..."
curl -fsSL https://deb.nodesource.com/setup_23.x | bash -
apt install -y nodejs

# Install pnpm globally
echo "📦 Installing pnpm..."
npm install -g pnpm

# Install PM2 globally for process management
echo "📦 Installing PM2..."
npm install -g pm2

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
echo "📋 Creating PM2 systemd service..."
systemctl enable pm2-root

echo "✅ FamilyXYZ Hetzner server setup completed!"
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