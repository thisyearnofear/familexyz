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
├── agent/                 # Backend (ElizaOS runtime, 5 agents, Grok/Venice AI)
├── client/                # Frontend (Next.js on Netlify)
├── characters/            # Agent persona definitions (JSON)
├── packages/
│   ├── clients/telegram/  # Grammy-based Telegram bot
│   ├── clients/xmtp/      # XMTP encrypted messaging
│   ├── family/            # Agent plugins (wisdom, intimacy, presence, growth, bridge, savings)
│   ├── blockchain/        # Hedera services (HCS, HTS)
│   ├── monetization/      # Subscription tiers, usage tracking, feature gates
│   └── core/              # ElizaOS core
└── docs/                  # Detailed documentation
```

**Stack:** TypeScript, pnpm monorepo, ElizaOS, Grok AI (primary) / Venice AI (fallback), Grammy, Next.js 16, SQLite, Hedera SDK.

## Quick Start

```bash
git clone https://github.com/thisyearnofear/familexyz.git && cd familexyz
pnpm install && pnpm build
cp .env.example .env  # Add Venice API key + Telegram bot token
pnpm start            # Starts all 5 agents, health endpoint on separate port
```

Ports are configured via `SERVER_PORT` and `HEALTH_PORT` env vars (defaults: 31337 and 31338). Production sets `SERVER_PORT=3004`.

## Build Notes

- Use Node 22 and pnpm 9.12.3; the repo declares `node >=22 <23`.
- `pnpm build` runs `turbo run build` across all workspaces. Warm local Turbo builds should be mostly cache hits.
- The Next.js client build is offline-safe: font variables are defined locally instead of fetching Google Fonts during `next build`.
- Do not add a root `postinstall` rebuild step. pnpm already runs dependency lifecycle scripts, and a recursive rebuild can make installs appear to hang while native modules recompile repeatedly.

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
