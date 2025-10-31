# Family-Connection AI Agents

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Family-Connection AI Agents Banner" width="100%" />
</div>

<div align="center">

📑 [Technical Paper](https://arxiv.org/pdf/2501.06781) | 📖 [Documentation](./docs/) | 🚀 [Quick Start](#quick-start)

</div>

## 🚩 Overview

Familexyz is a privacy-first suite of specialized AI agents designed to strengthen family bonds. Each agent brings expertise in emotional intelligence, relationship skills, generational connection, mindfulness, and shared growth—offering families practical support and tools for deeper, healthier relationships.

<div align="center">
  <img src="./docs/static/img/eliza_diagram.png" alt="Family-Connection AI Agents Diagram" width="100%" />
</div>

## ✨ Five Family Agents

- 🧠 **Wisdom Agent** - Philosophy & Emotional Intelligence guidance
- 💑 **Intimacy Agent** - Couple & family relationship coaching
- 👵👦 **Generational Bridge Agent** - Cross-generational storytelling
- 🧘 **Presence Agent** - Mindful presence & digital-wellness nudges
- 🚀 **Growth Agent** - Shared family growth challenges

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/familexyz.git
cd familexyz
pnpm install

# 2. Set up environment
cp environments/development/.env.development .env
# Edit .env with your API keys (see docs/setup/environments.md)

# 3. Launch the full stack
pnpm dev
```

> **Note:** `pnpm dev` launches both the backend (all five family agents) and frontend dashboard automatically.

### 🔧 Development Options

**Launch Everything (Recommended)**

```bash
pnpm dev
```

This starts:

- Backend: All five family agents (Wisdom, Intimacy, Generational Bridge, Presence, Growth)
- Frontend: Web dashboard at `http://localhost:5173`
- Hot reload for both backend and frontend

**Backend Only**

```bash
# Start all family agents
pnpm start

# Or start with debug logging
pnpm start:debug

# Or clean start (resets database)
pnpm cleanstart
```

**Frontend Only**

```bash
# Start the web dashboard
pnpm start:client
```

The dashboard will be available at `http://localhost:5173`

**Individual Components**

```bash
# Backend agent server
cd agent && pnpm dev

# Frontend dashboard
cd client && pnpm dev

# Core packages (for development)
cd packages/core && pnpm dev
```

### 🔐 Environment Setup

1. **Copy the template**: `cp environments/development/.env.development.template environments/development/.env.development`
2. **Add your API keys**:
    - Venice AI API key (primary)
    - OpenAI API key (fallback)
    - Hedera testnet credentials
    - Social platform tokens (optional)
3. **Configure family settings**:
    - Encryption keys for privacy
    - Data retention policies
    - Parental controls

**Important**: Never commit your actual `.env.development` file with real API keys. The template file is provided for reference.

## 📚 Documentation

- **🛠️ [Installation Guide](docs/setup/installation.md)** - Complete setup instructions
- **⚙️ [Environment Setup](docs/setup/environments.md)** - Development, staging, production configs
- **👨‍👩‍👧‍👦 [Family Features](docs/setup/family-features.md)** - Configure and use the five family agents
- **🏗️ [Project Structure](docs/project/structure.md)** - Understanding the codebase organization
- **🤝 [Contributing](docs/project/contributing.md)** - How to contribute to the project

**📖 [Full Documentation →](docs/)**

## 🛡️ Privacy & Safety First

Family data protection is our top priority:

- ✅ **End-to-end encryption** for sensitive conversations
- ✅ **Local data storage** options for maximum privacy
- ✅ **Parental controls** and content moderation
- ✅ **Age-appropriate responses** for all family members
- ✅ **Data retention policies** with automatic cleanup

## 🌐 Platform Support

- **💬 Discord** - Family server with dedicated channels
- **📱 Telegram** - Family group chat integration
- **🐦 Twitter/X** - Social sharing (optional)
- **🌐 Web Dashboard** - Family management interface
- **📞 WhatsApp** - Private family messaging

## 🛠️ Built For Developers

- **📦 Monorepo architecture** with clear package organization
- **🎯 TypeScript throughout** for type safety and better DX
- **🔥 Hot reload development** for fast iteration
- **🧪 Comprehensive testing** with Jest
- **🐳 Docker support** for easy deployment
- **⚙️ Environment templates** for all deployment scenarios

## 📊 Project Organization

```
familexyz/
├── 📂 packages/family/         # 👨‍👩‍👧‍👦 Family-specific AI agents
├── 📂 packages/blockchain/     # ⛓️ Hedera & Web3 integrations
├── 📂 packages/adapters/       # 🔌 Database adapters
├── 📂 packages/clients/        # 📱 Platform clients
├── 📂 config/                  # ⚙️ Centralized configuration
├── 📂 environments/            # 🌍 Environment templates
├── 📂 docs/                    # 📚 Complete documentation
└── 📂 docker/                  # 🐳 Container configurations
```

## 📄 Citation

We now have a [paper](https://arxiv.org/pdf/2501.06781) you can cite for the Eliza OS:

```bibtex
@article{walters2025eliza,
  title={Eliza: A Web3 friendly AI Agent Operating System},
  author={Walters, Shaw and Gao, Sam and Nerd, Shakker and Da, Feng and Williams, Warren and Meng, Ting-Chien and Han, Hunter and He, Frank and Zhang, Allen and Wu, Ming and others},
  journal={arXiv preprint arXiv:2501.06781},
  year={2025}
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to strengthen your family connections?** Start with our [Installation Guide](docs/setup/installation.md) and join the growing community of families using AI to deepen their relationships.

# Trigger CI/CD deployment

# Cache cleared for mega nuclear deployment
