# Hedera Blockchain Integration & HCS-10 Compliance

## ⛓️ HCS-10 Compliant Messaging

### Standard Implementation

The platform implements full HCS-10 compliance for all family interactions, ensuring interoperability with other Hedera applications and agents.

### Message Types

#### Family Interaction Messages

```json
{
    "standard": "HCS-10",
    "version": "1.0",
    "timestamp": 1700000000000,
    "messageId": "interaction_123",
    "sender": "wisdom_agent_v1.0",
    "topicId": "0.0.1234567",
    "type": "family_interaction",
    "payload": {
        "familyId": "family_xyz_789",
        "agentType": "wisdom",
        "interactionType": "conflict_resolution",
        "contentHash": "sha256:abc123...",
        "participants": ["0.0.111", "0.0.222", "0.0.333"],
        "sentiment": {
            "polarity": 0.75,
            "familyTone": "reconciled",
            "healthScore": 82
        },
        "metadata": {
            "sessionId": "session_a1b2c3",
            "durationSeconds": 300
        }
    }
}
```

#### Family Milestone Messages

```json
{
    "standard": "HCS-10",
    "version": "1.0",
    "timestamp": 1700000000000,
    "messageId": "milestone_456",
    "sender": "growth_agent_v1.0",
    "topicId": "0.0.1234567",
    "type": "family_milestone",
    "payload": {
        "familyId": "family_xyz_789",
        "agentType": "growth",
        "milestoneType": "monthly_communication_goal",
        "description": "30 days of positive communication",
        "participants": ["0.0.111", "0.0.222", "0.0.333"],
        "rewardAmount": 1000,
        "metadata": {
            "streakDays": 30,
            "startDate": "2025-10-01"
        }
    }
}
```

#### Family Reward Messages

```json
{
    "standard": "HCS-10",
    "version": "1.0",
    "timestamp": 1700000000000,
    "messageId": "reward_789",
    "sender": "tokenomics_engine_v1.0",
    "topicId": "0.0.1234567",
    "type": "family_reward",
    "payload": {
        "familyId": "family_xyz_789",
        "agentType": "system",
        "recipient": "0.0.111",
        "amount": 500,
        "tokenId": "0.0.999888777",
        "reason": "conflict_peacefully_resolved",
        "transactionId": "0.0.123@1730400000.000000000",
        "metadata": {
            "interactionId": "interaction_123"
        }
    }
}
```

## 🏗️ Technical Implementation

### Hedera Agent Kit: Tools

Our core services function as "Tools" in the Hedera AI Agent Kit paradigm, providing reusable and direct access to Hedera's functionalities.

#### HederaService Tool

Singleton service managing all Hedera interactions:

- Client initialization and authentication
- Network configuration (testnet/mainnet)
- Retry logic and error handling
- Performance optimization

#### HederaConsensusService Tool

Handles all HCS operations:

- Topic creation and management
- Message submission with batching
- HCS-10 compliant message formatting
- Consensus message querying

#### HederaTokenService Tool

Manages tokenomics and rewards:

- Token creation and configuration
- Reward distribution to family members
- Balance tracking and reporting
- Custom token management

### Execution Modes

Our system supports dual execution modes, a key feature of the Hedera AI Agent Kit:

-   **Autonomous Mode**: Agents can autonomously record milestones and distribute rewards based on predefined family goals and rules, perfect for automated positive reinforcement.
-   **Human-in-the-Loop Mode**: For sensitive actions, such as resolving a significant conflict, the agent can prepare a transaction (e.g., a special reward) and present it to a family member for approval before execution.

## 🔧 Configuration

### Environment Variables

```bash
# Hedera Network Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...

# Consensus Service
HEDERA_WISDOM_TOPIC_ID=0.0.1234567
HEDERA_FAMILY_TOKEN_ID=0.0.999888777
HEDERA_TREASURY_ACCOUNT_ID=0.0.1111111

# Feature Flags
HEDERA_ENABLE_CONSENSUS=true
HEDERA_SUBMIT_STARTUP_TEST=true
```

### Agent Configuration

```typescript
const wisdomAgentConfig = {
    agentType: "wisdom",
    consensusTopicId: "0.0.1234567",
    rewardTokenId: "0.0.999888777",
    specializations: [
        "wisdom_shared",
        "conflict_resolved",
        "empathy_expressed",
    ],
    rewardMultiplier: 1.2,
    enableTokenomics: true,
    enableConsensusLogging: true,
};
```

## 📊 Tokenomics System

### Reward Distribution

- **60% Immediate Rewards**: Distributed directly to family members
- **30% Family Savings**: Reserved for future family goals
- **10% Charity Pool**: Automatic donations to family-focused charities

### Milestone Rewards

- Weekly goal achieved: 500 tinybars
- Monthly challenge completed: 1000 tinybars
- Family tradition preserved: 750 tinybars
- Conflict peacefully resolved: 1200 tinybars
- New family member welcomed: 2000 tinybars

## 🚀 Quick Start Example

Here's a minimal example to send and retrieve HCS-10 messages:

```ts
import { HederaService } from '@elizaos/hedera-core/services';
import { HederaStandardsService } from '@elizaos/hedera-core/services';
import { HCS10FamilyInteraction } from '@elizaos/hedera-core/types';

async function run() {
  const hederaService = HederaService.getInstance({
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet'
  });
  await hederaService.initialize();

  // Create a topic for your family/app
  const topicRes = await hederaService.consensus.createFamilyTopic(
    'quickstart-family',
    'Quick Start Topic'
  );
  if (!topicRes.success || !topicRes.data) throw new Error('Topic creation failed');
  const topicId = topicRes.data;

  // Submit an HCS-10 message
  const msg: HCS10FamilyInteraction = {
    standard: 'HCS-10',
    version: '1.0',
    timestamp: Date.now(),
    messageId: `quickstart-${Date.now()}`,
    sender: process.env.HEDERA_ACCOUNT_ID!,
    topicId,
    type: 'family_interaction',
    payload: {
      familyId: 'quickstart-family',
      agentType: 'coordinator',
      interactionType: 'daily_checkin',
      contentHash: 'hash-abc',
      participants: ['alice','bob'],
      sentiment: { polarity: 0.7, familyTone: 'positive', healthScore: 80 },
      metadata: { mood: 'positive' }
    }
  };
  const submitRes = await hederaService.consensus.submitHCS10Message(topicId, msg);
  if (!submitRes.success) throw new Error(`Submit failed: ${submitRes.error}`);

  // Retrieve from Mirror Node
  const mirrorRes = await hederaService.mirror.getTopicMessages(topicId, { limit: 10 });
  if (!mirrorRes.success || !mirrorRes.data?.length) throw new Error('No messages retrieved');

  console.log('HCS-10 quickstart completed:', topicId);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
```

## ✅ Hedera Integration Proof

### Account Details
- **Account ID:** `0.0.6511978`
- **Network:** Hedera Testnet
- **Balance:** 1,100.00 HBAR ($160.75)
- **Key Type:** ECDSA_SECP256K1

### Transaction Proof
- **Topic Created:** `0.0.7296068`
- **Transaction ID:** `0.0.6511978@1763637529.750457705`
- **Status:** SUCCESS
- **Timestamp:** 2025-11-20 (Unix: 1763637529)

### Verification Links
- **Transaction on HashScan:** https://hashscan.io/testnet/transaction/0-0.6511978-1763637529.750457705
- **Topic on HashScan:** https://hashscan.io/testnet/topic/0.0.7296068
- **Account on HashScan:** https://hashscan.io/testnet/account/0.0.6511978

### Message Submitted
```json
{
  "project": "Famile",
  "agent": "Wisdom",
  "timestamp": 1763637529750,
  "proof": "Hedera Integration Working"
}
```

This proof demonstrates that FamilyXYZ has working, verifiable blockchain integration - a key differentiator for the hackathon! 🚀