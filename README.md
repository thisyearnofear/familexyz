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

### 🧠 Cognee Memory Layer (Hackathon: The Hangover Part AI)

Five agents that **never forget your family**. Cognee's hybrid graph-vector memory layer gives our agents persistent, cross-session memory — so Wisdom remembers what you discussed last week, and the council can traverse your family relationship graph to answer "who haven't I connected with lately?"

**Automatic context injection:** When a user sends a message (free-text or `/ask`), the agent silently recalls relevant memories in parallel with state composition and injects them into the LLM context. The agent responds with awareness of past conversations without the user needing to explicitly ask. This is the deep integration — memory isn't just a search tool, it's woven into every response.

**Graceful degradation:** The entire memory layer is optional. If `COGNEE_ENABLED` is not set, or if Cognee Cloud is unreachable, the app continues to work seamlessly with its existing SQLite-backed state. Every Cognee call is wrapped in try/catch and degrades to a no-op. Context injection silently returns empty — the agent responds normally, just without memory awareness.

#### The Four Memory Lifecycle Operations

| Operation | Cognee API | Where it's called | What it remembers |
|-----------|-----------|-------------------|-------------------|
| **remember()** | `POST /api/v1/remember` | `/checkin` completion, `/family` interaction log, every free-text message, web `/memory` page | Check-in mood + gratitude, family interactions (called/walked/meal), conversation topics |
| **recall()** | `POST /api/v1/recall` | Automatic context injection (every message), `/recall` command, web `/memory` page | Searches the user's full memory graph across all sessions |
| **improve()** | `POST /api/v1/improve` | `/bondscore` refresh, web `/memory` page | Enriches the graph, prunes stale nodes, adapts weights |
| **forget()** | `POST /api/v1/forget` | `/deletedata` command, web `/memory` page | Surgically deletes the user's entire memory dataset |

#### Web Dashboard

- **[/memory](https://familexyz.netlify.app/memory)** — Full memory management page: search memories (recall), add new memories (remember), enrich the graph (improve), and delete all data (forget). Shows live Cognee connection status.
- **[/dashboard](https://familexyz.netlify.app/dashboard)** — Memory status indicator (Active/Off) with link to the memory page.
- **[/account](https://familexyz.netlify.app/account)** — Memory layer status card showing whether Cognee is connected.

#### REST API

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/memory/status` | GET | — | Check if Cognee memory layer is enabled |
| `/api/memory/recall` | POST | JWT | Search the user's memory graph |
| `/api/memory/remember` | POST | JWT | Store a new memory |
| `/api/memory/improve` | POST | JWT | Enrich the user's memory graph |
| `/api/memory/forget` | POST | JWT | Delete all user memories |

#### Per-User Memory Isolation

Each user gets a dedicated Cognee dataset: `familexyz_user_<telegramId>`. This ensures complete memory isolation between users — one user's family graph is never visible to another.

#### Setup

```bash
# .env
COGNEE_ENABLED=true
COGNEE_API_KEY=ck_your_key        # Get a free Developer plan at cognee.ai (code COGNEE-35)
COGNEE_BASE_URL=https://your-tenant.aws.cognee.ai
```

Without these vars, the app runs normally with no memory layer.

#### Code Map

- `packages/memory/` — `MemoryService` interface, `CogneeMemoryService` (HTTP client), `NoopMemoryService` (fallback)
- `packages/clients/telegram/src/handlers.ts` — `remember()` on check-in, `improve()` on bond score
- `packages/clients/telegram/src/relationships.ts` — `remember()` on interaction log
- `packages/clients/telegram/src/privacy.ts` — `forget()` on data deletion
- `packages/clients/telegram/src/TelegramFamilyClient.ts` — `/recall` command, `remember()` on free-text messages, `/status` memory indicator
- `agent/src/server/app.ts` — `/api/memory/*` REST endpoints (status, recall, remember, improve, forget)
- `agent/src/integrations/telegram.ts` — automatic memory recall + context injection in `routeToAgent` (every message)
- `agent/src/server/http-server.ts` — `initMemoryService()` at boot
- `agent/src/health.ts` — memory status in readiness check
- `client/app/memory/page.tsx` — web memory dashboard (recall search, remember input, lifecycle controls)
- `client/hooks/use-memory.ts` — TanStack Query hooks for memory API
- `client/components/dashboard/EnhancedFamilyDashboard.tsx` — memory status indicator
- `client/components/layout/app-sidebar.tsx` — Memory nav link
- `client/app/account/page.tsx` — memory layer status card

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
│   ├── memory/            # Cognee memory layer (remember/recall/improve/forget)
│   ├── monetization/      # Subscription tiers, usage tracking, feature gates
│   ├── auth/              # Hedera wallet auth
│   └── core/              # ElizaOS core runtime
└── docs/                  # Architecture, Roadmap, Development, Agents & Incentives
```

**Stack:** TypeScript, pnpm monorepo, Turbo, Hono, ElizaOS, Grok AI / Venice AI, Grammy, Next.js 16, TanStack Query, Tailwind CSS, Radix UI, SQLite, Hedera SDK, Cognee (hybrid graph-vector memory).

## Production Status

| Service | Status | Details |
|---------|--------|---------|
| **Backend** | ✅ Live (6d uptime) | Hetzner VPS, PM2, PID 1737409 |
| **Frontend** | ✅ Netlify | [familexyz.netlify.app](https://familexyz.netlify.app) |
| **Telegram** | ✅ Connected | [@familexyzbot](https://t.me/familexyzbot) |
| **Database** | ✅ Active | SQLite |
| **Monetization** | ✅ Active | Tiers + usage tracking |
| **Cognee Memory** | 🔶 Optional | Disabled by default; set `COGNEE_ENABLED=true` to activate |
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
