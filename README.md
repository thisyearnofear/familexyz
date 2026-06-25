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

## What's Live

### 🧠 Daily Council
A zeitgeist story curated via RSS + AI search, then analyzed through all 5 agent perspectives. Updated daily.
- **Web:** [/today](https://familexyz.netlify.app/today) — per-agent styled takes
- **API:** `GET /daily-take`

### 🤖 Telegram Bot (@familexyzbot)
Full-featured grammy bot with 20+ commands:
- `/checkin` — Mood tracking, gratitude, streaks
- `/family` — Add members, log interactions (called, walked, meal, gift, etc.)
- `/council` — All 5 agents weigh in
- `/ask <agent> <question>` — Direct to a specific agent
- `/bondscore` — Family health metrics
- `/challenge` — Weekly family goals
- `/savings` — FAM vault
- Smart routing: detects topic and routes to the right agent automatically
- Progressive opt-in: detects family mentions in free text → offers relationship tracking
- Privacy controls: `/me`, `/privacy`, `/export`, `/deletedata`
- Hedera commands: `/hedera`, `/milestone`, `/reward`, `/transfer`, `/balance`, `/demo`
- SQLite-backed persistence (7 tables)

### 🖥️ Web Dashboard (Next.js 16)
- [/dashboard](https://familexyz.netlify.app/dashboard) — Bond score, agent status, weekly trend
- [/chat](https://familexyz.netlify.app/chat/wisdom) — Real SSE streaming via AG-UI protocol
- [/marketplace](https://familexyz.netlify.app/marketplace) — Browse and subscribe to agents

### 🏛️ Agent Marketplace (Shipped)
- Catalog, detail, subscribe, submission, and review APIs
- Frontend: `/marketplace`, `/account`, `/publish`
- Practitioner agent submission pipeline: submit → review → approve → catalog
- Subscription tiers: Free → Basic → Premium → Family
- JWT-based authentication

### ⛓️ Hedera Integration
- HCS Topic `0.0.7304500` (testnet)
- FAM Token `0.0.7304501` (testnet)
- Agent actions logged to HCS-10 compliant topic
- Bond scores and payouts recorded on-chain

## Architecture

```
familexyz/
├── agent/                 # Backend (Hono HTTP + ElizaOS runtime, 5 agents)
│   ├── src/
│   │   ├── server/        # Hono app, routes, ServiceRegistry
│   │   ├── integrations/  # Telegram, bond scoring, GoodDollar
│   │   ├── jobs/           # DailyTakeGenerator, BondScoreScheduler
│   │   ├── auth/           # JWT auth middleware
│   │   └── services/      # LLM resilience, token provider
├── client/                # Next.js 16 (Netlify)
├── packages/
│   ├── clients/telegram/  # Grammy bot: 8 modules, 2,150+ lines
│   ├── clients/xmtp/      # XMTP encrypted messaging (scaffolded)
│   ├── family/            # Agent plugins (wisdom, intimacy, presence, growth, bridge, savings)
│   ├── blockchain/        # Hedera core + plugin-familyxyz
│   ├── monetization/      # Subscription tiers, usage tracking, feature gates
│   ├── auth/              # Hedera wallet auth
│   └── core/              # ElizaOS core runtime
└── docs/                  # Architecture, Roadmap, Development, Agents & Incentives
```

**Stack:** TypeScript, pnpm monorepo, Turbo, Hono, ElizaOS, Grok AI / Venice AI, Grammy, Next.js 16, TanStack Query, Tailwind CSS, Radix UI, SQLite, Hedera SDK.

## Production Status

| Service | Status | Details |
|---------|--------|---------|
| **Backend** | ✅ Live (6d uptime) | Hetzner VPS, PM2, PID 1737409 |
| **Frontend** | ✅ Netlify | [familexyz.netlify.app](https://familexyz.netlify.app) |
| **Telegram** | ✅ Connected | [@familexyzbot](https://t.me/familexyzbot) |
| **Database** | ✅ Active | SQLite |
| **Monetization** | ✅ Active | Tiers + usage tracking |
| **Payout Handler** | ❌ Not wired | Service exists, not initialized on boot |
| **Savings Agent** | 🔶 Stub | No real Bonzo Finance integration |

## Quick Start

```bash
git clone https://github.com/thisyearnofear/familexyz.git && cd familexyz
pnpm install && pnpm build
cp .env.example .env  # Add Grok/Venice API key + Telegram bot token
pnpm start            # Starts all 5 agents + Telegram bot + API server
```

Ports are configured via `SERVER_PORT` and `HEALTH_PORT` env vars (defaults: 31337 and 31338). Production sets `SERVER_PORT=3004`.

## Build Notes

- Use Node 22 and pnpm 9.12.3; the repo declares `node >=22 <23`.
- `pnpm build` runs `turbo run build` across all workspaces.
- The Next.js client build is offline-safe: font variables defined locally instead of fetching Google Fonts.
- Do not add a root `postinstall` rebuild step — pnpm already runs lifecycle scripts.

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check (hasDb, hasRuntime, hasTelegram, etc.) |
| `GET /ready` | Readiness check (200 = ready, 503 = not) |
| `GET /agents` | List running agents |
| `POST /:agentId/message` | Send message to agent |
| `POST /:agentId/ag-ui` | SSE stream of AG-UI events |
| `GET /daily-take` | Today's council (story + 5 perspectives) |
| `GET /api/families/:id/bond-score` | Bond score history |
| `GET /api/marketplace/agents` | Agent catalog (with category/tier filters) |
| `GET /api/marketplace/agents/:slug` | Agent detail |
| `POST /api/marketplace/subscribe` | Subscribe family to agent |
| `POST /api/marketplace/submit` | Practitioner agent submission |
| `GET /api/marketplace/pending` | Admin: pending submissions |
| `POST /api/marketplace/review/:id` | Admin: approve/reject submission |
| `POST /api/auth/session` | Create JWT session |
| `GET /api/auth/me` | Current user + subscription |
| `GET /api/subscription/status` | Subscription + usage |
| `POST /api/subscription/upgrade` | Upgrade tier |

## Deployment

- **Frontend:** Netlify (auto-deploys from `develop` branch)
- **Backend:** Hetzner VPS via PM2 at `/home/deploy/familexyz/current`
- **Environment:** `.env` at `/home/deploy/familexyz/shared/env/.env`, symlinked into release
- **Database:** SQLite at `data/db.sqlite` (symlinked to shared)

## Docs

- [Architecture](./docs/ARCHITECTURE.md) — System design & data flows
- [Roadmap](./docs/ROADMAP.md) — Current state, shipped phases, next priorities
- [Agents & Incentives](./docs/AGENTS.md) — Agent details, HCS-10, FAM token
- [Development](./docs/DEVELOPMENT.md) — Local setup & testing

## License

MIT
