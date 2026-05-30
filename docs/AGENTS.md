# AI Agents & Incentives

## 🤖 Five Family Agents

### Agent Overview

| Agent | Emoji | Focus | Examples |
|-------|-------|-------|----------|
| **Wisdom** | 🧠 | Philosophy & Emotional Intelligence | Conflict resolution, empathy, perspective |
| **Intimacy** | 💖 | Relationships & Connection | Communication, physical health, bonding |
| **Generational Bridge** | 👵👦 | Cross-Generational Connections | Family stories, traditions, history |
| **Presence** | 🧘 | Mindfulness & Digital Wellness | Presence, digital balance, meditation |
| **Growth** | 🚀 | Development & Achievements | Challenges, milestones, collective goals |

### Wisdom Agent (🧠)

**Role:** Philosophy & Emotional Intelligence guidance

**Specializations:**
- Conflict resolution through Socratic questioning
- Empathy development across family
- Perspective-taking exercises
- Emotional awareness coaching

**Actions:**
- Analyzes family tensions
- Proposes dialogue frameworks
- Guides difficult conversations
- Teaches emotional awareness

**Integration:**
- Contributes to sentiment trajectory signal
- Earns payouts when family sentiment improves

### Intimacy Agent (💖)

**Role:** Couple & Family Relationship Coaching

**Specializations:**
- Emotional connection strengthening
- Physical intimacy guidance (age-appropriate)
- Communication pattern improvement
- Relationship milestone tracking

**Actions:**
- Suggests connection activities
- Recommends communication techniques
- Celebrates relationship milestones
- Provides couple-specific insights

**Integration:**
- Performance metrics show intimacy contributions
- Earns payouts when response reciprocity improves

### Generational Bridge Agent (👵👦)

**Role:** Cross-Generational Storytelling & Connection

**Specializations:**
- Family history preservation
- Intergenerational dialogue facilitation
- Tradition documentation
- Wisdom transfer between generations

**Actions:**
- Collects family stories
- Prompts cross-age conversations
- Documents family traditions
- Creates intergenerational prompts

**Integration:**
- Drives generational interaction signal
- Earns payouts when cross-age interactions increase

### Presence Agent (🧘)

**Role:** Mindful Presence & Digital Wellness

**Specializations:**
- Mindfulness practice guidance
- Digital wellness nudges
- Presence-focused activities
- Distraction reduction techniques

**Actions:**
- Suggests presence-building activities
- Provides mindfulness exercises
- Encourages device-free time
- Celebrates offline moments

**Integration:**
- Tracks presence consistency signal
- Earns payouts when presence consistency improves

### Growth Agent (🚀)

**Role:** Shared Family Growth Challenges

**Specializations:**
- Family challenge creation & curation
- Milestone celebration
- Progress tracking
- Growth momentum building

**Actions:**
- Proposes weekly challenges
- Tracks challenge completion
- Celebrates achievements
- Creates growth streaks

**Integration:**
- Drives challenge completion signal
- Earns payouts when challenges complete

---

## 📡 Agent API Integration

### Agent Message Endpoint

Send messages to agents via REST API:

```bash
# Send message to Wisdom agent
curl -X POST 'http://localhost:3004/Wisdom/message' \
  -F 'text=How can we improve family communication?' \
  -F 'user=test'
```

### Agent Insights API

Real-time agent insights from runtime metrics:

```bash
# Get all agents' insights
curl http://localhost:3004/agents/insights

# Get single agent insights
curl http://localhost:3004/agents/Wisdom/insights
```

**Response format:**
```json
{
  "agentId": "wisdom",
  "metrics": {
    "familyMetrics": { ... },
    "intimacyMetrics": { ... }
  },
  "insights": [
    {
      "type": "sentiment_analysis",
      "content": "Family sentiment has improved by 5%",
      "timestamp": "2026-05-24T00:00:00Z"
    }
  ]
}
```

### AG-UI Protocol

Real-time agent chat via AG-UI protocol:

```bash
# Start AG-UI stream
curl -X POST 'http://localhost:3004/Wisdom/ag-ui' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "How is our family doing?",
    "user": "user",
    "context": {}
  }'
```

**Event types:**
- `RunStarted` / `RunFinished` — Stream lifecycle
- `StepStarted` / `StepFinished` — Agent reasoning progress
- `TextMessageContent` — Streamed response
- `StateSnapshot` — Initial state with runtime metadata
- `StateDelta` — State updates (JSON Patch RFC 6902)

---

## 💰 Payout System & Incentives

### Overview
The FamilyXYZ Payout System enables autonomous AI agents to earn FAM tokens by improving measurable family bond metrics. Agents compete to enhance family connections, creating an aligned incentive structure where **agents only profit if families actually benefit**.

### Payout Formula

```
Final Payout = Base Amount × Performance Multiplier × Recency Weight
```

**Components:**

#### 1. Base Amount
```
Base = $50 × Score Delta

where Score Delta = Current Week Score - Previous Week Score

Example:
- Previous Score: 70
- Current Score: 75
- Delta: +5
- Base: $50 × 5 = $250
```

#### 2. Performance Multiplier (1.0 - 1.5x)
Rewards consistent improvement:

```
Consecutive Improvements | Multiplier
------------------------+-----------
0                        | 1.0x
1                        | 1.1x
2                        | 1.2x
3                        | 1.3x
4+                       | 1.5x (capped)
```

#### 3. Recency Weight (0.8 - 1.0)
Recent improvements weighted more heavily:

```
Weeks Since Last Payout | Weight
-----------------------+--------
≤ 4 weeks             | 1.0x
5-8 weeks             | 0.95x
9-12 weeks            | 0.9x
13-16 weeks           | 0.85x
17+ weeks             | 0.8x (minimum)
```

### Anti-Gaming Protections

#### Anomaly Detection
Detects 4 categories of suspicious patterns:

1. **Suspicious Large Jumps**: Score delta > 50 points in one week
2. **Unrealistic Perfection**: All 8 metrics at or near 100
3. **Rapid Consecutive Improvements**: 5+ consecutive weeks of improvements
4. **Network Topology Anomalies**: Sudden changes in relationship patterns

#### Cooling Period Mechanism
When anomalies detected:
- Tier 1 (minor): 1-2 weeks (50% payout reduction)
- Tier 2 (moderate): 2-3 weeks (no payouts)
- Tier 3 (severe): 3-4 weeks (payout freeze)

#### Weekly Caps
- **Per-Agent Weekly Cap:** $500 FAM
- **Platform Weekly Cap:** $50,000 FAM

### Payout API Endpoints

```bash
# Get agent payout history
curl http://localhost:3004/api/agents/Wisdom/payouts

# Get agent performance metrics
curl http://localhost:3004/api/agents/Wisdom/performance

# Get family payout aggregation
curl http://localhost:3004/api/families/family_xyz/payouts

# Get pending payouts
curl http://localhost:3004/api/payouts/pending

# Dry-run payout calculation
curl -X POST http://localhost:3004/api/payouts/calculate \
  -H 'Content-Type: application/json' \
  -d '{"agentId": "wisdom", "familyId": "family_xyz", "scoreDelta": 5}'
```

---

## ⛓️ Hedera Blockchain Integration

### HCS-10 Standard Compliance
All family interactions are logged as HCS-10 compliant messages to ensure interoperability with other Hedera applications.

### Message Types

#### Family Interaction Message
Logs when agents help families:
```json
{
  "standard": "HCS-10",
  "version": "1.0",
  "timestamp": 1700000000000,
  "messageId": "interaction_123",
  "sender": "wisdom_agent_v1.0",
  "topicId": "0.0.7304500",
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

#### Family Milestone Message
Logs when families achieve goals:
```json
{
  "standard": "HCS-10",
  "version": "1.0",
  "timestamp": 1700000000000,
  "messageId": "milestone_456",
  "sender": "growth_agent_v1.0",
  "topicId": "0.0.7304500",
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

#### Family Reward Message
Logs when agents earn payouts:
```json
{
  "standard": "HCS-10",
  "version": "1.0",
  "timestamp": 1700000000000,
  "messageId": "reward_789",
  "sender": "tokenomics_engine_v1.0",
  "topicId": "0.0.7304500",
  "type": "family_reward",
  "payload": {
    "familyId": "family_xyz_789",
    "agentType": "wisdom",
    "recipient": "0.0.111",
    "amount": 325,
    "tokenId": "0.0.7304501",
    "reason": "conflict_peacefully_resolved",
    "transactionId": "0.0.123@1730400000.000000000",
    "metadata": {
      "interactionId": "interaction_123",
      "scoreDelta": 5,
      "multiplier": 1.3
    }
  }
}
```

### Hedera Services

#### HederaService
Core service managing all Hedera interactions:
- Client initialization and authentication
- Network configuration (testnet/mainnet)
- Retry logic and error handling
- Performance optimization
- Singleton pattern for efficiency

#### HederaConsensusService
Handles all HCS operations:
- Topic creation and management
- Message submission with batching
- HCS-10 compliant message formatting
- Consensus message querying
- Mirror Node integration

#### HederaTokenService
Manages FAM token distribution:
- Token creation and configuration
- Payout distribution to agents
- Balance tracking and reporting
- Transaction verification

---

## 🌐 Active Testnet Deployment

**Last Updated:** November 22, 2025

| Resource | ID | Status |
|----------|----|----|
| **Network** | Hedera Testnet | ✅ Active |
| **Operator Account** | `0.0.6511978` | ✅ Funded |
| **Wisdom Topic** | `0.0.7304500` | ✅ Created |
| **FAM Token** | `0.0.7304501` | ✅ Deployed |
| **Mirror Node** | testnet.mirrornode.hedera.com | ✅ Connected |

### Verification Links

- **Wisdom Topic:** [HashScan](https://hashscan.io/testnet/topic/0.0.7304500)
- **FAM Token:** [HashScan](https://hashscan.io/testnet/token/0.0.7304501)
- **Operator Account:** [HashScan](https://hashscan.io/testnet/account/0.0.6511978)

---

## 🌐 Agent Marketplace Vision

### The Platform Shift
FamilyXYZ is evolving from a product into a **platform** where practitioners distribute research-backed agents to families.

### How It Works

```
CREATORS                          FAMILIES
───────                           ───────
Dr. Gottman Institute      →      Subscribe to
Attachment Research Lab    →      "Gottman Relationship"
Mindfulness Institute       →      "Secure Attachment"
Custom Agent Creator       →      "Family Wisdom"

┌─────────────────────────────────────────┐
│           Agent Marketplace              │
│  • Creator profiles & credentials      │
│  • Research-backed agent descriptions   │
│  • Family ratings & reviews             │
│  • Subscription or one-time access      │
└─────────────────────────────────────────┘
```

### Trust Layer
The marketplace model builds trust through:
- **Creator accountability** — Practitioners publicly stand behind methodology
- **Research citations** — Agents reference peer-reviewed approaches
- **Hedera verification** — Immutable audit trail for family milestones
- **Credential verification** — Creator credentials publicly displayed

### Tiered Access

| Tier | Who | What They Get |
|------|-----|---------------|
| **Family** | End users | Access to curated agents, private family data |
| **Pro** | Practitioners | Client management, outcome analytics, agent curation |
| **Enterprise** | Employers | Wellness benefit integration, aggregated dashboards |

**Critical:** Each layer only sees what participants explicitly share. Employers never see family conversations.
