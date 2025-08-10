# @elizaos/plugin-gooddollar

GoodDollar G$ integration plugin for FamilyXYZ - Universal Basic Income rewards for positive family interactions.

## Overview

This plugin integrates the GoodDollar protocol into FamilyXYZ, enabling:
- **Universal Basic Income (UBI)** claiming for verified family members
- **G$ token transfers** using ERC677 transferAndCall functionality
- **Family reward systems** with automatic G$ distribution
- **Multi-chain support** for Celo and Fuse networks
- **Face verification** integration for sybil resistance
- **Superfluid streaming** for continuous family rewards

## Features

### 🪙 G$ Token Operations
- Transfer G$ tokens to family members with ERC677 transferAndCall
- Claim daily UBI rewards with eligibility validation
- Multi-chain wallet support (Celo/Fuse networks)
- Real-time balance tracking and transaction history

### 👨‍👩‍👧‍👦 Family Rewards System
- Automatic G$ rewards for positive family interactions
- Quality-based reward multipliers and bonuses
- Cross-generational engagement incentives
- Conflict resolution and wisdom-sharing rewards

### 🔐 Identity & Verification
- Face verification integration (FaceTec ZoOm 3D compatible)
- Advanced sybil resistance mechanisms
- Family relationship verification with role management
- Privacy-preserving identity with 90-day renewal cycles

### 🌊 Superfluid Streaming Rewards ✨ **NEW**
- **Family Allowances**: Real-time monthly/weekly G$ streaming to children
- **Milestone Rewards**: Goal-based streaming over custom timeframes  
- **Continuous Incentives**: Hourly rewards for positive behaviors
- **Stream Management**: Update, pause, or cancel streams anytime
- **Per-second precision**: Funds flow continuously, not in batches

## Installation

```bash
pnpm install @elizaos/plugin-gooddollar
```

## Configuration

Add these environment variables to your `.env` file:

```env
# Required
GOODDOLLAR_NETWORK=fuse                    # or 'celo'
GOODDOLLAR_TOKEN_ADDRESS=0x495d133B938596C9984d462F007B676bDc57eCEC
GOODDOLLAR_RPC_URL=https://rpc.fuse.io
GOODDOLLAR_PRIVATE_KEY=your_private_key_here

# Optional Features
GOODDOLLAR_ENABLE_UBI_CLAIM=true
GOODDOLLAR_ENABLE_FACE_VERIFICATION=false
GOODDOLLAR_ENABLE_STREAMING=false
GOODDOLLAR_SUPER_TOKEN_ADDRESS=0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f

# Face Verification (optional)
GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER=your_facetec_key
GOODDOLLAR_FACETEC_PRODUCTION_KEY=your_production_key

# GoodCollective (optional)
GOODDOLLAR_GOODCOLLECTIVE_API_URL=https://api.goodcollective.xyz

# Rewards (optional)
GOODDOLLAR_REWARD_MULTIPLIER=1.0
```

## Usage

### Basic Integration

```typescript
import { gooddollarPlugin } from "@elizaos/plugin-gooddollar";

// Add to your ElizaOS agent
const agent = new AgentRuntime({
  // ... other config
  plugins: [gooddollarPlugin],
});
```

### Using the Service

```typescript
import { GoodDollarService } from "@elizaos/plugin-gooddollar";

// Get the service from runtime
const gdService = runtime.getService<GoodDollarService>(GoodDollarService);

// Transfer G$ with custom data
const transaction = await gdService.transfer(
  "0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
  "10.0", // 10 G$
  "0x..." // Custom data for transferAndCall
);

// Claim UBI
const claimResult = await gdService.claimUBI();

// Get balance
const balance = await gdService.getBalance(walletAddress);
```

## Actions

### Core G$ Operations

#### Transfer G$ (`TRANSFER_GDOLLAR`)
Send G$ tokens to family members with contextual data.

**Natural Language Examples:**
- "Send 5 G$ to [address] for helping with homework"
- "Transfer 10 GoodDollar to my daughter"
- "Give 2.5 G$ to grandma for sharing stories"

#### Claim UBI (`CLAIM_UBI`)
Claim daily Universal Basic Income rewards.

**Natural Language Examples:**
- "Claim my daily UBI"
- "Get my basic income" 
- "Collect my G$ reward"

### Identity & Family Management

#### Verify Family Member (`VERIFY_FAMILY_MEMBER`)
Complete face verification and family role setup.

**Natural Language Examples:**
- "Verify me as a parent with wallet 0x1234..."
- "I need face verification to join my family"
- "Register as a grandparent with wallet [address]"

#### Family Status (`FAMILY_STATUS`)
View family verification status and member overview.

**Natural Language Examples:**
- "Show me our family verification status"
- "Who is verified in our family?"
- "Check family member eligibility"

### Streaming & Allowances ✨ **NEW**

#### Create Stream (`CREATE_STREAM`)
Set up continuous G$ streaming rewards.

**Natural Language Examples:**
- "Set up monthly allowance of 100 G$ for my child [address]"
- "Create milestone stream of 200 G$ over 30 days for completing chores"
- "Start continuous reward of 3 G$/hour for mindful behavior"

#### Manage Streams (`MANAGE_STREAMS`)
View, update, or cancel active streams.

**Natural Language Examples:**
- "Show my active streams"
- "Cancel stream [stream_id]"
- "Update stream rate to 5 G$/hour"

## Providers

### Wallet Provider (`gdollarWalletProvider`)
Comprehensive wallet information display:
- Real-time G$ balance and SuperToken balance
- Multi-chain network status (Celo/Fuse)
- Recent transaction history with context
- UBI claim eligibility and timing
- Verification status and expiry tracking

### Identity Provider (`identityProvider`) ✨ **NEW**
Family identity and verification management:
- Individual verification status and confidence scores
- Family relationship mapping and roles
- Sybil resistance status and uniqueness verification
- Privacy and security information display
- Next action recommendations for verification

### Streaming Provider (`streamingProvider`) ✨ **NEW**
Real-time streaming status and management:
- Active stream overview with flow rates
- Incoming vs outgoing stream breakdown
- Estimated earnings (hourly/daily/monthly)
- Stream management options and IDs
- Superfluid protocol integration status

## Network Support

### Fuse Network (Default)
- Chain ID: 122
- RPC: https://rpc.fuse.io
- G$ Token: `0x495d133B938596C9984d462F007B676bDc57eCEC`
- Explorer: https://explorer.fuse.io

### Celo Mainnet
- Chain ID: 42220  
- RPC: https://forno.celo.org
- G$ Token: `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`
- Explorer: https://celoscan.io

## Family Integration

This plugin is designed to work seamlessly with FamilyXYZ family agents:

```typescript
// Family agents can trigger G$ rewards
const reward = {
  recipientId: "family_member_address",
  amount: ethers.parseEther("5.0").toString(),
  reason: "Wisdom sharing - helped resolve family conflict",
  interactionType: "conflict_resolved",
  qualityScore: 85,
};

await gdService.distributeFamilyReward(reward);
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## Security Considerations

- Private keys are handled securely through environment variables
- Face verification data is anonymized and encrypted
- Smart contract interactions include proper error handling
- Transaction data includes family context for transparency

## Roadmap

### ✅ Completed (Production Ready)
- [x] **Phase 1**: Basic G$ transfers and UBI claiming
- [x] **Phase 1**: ERC677 transferAndCall implementation  
- [x] **Phase 1**: Multi-chain wallet support (Celo/Fuse)
- [x] **Phase 2**: Face verification integration (FaceTec compatible)
- [x] **Phase 2**: Family identity management and sybil resistance
- [x] **Phase 2**: Privacy-preserving verification cycles
- [x] **Phase 3**: Superfluid streaming rewards (family allowances)
- [x] **Phase 3**: Milestone and continuous reward streaming
- [x] **Phase 3**: Comprehensive stream management

### 🔄 Next Phase (In Development)
- [ ] **Phase 4**: Dashboard G$ integration with delightful UX
- [ ] **Phase 4**: Telegram bot integration (priority platform)
- [ ] **Phase 4**: Family agent reward automation
- [ ] **Phase 5**: GoodCollective pool participation
- [ ] **Phase 5**: Advanced family reward algorithms
- [ ] **Phase 6**: Cross-chain bridging with Hedera HCS

## Contributing

Contributions are welcome! Please follow the existing code patterns and include tests for new features.

## License

MIT License - see LICENSE file for details.

## Links

- [GoodDollar Protocol](https://www.gooddollar.org)
- [GoodDollar Documentation](https://docs.gooddollar.org)
- [FamilyXYZ](https://familexyz.com)
- [Superfluid Protocol](https://www.superfluid.finance)