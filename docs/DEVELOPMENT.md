# Development & Deployment Guide

## 🛠️ Development Environment Setup

### Prerequisites

- Node.js 22+ (required for ES modules support)
- PNPM 9+ (package manager)
- Git for version control
- Code editor (VS Code recommended)
- Hedera testnet account (free)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/familexyz.git
cd familexyz

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:

- Grok AI API key (primary LLM provider)
- Venice AI API key (fallback)
- Hedera testnet credentials
- Optional: Ollama server URL (for embeddings)

---

## 🚀 Quick Start

### Start Backend Server

```bash
# Start the backend agent server
pnpm start
```

The backend API will be available at:
- **API:** `http://localhost:3004`
- **Health:** `http://localhost:3005`

### Start with Debug Logging

```bash
# Start with verbose logging
pnpm start:debug
```

### Start with Clean Database

```bash
# Remove existing database and start fresh
pnpm cleanstart
```

### Start CLI Direct Client

For testing agents via command line:

```bash
# Start CLI client
pnpm dev
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run specific package tests
cd packages/agent && pnpm test
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration
```

### API Smoke Tests

```bash
# Run API smoke tests
pnpm smokeTests
```

### Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3005/health

# Test agent message
curl -X POST 'http://localhost:3004/Wisdom/message' \
  -F 'text=Hello' \
  -F 'user=test'

# Test agent insights
curl http://localhost:3004/agents/insights
```

---

## 🐳 Docker Deployment

### Build Docker Images

```bash
# Build using provided script
./scripts/docker.sh build

# Or build manually
docker build -t familexyz .
```

### Run with Docker Compose

```bash
# Start full stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ☁️ Cloud Deployment

### Hetzner VPS Deployment

```bash
# 1. Create VPS (Ubuntu 22.04)
# 2. SSH into instance
ssh root@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install -y nodejs npm git

# 4. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Install PNPM
npm install -g pnpm

# 6. Clone repository
git clone https://github.com/your-org/familexyz.git
cd familexyz

# 7. Install dependencies
pnpm install
pnpm build

# 8. Configure environment
cp .env.example .env
nano .env  # Add credentials

# 9. Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name api.famile.xyz;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Process Management with PM2

### Install PM2 Globally

```bash
npm install -g pm2
```

### Start Services with PM2

```bash
# Start from ecosystem config
pm2 start ecosystem.config.cjs

# Or manually
pm2 start "pnpm start" --name "familexyz-agent"
```

### Monitor Processes

```bash
# View status
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs familexyz-agent

# Restart
pm2 restart familexyz-agent
```

---

## 📊 Database Setup

### SQLite (Default)

Database automatically created on first run:

```bash
# Location
agent/data/db.sqlite

# View schema
sqlite3 agent/data/db.sqlite ".schema"

# Query data
sqlite3 agent/data/db.sqlite "SELECT * FROM family_bond_scores LIMIT 5"

# Reset database
rm -rf agent/data/
pnpm start
```

---

## 🔒 Security Best Practices

### Credential Management

- **Do:** Store secrets in `.env` file (gitignored)
- **Do:** Use different credentials for dev/staging/prod
- **Do:** Rotate keys regularly
- **Don't:** Commit `.env` to version control
- **Don't:** Share credentials in chat/email

### Network Security

```bash
# Use HTTPS in production
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# Enable CORS restrictions
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Backend API (3004)
lsof -i :3004
kill -9 <PID>

# Health endpoint (3005)
lsof -i :3005
kill -9 <PID>
```

#### Hedera Connection Error

```bash
# Check credentials
echo $HEDERA_OPERATOR_ID
echo $HEDERA_OPERATOR_KEY

# Verify network
echo $HEDERA_NETWORK

# Test connection
curl https://testnet.mirrornode.hedera.com/api/v1/accounts
```

#### Build Failures

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Check Node version
node --version  # Should be 22+
```

### Debug Commands

```bash
# Check node version
node --version

# Check pnpm version
pnpm --version

# Verify file permissions
ls -la agent/data/

# Check database
sqlite3 agent/data/db.sqlite ".tables"

# View environment
cat .env | grep -E "^[^#]"

# Check PM2 logs
pm2 logs familexyz-agent --lines 100
```

---

## 📡 API Reference

### Health Check

```bash
curl http://localhost:3005/health
```

### Send Message to Agent

```bash
curl -X POST 'http://localhost:3004/Wisdom/message' \
  -F 'text=How can we improve family communication?' \
  -F 'user=test'
```

### Get Agent Insights

```bash
curl http://localhost:3004/agents/insights
```

### Get Bond Score

```bash
curl http://localhost:3004/api/families/family_xyz/bond-score
```

### Get Agent Payouts

```bash
curl http://localhost:3004/api/agents/Wisdom/payouts
```
