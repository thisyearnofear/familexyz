# FamilyXYZ Development Roadmap

## Current Phase: MVP with Hedera Integration

### Completed ✅
- Basic family connection dashboard
- Agent character system with plugins
- Hedera wallet authentication setup (HashConnect v3)
- Family treasury modal with balance display

---

## Active Issues & Near-Term Fixes

### 1. Hedera Wallet Authentication (IN PROGRESS)
**Status:** HashConnect integration working, requires WalletConnect v2 projectId

**Background:**
- HashConnect v3 is deprecated and will be shut down by 2026
- HashConnect now requires a valid WalletConnect v2 projectId to function
- Current implementation uses HashConnect for wallet pairing and transaction signing

**Current Setup:**
```
WalletConnect v2 ProjectId: 362a76563f2a3eca3d3c65661003d87b
Environment Variable: VITE_WALLETCONNECT_PROJECT_ID
```

**Files Involved:**
- `packages/auth/hedera-wallet/src/services/HederaAuthService.ts` - Core wallet service
- `packages/auth/hedera-wallet/src/react/HederaAuthProvider.tsx` - React provider
- `client/src/main.tsx` - Config initialization
- `.env` - Wallet credentials

**What Works Now:**
- Wallet detection (HashPack, Blade, WalletConnect)
- Pairing modal opens correctly
- Session management and caching
- Family creation/joining logic

**What Needs Verification:**
- [ ] Test wallet connection with actual HashPack extension
- [ ] Test transaction signing flow
- [ ] Verify balance fetching from Mirror Node
- [ ] Test with Blade Wallet
- [ ] Test with WalletConnect modal

---

## Medium-Term Roadmap (Q1 2025)

### 2. Full WalletConnect v2 Migration
**Priority:** HIGH (before HashConnect shutdown in 2026)

**Plan:**
1. Implement WalletConnect v2 as primary authentication method
2. Keep HashConnect v3 as fallback during transition period
3. Dual-stack support for both wallet protocols
4. Feature flag to disable HashConnect if needed

**Migration Steps:**
```typescript
// Phase 1: Add WalletConnect v2 alongside HashConnect
// Phase 2: Test both pathways in parallel
// Phase 3: Make WalletConnect v2 default
// Phase 4: Remove HashConnect dependency (2025-2026)
```

**Files to Refactor:**
- `HederaAuthService.ts` - Add WalletConnect v2 initialization
- `connectHashPack()` method - Create `connectWalletConnect()` alternative
- Type definitions - Support both SDK types

### 3. Enhanced Wallet Features
- Token swapping and DEX integration
- Multi-wallet account management
- Wallet transaction history
- Real-time balance updates using Mirror Node subscriptions

---

## Long-Term Roadmap (2025+)

### 4. Hedera Token Service (HTS) Integration
- Create and manage family tokens
- Token-based reward distribution
- NFT-based family member badges
- Token governance for family decisions

### 5. Hedera Consensus Service (HCS)
- Family activity logging on-chain
- Immutable family records
- Distributed decision-making logs
- Cross-family consensus protocols

### 6. Smart Contract Services
- Family treasury smart contracts
- Automated reward distribution
- Multi-signature wallet contracts
- Governance DAOs per family

### 7. Scaling & Performance
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

## Notes for Contributors

When working on wallet-related features:
1. Check if changes affect both HashConnect and WalletConnect paths
2. Add appropriate deprecation warnings for HashConnect code
3. Update this roadmap when significant progress is made
4. Test with actual wallet extensions, not just mocks
5. Refer to official Hedera and WalletConnect documentation

---

**Last Updated:** November 22, 2025
**Next Review:** December 2025
