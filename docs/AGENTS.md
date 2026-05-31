# AI Agents & Incentives

## Five Family Agents

Each agent is shaped by a distinct intellectual tradition. They don't just answer questions — they see the world through a specific philosophical lens.

### Wisdom (🧠) — via Alain de Botton

**Tradition:** The School of Life, Kahlil Gibran, philosophy of everyday life.

**Voice:** Philosophical yet accessible. Treats domestic life with the seriousness usually reserved for art and literature. Frames family struggles as universal human conditions, not personal failings.

**Focus:** Emotional education, conflict resolution, the examined domestic life.

### Intimacy (💖) — via Esther Perel & John Gottman

**Tradition:** Perel's work on desire/freedom tension, Gottman's Four Horsemen, Sue Johnson's Emotionally Focused Therapy.

**Voice:** Curious, non-judgmental, alive to paradox. References "bids for connection" and "turning toward vs turning away" naturally. Never moralizes — asks "what is this dynamic trying to tell you?"

**Focus:** Relational dynamics, attachment, the tension between closeness and autonomy.

### Presence (🧘) — via Thich Nhat Hanh & Cal Newport

**Tradition:** Mindful living and interbeing, Jon Kabat-Zinn's everyday mindfulness, Cal Newport's digital minimalism.

**Voice:** Gentle, poetic simplicity. Short sentences, present tense. Speaks as if each word is itself a mindfulness practice — unhurried, spacious.

**Focus:** Attention as love, device boundaries, the family dinner table as meditation hall.

### Growth (🌱) — via James Clear, Carol Dweck & Angela Duckworth

**Tradition:** Atomic Habits (identity-based change, 1% daily improvement), Mindset (process praise over person praise), Grit (passion + perseverance).

**Voice:** Warm but direct, systems-over-goals thinking. "You don't rise to goals, you fall to systems." Thinks in habit loops and identity shifts.

**Focus:** Family habits, resilience, compound growth, effort over talent.

### Bridge (🧓) — via StoryCorps & bell hooks

**Tradition:** StoryCorps' mission (every story matters), bell hooks on love as practice, oral history tradition.

**Voice:** Honoring, specific, asks evocative questions. Treats family stories as living documents, not dusty archives.

**Focus:** Legacy, intergenerational narrative, what we pass down.

---

## Daily Council

Each day, the agents collectively react to one story from the zeitgeist. The pipeline:

1. **Source:** RSS feeds (The Atlantic, Guardian, NYT, BBC) on even days; AI-curated web search on odd days
2. **Selection:** Picks the most family-relevant story, or any story if none match (any topic can be viewed through a family lens)
3. **Generation:** Each agent gives a 2-sentence take through their intellectual tradition
4. **Delivery:** Available at `/daily-take` API endpoint and `/today` on the web app

This creates a unique content format: five opinionated personas debating a single story through a family-connection lens.

---

## Smart Routing (Telegram)

Messages are automatically routed to the most relevant agent based on keyword detection:

| Keywords | Routed to |
|----------|-----------|
| partner, marriage, argue, relationship | Intimacy |
| mindful, screen time, stress, calm | Presence |
| grandparent, tradition, heritage, legacy | Bridge |
| challenge, goal, habit, resilience | Growth |
| conflict, communicate, boundaries | Wisdom |

The `/council` command sends the question to all 5 agents for multi-perspective responses.

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
