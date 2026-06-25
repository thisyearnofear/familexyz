# FamilyXYZ Roadmap

## Current State (June 25, 2026)

**Everything below is shipped and live in production.**

### Backend (Hetzner VPS)
- Agent server running via PM2 (PID 1737409, ~6 day uptime)
- Grok AI for primary LLM, Venice AI fallback
- Ollama for embeddings (nomic-embed-text, local)
- **Hono** HTTP framework (replaced hand-rolled server) with CORS via `CORS_ORIGINS` env var
- **ServiceRegistry** singleton replaces all module-level globals
- Health check with dependency status: `hasDb`, `hasRuntime`, `hasDirectClient`, `hasTelegram`, `hasMonetization` — all active
- **5 agents**: Wisdom, Intimacy, Presence, Growth, Bridge with full specialized plugins
- **Daily Council**: RSS/Web story → 5 agent perspectives (`/daily-take` API, cached)
- **Bond scoring**: 7 signal aggregators, weekly scheduler, composite 0-100 score, HCS logging
- **Payout engine**: calculation, anomaly detection, HCS audit trail, API endpoints
- **Monetization**: Connected to SQLite, subscription tiers (Free/Pro/Enterprise), usage tracking, feature gates
- **Auth**: JWT-based session tokens, auth middleware, `/api/auth/session` and `/api/auth/me` endpoints
- **Marketplace**: Agent catalog SQLite tables, submission→review→approve pipeline, API endpoints all wired
- LLM retry with exponential backoff (2 retries, 1s/2s delays)

### Frontend (Netlify)
- Next.js 16, dark editorial design, deployed at familexyz.netlify.app
- `/` — Home with Daily Council preview and agent masthead
- `/today` — Full council with per-agent styled takes (Wisdom gets letter format, Presence gets centered meditation, Growth gets manifesto, etc.)
- `/chat/[agentId]` — Real SSE streaming via AG-UI protocol (not simulated)
- `/dashboard` — Bond score bar, agent strip, weekly trend sparkline
- `/marketplace` — Browse/search agents by category
- `/marketplace/[slug]` — Agent detail pages
- `/account` — Subscription management, usage, billing
- `/publish` — Practitioner agent submission form
- **TanStack Query** hooks: `useDailyTake`, `useAgentStatuses`, `useBondScore`, `useMarketplaceAgents`
- **Chat persistence**: Last 50 messages per agent in localStorage
- **Auto-growing textarea** in chat (up to 120px)
- **Cache headers**: immutable for static assets, 3600s for `/api/today`, no-cache for other API routes
- **Radix UI components**: sidebar, tooltips, dialogs, accordion, dropdown, select, tabs, toast, etc.
- **Editorial color system**: `editorial-bg`, `editorial-cream`, `editorial-accent`, etc.
- **Animation system**: `reveal-up`, `reveal-scale`, `reveal-slide`, staggered delay classes (`d1`–`d7`)
- **All Phase 2 items complete**: TanStack Query, real SSE streaming, cache headers, chat persistence, auto-growing textarea

### Telegram Bot (@familexyzbot)
- **Full production grammy bot** — 2,150+ lines across 8 modules
- **20+ commands**: /start, /checkin, /family, /agents, /bondscore, /challenge, /savings, /council, /ask, /status, /help, /me, /privacy, /export, /deletedata, /hedera, /milestone, /reward, /transfer, /balance, /demo
- **Session management** with SQLite-backed persistence (7 tables: users, checkins, family_members, interactions, mentions, etc.)
- **Smart agent routing**: keyword detection routes messages to correct agent automatically
- **Council requests**: `/council` sends to all 5 agents
- **Family relationship tracking**: add members, log interaction types (called, walked, meal, gift, quality_time, messaged, visited), set cadence goals
- **Progressive enablement**: detects family mentions in free text → offers opt-in after 3 mentions
- **Nudge system**: contextual nudges based on cadence goals and last interaction time
- **Check-in state machine**: mood → gratitude → story → streak tracking
- **Privacy**: `/me` stats, `/privacy` disclosure, `/export` data, `/deletedata` full wipe
- **Hedera commands**: `/hedera` status, `/milestone` log to HCS, `/reward` payout, `/transfer`, `/balance`, `/demo`
- **Long polling** with webhook support, group/private chat differentiation
- **Integrated into agent startup**: `agent/src/integrations/telegram.ts` handles initialization, message routing, council, DirectClient extension

### Hedera
- HCS topic: `0.0.7304500`
- FAM token: `0.0.7304501`
- Operator account: `0.0.6511978`
- Mirror node connected
- Hedera plugin family: `plugin-familyxyz` with payout, rewards, consensus tools
- Hedera core: HCS-10 compliance, topic registry, mirror service, token service, contract service

### Marketplace (Shipped)
- Agent catalog API: `GET /api/marketplace/agents` (with category/tier filtering)
- Agent detail API: `GET /api/marketplace/agents/:slug`
- Subscribe API: `POST /api/marketplace/subscribe`
- Family subscriptions API: `GET /api/marketplace/family/:familyId/subscriptions`
- Submission API: `POST /api/marketplace/submit`
- Review API: `GET /api/marketplace/pending`, `POST /api/marketplace/review/:id`
- Frontend: `/marketplace`, `/marketplace/[slug]`, `/account`, `/publish`
- Practitioner agent submission pipeline (submit → review → approve → catalog)
- SQLite tables: `agent_catalog`, `agent_submissions`

**Total shipped: ~9,500 lines of production TypeScript across all packages.**

---

## Guiding Principles

1. **Frontend quality is the differentiator** — the backend works; the UX is where families form their opinion
2. **Motion design matters** — intentional transitions create a sense of craft that builds trust
3. **Product before infrastructure** — ship features families can use before optimizing what already works
4. **Each phase is shippable** — no phase depends on a later phase to be useful

---

## Phase 0 — Consolidation & Cleanup

**Status: ✅ COMPLETED**

| Task | Status |
|------|--------|
| 0a — Delete unused character files | ✅ Done |
| 0b — Fix port configuration | ✅ Done |
| 0c — Fix package.json description | ✅ Done |
| 0d — Fix character navigation refs | ✅ Done |
| 0e — Remove dead code paths | ✅ Done |
| 0f — Consolidate CSS animations | ✅ Done |
| 0g — Mark stale docs | ✅ Done |

---

## Phase 1 — Ship What's Built

**Status: ✅ COMPLETED**

| Task | Status |
|------|--------|
| 1a — Connect frontend to backend | ✅ Real SSE streaming, live API calls |
| 1b — Deploy and verify Telegram bot | ✅ Live @familexyzbot, 20+ commands |
| 1c — Wire Savings agent | 🔶 Stub only (single action, no balance/yield) |
| 1d — LLM retry with exponential backoff | ✅ `withRetry()` wrapper in place |
| 1e — Parallelize Daily Take generation | 🔶 Sequential loop (5 agents, ~12s) |

---

## Phase 2 — Frontend Data Layer

**Status: ✅ COMPLETED**

| Task | Status |
|------|--------|
| 2a — TanStack Query | ✅ `useDailyTake`, `useAgentStatuses`, `useBondScore`, `useMarketplaceAgents` |
| 2b — Real SSE streaming | ✅ AG-UI protocol via `sendMessageStream()` |
| 2c — Cache-Control headers | ✅ Immutable for static, 3600s for `/api/today` |
| 2d — Persist chat state | ✅ Last 50 messages per agent in localStorage |
| 2e — Auto-growing textarea | ✅ `<textarea>` grows up to 120px |

---

## Phase 3 — Backend Foundation

**Status: ✅ COMPLETED**

| Task | Status |
|------|--------|
| 3a — Hand-rolled HTTP → Hono | ✅ `app.ts` + `http-server.ts` + `service-registry.ts` |
| 3b — ServiceRegistry | ✅ Singleton replaces all module-level globals |
| 3c — Strengthen health check | ✅ Dependency checks (hasDb, hasRuntime, etc.) |
| 3d — CORS_ORIGINS env var | ✅ Comma-separated origins config |

---

## Phase 4 — Marketplace MVP

**Status: ✅ COMPLETED**

| Task | Status |
|------|--------|
| 4a — Wire monetization | ✅ Subscription tiers, usage tracking, feature gates |
| 4b — User authentication | ✅ JWT sessions, auth middleware |
| 4c — Agent catalog API | ✅ Catalog, detail, subscribe, submissions, review |
| 4d — Marketplace frontend | ✅ `/marketplace`, `/marketplace/[slug]`, `/account`, `/publish` |
| 4e — Practitioner publishing | ✅ Submit → review → approve pipeline |

---

## Phase 5 — Production Hardening

**Goal:** Graceful shutdown, rollback, OpenAPI docs, structured logging, rate limiting.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 5a | Graceful shutdown (SIGTERM handler) | Small | Medium |
| 5b | Deployment rollback improvements | Small | Low |
| 5c | OpenAPI documentation | Medium | Low |
| 5d | Structured JSON logging | Medium | Low |
| 5e | Rate limiting middleware | Small | High (anti-abuse) |

---

## Phase 6 — Motion Design System

**Goal:** Replace ad-hoc CSS animations with a curated motion design system inspired by [transitions.dev](https://transitions.dev).

**Rationale:** The current `reveal-*` and `hover-*` animations are hand-crafted. transitions.dev provides 21 production-grade, micro-optimized transitions (dropdowns, modals, icon swaps, accordions) with proper easing curves, durations, and staggered timing. Installing this as a skill would give the entire frontend a cohesive, polished feel with minimal effort.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 6a | Install transitions.dev skill (`npx skills add Jakubantalik/transitions.dev`) | 5 min | High |
| 6b | Run `transitions review` to audit all current animations | 10 min | — |
| 6c | Apply curated transitions to: dropdowns, modals, sidebar, dialog, tooltip | Small | High |
| 6d | Replace ad-hoc hover transitions with motion tokens | Small | Medium |
| 6e | Add page transition between routes (reveal-up refinements) | Small | Medium |

---

## Phase 7 — Agent UI Components (agentcn)

**Goal:** Use [agentcn](https://github.com/shadcn-labs/agentcn) to replace hand-rolled agent interaction patterns with pre-built, production-grade agent UI components.

**Rationale:** agentcn is "shadcn/ui, but for building agents" — zero-config, composable components for agent chat, tool calls, streaming responses, reasoning traces, and state visualization. It uses the same registry format as shadcn CLI. This would accelerate agent UI development significantly.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 7a | Evaluate agentcn catalog — browse available agent recipes/components | 30 min | — |
| 7b | Integrate agent chat component (replace or augment ChatInterface) | 1-2 days | Very High |
| 7c | Add tool call visualization (agentcn has built-in tool lifecycle components) | 0.5 day | High |
| 7d | Add agent reasoning display (chain-of-thought visualization) | 1 day | High |
| 7e | Add agent state visualization (bond score, metrics as agentcn components) | 0.5 day | Medium |

---

## Phase 8 — UX Elevation

**Goal:** Elevate the overall user experience through targeted improvements informed by the current frontend audit.

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 8a | Add persistent loading/skeleton states across all pages | Small | High |
| 8b | Wire dashboard bond score to real API data (currently mocked) | Small | High |
| 8c | Add WebSocket push for real-time bond score/agent activity updates | 2 days | High |
| 8d | Add onboarding flow for first-time visitors (3-step: intro → agent → chat) | 1-2 days | Very High |
| 8e | Improve responsiveness on mobile (esp. chat and dashboard) | 1 day | High |
| 8f | Add keyboard shortcuts (Cmd+K command palette, etc.) | 1 day | Medium |
| 8g | Add dark/light mode toggle (currently dark-only) | 0.5 day | Medium |

---

## Phase 9 — The Savings Agent

**Remaining gap from Phase 1:** The Savings agent plugin has a single action stub with no real Bonzo Finance integration.

| # | Task | Effort |
|---|------|--------|
| 9a | Query Bonzo Finance for family savings balance | 1 day |
| 9b | Implement deposit/withdraw actions | 1 day |
| 9c | Log savings interactions to HCS for bond score | 0.5 day |
| 9d | Expose savings data in dashboard and Telegram | 1 day |

---

## Future (Post-MVP)

These remain valuable but depend on adoption:

- **Hedera deep integration:** Treasury smart contracts, multi-sig wallets, governance DAOs, agent performance escrow, NFT badges
- **XMTP production:** Connect the existing XMTP client for web3-native encrypted messaging
- **WebSocket push:** Real-time updates (already partially done via SSE)
- **Enterprise tier:** Employer wellness benefit integration
- **Cross-family consensus protocols**
- **SQLite → PostgreSQL migration** (only when scale demands it)

---

## Phase Dependency Graph

```
Phase 0 (Consolidation)     — ✅ COMPLETE
Phase 1 (Ship It)           — ✅ COMPLETE (savings stubbed)
Phase 2 (Frontend Data)     — ✅ COMPLETE
Phase 3 (Backend Hono)      — ✅ COMPLETE
Phase 4 (Marketplace MVP)   — ✅ COMPLETE
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    Phase 5 (Hardening)  Phase 6 (Motion Sys)  Phase 7 (Agentcn UI)
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                     Phase 8 (UX Elevation)
                              │
                              ▼
                     Phase 9 (Savings Agent)
```

## Recommended Next 3 Weeks

| Week | Focus | Key Deliverables |
|------|-------|-----------------|
| **Week 1** | Motion + Components | Install transitions.dev, audit animations, evaluate agentcn catalog, integrate agent chat component |
| **Week 2** | UX Elevation | Wire real bond score data, add onboarding flow, improve mobile responsiveness, add loading skeletons |
| **Week 3** | Polish & Ship | WebSocket push, keyboard shortcuts, dark/light mode, savings agent, rate limiting |

---

**Last Updated:** June 25, 2026
**Current Phase:** Phase 5–9 (concurrent, prioritized by UX impact)
**Next Up:** WebSocket push for real-time updates → improve mobile responsiveness → savings agent

---

## Changelog

### June 26, 2026
- **Signal aggregators fixed**: 7 bond score signals now fetch real data from `memories` table — fixed `'message'` → `'messages'` type filter, removed `datetime()` on integer timestamps, fixed DISTINCT dedup for per-user-per-day counts
- **Dashboard UX overhaul**:
  - Replaced manual `useEffect`+`fetch` with `useBondScore` TanStack Query hook (30s staleTime, auto-refetching)
  - Added Signal Breakdown section showing all 7 component scores with color-coded progress bars
  - Dynamic `familyId` resolution: URL params → localStorage → `'primary'` fallback
  - Added `<Suspense>` boundary for `useSearchParams()` compatibility
- **Bond score scheduler**: Weekly cron (Sundays 00:00 UTC) auto-calculates, first run successful — 10 families scored
- **Nginx routing**: `/daily-take` and `/api/*` paths route to Hono app (port 31338) — marketplace, bond score, and subscription APIs publicly accessible
- **SQLite adapter fix**: 27 `.query()` → `.all()`/`.run()` changes across 4 backend files (`app.ts`, `BondScoreScheduler.ts`, `bondScoring.ts`, `migrations/runner.ts`)
- **Telegram dashboard deep-link rollout**:
  - Added `dashboardUrlButton()` helper in `keyboards.ts` — resolves familyId per chat context (group: `telegram_{chatId}`, private: `user_{userId}`)
  - Dashboard "📊 Family Dashboard" URL button added to all 18 Telegram touchpoints: `/start`, `/bondscore`, `/status`, check-in complete, `/help`, onboarding keyboard, `/agents`, agent selection confirmation, `/council`, `/challenge`, `/savings`, `/me`, `/privacy`, `/export`, `/deletedata`, `/hedera`, `/milestone`, `/reward`, `/transfer`, `/balance`, `/demo`
  - Configurable via `FRONTEND_URL` env var (default: `https://familexyz.netlify.app`)
  - All 5 Telegram files updated (`handlers.ts`, `keyboards.ts`, `TelegramFamilyClient.ts`, `privacy.ts`, `hederaHandlers.ts`), deployed, PM2 restarted
  - Fixed orphaned `reply_markup` in `/demo` handler — keyboard was created but never passed to the reply
- **Infrastructure**: Bond score scheduler deployed, temp files cleaned up, ROADMAP updated with June 26 changelog

### June 25, 2026
- **Phase 5 — Production Hardening (5e):** Rate limiting middleware configured in Nginx (10r/s, burst 20)
- **Phase 6 — Motion Design System:** transitions.dev skill installed (`npx skills add`), motion tokens integrated into CSS custom properties, skeleton components created, hover refinements with `--ease-smooth-out` easing
- **Phase 7 — Agent UI Components:** agentcn catalog evaluated; integration deferred due to monorepo complexity
- **Phase 8 — UX Elevation:**
  - 8a - Skeleton loading states on all 6 pages (/, /today, /chat, /marketplace, /account, /marketplace/[slug])
  - 8b - Bond score API wired — backend DB query fixed, database schema migrated, Nginx routing updated for public access
  - 8d - Onboarding flow created (3-step wizard: welcome → pick agent → ready)
- **Infrastructure fixes:**
  - Fixed `IDatabaseAdapter` method mismatch — `.query()` → `.all()`/`.run()` across 4 files (app.ts, migrations/runner.ts, BondScoreScheduler.ts, bondScoring.ts)
  - Applied SQLite schema migrations (bond scoring, monetization, marketplace tables)
  - Updated Nginx to route `/daily-take` and `/api/*` paths to Hono app on port 31338
