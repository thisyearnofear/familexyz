# Wallet Testing Guide

Manual testing steps for Hedera wallet integrations on testnet.

## Prerequisites

- Node.js 22+, pnpm 9+
- Backend running: `pnpm --filter agent start`
- Frontend running: `pnpm start:client`
- Hedera testnet credentials in `.env`:
  ```
  HEDERA_OPERATOR_ID=0.0.6511978
  HEDERA_OPERATOR_KEY=<your-key>
  HEDERA_NETWORK=testnet
  VITE_WALLETCONNECT_PROJECT_ID=362a76563f2a3eca3d3c65661003d87b
  ```

---

## Test 1: HashPack Connection

**Requires:** [HashPack Chrome Extension](https://www.hashpack.app/)

1. Install HashPack extension and create/import a testnet account
2. Fund account via [Hedera Portal Faucet](https://portal.hedera.com/faucet)
3. Open dashboard at `http://localhost:5173`
4. Click **Treasury** button in the header
5. Click **Connect HashPack Wallet**
6. HashPack pairing modal should appear
7. Approve the connection in HashPack

**Verify:**
- [ ] Pairing modal opens correctly
- [ ] Account ID appears after connection
- [ ] HBAR balance loads from Mirror Node
- [ ] Disconnect button works
- [ ] Reconnecting restores session

---

## Test 2: Blade Wallet Connection

**Requires:** [Blade Wallet Chrome Extension](https://bladewallet.io/)

1. Install Blade extension and create a testnet account
2. Fund via faucet
3. Open dashboard → Treasury → Connect
4. Select Blade wallet option (if multiple wallets detected)

**Verify:**
- [ ] Blade wallet detected by `HederaAuthService.detectAvailableWallets()`
- [ ] Connection flow completes
- [ ] Balance displays correctly

---

## Test 3: WalletConnect Modal

**Requires:** Any WalletConnect-compatible Hedera wallet (e.g. HashPack mobile)

1. Open dashboard → Treasury → Connect
2. If HashPack extension is not installed, WalletConnect QR modal should appear
3. Scan QR code with HashPack mobile app
4. Approve connection

**Verify:**
- [ ] QR code modal renders
- [ ] Connection completes via WalletConnect v2
- [ ] Account ID and balance load correctly

---

## Test 4: Transaction Signing

1. Connect wallet (any method above)
2. Run simulation: `npx tsx scripts/simulate_family.ts`
3. If the simulation triggers a token transfer, the wallet should prompt for signature

**Verify:**
- [ ] Transaction signing prompt appears in wallet
- [ ] Signing succeeds and transaction ID is returned
- [ ] Transaction visible on [HashScan testnet](https://hashscan.io/testnet/)

---

## Test 5: Balance Fetching

1. Connect wallet
2. Check Treasury modal displays balance
3. Verify balance matches HashScan: `https://hashscan.io/testnet/account/<account-id>`

**Verify:**
- [ ] Balance matches Mirror Node data
- [ ] Balance updates after transactions
- [ ] Error handling if Mirror Node is unreachable

---

## Test 6: Error Handling

1. **No wallet installed:** Open Treasury modal without any wallet extension installed
   - Should show helpful error message, not crash
2. **Reject pairing:** Start connection then reject in wallet
   - Should reset to disconnected state
3. **Network mismatch:** Try connecting with mainnet wallet to testnet app
   - Should show appropriate error

**Verify:**
- [ ] ErrorBoundary catches wallet component crashes
- [ ] User-friendly error messages shown
- [ ] App remains functional after wallet errors

---

## Relevant Files

- `packages/auth/hedera-wallet/src/services/HederaAuthService.ts` — Core wallet service
- `packages/auth/hedera-wallet/src/react/HederaAuthProvider.tsx` — React provider & Zustand store
- `client/src/components/dashboard/FamilyTreasuryModal.tsx` — Treasury UI
- `client/src/components/connection-status.tsx` — Sidebar connection indicator
- `client/src/main.tsx` — Config initialization

## Known Issues

- HashConnect v3 is **deprecated** and will be shut down by 2026
- WalletConnect v2 migration is planned but not yet the default path
- `VITE_WALLETCONNECT_PROJECT_ID` must be a valid v2 project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
