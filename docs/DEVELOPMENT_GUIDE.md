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

## 🏗️ Project Structure

```
familexyz/
├── agent/                      # Backend agent server
│   └── src/
│       ├── index.ts           # Main entry point
│       └── characters/        # Character configurations
├── client/                     # Frontend dashboard
│   └── src/
│       ├── components/        # React components
│       ├── pages/             # Page routes
│       └── lib/               # Client utilities
├── packages/
│   ├── family/                # Family-specific agents
│   │   ├── plugin-wisdom/     # Wisdom agent
│   │   ├── plugin-intimacy/   # Intimacy agent
│   │   ├── plugin-generational-bridge/ # Generational agent
│   │   ├── plugin-presence/   # Presence agent
│   │   ├── plugin-growth/     # Growth agent
│   │   ├── nlp-utils/         # NLP utilities
│   │   └── metrics/           # Metrics tracking
│   ├── blockchain/
│   │   ├── hedera-core/       # Core Hedera services
│   │   └── plugin-hedera-template/ # Hedera plugin template
│   ├── adapters/              # Database adapters
│   └── clients/               # Platform clients
├── config/                     # Configuration files
├── environments/               # Environment templates
├── docs/                       # Documentation
└── tests/                      # Integration tests
```

## 🚀 Development Workflow

### Local Development Setup (Recommended)

Start the backend agents and frontend dashboard in separate terminal windows:

**Terminal 1: Start Backend Agents**

```bash
# Start all five family agents
pnpm --filter agent start

# Or with debug logging
pnpm --filter agent start:debug

# Or with clean database reset
pnpm --filter agent run cleanstart
```

The agents will initialize and listen on port 3001.

**Terminal 2: Start Frontend Dashboard**

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

This provides a direct terminal interface to interact with the family agents.

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

## ☁️ Cloud Deployment

### Deploy to VPS

```bash
# Build for production
pnpm build

# Copy to server
scp -r . user@server:/opt/familexyz

# Start on server
ssh user@server "cd /opt/familexyz && pnpm start"
```

### PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

## 🔧 Hedera Configuration

### Testnet Setup

1. Create Hedera Portal account
2. Generate testnet credentials
3. Request testnet HBAR from faucet
4. Configure environment variables:
    ```bash
    HEDERA_NETWORK=testnet
    HEDERA_OPERATOR_ID=0.0.123456
    HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
    ```

### Topic Creation

The system automatically creates HCS topics on first run:

- One topic per family
- Automatic topic registration with HCS-10 compliance
- Memo field describing topic purpose

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Built-in health check endpoint
curl http://localhost:3001/health

# Monitor Hedera service status
# Check logs for "HederaService initialized"
```

### Log Management

```bash
# View application logs
tail -f logs/app.log

# Debug logging
DEBUG=eliza:* pnpm start

# Set log level
DEFAULT_LOG_LEVEL=debug pnpm start
```

## 🔒 Security Best Practices

### Credential Management

- Never commit .env files to version control
- Use different credentials for development/production
- Rotate keys regularly
- Store keys in secure vault in production

### Data Privacy

- Encrypt sensitive family data
- Implement proper access controls
- Regular security audits
- GDPR compliance measures

## 🆘 Troubleshooting

### Common Issues

#### Hedera Connection Errors

```bash
# Check credentials
echo $HEDERA_OPERATOR_ID
echo $HEDERA_OPERATOR_KEY

# Verify network
echo $HEDERA_NETWORK
```

#### Build Failures

```bash
# Clean build
pnpm clean
pnpm build

# Check Node.js version
node --version
```

#### Database Issues

```bash
# Reset database
rm -rf data/
pnpm cleanstart
```

#### Docker Problems

```bash
# Clean Docker cache
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

### Debugging Tips

1. Enable debug logging: `DEBUG=eliza:*`
2. Check Hedera service initialization logs
3. Verify environment variables are loaded
4. Test network connectivity to Hedera
5. Monitor browser console for frontend errors