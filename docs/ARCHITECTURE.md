# Architecture & Technical Reference

## 🏗️ System Architecture

### Monorepo Structure

```
familexyz/
├── agent/                      # Backend agent server
│   └── src/
│       ├── index.ts           # Main entry point
│       ├── services/          # Core business logic
│       ├── integrations/      # External integrations
│       └── api/               # REST API handlers
├── client/                     # Frontend dashboard (React/Vite)
│   └── src/
│       ├── components/        # React components
│       ├── pages/             # Page routes
│       └── lib/               # Client utilities
├── packages/
│   ├── family/                # Family-specific agents
│   │   ├── plugin-wisdom/     # Wisdom agent
│   │   ├── plugin-intimacy/   # Intimacy agent
│   │   ├── plugin-generational-bridge/
│   │   ├── plugin-presence/
│   │   ├── plugin-growth/
│   │   ├── nlp-utils/         # NLP utilities
│   │   └── metrics/           # Metrics tracking
│   ├── blockchain/
│   │   ├── hedera-core/       # Core Hedera services
│   │   └── plugin-hedera-template/
│   ├── adapters/              # Database adapters
│   └── clients/               # Platform clients
├── config/                     # Configuration files
├── environments/               # Environment templates
├── tests/                      # Integration tests
└── docs/                       # Documentation
```

### Core Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **TypeScript** | Type-safe implementation | Latest |
| **Node.js** | Runtime environment | 22+ |
| **Hedera SDK** | Blockchain integration | Latest |
| **SQLite** | Local data persistence | Latest |
| **React** | Frontend framework | 18+ |
| **Vite** | Frontend build tool | Latest |
| **PNPM** | Package management | 9+ |
| **Turbo** | Monorepo task runner | Latest |

---

## 🔄 Data Flow Architecture

### Family Bond Scoring Pipeline

```
Family Interactions (SQLite)
    ↓
Signal Aggregators (7 metrics)
├─ Generational Interaction
├─ Response Reciprocity
├─ Sentiment Trajectory
├─ Challenge Completion
├─ Presence Consistency
├─ Network Topology
└─ Hedera Consensus
    ↓
BondScoreService (calculates 0-100)
    ↓
Weekly Scheduler (Sundays 00:00 UTC)
├─ Store scores to SQLite
├─ Log to Hedera HCS
└─ Publish to dashboard
    ↓
Agent Payout Calculations
├─ Score delta detection
├─ Anomaly detection
└─ Performance multipliers
    ↓
Token Distribution
├─ Validate payout amounts
├─ Transfer FAM tokens
└─ Log to blockchain
```

### Payout System Flow

```
Agent Performance Change
    ↓
Calculate Payout (PayoutService)
├─ Base: $50 × score delta
├─ Performance multiplier: 1.0-1.5x
└─ Recency weight: 0.8-1.0
    ↓
Validate Against Rules (AnomalyDetectionService)
├─ Detect suspicious patterns
├─ Check cooling periods
└─ Verify caps and limits
    ↓
Create Audit Record (HederaPayoutLogger)
├─ Log to HCS Topic
├─ Store metadata
└─ Immutable timestamp
    ↓
Execute Transfer (HederaTokenService)
├─ Transfer FAM tokens
├─ Update balances
└─ Verify on-chain
    ↓
✅ Payout Complete
```

---

## 🔌 API Architecture

### REST Endpoints

#### Payout System APIs (Phase 4b)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/:agentId/payouts` | GET | Agent payout history (12 weeks) |
| `/api/agents/:agentId/performance` | GET | Agent performance metrics |
| `/api/families/:familyId/payouts` | GET | Family payout aggregation |
| `/api/payouts/pending` | GET | Payouts awaiting execution |
| `/api/payouts/calculate` | POST | Dry-run payout calculation |
| `/api/payouts/anomalies` | GET | Anomaly review list (admin) |
| `/api/payouts/dispute` | POST | File dispute against payout |

#### Agent Insights APIs (Live Metrics)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agents/insights` | GET | All agents' real-time insights (port 3000) |
| `/agents/:agentId/insights` | GET | Single agent insight + metrics (port 3000) |

**Note:** Agent insight endpoints are served by DirectClient (port 3000) because they require access to agent runtimes. The frontend's `BASE_URL` already points to port 3000.

#### Bond Scoring APIs (Phase 4a)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/families/:familyId/bond-score` | GET | Current + 12-week history |

---

## 💾 Database Schema

### Core Tables

#### family_bond_scores
Stores weekly composite bond scores and signal breakdown.

```sql
CREATE TABLE family_bond_scores (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Signal scores (0-100)
  generational_interaction_score INTEGER,
  response_reciprocity_score INTEGER,
  sentiment_trajectory_score INTEGER,
  challenge_completion_score INTEGER,
  presence_consistency_score INTEGER,
  network_topology_score INTEGER,
  hedera_consensus_score INTEGER,

  -- Composite
  bond_score INTEGER NOT NULL,
  trend TEXT,
  week_over_week_delta REAL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, week_number)
);
```

#### agent_payout_tracking (Phase 4b)
Tracks all agent payouts with full audit trail.

```sql
CREATE TABLE agent_payout_tracking (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,

  -- Calculation
  previous_bond_score INTEGER,
  new_bond_score INTEGER,
  score_delta REAL,

  -- Breakdown
  base_payout REAL,
  performance_multiplier REAL,
  recency_weight REAL,
  final_payout REAL,

  -- Blockchain
  hcs_record_id TEXT,
  tx_hash TEXT,
  status TEXT,

  -- Anomalies
  anomalies_detected BOOLEAN,
  cooling_period_active BOOLEAN,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME
);
```

#### bond_score_signals
Raw aggregates (purged after 90 days).

```sql
CREATE TABLE bond_score_signals (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,

  -- JSON aggregates
  generational_data JSON,
  reciprocity_data JSON,
  sentiment_data JSON,
  challenge_data JSON,
  presence_data JSON,
  topology_data JSON,
  consensus_data JSON,

  opted_out_signals TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  purge_at DATETIME
);
```

---

## 🏛️ Service Architecture

### Backend Services

#### PayoutService
Core payout calculation engine.

**Methods:**
- `calculatePayout(scoreDelta, agentId)` - Main calculation
- `validatePayout(amount, agentId, familyId, weekNumber)` - Validation
- `getAgentPerformance(agentId)` - Performance tracking

**Features:**
- Configurable base rate
- Performance multiplier system
- Recency weighting
- Weekly cap enforcement
- Consecutive improvement tracking

#### AnomalyDetectionService
Detects gaming patterns and manages cooling periods.

**Methods:**
- `detectAnomalies(agentId, currentScores, previousScores)` - Multi-metric analysis
- `setCoolingPeriod(agentId, weekNumber, duration)` - Enforce cooling
- `getCoolingPeriodDetails(agentId, weekNumber)` - Status check
- `checkCoolingPeriod(agentId, weekNumber)` - Block payout check

**Detects:**
- Suspicious large jumps
- Unrealistic perfection
- Rapid consecutive improvements
- Network topology anomalies

#### HederaPayoutLogger
Immutable audit trail on Hedera Consensus Service + SQLite persistence.

**Methods:**
- `logPayoutRecord(record)` - Submit HCS message + persist to SQLite
- `getPayoutRecord(recordId)` - Retrieve from Mirror Node
- `getAgentPayoutStats(agentId, startWeek, endWeek)` - Aggregation
- `getFamilyPayoutStats(familyId, startWeek, endWeek)` - Aggregation
- `setDbAdapter(db)` - Attach SQLite adapter at runtime
- `loadFromDb()` - Hydrate in-memory cache from SQLite on startup

**Persistence:** Records are written to both in-memory Map (fast cache) and `agent_payout_tracking` SQLite table (durable). On startup, existing records are loaded from SQLite into the cache.

#### HederaTokenService
FAM token distribution on Hedera.

**Methods:**
- `transferTokens(agentId, amount, metadata)` - Token transfer
- `getTokenBalance(accountId)` - Balance check
- `validateTransfer(amount)` - Validation
- `getTransactionStatus(txHash)` - Status tracking

#### PayoutScheduler
Weekly automated execution.

**Features:**
- Cron-based scheduling (Sundays 23:00 UTC)
- Batch processing
- Error recovery
- Manual trigger support
- Dry-run mode

---

## 🧩 Component Architecture

### Frontend Components (Phase 4b)

#### PayoutDashboard
Main orchestrator component with tab navigation.

**Tabs:**
1. **History** - PayoutHistory component
2. **Performance** - PerformanceMetrics component
3. **Calculator** - PayoutCalculator component
4. **Admin** - AnomalyReview component

#### Custom Hooks

| Hook | Purpose |
|------|---------|
| `usePayoutData(agentId, weeks?)` | Fetch agent history |
| `useAgentPerformance(agentId)` | Fetch metrics |
| `usePayoutCalculator()` | POST calculation |
| `usePendingPayouts()` | Fetch pending list |

---

## 🧬 Agent Architecture

### Five Family Agents

Each agent is a specialized plugin with:
- Custom actions and evaluators
- Metrics tracking
- Hedera integration
- Response generation

### Agent Types

| Agent | Emoji | Focus | Examples |
|-------|-------|-------|----------|
| Wisdom | 🧠 | Philosophy & emotions | Conflict resolution, empathy |
| Intimacy | 💖 | Relationships | Connection, physical health |
| Generational Bridge | 👵👦 | Cross-age | Stories, traditions, history |
| Presence | 🧘 | Mindfulness | Digital wellness, presence |
| Growth | 🚀 | Development | Challenges, milestones, goals |

---

## 🔐 Security Architecture

### Credential Management
- Environment variables for secrets
- No hardcoded credentials
- Key rotation support
- Separate dev/prod keys

### Data Protection
- Encrypted sensitive data
- No raw content storage
- Aggregated metrics only
- Automatic purge policies (90 days for raw signals)

### Blockchain Security
- Immutable HCS audit trail
- Verifiable transactions
- On-chain verification links
- Mirror Node validation

---

## 📊 Performance Architecture

### Scalability Targets
- **10,000+ weekly payouts** per platform
- **100+ concurrent calculations**
- **1,000+ families** managed
- **<100ms API response time**

### Optimization Strategies
- In-memory caching for hot data (HederaPayoutLogger dual-layer cache)
- Batch HCS submissions
- Async/await for I/O
- Query result caching
- Memoized React components
- Agent insights served from runtime metadata (zero DB overhead)

---

## 🧪 Testing Architecture

### Test Types

| Type | Count | Purpose |
|------|-------|---------|
| Unit | 29 | Individual service methods |
| Integration | 13 | Full payout cycle |
| Component | 15 | React rendering |
| Hook | 18 | Custom hook logic |
| E2E UI | 42 | User workflows |
| E2E API | 37 | API endpoints |
| **Total** | **154** | Comprehensive coverage |

### Test Locations

```
tests/
├── e2e/
│   ├── payout-dashboard.e2e.ts    (42 tests)
│   └── payout-api.e2e.ts          (37 tests)

packages/agent/src/
├── __tests__/
│   └── PayoutIntegration.test.ts  (13 tests)
└── api/__tests__/
    └── PayoutApiHandler.test.ts   (29 tests)

client/src/components/dashboard/payout/
├── __tests__/
│   ├── PayoutComponents.test.tsx  (15 tests)
│   └── hooks/
│       └── __tests__/
│           └── usePayoutData.test.ts (18 tests)
```

---

## 🚀 Deployment Architecture

### Development
- Local machine with SQLite
- Hot reload for fast iteration
- Debug logging available

### Staging
- Hedera testnet
- PostgreSQL database
- Docker containers
- CI/CD pipeline

### Production
- Hedera mainnet
- PostgreSQL with backups
- Kubernetes orchestration
- Load balancer + CDN
- Monitoring & alerting

---

## 📈 Monitoring & Observability

### Health Checks
```bash
curl http://localhost:3001/health
```

### Logging Levels
- `error` - Critical issues
- `warn` - Important notices
- `info` - General information
- `debug` - Detailed debugging

### Metrics to Track
- Payout calculation time
- Anomaly detection rate
- Token transfer success rate
- API response times
- Database query latency

---

## 🔄 Deployment Workflow

### Environment Configuration

```bash
# Development
cp environments/development/.env.development .env

# Staging
cp environments/staging/.env.staging .env

# Production
cp environments/production/.env.production .env
```

### Build Pipeline

```bash
# Install
pnpm install

# Build
pnpm build

# Test
pnpm test

# Deploy
pnpm deploy
```

---

## 🌐 AG-UI Protocol (Agent-User Interaction)

FamilyXYZ implements the [AG-UI protocol](https://docs.ag-ui.com) for real-time, typed communication between agents and the frontend.

### Event Types

All events follow the AG-UI spec and are defined in `client/src/types/agui.ts`.

| Category | Events | Purpose |
|----------|--------|---------|
| Lifecycle | `RunStarted`, `RunFinished`, `RunError` | Stream lifecycle |
| Steps | `StepStarted`, `StepFinished` | Agent reasoning progress |
| Text | `TextMessageStart`, `TextMessageContent`, `TextMessageEnd` | Streamed response |
| Tools | `ToolCallStart`, `ToolCallArgs`, `ToolCallEnd` | Frontend tool invocation |
| State | `StateSnapshot`, `StateDelta` | Shared state (JSON Patch RFC 6902) |
| Custom | `Custom` | Family-specific events (`family.*`) |

### Frontend Tools (Human-in-the-Loop)

Defined in `client/src/hooks/useFamilyTools.ts` and sent in the request body.

| Tool | Purpose |
|------|---------|
| `confirmPayout` | Approve agent payouts before Hedera execution |
| `setFamilyGoal` | Propose a new shared family goal |
| `suggestActivity` | Recommend a bond-strengthening activity |

When the agent invokes a frontend tool, the UI shows an approval card. The user can approve or reject.

### Endpoint

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/:agentId/ag-ui` | POST | SSE stream of AG-UI events (port 3000) |

**Request body:**
```json
{
  "text": "How is our family doing?",
  "user": "user",
  "tools": [{ "name": "confirmPayout", "description": "...", "parameters": {...} }],
  "context": {}
}
```

### State Management

- `StateSnapshot` emitted at run start with real `runtime.meta` data (familyMetrics, intimacyMetrics, etc.)
- `StateDelta` uses JSON Patch RFC 6902 operations: `[{ "op": "replace", "path": "/family/overallHealth", "value": 82 }]`

---

## 📚 References

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera AI Agent Kit](https://github.com/hashgraph/hedera-ai-agent-kit)
- [HCS-10 Standard](https://hips.hedera.com/hip/hip-10)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
