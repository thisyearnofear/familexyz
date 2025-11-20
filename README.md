# Family-Connection AI Agents

<div align="center">
  <img src="./client/public/banner.jpg" alt="Family-Connection AI Agents Banner" width="100%" />
</div>

<div align="center">

📑 [Technical Paper](https://arxiv.org/pdf/2501.06781) | 📖 [Platform Overview](./docs/platform-overview.md) | ⛓️ [Hedera Integration](./docs/hedera-integration.md) | 🚀 [Development Guide](./docs/development-deployment.md)

</div>

## 🚩 Overview

Familexyz is a privacy-first suite of specialized AI agents designed to strengthen family bonds. Each agent brings expertise in emotional intelligence, relationship skills, generational connection, mindfulness, and shared growth—offering families practical support and tools for deeper, healthier relationships.

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
# Edit .env with your API keys (Venice AI, OpenAI, Hedera credentials)

# 3. Start the backend agents (required first)
pnpm --filter agent start

# 4. In a new terminal, start the frontend dashboard
pnpm start:client
```

The dashboard will be available at `http://localhost:5173`

### 🔧 Development Options

**Terminal 1: Start Backend Agents**

```bash
pnpm --filter agent start
```

Backend agents will initialize and listen for connections on port 3001.

**Terminal 2: Start Frontend Dashboard**

```bash
pnpm start:client
```

Frontend development server runs at `http://localhost:5173`

**Alternative: Using Client Direct Interface**

For testing agents without the web dashboard:

```bash
# Terminal 1: Start agents
pnpm --filter agent start

# Terminal 2: Start CLI client
pnpm --filter "@elizaos/client-direct" start
```

See [Development Guide](./docs/development-deployment.md) for detailed setup instructions.

## 📚 Documentation

See our consolidated documentation:

- **[Platform Overview](./docs/platform-overview.md)** - Complete platform features and architecture
- **[Hedera Integration](./docs/hedera-integration.md)** - HCS-10 compliance and blockchain features
- **[Development Guide](./docs/development-deployment.md)** - Setup, deployment, and maintenance

## 🛡️ Privacy & Safety First

Family data protection is our top priority:

- **Privacy-First Design** - Built with privacy in mind
- **Secure Architecture** - Modern security practices
- **Family Focused** - Designed for safe family interactions
- **Age-appropriate responses** for all family members
- **Data retention policies** with automatic cleanup

## 🌐 Platform Support

- **🌐 Web Dashboard** - Family management interface
- **🔜 Future Support** - Discord, Telegram, and WhatsApp integrations coming soon

## 🛠️ Built For Developers

- **📦 Monorepo architecture** with clear package organization
- **🎯 TypeScript throughout** for type safety and better DX
- **🔥 Hot reload development** for fast iteration
- **🧪 Comprehensive testing** with Jest
- **🐳 Docker support** for easy deployment
- **⚙️ Environment templates** for all deployment scenarios

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to strengthen your family connections?** See our [documentation](./docs/platform-overview.md) to get started.
