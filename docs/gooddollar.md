GoodDollar Integration

Overview
- Adds a privacy-first server service exposing minimal endpoints for wallet balance, claim status, and a stubbed claim flow.
- Client includes simple tiles for entering a wallet address, viewing balance, and checking daily UBI eligibility.

Environment Variables
- `GD_CHAIN_ID`: Target chain ID for GoodDollar network (e.g., `122` for Fuse).
- `GD_TOKEN_ADDRESS`: ERC-20 address of GoodDollar token (`G$`).
- `GD_UBI_CONTRACT`: Address of the UBI/claim contract providing `canClaim`/`claim`.
- `GD_RPC_URLS`: Comma-separated RPC endpoints, prioritized left to right.
- `GD_RPC_TIMEOUT_MS`: Timeout in milliseconds for RPC calls (default `8000`).
- `GD_PRIVACY_LOGGING`: `true`/`false` to enable minimal, consent-aware logs (default `false`).

Server Endpoints
- `GET /gooddollar/wallet/:address`: Returns `{ balance, symbol }` for the provided address.
- `GET /gooddollar/status/:address`: Returns `{ canClaim, nextClaimAt }` eligibility info.
- `POST /gooddollar/claim`: Placeholder for claim initiation; extend with signature-based flow.

Privacy Defaults
- The server never stores wallet addresses; requests are processed on-demand.
- Enable `GD_PRIVACY_LOGGING=true` to log sanitized events without PII.

Client Usage
- Open Family Dashboard and enter a wallet address in the GoodDollar card.
- Use `Claim UBI` once eligibility is `Yes`; refresh to verify updates.

Next Steps
- Wire `claim` with contract interaction and signature-based authorization.
- Add optional identity verification flow on the client; enforce on server.