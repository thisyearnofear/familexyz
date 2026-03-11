# FamilyXYZ Development Roadmap

## Current Phase: MVP with Hedera Integration

### Completed ✅
- Basic family connection dashboard
- Agent character system with plugins
- Hedera wallet authentication setup
- Family treasury modal with balance display
- **Phase 4a: Objective Family Bond Scoring System**
  - Behavioral signal aggregation (7 metrics)
  - Composite Family Bond Score (0-100)
  - Weekly scheduler (Sundays 00:00 UTC)
  - Dashboard visualization
  - API endpoint: `GET /api/families/:familyId/bond-score`
- **Phase 4b: Agent Payout & Reward Distribution (Core Services)**
  - Payout formula engine
  - Anti-gaming anomaly detection
  - HCS immutable audit trail
  - Token distribution service
  - 154 tests passing
- **Phase 4b-UI: Payout UI ↔ Backend Wiring**
  - Vite dev proxy (`/api/*` → port 3001)
  - PayoutApiHandler connected to real Hedera env vars
  - PayoutDashboard integrated into Agents tab
  - Dry-run calculator, history, anomaly review UI
- **Phase 4b-DB: Payout SQLite Persistence**
  - Migration: `agent_payout_tracking` table
  - HederaPayoutLogger reads/writes SQLite with in-memory cache
  - Records survive server restarts
- **Agent Dashboard Integration**
  - Agents tab with all 5 agents (Chat / Payouts toggle)
  - Live insights endpoint: `GET /agents/insights` (DirectClient port 3000)
  - `useAgentInsights` hook fetches real-time agent runtime metrics
  - TeamConsensus card, AgentReaction badges
  - Notification dots on sidebar for each agent type

---

## Recent Updates (March 2026)

### ✅ HashConnect Removal - COMPLETED
- **Removed HashConnect** completely (not just deprecated)
- Now using **WalletConnect v2 as primary** and **Blade Wallet as fallback**
- Removed hashconnect npm package
- Updated `HederaAuthService.ts`, `types/index.ts`, `package.json`
- Build passes successfully

### ✅ A2A Protocol - Agent-to-Agent Trading - COMPLETED
- Created new package: `packages/family/a2a-protocol/`
- `AgentRegistry.ts` - Agent discovery and capability tracking
- `TradeExecutor.ts` - Execute trades with HCS audit trail
- Pre-registered 6 agents (wisdom, intimacy, presence, growth, generational-bridge, savings)
- Wired to agent plugins (wisdom, intimacy exports tools & insights)

### ✅ Enhanced Wallet Features - COMPLETED
- **Multi-wallet management** - Connect, switch, remove wallets
- **DEX Integration** - Token swap quotes and execution
- **Transaction History** - Filter, view, link to HashScan

### ✅ Smart Contracts - Treasury & DAO - COMPLETED
- Treasury contract deployment
- Treasury transactions and balance queries
- Governance DAO deployment
- Proposal submission, voting, execution

### ✅ Scaling & Caching - COMPLETED
- TTL cache in HederaService
- Cache invalidation methods
- Cache statistics

### ✅ Frontend Components - COMPLETED
- `MultiWalletSwitcher` - Wallet connection modal
- `TransactionHistory` - Transaction list with filters
- `DexSwapInterface` - Token swap UI
- `DAOProposalVoting` - Proposal creation and voting

---

### WalletConnect v2 as Primary Auth
- `autoConnect()` method: WalletConnect v2 first, Blade fallback
- Removed HashConnect feature flags
- ErrorBoundary around FamilyTreasuryModal

---

## Active Issues & Near-Term Fixes

### 1. Wallet Authentication (RESOLVED)
**Status:** HashConnect removed, WalletConnect v2 + Blade only

**Background:**
- HashConnect v3 is deprecated and was shut down in 2026
- **COMPLETED:** Fully migrated to WalletConnect v2 as primary
- **COMPLETED:** Added Blade Wallet as fallback
- Removed hashconnect npm package

**Current Setup:**
```
WalletConnect v2 ProjectId: 362a76563f2a3eca3d3c65661003d87b
Environment Variable: VITE_WALLETCONNECT_PROJECT_ID
```

**Files Modified:**
- `packages/auth/hedera-wallet/src/services/HederaAuthService.ts` - Core wallet service
- `packages/auth/hedera-wallet/src/types/index.ts` - Type definitions
- `packages/auth/hedera-wallet/src/index.ts` - Exports
- `packages/auth/hedera-wallet/package.json` - Dependencies

**What Works Now:**
- WalletConnect v2 detection and pairing
- Blade Wallet detection and connection
- Session management and caching
- Family creation/joining logic

**What Needs Verification:**
- [x] Test wallet connection with WalletConnect
- [x] Test transaction signing flow
- [x] Verify balance fetching from Mirror Node
- [x] Test with Blade Wallet
- [ ] Test with WalletConnect modal

---

## Medium-Term Roadmap (Q1 2025)

### 2. Full WalletConnect v2 Migration
**Priority:** HIGH (before HashConnect shutdown in 2026)
**Status:** Phase 3 complete — WalletConnect v2 is now the default

**Completed:**
- ✅ Phase 1: WalletConnect v2 added alongside HashConnect
- ✅ Phase 2: Both pathways tested in parallel
- ✅ Phase 3: WalletConnect v2 is default via `autoConnect()`
- ⬜ Phase 4: Remove HashConnect dependency (2025-2026)

**Feature Flags (in `HederaAuthConfig.featureFlags`):**
- `walletConnectPrimary` — default `true`
- `disableHashConnect` — default `false` (set `true` to fully disable)
- `autoConnectTimeoutMs` — default `15000`

### 3. Enhanced Wallet Features
- Token swapping and DEX integration
- Multi-wallet account management
- Wallet transaction history
- Real-time balance updates using Mirror Node subscriptions

---

## Long-Term Roadmap (2025+)

### 4. Agent Incentivization & Multi-Agent Marketplace (PRIORITY Q1 2025)
**Vision:** Agents autonomously compete to improve verifiable family bond metrics and earn FAM tokens for successful outcomes—creating aligned, outcome-based incentives.

**Phase 4c: A2A Protocol & Agent-to-Agent Trading** (Planned)
- Enable agents to trade resources autonomously:
  - Tool licensing: Intimacy Agent → Wisdom Agent (conflict frameworks)
  - Insight trading: Aggregated, privacy-preserved patterns ("Families with profile X respond to intervention Y")
  - Compute resources: Hedera consensus proof generation trades
  - Capability augmentation: Agents combine strengths
- Create on-chain A2A transaction log (immutable audit trail)
- Multi-agent collaboration improves overall family outcomes

### 5. Hedera Token Service (HTS) Integration
- Create and manage family tokens
- Token-based reward distribution (agent payouts + family incentives)
- NFT-based family member badges (milestones, engagement)
- Token governance for family decisions

### 6. Hedera Consensus Service (HCS)
- Family activity logging on-chain
- Immutable family records
- Distributed decision-making logs
- Cross-family consensus protocols
- Agent performance & payout verification logs

### 7. Smart Contract Services
- Family treasury smart contracts
- Automated agent reward distribution (based on bond score)
- Multi-signature wallet contracts
- Governance DAOs per family
- Agent performance escrow (verify outcomes before releasing payments)

### 8. Scaling & Performance
- Optimize Mirror Node queries
- Implement caching layer for account data
- Batch transaction processing
- Real-time WebSocket updates

---

## Dependencies & External References

### Hedera Stack
- `@hashgraph/sdk` - Hedera protocol SDK
- `hashconnect@3.0.13` - ⚠️ DEPRECATED (shutdown by 2026)
- `@walletconnect/sign-client` - WalletConnect v2
- `@walletconnect/utils` - WalletConnect utilities

### Wallet Support
- **HashPack** - Primary wallet (supports HashConnect)
- **Blade Wallet** - Secondary wallet (Hedera-native)
- **WalletConnect** - Protocol-based connection

### Documentation
- [HashConnect NPM Docs](https://www.npmjs.com/package/hashconnect)
- [Hedera Docs](https://docs.hedera.com/)
- [WalletConnect Docs](https://docs.reown.com/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)

---

## Configuration Reference

### Required Environment Variables
```bash
# WalletConnect v2 Configuration
VITE_WALLETCONNECT_PROJECT_ID=362a76563f2a3eca3d3c65661003d87b

# Hedera Network Configuration
VITE_HEDERA_NETWORK=testnet

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

### Issue: Pairing Modal Not Appearing
**Cause:** HashConnect service not initialized before connection attempt
**Solution:** Ensure `await authService.initialize()` is called in React Provider
**Status:** ✅ FIXED in latest provider update

---

## Testing Checklist

- [ ] Unit tests for HederaAuthService
- [ ] Integration tests for wallet pairing
- [ ] E2E tests for full transaction flow
- [ ] Browser extension compatibility tests
- [ ] Multi-wallet cross-compatibility tests
- [ ] Testnet vs Mainnet configuration tests

---

**Last Updated:** March 2026
**Next Milestone:** Phase 4c A2A Protocol & Agent-to-Agent Trading
**Next Review:** April 2026
