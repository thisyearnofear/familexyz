# FamilyXYZ Development Roadmap

## Current Phase: Backend-Only API Server 🚀

### 🎯 Active Focus: Backend Production Readiness
**Status:** Complete | **Priority:** HIGH

---

## Completed ✅

### Phase 1: Backend Core Setup ✅ COMPLETED
**Status:** Complete

#### 1a. Agent Server Structure ✅
- Modular agent architecture
- REST API on port 3004
- Health endpoint on port 3005

#### 1b. Environment Configuration ✅
- Grok AI API (primary)
- Venice AI API (fallback)
- Ollama embeddings (free)
- Hedera credentials

#### 1c. Health & Status Endpoints ✅
- `GET /health` - Basic health check
- `GET /api/status` - Full system status

---

### Phase 2: Agent Messaging ✅ COMPLETED
**Status:** Complete

#### 2a. Agent Message Handling ✅
- `POST /:agentId/message` - Send message to agent
- Agent routing based on agentId
- Response streaming support

#### 2b. AG-UI Protocol ✅
- `POST /:agentId/ag-ui` - SSE stream
- Event types: RunStarted, StepStarted, TextMessageContent, StateSnapshot
- JSON Patch RFC 6902 for state deltas

#### 2c. Agent Insights API ✅
- `GET /agents/insights` - All agents' insights
- `GET /agents/:agentId/insights` - Single agent insights
- Real-time data from runtime metadata

---

### Phase 3: Payout System ✅ COMPLETED
**Status:** Complete

#### 3a. Payout Calculation Engine ✅
- Base rate: $50 × score delta
- Performance multiplier: 1.0-1.5x
- Recency weight: 0.8-1.0
- Weekly caps enforcement

#### 3b. Anomaly Detection ✅
- Suspicious large jumps detection
- Unrealistic perfection detection
- Rapid consecutive improvements detection
- Cooling period management

#### 3c. Payout API Endpoints ✅
- `GET /api/agents/:agentId/payouts`
- `GET /api/agents/:agentId/performance`
- `GET /api/families/:familyId/payouts`
- `GET /api/payouts/pending`
- `POST /api/payouts/calculate`

#### 3d. HCS Audit Trail ✅
- Payout records logged to HCS Topic
- SQLite persistence
- Dual-layer cache

---

### Phase 4: Production Deployment ✅ COMPLETED
**Status:** Complete

#### 4a. Server Configuration ✅
- `SERVER_PORT=3004`
- `HEALTH_PORT=3005`
- Nginx reverse proxy with HTTPS
- CORS configuration

#### 4b. Model Configuration ✅
- Grok 4.1 Fast (primary)
- Venice qwen3-4b (fallback)
- Ollama nomic-embed-text (embeddings)

#### 4c. PM2 Process Management ✅
- Process management with ecosystem.config.cjs
- Auto-restart on failure
- Log rotation

---

## Legacy Phases (Pre-Backend-Only) ✅

#### Hedera Integration Foundation
- Basic agent runtime
- Agent character system with plugins
- Hedera wallet authentication setup
- Hedera service integration

#### Objective Family Bond Scoring System
- Behavioral signal aggregation (7 metrics)
- Composite Family Bond Score (0-100)
- Weekly scheduler (Sundays 00:00 UTC)
- API endpoint: `GET /api/families/:familyId/bond-score`

#### Agent Payout & Reward Distribution
- Payout formula engine
- Anti-gaming anomaly detection
- HCS immutable audit trail
- Token distribution service
- Full API integration

#### A2A Protocol - Agent-to-Agent Trading
- Agent registry with capability tracking
- Trade executor with HCS audit trail
- Pre-registered agents

#### Scaling & Caching
- TTL cache in HederaService
- Cache invalidation and statistics

---

## Active Issues & Near-Term Fixes

### 1. Frontend Removal ✅ RESOLVED
**Status:** Frontend removed, backend-only repository

- Old Vite/React frontend deleted
- New Next.js frontend structure added but not finalized
- Repository now focused on backend API only

---

## Future Roadmap (Backend Extensions)

### Phase 5: Messaging Integrations 🔄 PLANNED
**Priority:** MEDIUM | **Status:** Planned

#### 5a. Telegram Integration ⬜
Create `packages/clients/telegram/`:
- Real Telegram bot with grammy
- Slash commands: `/start`, `/agents`, `/ask`, `/status`
- Group mapper: Telegram group ID → familyId

#### 5b. XMTP Integration ⬜
Create `packages/clients/xmtp/`:
- Web3-native encrypted messaging
- Agent identities derived from Hedera keys
- 1:1 and group conversation management

#### 5c. On-Chain Message Receipts ⬜
- Log content hash to HCS for messages
- Verifiable record without revealing content

---

### Phase 6: Hedera Deep Integration 🔄 PLANNED
**Priority:** MEDIUM | **Status:** Planned

#### 6a. Hedera Token Service (HTS) Integration ⬜
- Create and manage family tokens
- Token-based reward distribution
- NFT-based family member badges
- Token governance for family decisions

#### 6b. Hedera Consensus Service (HCS) Deep Integration ⬜
- Family activity logging on-chain
- Immutable family records
- Agent performance & payout verification logs
- Cross-family consensus protocols

#### 6c. Smart Contract Services ⬜
- Family treasury smart contracts
- Automated agent reward distribution
- Multi-signature wallet contracts
- Governance DAOs per family
- Agent performance escrow

---

### Phase 7: API Enhancements 🔄 PLANNED
**Priority:** LOW | **Status:** Planned

#### 7a. OpenAPI Documentation ⬜
- Swagger/OpenAPI spec generation
- Interactive API documentation
- Request/response examples

#### 7b. Rate Limiting & Throttling ⬜
- Per-endpoint rate limits
- Request throttling
- Quota management

#### 7c. WebSocket Support ⬜
- Real-time agent updates
- Push notifications
- Live bond score updates

---

### Phase 8: Platform & Marketplace 🔄 PLANNED
**Priority:** HIGH | **Status:** Planned

*Vision: Transform FamilyXYZ from a product into a platform where practitioners distribute research-backed agents to families.*

#### 8a. Agent Marketplace ⬜
- Creator profiles with credentials
- Research-backed agent descriptions
- Family ratings & reviews
- Subscription or one-time access

#### 8b. Practitioner Tier ⬜
- Practitioner accounts with client management
- Outcome analytics (aggregated, anonymized)
- Research-backed agent curation

#### 8c. Enterprise Distribution ⬜
- Employer wellness benefit integration
- Family account licensing
- Usage dashboards (no content access)

#### 8d. Trust Layer ⬜
- Creator credential verification
- Research citation requirements
- Immutable audit trail for agent actions
- On-chain verification of family milestones

---

## Competitive Positioning

### Market Gap
No platform occupies: **Research-Backed + Blockchain-Verified + Family-Focused + Marketplace**

| Competitor | Family Focus | Marketplace | Research-Backed | Blockchain |
|------------|:------------:|:-----------:|:--------------:|:---------:|
| Replika | Individual | ❌ | ❌ | ❌ |
| Relish | Couples | ❌ | ✅ | ❌ |
| BetterHelp | Individual | ✅ Human | ✅ | ❌ |
| Character.AI | Individual | ✅ AI | ❌ | ❌ |
| **FamilyXYZ** | ✅ Core | 🔜 | ✅ | ✅ |

### Unfair Advantages
1. **Multi-agent family coordination** — No competitor coordinates multiple AI agents across a family unit
2. **Hedera-verified "Wisdom Blocks"** — Immutable audit trail creates trust layer competitors lack
3. **HCS-10 compliant messaging** — Interoperability with Hedera ecosystem
4. **FAM token incentive system** — On-chain economy of emotional wealth
5. **Practitioner-to-family distribution** — Network effects (creators → families → creators)

### Brand Positioning
**"The emotional intelligence platform for families"** — Consumer + practitioners served by same platform.

- Families get expert-curated agents (better than generic AI)
- Practitioners get distribution + monetization
- Enterprise gets "family wellness benefits" they can offer

---

## Dependencies & External References

### LLM Providers
- **Grok AI** — Primary chat model (very fast, high quality)
- **Venice AI** — Fallback chat model (cheap)
- **Ollama** — Self-hosted embeddings (free)

### Blockchain
- **Hedera SDK** — Blockchain integration
- **HCS-10** — Consensus message standard
- **HTS** — Token service

### Messaging (Planned)
- **grammy** — Telegram bot framework
- **XMTP** — Encrypted messaging protocol

### Documentation
- [Hedera Docs](https://docs.hedera.com/)
- [Grok API Docs](https://docs.x.ai/)
- [Venice AI Docs](https://venice.ai/docs)
- [grammy Docs](https://grammy.dev/)
- [XMTP Docs](https://xmtp.org/docs)

---

## Configuration Reference

### Required Environment Variables
```bash
# Server Configuration
SERVER_PORT=3004
HEALTH_PORT=3005

# Grok AI (Primary)
GROK_API_KEY=your_grok_api_key
SMALL_GROK_MODEL=grok-4-1-fast
MEDIUM_GROK_MODEL=grok-4-1-fast
LARGE_GROK_MODEL=grok-4-1-fast

# Venice AI (Fallback)
VENICE_API_KEY=your_venice_key
SMALL_VENICE_MODEL=qwen3-4b

# Ollama (Embeddings)
USE_OLLAMA_EMBEDDING=true
OLLAMA_SERVER_URL=http://localhost:11434

# Hedera Network
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=your_operator_id
HEDERA_OPERATOR_KEY=your_operator_key

# CORS
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## Testing Checklist

### Backend Verification ✅
- [x] Server starts on port 3004
- [x] Health endpoint responds on port 3005
- [x] Agent message endpoint works
- [x] Agent insights endpoint returns data
- [x] Payout calculation endpoint works
- [x] Bond score endpoint returns data

### Integration Verification (Planned)
- [ ] Telegram bot connection and commands
- [ ] XMTP client initialization
- [ ] HCS message logging verification
- [ ] Hedera token transfer verification

---

**Last Updated:** May 30, 2026
**Current Phase:** Backend-Only API Server
**Next Milestone:** Phase 8 — Platform & Marketplace
**Next Review:** Bounty submission (May 31)
