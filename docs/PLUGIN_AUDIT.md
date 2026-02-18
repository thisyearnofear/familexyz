# Plugin Packages Audit

## Overview

FamilyXYZ includes a comprehensive plugin ecosystem with 83+ packages. This audit documents the purpose, status, and relevance of each plugin category.

## Core Packages (Required)

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/core` | Core ElizaOS functionality | ✅ Required |
| `packages/agent` | Agent runtime | ✅ Required |
| `packages/config` | Configuration management | ✅ Required |
| `packages/clients/direct` | Direct client for API | ✅ Required |

## Family-Specific Plugins (Core Product)

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/family/plugin-wisdom` | Wisdom agent | ✅ Active |
| `packages/family/plugin-intimacy` | Intimacy agent | ✅ Active |
| `packages/family/plugin-generational-bridge` | Generational bridge agent | ✅ Active |
| `packages/family/plugin-presence` | Presence agent | ✅ Active |
| `packages/family/plugin-growth` | Growth agent | ✅ Active |
| `packages/family/nlp-utils` | NLP utilities | ✅ Active |
| `packages/family/metrics` | Metrics tracking | ✅ Active |

## Blockchain Plugins (Hedera Integration)

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/blockchain/hedera-core` | Core Hedera services | ✅ Required |
| `packages/blockchain/plugin-hedera-template` | Hedera plugin template | ✅ Active |

## Authentication

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/auth/hedera-wallet` | Hedera wallet connection | ✅ Active |

## AI/LLM Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/plugin-openai` | OpenAI integration | ✅ Active |
| `packages/plugin-node` | Node plugin for runtime | ✅ Active |

## Blockchain Network Plugins (Optional)

### Layer 1 Blockchains
- `plugin-solana` - Solana integration
- `plugin-aptos` - Aptos integration
- `plugin-near` - NEAR integration
- `plugin-icp` - Internet Computer
- `plugin-ton` - TON blockchain
- `plugin-cosmos` - Cosmos ecosystem
- `plugin-starknet` - Starknet L2
- `plugin-sui` - Sui blockchain
- `plugin-multiversx` - MultiversX

### EVM Chains
- `plugin-evm` - Generic EVM support
- `plugin-avalanche` - Avalanche
- `plugin-bnb` - BNB Chain
- `plugin-abstract` - Abstract Chain
- `plugin-arthera` - Arthera
- `plugin-b2` - B2 Network
- `plugin-conflux` - Conflux
- `plugin-cronos` - Cronos
- `plugin-cronoszkevm` - Cronos zkEVM
- `plugin-initia` - Initia
- `plugin-injective` - Injective
- `plugin-movement` - Movement Labs
- `plugin-quai` - Quai Network
- `plugin-zksync-era` - zkSync Era

### Other Chains
- `plugin-0g` - 0G Network
- `plugin-akash` - Akash Network
- `plugin-allora` - Allora
- `plugin-avail` - Avail
- `plugin-fuel` - Fuel Network
- `plugin-hyperliquid` - Hyperliquid
- `plugin-irys` - Irys
- `plugin-lensNetwork` - Lens Network
- `plugin-massa` - Massa
- `plugin-story` - Story Protocol

## DeFi/Trading Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-birdeye` | Birdeye price data | Optional |
| `plugin-coinbase` | Coinbase integration | Optional |
| `plugin-coingecko` | CoinGecko data | Optional |
| `plugin-coinmarketcap` | CMC data | Optional |
| `plugin-dexscreener` | DEX data | Optional |
| `plugin-rabbi-trader` | Trading bot | Optional |
| `plugin-router-nitro` | Router protocol | Optional |
| `plugin-squid-router` | Cross-chain swaps | Optional |
| `plugin-hyperliquid` | Hyperliquid trading | Optional |

## Data Provider Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-chainbase` | Chainbase data | Optional |
| `plugin-pyth-data` | Pyth oracle data | Optional |
| `plugin-web-search` | Web search capability | Optional |
| `plugin-open-weather` | Weather data | Optional |
| `plugin-giphy` | GIF search | Optional |
| `plugin-gitbook` | GitBook integration | Optional |

## Media Generation Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-image-generation` | Image creation | Optional |
| `plugin-video-generation` | Video creation | Optional |
| `plugin-3d-generation` | 3D content | Optional |
| `plugin-nft-generation` | NFT creation | Optional |
| `plugin-nft-collections` | NFT data | Optional |

## Communication Platform Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `packages/clients/discord` | Discord bot | Optional |
| `packages/clients/telegram` | Telegram bot (see agent/src/integrations/telegram.ts) | Optional |
| `packages/clients/slack` | Slack bot | Optional |
| `packages/clients/twitter` | Twitter/X bot | Optional |
| `packages/clients/whatsapp` | WhatsApp integration | Optional |
| `packages/clients/instagram` | Instagram DM | Optional |
| `packages/clients/farcaster` | Farcaster | Optional |
| `packages/clients/lens` | Lens Protocol | Optional |
| `packages/clients/github` | GitHub integration | Optional |

## Security/TEE Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-tee` | Trusted Execution Environment | Optional |
| `plugin-tee-log` | TEE logging | Optional |
| `plugin-tee-marlin` | Marlin TEE | Optional |
| `plugin-tee-verifiable-log` | Verifiable logs | Optional |
| `plugin-sgx` | Intel SGX | Optional |
| `plugin-dkg` | Distributed Key Generation | Optional |

## Utility Plugins

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-bootstrap` | Bootstrap utilities | Optional |
| `plugin-tts` | Text-to-speech | Optional |
| `plugin-email` | Email integration | Optional |
| `plugin-obsidian` | Obsidian notes | Optional |
| `plugin-gooddollar` | GoodDollar UBI | Active (see integrations) |

## AI Agent Frameworks

| Package | Purpose | Status |
|---------|---------|--------|
| `plugin-agentkit` | Agent kit | Optional |
| `plugin-goat` | GOAT integration | Optional |
| `plugin-autonome` | Autonome | Optional |
| `plugin-devin` | Devin integration | Optional |

## Recommendations

### Keep Active
1. All `packages/family/*` - Core product
2. `packages/blockchain/hedera-core` - Required for Hedera
3. `packages/plugin-openai` - Primary LLM
4. `packages/plugin-node` - Runtime required

### Review for Removal
1. Unused blockchain plugins (chains not integrated)
2. Unused platform clients (if not planning multi-platform)
3. TEE plugins (if not using TEE infrastructure)

### Potential Consolidation
1. Multiple EVM chain plugins could be consolidated into generic EVM plugin
2. Multiple oracle/data plugins could be consolidated
3. Multiple TEE plugins could be merged

## Statistics

- **Total Packages**: 83+
- **Core Required**: ~5
- **Family Product**: 7
- **Blockchain**: 40+
- **Communication**: 11
- **Utility**: 15+
- **Media/Generation**: 4

## Next Steps

1. Audit actual import usage across codebase
2. Identify packages with zero imports
3. Create deprecation plan for unused packages
4. Document which packages are production-ready vs experimental