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

### Venice AI Model Configuration

The platform uses specialized Venice AI models for each agent type:

| Agent       | Model              | Purpose                          | Context |
| ----------- | ------------------ | -------------------------------- | ------- |
| 🧠 Wisdom   | llama-3.3-70b      | Complex emotional reasoning      | 128k    |
| 💑 Intimacy | llama-3.3-70b      | Relationship intelligence        | 128k    |
| 👵👦 Bridge | llama-3.3-70b      | Cross-generational understanding | 128k    |
| 🧘 Presence | llama-3.2-3b       | Quick mindfulness responses      | 32k     |
| 🚀 Growth   | qwen-2.5-coder-32b | Goal-oriented, structured tasks  | 64k     |

**Available Venice AI Models:**

#### Large Models (High Reasoning)

- `llama-3.3-70b` - Extensive context, versatile
- `qwen-2.5-72b` - Advanced reasoning capabilities
- `qwen-3-235b-a22b` - Multimodal, in-depth reasoning

#### Fast Models (Quick Responses)

- `llama-3.2-3b` - Lightweight, fast
- `qwen-2.5-14b` - Balanced speed/quality

#### Specialized Models

- `qwen-2.5-coder-32b` - Code generation, technical tasks
- `qwen-2.5-vl` - Vision capabilities
- `mistral-31-24b` - Vision, function calling, web search

**Fallback Strategy:**

1. Primary model fails → `llama-3.2-3b` (fast fallback)
2. Still failing → `qwen-2.5-32b` (alternative reasoning)
3. Last resort → `mistral-31-24b` (full features)

Venice AI ensures privacy through:

- ✅ **No data storage** - Conversations never stored on servers
- ✅ **Encrypted local storage** - Data stays in your browser
- ✅ **Decentralized processing** - Distributed GPU providers
- ✅ **No conversation logging** - Zero persistent tracking
- ✅ **Proxy routing** - Requests processed via secure proxy

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
├── docs-consolidated/          # Documentation
└── tests/                      # Integration tests
```

## 🚀 Development Workflow

### Hot Reload Development

```bash
# Start full stack with hot reload
pnpm dev
```

This command starts both the backend agents and frontend dashboard with automatic reloading on code changes.

### Backend Development Only

```bash
# Start all family agents
pnpm start

# Start with debug logging
pnpm start:debug

# Clean start (resets database)
pnpm cleanstart
```

### Frontend Development Only

```bash
# Start web dashboard
pnpm start:client
```

Dashboard available at `http://localhost:5173`

### Individual Package Development

```bash
# Develop specific packages
cd packages/family/plugin-wisdom && pnpm dev
cd packages/blockchain/hedera-core && pnpm dev
cd client && pnpm dev
```

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

### HCS-10 Compliance Testing

```bash
# Test HCS-10 message formats
cd packages/blockchain/hedera-core
node test/hcs10-test.cjs
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

### Docker Environment Configuration

```bash
# Create environment file for Docker
cp environments/docker/.env.docker.template .env.docker
# Edit with production credentials
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

### Token Setup

```bash
# Family health tokens are created automatically
# Configure in environment:
HEDERA_FAMILY_TOKEN_ID=0.0.999888777
HEDERA_TREASURY_ACCOUNT_ID=0.0.1111111
```

### Hedera Feature Flags

```bash
# Enable/disable consensus service
HEDERA_ENABLE_CONSENSUS=true

# Submit startup test message
HEDERA_SUBMIT_STARTUP_TEST=true
```

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

### Performance Monitoring

- Track message processing latency
- Monitor Hedera transaction success rates
- Watch for batch processing efficiency
- Monitor memory and CPU usage

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

### Network Security

- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Regular dependency updates

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

## 📈 Performance Optimization

### Caching Strategies

- Message cache with 30-second TTL
- Account balance caching
- Topic info caching
- Performance metrics aggregation

### Batch Processing

- Family interaction batching (10 messages)
- 5-second batch intervals
- Automatic flush on queue full
- Retry logic for failed batches

### Resource Management

- Connection pooling for Hedera client
- Memory-efficient message processing
- Garbage collection optimization
- Database connection management

## 🔄 CI/CD Pipeline

### GitHub Actions

- Automated testing on pull requests
- Build verification
- Security scanning
- Deployment automation

### Version Management

```bash
# Bump version
pnpm version patch  # or minor/major

# Tag releases
git tag v1.0.0
git push origin v1.0.0
```

### Release Process

1. Update version numbers
2. Run full test suite
3. Create GitHub release
4. Deploy to production
5. Update documentation

## 📄 License & Contributing

### MIT License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

See [Platform Overview](./platform-overview.md) for contributing guidelines.
