# FamilyXYZ Roadmap

## Current State

**What's live today:**
- Backend API server (Hetzner VPS via PM2, Grok AI primary LLM)
- Five specialized agents: Wisdom, Intimacy, Presence, Growth, Bridge
- Daily Council: RSS/web story → 5 agent perspectives (`/daily-take` API + `/today` web page)
- Next.js frontend on Netlify: home, `/today`, `/dashboard`, `/chat/[agentId]`
- Telegram bot: check-ins, mood tracking, agent routing, family members, bond score, privacy, Hedera commands (~2100 lines)
- Hedera testnet: HCS topic (0.0.7304500), FAM token (0.0.7304501), operator account (0.0.6511978)
- Payout engine: calculation, anomaly detection, HCS audit trail, API endpoints
- Bond scoring: 7 signal aggregators, weekly scheduler, composite 0-100 score
- AG-UI protocol: SSE streaming for agent chat
- Monetization package: subscription tiers, usage tracking, feature gates (scaffolded, not wired)
- XMTP client: encrypted messaging client (scaffolded, not production-connected)
- A2A protocol: agent registry + trade executor (exists, not exposed via API)
- Savings agent: Bonzo Finance plugin (minimal — single action, no balance/yield logic)

**What's not built:**
- Agent Marketplace (creator profiles, agent catalog, subscription billing)
- Payment processing (no Stripe, crypto checkout, or any real payment flow)
- User authentication (all interactions are anonymous)
- Real SSE streaming in the frontend chat (currently simulates word-by-word)
- WebSocket push notifications
- OpenAPI documentation
- Rate limiting
- Smart contracts (treasury, escrow, governance DAOs)
- NFT badges, multi-sig wallets, cross-family consensus

---

## Guiding Principles

1. **CONSOLIDATE before enhancing** — remove dead code, unify duplication, then build on clean foundations
2. **Backend before frontend** — stabilize the data layer and API contract, then upgrade the UI
3. **Product before infrastructure** — ship features families can use before optimizing what already works
4. **Each phase is shippable** — no phase depends on a later phase to be useful

---

## Phase 0 — Consolidation & Cleanup

**Goal:** Remove dead code, fix contradictions, establish a single source of truth. Zero new features.

### 0a. Delete unused character files
The `characters/` directory has 8 files inherited from the ElizaOS fork that don't belong to FamilyXYZ.

**Delete:**
- `characters/c3po.character.json`
- `characters/cosmosHelper.character.json`
- `characters/dobby.character.json`
- `characters/eternalai.character.json`
- `characters/savings.character.json`
- `characters/sbf.character.json`
- `characters/simsai.character.json`
- `characters/trump.character.json`
- `characters/wisdom-test.character.json` (test artifact)

**Keep:** wisdom, intimacy, presence, growth, generationalBridge, family-wellness-agent

### 0b. Fix port configuration
Currently three conflicting port references exist. Standardize:

| Location | Current | Corrected |
|----------|---------|-----------|
| `agent/src/index.ts` | defaults to 31337/31338 | Keep as fallback defaults |
| `README.md` | :31337, :31338 | Reference env vars, remove hardcoded ports |
| `IMPLEMENTATION_PLAN.md` | :3004, :3005 | Mark doc as stale (see Phase 0g) |
| `ecosystem.config.js` | PORT: 3000 | Already marked deprecated — leave or remove |
| `.env.example` | SERVER_PORT=3004 | Keep — production uses this via env var |

**Single truth:** Server reads `SERVER_PORT` and `HEALTH_PORT` from env, with defaults 31337/31338 in `agent/src/index.ts`. Production sets `SERVER_PORT=3004` in `.env`.

### 0c. Fix package.json description
Change: `"Cache cleared for mega nuclear deployment"` → remove that suffix, keep the real description.

### 0d. Fix character JSON navigation references
Replace `[NAVIGATE: /dashboard?tab=activities]` references (tabs don't exist) with natural language suggestions to visit `/dashboard` or `/today`.

### 0e. Remove dead code paths
- `agent/src/index.ts` — delete the `cachedDbAdapter`/`cachedFilePath` dead block (always null, `if (false && ...)` guard)
- `agent/src/health.ts` — simplify dual-mode readiness check to only return a value

### 0f. Consolidate duplicate CSS animations
`client/app/globals.css` has duplicate `fade-in-*` animations that overlap with `reveal-*`. Delete the `fade-in` block and replace any references with `reveal-up` equivalents.

### 0g. Mark stale docs
Add deprecation notice to `IMPLEMENTATION_PLAN.md` pointing to `docs/ARCHITECTURE.md` and this roadmap.

**Validation:** `pnpm build` passes after all Phase 0 changes.

---

## Phase 1 — Ship What's Built

**Goal:** Wire up existing code that's functional but disconnected. Get the Telegram bot running end-to-end, connect the frontend to real backend data, and confirm the full stack works together.

### 1a. Connect frontend to live backend
The Next.js frontend proxies to `api.famile.xyz` but may have stale or broken connections.

- Verify `/api/today` route fetches from backend `/daily-take` (fallback exists — confirm primary path works)
- Verify `/api/agents` route returns real agent data
- Verify `/chat/[agentId]` actually sends messages to `/:agentId/message` and receives responses
- Fix any CORS issues between Netlify frontend and Hetzner backend

### 1b. Deploy and verify Telegram bot
The Telegram client is 2100+ lines of feature-rich code but its production status is unclear.

- Wire `TelegramFamilyClient` into the agent server startup (`agent/src/integrations/telegram.ts`)
- Confirm bot token is configured and bot starts without errors
- Test end-to-end: `/start` → check-in → mood → agent chat → bond score → `/council`
- Verify daily check-in scheduler fires and sends messages

### 1c. Wire up the Savings agent properly
The submission doc claims Bonzo Finance integration but the plugin has a single action stub.

- Implement balance查询 (query Bonzo Finance for family savings balance)
- Implement deposit/withdraw actions
- Log savings interactions to HCS for bond score contribution
- Expose savings data in the dashboard

### 1d. Add LLM retry with exponential backoff
Wrap all `generateText` calls (DailyTakeGenerator, telegram message responses) with retry logic:
- Max 2 retries, exponential delay (1s, 2s)
- Graceful fallback messaging on total failure

### 1e. Parallelize Daily Take generation
Current: sequential loop over 5 agents (~12s). Change to `Promise.allSettled` (~3s).

**Validation:** Open familexyz.netlify.app, verify Daily Council loads real data. Send a Telegram message, get an agent response. Check savings balance displays on dashboard.

---

## Phase 2 — Frontend Data Layer

**Goal:** Replace manual fetch/useState patterns with TanStack Query, add real SSE streaming to chat, and persist conversation state.

### 2a. Install TanStack Query
- Add `@tanstack/react-query` to client
- Create shared hooks: `useDailyTake()`, `useBondScore()`, `useAgentStatuses()`
- Refactor `page.tsx`, `today/page.tsx`, `EnhancedFamilyDashboard.tsx` to use hooks
- Set `staleTime` appropriately (1hr for daily content, 30s for agent status)

### 2b. Add real SSE streaming to chat
Current: `ChatInterface` waits for full response, then simulates word-by-word typing.
New: consume SSE from `/:agentId/ag-ui`, parse `TextMessageContent` events, append to `streamingContent` in real-time.

### 2c. Fix Cache-Control headers
- Let `/api/today` use its existing `revalidate = 3600`
- Add `public, max-age=31536000, immutable` for `/_next/static/` assets
- Keep `no-cache` for other `/api/` routes

### 2d. Persist chat conversation state
- Store last 50 messages per agent in localStorage
- Load history on mount, save after each exchange

### 2e. Upgrade chat input to auto-growing textarea
Replace single-line `<input>` with `<textarea>` that grows up to 120px. Submit on Enter, newline on Shift+Enter.

**Validation:** Open the app, verify daily council loads instantly from cache, send a chat message and see tokens stream in real-time, refresh and confirm history persists.

---

## Phase 3 — Backend Foundation

**Goal:** Replace the hand-rolled HTTP server with a proper framework, extract global state, and add resilience. This enables Phase 4 (marketplace) by providing clean middleware and routing.

### 3a. Replace hand-rolled HTTP with Hono
`agent/src/server/http-server.ts` (518 lines) manually parses URLs and handles CORS. Replace with Hono (14kB, zero-dependency, TypeScript-native):

```
agent/src/server/
├── app.ts              # Hono app + middleware
├── http-server.ts       # Server startup only
├── routes/
│   ├── health.ts
│   ├── bondScore.ts
│   ├── payouts.ts
│   └── dailyTake.ts
```

### 3b. Extract global mutable state into a ServiceRegistry
Replace `global.payoutApiHandler`, module-level `let telegramClient`, `let runtimeInstance`, `let cachedTake`, `let _primaryDb` with a singleton `ServiceRegistry` class.

### 3c. Strengthen health check
Add dependency checks: database connectivity, LLM provider reachability, Hedera connection. Return 503 if any service is down.

### 3d. Add CORS_ORIGINS to environment
Read from `CORS_ORIGINS` env var (comma-separated) instead of hardcoded array.

**Validation:** `pnpm build` and `pnpm test` pass. `/health` returns dependency status. All existing endpoints work identically.

---

## Phase 4 — Marketplace MVP

**Goal:** Ship the minimum viable marketplace — families can discover agents, subscribe, and practitioners can publish. This is the core business model from the roadmap's Phase 8.

### 4a. Wire the monetization package
The `packages/monetization/` package has `SubscriptionService`, `UsageTracker`, `FeatureGate`, usage tracking middleware, and cron-based usage reset — all scaffolded but disconnected.

- Connect `SubscriptionService` to a real data store (SQLite table for subscriptions)
- Wire `UsageTracker` middleware into the Hono app from Phase 3
- Configure tier limits (Free: 10 messages/day, Pro: unlimited, Enterprise: custom)
- Add `FeatureGate` checks to agent endpoints

### 4b. Add user authentication
Lightweight JWT-based auth — no heavy framework, just enough to identify family members:

- `packages/auth/src/` — create/verify session tokens
- Session middleware on API routes
- Frontend: store token in localStorage, attach `Authorization` header
- Onboarding flow: name → family code → meet the agents (3-step modal)

### 4c. Agent catalog API
New endpoints for the marketplace:

- `GET /api/marketplace/agents` — list available agents with descriptions, creator, ratings
- `GET /api/marketplace/agents/:id` — agent detail with methodology, research citations
- `POST /api/marketplace/subscribe` — subscribe a family to an agent
- `GET /api/marketplace/family/:id/subscriptions` — family's active subscriptions

### 4d. Marketplace frontend
New pages in the Next.js client:

- `/marketplace` — browse agents by category, see ratings and descriptions
- `/marketplace/[agentId]` — agent detail page with subscribe button
- `/account` — manage subscriptions, view usage, billing history

### 4e. Practitioner publishing (minimal)
- Practitioner signup page (credentials, methodology description)
- Agent submission form (name, description, intellectual tradition, research citations)
- Admin review queue (list of pending agents, approve/reject)

**Validation:** A practitioner can submit an agent. An admin approves it. A family discovers it in the marketplace, subscribes, and uses it. Usage is tracked and tier limits are enforced.

---

## Phase 5 — Production Hardening

**Goal:** Operational excellence — graceful shutdown, deployment rollback, API documentation, structured logging.

### 5a. Graceful shutdown
Handle SIGTERM/SIGINT: stop accepting connections, disconnect Telegram, close database, exit cleanly.

### 5b. Deployment rollback
Add `make rollback` target that swaps the symlink to the previous release and restarts PM2.

### 5c. OpenAPI documentation
Generate OpenAPI 3.0 spec from route definitions. Serve Swagger UI at `/docs` in development.

### 5d. Structured logging
Replace scattered `elizaLogger.*` calls with JSON structured logger for production log aggregation.

### 5e. Rate limiting
Per-endpoint rate limits using Hono middleware. Per-user quotas enforced via the monetization package's `UsageTracker`.

**Validation:** Deploy to staging, verify health check reports all services, test graceful shutdown with `kill -SIGTERM`, confirm rollback works, browse Swagger UI.

---

## Future (Post-MVP)

These are documented in the vision but correctly deferred until the marketplace proves traction:

- **Hedera deep integration:** HTS family badges/NFTs, treasury smart contracts, multi-sig wallets, governance DAOs, agent performance escrow
- **XMTP production:** Connect the existing XMTP client to the live agent server for web3-native encrypted messaging
- **WebSocket push:** Real-time bond score updates, agent activity notifications
- **Enterprise tier:** Employer wellness benefit integration, usage dashboards (no content access)
- **Cross-family consensus protocols**
- **SQLite → PostgreSQL migration** (only when scale demands it)

---

## Phase Dependency Graph

```
Phase 0 (Consolidation)
  │
  ├──→ Phase 1 (Ship What's Built) ──→ Phase 2 (Frontend Data Layer)
  │                                        │
  ├──→ Phase 3 (Backend Foundation)        │
          │                                │
          └──→ Phase 4 (Marketplace MVP) ←─┘
                   │
                   └──→ Phase 5 (Production Hardening)
```

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| 0 — Consolidation | 1-2 days | None |
| 1 — Ship What's Built | 3-4 days | Phase 0 |
| 2 — Frontend Data Layer | 2-3 days | Phase 1 |
| 3 — Backend Foundation | 3-4 days | Phase 0 |
| 4 — Marketplace MVP | 5-7 days | Phases 2, 3 |
| 5 — Production Hardening | 2-3 days | Phase 3 |
| **Total** | **16-23 days** | |

---

**Last Updated:** June 12, 2026
**Current Phase:** Phase 0 — Consolidation
**Next Milestone:** Phase 1 — Ship What's Built (Telegram bot + frontend connectivity)
