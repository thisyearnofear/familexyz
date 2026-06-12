# ⚠️ DEPRECATED — This document is stale

**This implementation plan is no longer the source of truth.** It was written for an earlier phase when the project was backend-only and the frontend had been removed. The project now includes a Next.js frontend, a Telegram bot, and additional packages not referenced here.

**Current documentation:**
- **[Roadmap](docs/ROADMAP.md)** — Phased plan from consolidation through marketplace MVP
- **[Architecture](docs/ARCHITECTURE.md)** — System design, monorepo structure, API reference, deployment

Port numbers, phase references, and "backend-only" framing in this document are outdated. See the docs linked above for the current state.

---

# Implementation Plan: Backend-Only API Server (Historical)

## Objective
Transform FamilyXYZ into a **backend-only API server** that provides agent interactions, messaging integrations, and payout management via REST endpoints. The frontend will be a separate repository or future addition.

**Core Principles:**
- **API-FIRST**: All functionality exposed via REST endpoints
- **CONSOLIDATION**: Remove bloat, single source of truth
- **PREVENT BLOAT**: Audit before adding
- **DRY**: Single source of truth
- **CLEAN**: Clear separation of concerns
- **MODULAR**: Composable, testable
- **PERFORMANT**: Optimize bundle size, caching
- **ORGANIZED**: Predictable structure

---

## Problem Statement
The repository previously included a frontend dashboard that has been removed. The goal is to maintain a clean backend-only API server:

- **No Frontend**: Old Vite/React dashboard removed
- **Backend API**: REST API on port 3004, health on 3005
- **Agent Runtime**: Five family agents with messaging capabilities
- **Payout System**: HCS-10 compliant payout tracking and distribution

---

## Phase 1: Backend Core Setup ✅ COMPLETED

### 1a. Agent Server Structure ✅
**Status:** Complete

Backend agent server with modular architecture:
- `agent/src/` — Main entry point and services
- `packages/agent/` — Shared agent services
- `packages/family/` — Family-specific agents (Wisdom, Intimacy, etc.)

**Files Modified:**
- `agent/src/index.ts` — Main server entry
- `agent/src/services/` — Core business logic
- `agent/src/api/` — REST API handlers

---

### 1b. Environment Configuration ✅
**Status:** Complete

Environment variables for all external services:
- Grok AI API (primary chat model)
- Venice AI API (fallback)
- Ollama embeddings (free, self-hosted)
- Hedera credentials (testnet/mainnet)

**Files Modified:**
- `.env.example` — Template for all environment variables
- `agent/src/config/` — Configuration loading

---

### 1c. Health & Status Endpoints ✅
**Status:** Complete

Health monitoring on separate port:
- `GET /health` on port 3005 — Basic health check
- `GET /api/status` — Full system status

**Files Modified:**
- `agent/src/api/health.ts` — Health endpoint handlers

---

## Phase 2: Agent Messaging ✅ COMPLETED

### 2a. Agent Message Handling ✅
**Status:** Complete

Core agent messaging via REST:
- `POST /:agentId/message` — Send message to agent
- Agent routing based on agentId
- Response streaming support

**Files Modified:**
- `agent/src/api/agent.ts` — Agent message handlers

---

### 2b. AG-UI Protocol ✅
**Status:** Complete

AG-UI protocol implementation for real-time agent communication:
- `POST /:agentId/ag-ui` — SSE stream of typed events
- Event types: RunStarted, StepStarted, TextMessageContent, StateSnapshot, etc.
- JSON Patch RFC 6902 for state deltas

**Files Modified:**
- `agent/src/api/ag-ui.ts` — AG-UI protocol handler

---

### 2c. Agent Insights API ✅
**Status:** Complete

Real-time agent insights from runtime metrics:
- `GET /agents/insights` — All agents' insights
- `GET /agents/:agentId/insights` — Single agent insights
- Data from `runtime.meta` (familyMetrics, intimacyMetrics, etc.)

**Files Modified:**
- `agent/src/api/insights.ts` — Insights endpoint handlers

---

## Phase 3: Payout System ✅ COMPLETED

### 3a. Payout Calculation Engine ✅
**Status:** Complete

Core payout calculation with configurable parameters:
- Base rate: $50 × score delta
- Performance multiplier: 1.0-1.5x
- Recency weight: 0.8-1.0
- Weekly caps enforcement

**Files Created:**
- `packages/agent/src/services/PayoutService.ts` — Calculation engine

---

### 3b. Anomaly Detection ✅
**Status:** Complete

Anti-gaming protections:
- Suspicious large jumps detection
- Unrealistic perfection detection
- Rapid consecutive improvements detection
- Cooling period management

**Files Created:**
- `packages/agent/src/services/AnomalyDetectionService.ts` — Anomaly detection

---

### 3c. Payout API Endpoints ✅
**Status:** Complete

REST endpoints for payout management:
- `GET /api/agents/:agentId/payouts` — Payout history
- `GET /api/agents/:agentId/performance` — Performance metrics
- `GET /api/families/:familyId/payouts` — Family aggregation
- `GET /api/payouts/pending` — Pending payouts
- `POST /api/payouts/calculate` — Dry-run calculation

**Files Created:**
- `agent/src/api/payouts.ts` — Payout endpoint handlers

---

### 3d. HCS Audit Trail ✅
**Status:** Complete

Immutable audit trail on Hedera Consensus Service:
- Payout records logged to HCS Topic
- SQLite persistence for fast access
- Dual-layer cache (in-memory + SQLite)

**Files Created:**
- `packages/agent/src/services/HederaPayoutLogger.ts` — HCS logging

---

## Phase 4: Production Deployment ✅ COMPLETED

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│ Backend:  Hetzner VPS (api.famile.xyz:443)                  │
│ LLM:      Grok 4.1 Fast (primary) / Venice AI (fallback)    │
│ Embeddings: Ollama (nomic-embed-text, 768-dim, free)        │
│ Database: SQLite (agent/data/db.sqlite)                     │
│ Blockchain: Hedera Testnet                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4a. Server Configuration ✅
**Status:** Complete

Production server setup:
- `SERVER_PORT=3004` — Main API port
- `HEALTH_PORT=3005` — Health check port
- Nginx reverse proxy with HTTPS
- CORS configuration for allowed origins

**Files Modified:**
- `ecosystem.config.js` — PM2 process configuration
- `.env` — Production environment variables

### 4b. Model Configuration ✅
**Status:** Complete

LLM provider configuration:
- **Primary:** Grok 4.1 Fast (very fast, high quality)
- **Fallback:** Venice qwen3-4b (fast, cheap)
- **Embeddings:** Ollama nomic-embed-text (free, local)

**Files Modified:**
- `packages/core/src/models.ts` — Model configuration
- `packages/core/src/embedding.ts` — Ollama embeddings

### 4c. PM2 Process Management ✅
**Status:** Complete

Process management with PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 restart familexyz-agent --update-env
```

---

## Server Configuration Summary

### Environment Variables (.env)
```bash
# Server
SERVER_PORT=3004
HEALTH_PORT=3005
NODE_ENV=production

# Grok AI (Primary Chat - Very Fast)
GROK_API_KEY=your_grok_api_key_here
SMALL_GROK_MODEL=grok-4-1-fast
MEDIUM_GROK_MODEL=grok-4-1-fast
LARGE_GROK_MODEL=grok-4-1-fast

# Venice AI (Chat - Fallback)
VENICE_API_KEY=your_key_here
SMALL_VENICE_MODEL=qwen3-4b

# Ollama (Embeddings - Free)
USE_OLLAMA_EMBEDDING=true
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_SERVER_URL=http://localhost:11434

# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=your_operator_id
HEDERA_OPERATOR_KEY=your_operator_key

# CORS
CORS_ORIGINS=https://your-frontend-domain.com
TRUST_PROXY=true
```

### Model Strategy

**Primary Model: Grok 4.1 Fast**
- Latency: Very fast (1-3 seconds)
- Cost: $0.50/$1.25 per 1M tokens (input/output)
- Quality: High, balances speed with advanced capabilities
- Use case: All chat interactions

**Fallback Model: Venice Small (qwen3-4b)**
- Latency: Fastest available
- Cost: $0.05/$0.15 per 1M tokens (cheapest)
- Use case: Ultra-simple queries to minimize queue risks during peaks

**Embeddings: Ollama (nomic-embed-text)**
- Latency: ~1 second (local on VPS)
- Cost: FREE (self-hosted)
- Dimensions: 768

---

## Verification Commands

```bash
# Build all packages
pnpm build

# Start backend server
pnpm start

# Start with debug logging
pnpm start:debug

# Start with clean database
pnpm cleanstart

# Test chat endpoint
curl -X POST 'http://localhost:3004/Wisdom/message' \
  -F 'text=Hello' \
  -F 'user=test'

# Test health endpoint
curl http://localhost:3005/health

# Test agent insights
curl http://localhost:3004/agents/insights

# Test Ollama embeddings
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "test"}'

# Check PM2 status
pm2 status familexyz-agent
```

---

## Next Steps

1. **Frontend** — Build separate frontend repository (TBD)
2. **Telegram Integration** — Real Telegram bot with grammy
3. **XMTP Integration** — Web3-native encrypted messaging
4. **Documentation** — API documentation with OpenAPI/Swagger

---

## Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** — Backend Core | ✅ Complete | Agent server, env config, health endpoints |
| **Phase 2** — Agent Messaging | ✅ Complete | Message handling, AG-UI, insights API |
| **Phase 3** — Payout System | ✅ Complete | Calculation, anomaly detection, HCS logging |
| **Phase 4** — Production | ✅ Complete | VPS deployment, model config, PM2 |

**All Phases Complete!** 🎉

---

## Monorepo Structure

```
familexyz/
├── agent/                      # Backend agent server
│   ├── src/
│   │   ├── index.ts           # Main entry point
│   │   ├── services/          # Core business logic
│   │   ├── integrations/      # External integrations
│   │   └── api/               # REST API handlers
│   └── data/                   # SQLite database
├── packages/
│   ├── agent/                  # @elizaos/agent-services (shared services)
│   ├── core/                   # @elizaos/core (core utilities)
│   ├── core-lite/              # @familexyz/core-lite (lightweight core)
│   ├── family/                 # Family-specific agents
│   │   ├── plugin-wisdom/      # Wisdom agent
│   │   ├── plugin-intimacy/   # Intimacy agent
│   │   ├── plugin-generational-bridge/
│   │   ├── plugin-presence/
│   │   ├── plugin-growth/
│   │   └── nlp-utils/          # NLP utilities
│   ├── blockchain/
│   │   └── hedera-core/       # Core Hedera services
│   ├── config/                # Shared configuration
│   ├── adapters/              # Database adapters
│   ├── clients/               # Platform clients (Telegram, XMTP)
│   └── auth/                  # Authentication services
├── docs/                       # Documentation
└── config/                     # Configuration files
```

---

## API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/:agentId/message` | POST | Send message to agent |
| `/:agentId/ag-ui` | POST | AG-UI protocol stream |
| `/agents/insights` | GET | All agents' insights |
| `/agents/:agentId/insights` | GET | Single agent insights |
| `/health` | GET | Health check (port 3005) |
| `/api/status` | GET | Full system status |

### Payout Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/:agentId/payouts` | GET | Agent payout history |
| `/api/agents/:agentId/performance` | GET | Agent performance |
| `/api/families/:familyId/payouts` | GET | Family payouts |
| `/api/payouts/pending` | GET | Pending payouts |
| `/api/payouts/calculate` | POST | Dry-run calculation |
| `/api/payouts/anomalies` | GET | Anomaly review |
| `/api/payouts/dispute` | POST | File dispute |

### Bond Score Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/families/:familyId/bond-score` | GET | Current + history |
