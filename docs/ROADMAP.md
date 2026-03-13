# FamilyXYZ Development Roadmap

## Current Phase: Production Readiness 🚀

### 🎯 Active Focus: Phase 2 — Telegram Real Integration
**Status:** In Progress | **Priority:** HIGH

---

## Completed ✅

### Phase 1: Frontend Production Polish ✅ COMPLETED
**Commit:** `0811907a` | **Files:** 25 | **Changes:** +658/-411

#### 1a. Theme Resolution — Dark Mode ✅
- Migrated 89+ hardcoded light color references to semantic Tailwind tokens
- Updated 20+ components across dashboard, tabs, and family components
- Consistent dark theme throughout application

#### 1b. Mobile Bottom Navigation ✅
- Responsive `TabNavigation` with desktop (top) and mobile (bottom) layouts
- Fixed bottom bar with 4 primary tabs + "More" overflow
- Consolidated 8 tabs → 7 tabs (merged Bond Score into Insights)

#### 1c. Real Notification Badges ✅
- Replaced hardcoded `"2"`/`"1"` badges with real agent insights data
- Added `useUnreadInsights()` hook with localStorage read/unread tracking

#### 1d. Query Caching Fix ✅
- Changed global `staleTime` from `POSITIVE_INFINITY` to `30_000` (30s)
- Queries now properly invalidate and refresh

#### 1e. Lightweight Family Network Visualization ✅
- Canvas2D as default (zero deps), Three.js opt-in via "View in 3D" button
- Removed unused `@react-three/postprocessing` (~300KB+ gzipped saved)

#### 1f. Basic Auth / Family Gating ✅
- Invite-code based authentication (6-char alphanumeric)
- SQLite storage, localStorage session persistence
- React context for familyId (replaces hardcoded `user: "user"`)

#### 1g. HTTPS / Production URL ✅
- Replaced hardcoded `http://157.180.36.156:3004` with env vars
- `VITE_API_BASE_URL` and `VITE_HEALTH_BASE_URL` configuration
- Same-origin fallback for flexible deployment

---

### Legacy Phases (Pre-Production Readiness) ✅

#### Hedera Integration Foundation
- Basic family connection dashboard
- Agent character system with plugins
- Hedera wallet authentication setup
- Family treasury modal with balance display

#### Phase 4a: Objective Family Bond Scoring System ✅
- Behavioral signal aggregation (7 metrics)
- Composite Family Bond Score (0-100)
- Weekly scheduler (Sundays 00:00 UTC)
- Dashboard visualization
- API endpoint: `GET /api/families/:familyId/bond-score`

#### Phase 4b: Agent Payout & Reward Distribution ✅
- Payout formula engine
- Anti-gaming anomaly detection
- HCS immutable audit trail
- Token distribution service
- 154 tests passing
- Full UI integration with dry-run calculator, history, anomaly review

#### Agent Dashboard Integration ✅
- Agents tab with all 5 agents (Chat / Payouts toggle)
- Live insights endpoint: `GET /agents/insights`
- `useAgentInsights` hook with real-time metrics
- TeamConsensus card, AgentReaction badges

#### HashConnect Removal ✅
- Removed HashConnect completely (deprecated, shutdown 2026)
- WalletConnect v2 as primary, Blade Wallet as fallback
- Removed hashconnect npm package

#### A2A Protocol - Agent-to-Agent Trading ✅
- Created `packages/family/a2a-protocol/`
- Agent registry with capability tracking
- Trade executor with HCS audit trail
- Pre-registered 6 agents

#### Enhanced Wallet Features ✅
- Multi-wallet management
- DEX token swap integration
- Transaction history

#### Smart Contracts - Treasury & Governance DAOs ✅
- Treasury contract deployment and transactions
- Governance DAO deployment, proposal voting, execution

#### Scaling & Caching ✅
- TTL cache in HederaService
- Cache invalidation and statistics

---

## Active Issues & Near-Term Fixes

### 1. Wallet Authentication ✅ RESOLVED
**Status:** HashConnect removed, WalletConnect v2 + Blade only

- HashConnect v3 deprecated and shut down in 2026
- Fully migrated to WalletConnect v2 as primary
- Blade Wallet as fallback
- Removed hashconnect npm package

**Current Setup:**
```
WalletConnect v2 ProjectId: 362a76563f2a3eca3d3c65661003d87b
Environment Variable: VITE_WALLETCONNECT_PROJECT_ID
```

---

## Production Readiness Roadmap (Q1 2026)

### Phase 1: Frontend Production Polish ✅ COMPLETED
**Commit:** `0811907a` | **Files:** 25 | **Changes:** +658/-411

All Phase 1 sub-tasks complete:
- ✅ 1a: Theme resolution (dark mode commitment)
- ✅ 1b: Mobile bottom navigation (4 primary + "More")
- ✅ 1c: Real notification badges (agent insights data)
- ✅ 1d: Query caching fix (staleTime: 30s)
- ✅ 1e: Lightweight family network viz (Canvas2D default)
- ✅ 1f: Basic auth / family gating (invite codes)
- ✅ 1g: HTTPS / production URL (env vars)

---

### Phase 2: Telegram Real Integration 🔄 IN PROGRESS
**Priority:** HIGH | **Status:** Starting

#### 2a. Shared Messaging Adapter Interface ⬜
Create `packages/family/messaging-core/`:
- `FamilyMessagingAdapter` interface
- Message router with NLP classification
- Shared types: `IncomingMessage`, `OutgoingMessage`, `ChannelStatus`

#### 2b. Telegram Client Package ⬜
Create `packages/clients/telegram/` using grammy:
- `TelegramFamilyClient.ts` — Implements adapter interface
- Slash commands: `/start`, `/agents`, `/ask`, `/status`
- Group mapper: Telegram group ID → familyId

#### 2c. Replace Mock Endpoints ⬜
- Remove monkey-patch pattern in `agent/src/integrations/telegram.ts`
- Register Telegram as proper client alongside DirectClient
- REST endpoints become thin wrappers

#### 2d. Frontend: Real Telegram Status ⬜
- Wire `TelegramSetup.tsx` to real endpoints
- Show actual bot status, group list, agent config

---

### Phase 3: XMTP Integration ⬜ PENDING
**Priority:** MEDIUM | **Status:** Not Started

#### 3a. XMTP Client Package ⬜
Create `packages/clients/xmtp/`:
- `XmtpFamilyClient.ts` — Implements adapter interface
- Agent identities derived from Hedera keys
- 1:1 and group conversation management

#### 3b. Web Dashboard XMTP Chat ⬜
- `XmtpChat.tsx` component
- Toggle: "Direct" vs "XMTP (Encrypted)"

#### 3c. On-Chain Message Receipts ⬜
- Log content hash to HCS for XMTP messages
- Verifiable record without revealing content

---

## Long-Term Roadmap (2026+)

### 4. Hedera Token Service (HTS) Integration ⬜
- Create and manage family tokens
- Token-based reward distribution
- NFT-based family member badges
- Token governance for family decisions

### 5. Hedera Consensus Service (HCS) Deep Integration ⬜
- Family activity logging on-chain
- Immutable family records
- Agent performance & payout verification logs
- Cross-family consensus protocols

### 6. Smart Contract Services ⬜
- Family treasury smart contracts (foundation complete)
- Automated agent reward distribution
- Multi-signature wallet contracts
- Governance DAOs per family (foundation complete)
- Agent performance escrow

### 7. A2A Protocol Enhancement ⬜
**Vision:** Agents autonomously trade resources to improve family outcomes
- Tool licensing between agents
- Insight trading (privacy-preserved patterns)
- Compute resource trades (Hedera consensus proofs)
- Capability augmentation
- On-chain A2A transaction log

### 8. Scaling & Performance ⬜
- Optimize Mirror Node queries
- Implement caching layer (foundation complete)
- Batch transaction processing
- Real-time WebSocket updates

---

## Dependencies & External References

### Hedera Stack
- `@hashgraph/sdk` — Hedera protocol SDK
- `@walletconnect/sign-client` — WalletConnect v2
- `@walletconnect/utils` — WalletConnect utilities

### Messaging (Planned)
- `grammy` — Telegram bot framework (lighter than telegraf)
- `@xmtp/js-sdk` — XMTP v3 encrypted messaging

### Wallet Support
- **WalletConnect v2** — Primary connection method
- **Blade Wallet** — Secondary (Hedera-native)
- **HashPack** — Via WalletConnect

### Documentation
- [Hedera Docs](https://docs.hedera.com/)
- [WalletConnect Docs](https://docs.reown.com/)
- [grammy Docs](https://grammy.dev/)
- [XMTP Docs](https://xmtp.org/docs)

---

## Configuration Reference

### Required Environment Variables
```bash
# WalletConnect v2 Configuration
VITE_WALLETCONNECT_PROJECT_ID=362a76563f2a3eca3d3c65661003d87b

# Hedera Network Configuration
VITE_HEDERA_NETWORK=testnet

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_HEALTH_BASE_URL=http://localhost:3001

# Application URLs
VITE_URL=http://localhost:5173
```

### Development Mode
- Set `debug: true` in wallet config for enhanced logging
- Use `VITE_HEDERA_NETWORK=testnet` for development
- HashPack extension required for browser testing

---

## Known Issues & Workarounds

### Issue: "Unauthorized: invalid key" WebSocket Error
**Cause:** Invalid or missing WalletConnect projectId
**Solution:** Ensure `VITE_WALLETCONNECT_PROJECT_ID` is set to valid v2 projectId
**Reference:** https://cloud.walletconnect.com/

---

## Testing Checklist

### Phase 1 Verification ✅
- [x] Theme consistency across all components
- [x] Mobile navigation usability
- [x] Real notification badges display
- [x] Query invalidation working
- [x] 2D visualization renders
- [x] Family gate authentication flow
- [x] Environment variable configuration

### Phase 2 Verification (Pending)
- [ ] Unit tests for messaging adapter interface
- [ ] Telegram bot connection and commands
- [ ] Message routing to agents
- [ ] Frontend Telegram status integration
- [ ] Group mapping and onboarding flow

### Phase 3 Verification (Pending)
- [ ] XMTP client initialization
- [ ] Encrypted message send/receive
- [ ] Wallet-based identity derivation
- [ ] HCS message receipt logging

---

**Last Updated:** March 13, 2026
**Current Phase:** Phase 2 — Telegram Real Integration
**Next Milestone:** Phase 2a — Shared Messaging Adapter Interface
**Next Review:** Phase 2 Completion
