# FamilyXYZ: AI Agents for Family Thriving
### 🏆 Built for Hedera Hello Future: Ascension (Theme 1: AI & Agents)

<div align="center">

**[📄 Technical Paper](https://arxiv.org/pdf/2501.06781)** | **[⛓️ Hedera Proofs](./docs/AGENTS.md)**

</div>

## 🚩 Overview
**FamileXYZ** is a privacy-first suite of autonomous AI agents designed to strengthen family bonds. Built on **Hedera**, it combines advanced LLMs with the **Hedera Consensus Service (HCS)** to create a verifiable, immutable log of family milestones ("Wisdom Blocks").

Unlike passive chatbots, our agents—**Wisdom, Intimacy, GenerationalBridge, Presence, and Growth**—are proactive family coaches. They use **Hedera Token Service (HTS)** to reward positive interactions, effectively creating an on-chain economy of emotional wealth.

### 🔑 Key Features
*   **Verifiable Agent Actions:** Agent decisions are logged to HCS Topic `0.0.7304500`.
*   **Tokenized Incentives:** Families earn $FAM tokens (`0.0.7304501`) for completing connection challenges.
*   **Privacy-First:** Powered by Grok/Venice AI for secure, private inference.
*   **Backend API:** REST API for agent interactions, health monitoring, and payout management.
*   **Multi-Agent Coordination:** Five specialized agents work together across a family unit.

### 🎯 Platform Vision
FamilyXYZ is evolving into a **platform** where practitioners distribute research-backed agents to families:

```
CREATORS                          FAMILIES
Dr. Gottman Institute      →      "Gottman Relationship"
Attachment Research Lab    →      "Secure Attachment"
Custom Agent Creator      →      "Family Wisdom"
```

**Trust through verification:** Hedera blockchain creates immutable audit trails. Practitioners are publicly accountable. Families have verifiable proof of engagement.

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
cp .env.example .env
# Edit .env with your API keys (Grok/Venice AI, Hedera credentials)

# 3. Build all packages
pnpm build

# 4. Start the backend agent server
pnpm start
```

The backend API will be available at `http://localhost:3004` with health check at `http://localhost:3005`.

### 🔧 Development Options

**Start Backend Agents (with debug logging)**

```bash
pnpm start:debug
```

**Start with clean database**

```bash
pnpm cleanstart
```

**Start CLI Direct Client (for testing agents without API)**

```bash
pnpm dev
```

See [Development Guide](./docs/DEVELOPMENT.md) for detailed setup instructions.

## 📡 API Endpoints

### Core Agent Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/:agentId/message` | POST | Send message to agent |
| `/:agentId/ag-ui` | POST | AG-UI protocol stream |
| `/agents/insights` | GET | All agents' real-time insights |
| `/agents/:agentId/insights` | GET | Single agent insights |

### Payout System APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/:agentId/payouts` | GET | Agent payout history |
| `/api/agents/:agentId/performance` | GET | Agent performance metrics |
| `/api/families/:familyId/payouts` | GET | Family payout aggregation |
| `/api/payouts/pending` | GET | Payouts awaiting execution |
| `/api/payouts/calculate` | POST | Dry-run payout calculation |

### Bond Scoring APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/families/:familyId/bond-score` | GET | Current + 12-week history |

### Health & Status

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server health status |
| `/api/status` | GET | Full system status |

## 📚 Documentation

Complete documentation in 5 consolidated guides:

- **[Architecture & Technical Reference](./docs/ARCHITECTURE.md)** - System design, services, data flows
- **[Agents & Incentives](./docs/AGENTS.md)** - AI agents, HCS-10, FAM token, Payouts
- **[Development Guide](./docs/DEVELOPMENT.md)** - Local setup, testing, cloud deployment
- **[Roadmap](./docs/ROADMAP.md)** - Current status and future plans
- **[Submission Details](./docs/SUBMISSION.md)** - Hackathon submission info

## 🛡️ Privacy & Safety First

Family data protection is our top priority:

- **Privacy-First Design** - Built with privacy in mind
- **Secure Architecture** - Modern security practices
- **Family Focused** - Designed for safe family interactions
- **Age-appropriate responses** for all family members
- **Data retention policies** with automatic cleanup

## 🌐 Platform Support

- **🔜 Future:** Frontend dashboard (TBD)
- **📱 Telegram Integration** - Coming soon
- **💬 XMTP Encrypted Messaging** - Coming soon

## 🛠️ Built For Developers

- **📦 Monorepo architecture** with clear package organization
- **🎯 TypeScript throughout** for type safety and better DX
- **🧪 Comprehensive testing** with Jest
- **🐳 Docker support** for easy deployment
- **⚙️ Environment templates** for all deployment scenarios

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to strengthen your family connections?** See our [documentation](./docs/ARCHITECTURE.md) to get started.
