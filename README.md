# FamilyXYZ: AI Agents for Family Thriving

<div align="center">

**[Live App](https://familexyz.netlify.app)** | **[Telegram Bot](https://t.me/familexyzbot)** | **[API](https://api.famile.xyz/agents)**

</div>

## Overview

Five specialized AI agents that strengthen family bonds. Each agent is shaped by a distinct intellectual tradition and offers a unique lens on family life.

| Agent | Emoji | Intellectual DNA | Focus |
|-------|-------|-----------------|-------|
| **Wisdom** | 🧠 | Alain de Botton, School of Life | Philosophy & emotional education |
| **Intimacy** | 💖 | Esther Perel, John Gottman | Relational dynamics & connection |
| **Presence** | 🧘 | Thich Nhat Hanh, Cal Newport | Attention & digital wellness |
| **Growth** | 🌱 | James Clear, Carol Dweck, Angela Duckworth | Habits, resilience & identity |
| **Bridge** | 🧓 | StoryCorps, bell hooks | Legacy, narrative & oral history |

## Live Features

- **Daily Council** — One zeitgeist story, five agent perspectives. Updated daily via RSS + AI curation. ([/today](https://familexyz.netlify.app/today))
- **Telegram Bot** — Smart routing (detects topic → routes to right agent), `/council` command (all 5 agents weigh in), daily check-ins with streaks. ([@familexyzbot](https://t.me/familexyzbot))
- **Web Dashboard** — Agent status, bond score tracking, quick actions. ([/dashboard](https://familexyz.netlify.app/dashboard))
- **Hedera Integration** — Agent actions logged to HCS, FAM token rewards via HTS.

## Architecture

```
familexyz/
├── agent/                 # Backend (ElizaOS runtime, 5 agents, Venice AI)
├── client/                # Frontend (Next.js on Netlify)
├── characters/            # Agent persona definitions (JSON)
├── packages/
│   ├── clients/telegram/  # Grammy-based Telegram bot
│   ├── family/            # Agent plugins (wisdom, intimacy, etc.)
│   ├── blockchain/        # Hedera services
│   └── core/              # ElizaOS core
└── docs/                  # Detailed documentation
```

**Stack:** TypeScript, pnpm monorepo, ElizaOS, Venice AI (llama-3.3-70b), Grammy, Next.js 16, SQLite, Hedera SDK.

## Quick Start

```bash
git clone https://github.com/thisyearnofear/familexyz.git && cd familexyz
pnpm install && pnpm build
cp .env.example .env  # Add Venice API key + Telegram bot token
pnpm start            # Starts all 5 agents on :31337, health on :31338
```

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /agents` | List running agents |
| `POST /:agentId/message` | Send message to agent |
| `GET /daily-take` | Today's council (story + 5 perspectives) |
| `GET /health` | Health check |
| `GET /api/families/:id/bond-score` | Bond score history |

## Deployment

- **Frontend:** Netlify (auto-deploys from `develop` branch)
- **Backend:** Hetzner VPS via PM2 at `/home/deploy/familexyz/current`
- **Environment:** Single `.env` at `shared/env/.env`, symlinked into release

## Docs

- [Architecture](./docs/ARCHITECTURE.md) — System design & data flows
- [Agents & Incentives](./docs/AGENTS.md) — Agent details, HCS-10, FAM token
- [Development](./docs/DEVELOPMENT.md) — Local setup & testing

## License

MIT
