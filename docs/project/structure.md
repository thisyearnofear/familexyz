# Project Structure & Organization

This document outlines the reorganized structure of the Family-Connection AI Agents project, built on the Eliza framework.

## 📁 Root Directory Structure

```
familexyz/
├── 📂 agent/                    # Agent runtime application
├── 📂 characters/               # Character definitions and personas
├── 📂 client/                   # Frontend web application
├── 📂 config/                   # Configuration files (moved from root)
│   ├── biome.json              # Code formatting and linting
│   ├── commitlint.config.js    # Commit message linting
│   ├── jest.config.json        # Testing configuration
│   ├── lerna.json              # Monorepo management
│   ├── renovate.json           # Dependency updates
│   ├── tsconfig.json           # TypeScript configuration
│   └── turbo.json              # Build system configuration
├── 📂 docker/                   # Docker configurations (moved from root)
│   ├── Dockerfile              # Main application container
│   ├── Dockerfile.docs         # Documentation container
│   ├── docker-compose.yaml     # Local development stack
│   └── docker-compose-docs.yaml # Documentation stack
├── 📂 docs/                     # Project documentation
├── 📂 environments/             # Environment-specific configurations
│   ├── development/            # Development environment settings
│   ├── staging/               # Staging environment settings
│   ├── production/            # Production environment settings
│   └── README.md              # Environment setup guide
├── 📂 i18n/                     # Internationalization files
├── 📂 packages/                 # Organized monorepo packages
│   ├── 📂 family/              # 👨‍👩‍👧‍👦 Family-specific packages
│   ├── 📂 blockchain/          # ⛓️ Blockchain integrations
│   ├── 📂 adapters/            # 🔌 Database adapters
│   ├── 📂 clients/             # 📱 Platform clients
│   ├── 📂 plugins/             # 🧩 Third-party plugins
│   ├── 📂 core/                # 🧠 Core framework
│   ├── 📂 config/              # ⚙️ Configuration utilities
│   ├── 📂 create-eliza-app/    # 🚀 Project scaffolding
│   └── 📂 _examples/           # 📖 Example implementations
├── 📂 scripts/                  # Build and utility scripts
└── 📄 package.json             # Root package configuration
```

## 🎯 Package Organization

### 👨‍👩‍👧‍👦 Family Packages (`packages/family/`)

Contains all family-connection specific functionality:

```
packages/family/
├── nlp-utils/                  # Family-focused NLP utilities
├── plugin-generational-bridge/ # Storytelling & generational connection
├── plugin-growth/             # Shared family growth challenges
├── plugin-intimacy/           # Couple & family intimacy coaching
├── plugin-presence/           # Mindfulness & digital wellness
└── plugin-wisdom/             # Philosophy & emotional intelligence
```

**Key Features:**
- 🧠 Philosophy & Emotional Intelligence guidance  
- 💑 Couple Intimacy coaching  
- 👵👦 Generational bridge storytelling  
- 🧘 Mindful presence & digital-wellness nudges  
- 🚀 Shared growth challenges

### ⛓️ Blockchain Packages (`packages/blockchain/`)

Blockchain and Web3 integrations:

```
packages/blockchain/
├── hedera-core/               # Core Hedera integration
└── plugin-hedera-template/   # Hedera plugin template
```

### 🔌 Adapter Packages (`packages/adapters/`)

Database and storage adapters:

```
packages/adapters/
├── sqlite/       # SQLite adapter (default for development)
├── postgres/     # PostgreSQL adapter (production recommended)
├── redis/        # Redis adapter for caching
├── qdrant/       # Vector database for embeddings
├── supabase/     # Supabase integration
├── pglite/       # Lightweight PostgreSQL
└── sqljs/        # SQL.js in-memory database
```

### 📱 Client Packages (`packages/clients/`)

Platform-specific client implementations:

```
packages/clients/
├── auto/         # Auto-client for multiple platforms
├── direct/       # Direct API client
├── discord/      # Discord bot integration
├── telegram/     # Telegram bot integration
├── twitter/      # Twitter/X integration
├── slack/        # Slack integration
├── instagram/    # Instagram integration
├── github/       # GitHub integration
├── farcaster/    # Farcaster integration
├── lens/         # Lens Protocol integration
└── simsai/       # SimsAI integration
```

### 🧩 Plugin Packages (`packages/plugins/`)

Third-party service integrations and additional functionality:

```
packages/plugins/
├── openai/           # OpenAI integration
├── web-search/       # Web search capabilities
├── image-generation/ # AI image generation
├── video-generation/ # AI video generation
├── tts/             # Text-to-speech
├── email/           # Email integration
├── whatsapp/        # WhatsApp integration
└── ... (80+ other plugins)
```

## 🛠️ Configuration Management

### Environment-Based Configuration

The `environments/` directory provides templates for different deployment scenarios:

- **Development** (`environments/development/`): Local development with SQLite, debug logging
- **Staging** (`environments/staging/`): Pre-production testing environment
- **Production** (`environments/production/`): Production-ready configuration with security hardening

### Configuration Files (`config/`)

All build tools and linting configurations are centralized:

- `biome.json` - Code formatting and linting rules
- `tsconfig.json` - TypeScript compilation settings
- `turbo.json` - Monorepo build orchestration
- `jest.config.json` - Testing framework configuration
- `lerna.json` - Package versioning and publishing

## 🚀 Getting Started

### Quick Start
```bash
# Install dependencies
pnpm i

# Start development environment
pnpm dev
```

### Environment Setup
```bash
# Copy development environment template
cp environments/development/.env.development .env

# Edit .env with your API keys and configuration
# See environments/README.md for detailed setup instructions
```

### Family Agent Configuration
```bash
# Enable all family features
GENERATIONAL_BRIDGE_ENABLED=true
INTIMACY_COACH_ENABLED=true
GROWTH_CHALLENGES_ENABLED=true
MINDFULNESS_REMINDERS_ENABLED=true
WISDOM_SHARING_ENABLED=true
```

## 🔧 Development Workflow

### Build Commands
```bash
pnpm build          # Build all packages
pnpm test           # Run tests
pnpm lint           # Lint code
pnpm format         # Format code
```

### Docker Workflow
```bash
pnpm docker:build   # Build Docker images
pnpm docker:run     # Run in containers
pnpm docker:start   # Start services
```

### Family-Specific Development
```bash
# Start with family plugins enabled
pnpm cleanstart

# Debug family features
pnpm start:debug

# Test family interactions
pnpm test -- packages/family
```

## 📊 Benefits of This Organization

### ✅ **Improved Maintainability**
- **Logical grouping**: Related packages are grouped together
- **Clear boundaries**: Family features separated from generic plugins
- **Reduced complexity**: Cleaner package structure

### ✅ **Better Developer Experience**
- **Centralized config**: All configuration files in one place
- **Environment templates**: Easy setup for different environments
- **Clear documentation**: Structure is self-documenting

### ✅ **Enhanced Security**
- **Environment isolation**: Separate configs for dev/staging/prod
- **Centralized secrets**: Environment-based API key management
- **Family data protection**: Privacy-focused configuration options

### ✅ **Scalability**
- **Modular design**: Easy to add new family features
- **Plugin architecture**: Third-party integrations are isolated
- **Flexible deployment**: Environment-specific optimizations

## 🛡️ Security Considerations

### Family Data Privacy
- All family-specific features include privacy controls
- Data retention policies are configurable
- Parental controls and content moderation built-in
- End-to-end encryption options for sensitive conversations

### Environment Security
- Development: Relaxed security for ease of use
- Staging: Production-like security for testing
- Production: Maximum security hardening enabled

## 📝 Migration Notes

If you're upgrading from the previous structure:

1. **Configuration files** have moved from root to `config/`
2. **Docker files** have moved from root to `docker/`
3. **Family packages** have been reorganized under `packages/family/`
4. **Environment setup** now uses templates in `environments/`

Update your scripts and CI/CD pipelines accordingly.

## 🤝 Contributing

When adding new features:
- **Family features**: Add to `packages/family/`
- **Platform clients**: Add to `packages/clients/`
- **Database adapters**: Add to `packages/adapters/`
- **General plugins**: Add to `packages/plugins/`

Follow the existing naming conventions and package structure for consistency.