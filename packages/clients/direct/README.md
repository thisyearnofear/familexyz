# @elizaos/client-direct

FamilyXYZ Direct Web Client with GoodDollar Dashboard Integration

## Overview

The Direct Web Client provides a comprehensive REST API and dashboard for family AI agents with full GoodDollar G$ integration. This client enables delightful family experiences through:

- **Real-time G$ wallet management** with multi-chain support (Celo/Fuse)
- **Family verification dashboard** with identity management
- **Streaming rewards overview** with Superfluid integration
- **Family activity feed** showing G$ rewards and interactions
- **Comprehensive dashboard** with family health scoring

## Features

### 🏠 Family Dashboard Integration

#### Wallet Management
- Real-time G$ balance display
- SuperToken balance tracking
- Multi-chain network status (Celo/Fuse)
- UBI claim eligibility status
- Transaction history with family context

#### Family Verification Hub
- Family member verification status
- Role-based access control (parent/child/grandparent)
- Identity verification progress tracking
- Sybil resistance confidence scoring
- Family relationship mapping

#### Streaming Rewards Dashboard
- Active stream overview with flow rates
- Family allowance tracking (monthly/weekly)
- Milestone-based reward streams
- Continuous behavior incentive streams
- Real-time earnings estimates (hourly/daily/monthly)

#### Activity Feed
- Recent family interactions with G$ rewards
- Cross-generational engagement tracking
- UBI claim history
- Stream creation and management events
- Family milestone celebrations

### 🎯 Coherent Family Experience

The dashboard is designed with "first priority - coherence" in mind:

- **Unified Family Context**: All G$ operations are linked to family relationships
- **Intuitive Navigation**: Family-friendly interface design
- **Real-time Updates**: Live data synchronization across all features
- **Natural Language Integration**: Seamless connection to conversational AI agents
- **Progressive Enhancement**: Features unlock as family verification increases

## API Endpoints

### Core Agent Management

```
GET    /agents                           # List all family agents
GET    /agents/:agentId                  # Get agent details
POST   /agents/:agentId/message          # Send message to agent
POST   /agents/:agentId/set              # Update agent configuration
DELETE /agents/:agentId                  # Delete agent
```

### GoodDollar Dashboard Integration

```
GET    /agents/:agentId/gooddollar/wallet     # Wallet overview with G$ balance
GET    /agents/:agentId/gooddollar/family     # Family verification status
GET    /agents/:agentId/gooddollar/streams    # Streaming rewards overview
GET    /agents/:agentId/gooddollar/activity   # Family activity feed
GET    /agents/:agentId/gooddollar/dashboard  # Comprehensive family dashboard
```

### Family Agent Interaction

```
POST   /:agentId/message                 # Chat with family agent (with G$ context)
POST   /:agentId/whisper                 # Voice interaction with transcription
POST   /:agentId/speak                   # Get audio response from agent
POST   /:agentId/image                   # Generate images with family context
```

## Dashboard API Usage

### Wallet Information
```javascript
// Get comprehensive wallet status
const response = await fetch('/agents/agent-123/gooddollar/wallet');
const data = await response.json();

console.log(data.wallet.balance);        // "125.75" G$
console.log(data.wallet.canClaimUBI);    // true/false
console.log(data.wallet.network);        // "fuse" or "celo"
console.log(data.familyFeatures);        // Feature availability status
```

### Family Overview
```javascript
// Get family verification and member status
const response = await fetch('/agents/agent-123/gooddollar/family');
const data = await response.json();

console.log(data.family.verifiedCount);     // 2
console.log(data.family.totalMembers);      // 3  
console.log(data.family.verificationProgress); // 66.67%
console.log(data.family.members);           // Array of family members
```

### Streaming Dashboard
```javascript
// Get active streaming rewards overview
const response = await fetch('/agents/agent-123/gooddollar/streams');
const data = await response.json();

console.log(data.streaming.totalActiveStreams); // 2
console.log(data.streaming.estimatedDaily);     // "15.25" G$/day
console.log(data.streaming.streamTypes);        // {allowance: 1, milestone: 1}
```

### Activity Feed
```javascript
// Get recent family activity with G$ rewards
const response = await fetch('/agents/agent-123/gooddollar/activity?limit=10');
const data = await response.json();

console.log(data.activity.recent);           // Array of recent activities
console.log(data.activity.stats.totalRewards); // "45.67" total G$ earned
console.log(data.activity.familyMoments);    // Count of meaningful family interactions
```

### Comprehensive Dashboard
```javascript
// Get unified family dashboard data
const response = await fetch('/agents/agent-123/gooddollar/dashboard');
const data = await response.json();

console.log(data.dashboard.familyScore);      // 85 (0-100 family health score)
console.log(data.dashboard.quickStats);       // Key metrics summary
console.log(data.dashboard.recommendations);  // Personalized next steps
console.log(data.dashboard.familyGrowth);     // Progress tracking
```

## Response Formats

### Dashboard Response Structure
```typescript
interface DashboardResponse {
  success: boolean;
  dashboard: {
    familyScore: number;           // 0-100 family health score
    wallet: WalletInfo | null;
    family: FamilyInfo | null;
    streaming: StreamingInfo | null;
    activity: ActivityInfo | null;
    quickStats: {
      totalBalance: string;
      activeStreams: number;
      verifiedMembers: number;
      recentActivities: number;
    };
    recommendations: string[];     // Personalized suggestions
    familyGrowth: {
      weeklyRewards: number;
      streamingIncome: number;
      goalProgress: number;
    };
  };
  timestamp: number;
}
```

### Family Activity Structure
```typescript
interface ActivityItem {
  id: string;
  type: "reward_earned" | "stream_started" | "verification_completed" | "family_interaction" | "ubi_claimed";
  timestamp: number;
  actor: string;                 // Family member name
  action: string;                // Human-readable description
  amount: string | null;         // G$ amount if applicable
  icon: string;                  // Emoji for UI display
  category: string;              // Activity category
}
```

## Configuration

### Environment Variables

```env
# Core Configuration
SERVER_PORT=3000

# GoodDollar Configuration (required for dashboard)
GOODDOLLAR_NETWORK=fuse
GOODDOLLAR_TOKEN_ADDRESS=0x495d133B938596C9984d462F007B676bDc57eCEC
GOODDOLLAR_RPC_URL=https://rpc.fuse.io
GOODDOLLAR_PRIVATE_KEY=your_private_key_here

# Optional Features
GOODDOLLAR_ENABLE_UBI_CLAIM=true
GOODDOLLAR_ENABLE_FACE_VERIFICATION=true
GOODDOLLAR_ENABLE_STREAMING=true
GOODDOLLAR_SUPER_TOKEN_ADDRESS=0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f

# Face Verification (optional)
GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER=your_facetec_key
GOODDOLLAR_FACETEC_PRODUCTION_KEY=your_production_key
```

## Usage Examples

### Basic Family Dashboard Setup

1. **Install and Configure**
```bash
cd packages/clients/direct
npm install
```

2. **Set Environment Variables**
```bash
export GOODDOLLAR_NETWORK=fuse
export GOODDOLLAR_PRIVATE_KEY=your_key
export GOODDOLLAR_ENABLE_STREAMING=true
```

3. **Start Dashboard Server**
```bash
npm run dev
# Server starts on http://localhost:3000
```

4. **Access Family Dashboard**
```
GET http://localhost:3000/agents/your-agent-id/gooddollar/dashboard
```

### Family Agent with G$ Integration

```javascript
// Start family agent with GoodDollar plugin
import { gooddollarPlugin } from "@elizaos/plugin-gooddollar";

const agent = new AgentRuntime({
  plugins: [gooddollarPlugin],
  // ... other config
});

// Chat with natural language G$ operations
await fetch('/agent-123/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Set up monthly allowance of 100 G$ for my child 0x742d...",
    userId: "parent-001",
    roomId: "family-room-001"
  })
});
```

### Progressive Family Onboarding

1. **Wallet Connection**: Automatic wallet detection from agent configuration
2. **Family Verification**: Identity verification for sybil resistance
3. **Stream Setup**: Create family allowances and reward streams
4. **Activity Tracking**: Monitor G$ rewards and family interactions

## Dashboard Features

### Family Health Scoring

The dashboard calculates a comprehensive family health score (0-100) based on:

- **Verification Progress** (30%): Percentage of family members verified
- **Active Streaming** (40%): Number and variety of active reward streams  
- **Family Activity** (30%): Recent interactions and G$ reward engagement

### Smart Recommendations

Based on family status, the dashboard provides personalized recommendations:

- Complete missing family member verifications
- Set up streaming rewards for improved family dynamics
- Claim available UBI rewards
- Increase engagement with family AI agents

### Real-time Updates

All dashboard data refreshes in real-time, providing families with:

- Live G$ balance updates
- Stream flow rate changes
- New family activity notifications
- Verification status updates

## Integration with Family AI Agents

The dashboard seamlessly integrates with all 5 family AI agents:

### 🧠 Wisdom Agent Integration
- Philosophy conversation rewards tracked in activity feed
- Emotional intelligence G$ rewards displayed
- Wisdom sharing milestone streams

### 💑 Intimacy Agent Integration  
- Relationship milestone celebrations with G$ bonuses
- Couple communication improvement rewards
- Anniversary and date night stream rewards

### 👵👦 Generational Bridge Agent Integration
- Cross-generational interaction bonuses prominently displayed
- Family story sharing rewards in activity feed
- Grandparent-grandchild stream allowances

### 🧘 Presence Agent Integration
- Mindful communication rewards tracked
- Digital wellness milestone streams
- Present moment family interaction bonuses

### 🚀 Growth Agent Integration
- Family achievement celebrations with G$ distributions
- Growth challenge completion rewards
- Family goal progress tracking with streaming rewards

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### API Testing
```bash
# Test dashboard endpoint
curl http://localhost:3000/agents/test-agent/gooddollar/dashboard

# Test wallet status
curl http://localhost:3000/agents/test-agent/gooddollar/wallet

# Test family verification
curl http://localhost:3000/agents/test-agent/gooddollar/family
```

## Architecture

### Coherent Design Principles

1. **Family-First**: All features designed around family relationship context
2. **Natural Language**: Dashboard data connects seamlessly to conversational agents
3. **Real-time Responsive**: Live updates without page refreshes
4. **Progressive Enhancement**: Advanced features unlock with increased family engagement
5. **Cross-generational**: UI/UX designed for all age groups in the family

### Performance Optimizations

- Parallel API data fetching for dashboard compilation
- Efficient caching of family verification status  
- Real-time WebSocket updates for streaming data
- Optimized database queries for activity feeds

### Security Features

- Family member verification with sybil resistance
- Privacy-preserving identity management
- Secure wallet integration with environment variable configuration
- Role-based access control for family features

## Contributing

When adding new dashboard features:

1. Maintain coherent family experience design
2. Ensure natural language integration compatibility
3. Add comprehensive API documentation
4. Include family context in all G$ operations
5. Test across different family configurations

This dashboard represents the "first priority - coherence" requested, providing families with a delightful, unified experience for managing their G$ rewards and family interactions through AI agents.