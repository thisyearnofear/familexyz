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
# Copy development template
cp environments/development/.env.development.template .env

# Edit .env with your credentials
nano .env
```

Required environment variables:

- Venice AI API key (primary LLM provider)
- OpenAI API key (fallback)
- Hedera testnet credentials
- Optional: Discord, Telegram, Twitter tokens

---

## 🚀 Quick Start

### Terminal 1: Start Backend Agents

```bash
# Start all five family agents
pnpm --filter agent start

# Or with debug logging
pnpm --filter agent start:debug

# Or with clean database reset
pnpm --filter agent run cleanstart
```

The agents will initialize and listen on port 3001.

### Terminal 2: Start Frontend Dashboard

```bash
# Start web dashboard
pnpm start:client
```

Dashboard available at `http://localhost:5173`

### Alternative: CLI Direct Client

For testing agents without the web dashboard:

```bash
# Terminal 1: Start agents
pnpm --filter agent start

# Terminal 2: Start CLI client
pnpm --filter "@elizaos/client-direct" start
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run specific package tests
cd packages/blockchain/hedera-core && pnpm test
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test specific components
node tests/test-chat.js
```

### E2E Tests

```bash
# Start app first
# Then in new terminal:

npx cypress open          # Interactive mode
npx cypress run           # Headless mode
npx cypress run --spec "tests/e2e/payout-dashboard.e2e.ts"  # Specific suite
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

### AWS EC2 Deployment

```bash
# 1. Create EC2 instance (Ubuntu 22.04, t3.medium)
# 2. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install -y nodejs npm git postgresql postgresql-contrib

# 4. Clone repository
git clone https://github.com/thisyearnofear/familexyz.git
cd familexyz

# 5. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 6. Install PNPM
npm install -g pnpm

# 7. Install dependencies
pnpm install

# 8. Configure environment
nano .env  # Add credentials

# 9. Build and start
pnpm build
pnpm --filter agent start &
pnpm start:client &
```

### Digital Ocean App Platform

```bash
# 1. Connect GitHub repository
# 2. Add App Spec (app.yaml in root)
# 3. Configure environment variables in dashboard
# 4. Deploy on push to main
```

### Heroku Deployment

```bash
# 1. Install Heroku CLI
brew install heroku/brew/heroku

# 2. Login
heroku login

# 3. Create app
heroku create familexyz

# 4. Set environment variables
heroku config:set HEDERA_OPERATOR_ID=your_id
heroku config:set HEDERA_OPERATOR_KEY=your_key
# ... other variables

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs -t
```

---

## 🔧 Process Management with PM2

### Install PM2 Globally

```bash
npm install -g pm2
```

### Start Services with PM2

```bash
# Start from ecosystem.config.js
pm2 start ecosystem.config.js

# Or manually
pm2 start "pnpm --filter agent start" --name "backend"
pm2 start "pnpm start:client" --name "frontend"
```

### Monitor Processes

```bash
# View status
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs
```

---

## 📊 Database Setup

### SQLite (Local Development)

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
pnpm --filter agent start
```

### PostgreSQL (Production Ready)

For production deployments:

```bash
# Install PostgreSQL
brew install postgresql@15

# Create database
createdb familexyz

# Set connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/familexyz

# Run migrations
pnpm --filter agent run migrate
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
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Backend (3001)
lsof -i :3001
kill -9 <PID>

# Frontend (5173)
lsof -i :5173
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
```
