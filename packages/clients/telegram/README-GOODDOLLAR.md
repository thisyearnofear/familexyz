# @elizaos/client-telegram

FamilyXYZ Telegram Client with Comprehensive GoodDollar Integration

## Overview

The Telegram client provides a delightful family experience through a comprehensive bot interface that integrates seamlessly with GoodDollar G$ rewards. This is the **priority platform for coherence** in the FamilyXYZ ecosystem, designed to bring families together through AI-powered conversations and real-time G$ incentives.

## Key Features

### 🏠 Family-First Design

- **Coherent Experience**: Unified interface for all family G$ operations
- **Cross-Generational**: UI/UX designed for all family members
- **Real-time Updates**: Live balance updates and streaming notifications
- **Natural Language**: Chat naturally with G$ operations embedded
- **Inline Keyboards**: Beautiful, intuitive button interfaces

### 💰 Complete GoodDollar Integration

#### Wallet Management
- Real-time G$ balance display with emoji-rich formatting
- Multi-chain support (Celo/Fuse) with network status
- UBI claiming with one-tap convenience
- Transaction history with family context
- Quick send options with preset amounts

#### Family Verification Hub
- Family member verification status dashboard
- Identity management with sybil resistance
- Role-based access (parent/child/grandparent)
- Progress tracking with visual indicators
- Verification reminders and guidance

#### Streaming Rewards
- Active stream overview with beautiful formatting
- Family allowance management (monthly/weekly)
- Milestone-based reward tracking
- Real-time flow rate calculations
- Stream creation and management

#### Activity Feed
- Recent family interactions with G$ rewards
- Cross-generational engagement highlights
- AI agent interaction rewards
- Family milestone celebrations
- UBI claim history

### 🤖 AI Agent Integration

Seamlessly connects with all 5 FamilyXYZ AI agents:

- **🧠 Wisdom Agent**: Philosophy rewards tracked in activity feed
- **💑 Intimacy Agent**: Relationship milestone celebrations
- **👵👦 Bridge Agent**: Generational bonding rewards
- **🧘 Presence Agent**: Mindfulness interaction bonuses
- **🚀 Growth Agent**: Achievement rewards and goal progress

## Bot Commands

### Essential Family Commands

```
/start          - Welcome & family onboarding
/dashboard      - Complete family overview with health score
/wallet         - G$ balance, UBI status, transaction history
/family         - Verification status & member management
/streams        - Active allowances & milestone rewards
/activity       - Recent family interactions & G$ earnings
```

### Quick Actions

```
/claim          - Claim daily UBI rewards
/send           - Send G$ to family members
/allowance      - Set up family allowances
/verify         - Complete identity verification
/help_gooddollar - Comprehensive help & feature guide
```

### Natural Language Support

The bot understands natural family language:

```
"Send 10 G$ to my child for completing homework"
"Set up monthly allowance of 100 G$ for my daughter"
"Show me our family verification status"
"Claim my daily UBI reward"
"Create milestone stream for chores completion"
"Check our family health score"
```

## Inline Keyboard Interface

### Wallet Dashboard
```
💰 Claim UBI    |    📤 Send G$
🌊 View Streams |    👥 Family Status
📊 Dashboard    |    🔄 Refresh
```

### Family Management
```
✅ Verify Member  |  👥 Add Member
📱 Share Invite   |  🔄 Refresh
```

### Streaming Overview
```
💰 New Allowance |  🎯 New Milestone
⚙️ Manage Streams |  🔄 Refresh
```

### Quick Send Options
```
5 G$    |  10 G$   |  25 G$
50 G$   |  100 G$  |  Custom
📋 Recent Recipients  |  🔙 Back
```

## Setup & Configuration

### Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Optional  
TELEGRAM_API_ROOT=https://api.telegram.org

# GoodDollar Configuration (required for G$ features)
GOODDOLLAR_NETWORK=fuse
GOODDOLLAR_TOKEN_ADDRESS=0x495d133B938596C9984d462F007B676bDc57eCEC
GOODDOLLAR_RPC_URL=https://rpc.fuse.io
GOODDOLLAR_PRIVATE_KEY=your_private_key_here

# Optional G$ Features
GOODDOLLAR_ENABLE_UBI_CLAIM=true
GOODDOLLAR_ENABLE_FACE_VERIFICATION=true
GOODDOLLAR_ENABLE_STREAMING=true
GOODDOLLAR_SUPER_TOKEN_ADDRESS=0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f

# Family Group Management
TELEGRAM_ALLOWED_GROUP_IDS=["group_id_1", "group_id_2"]
TELEGRAM_SHOULD_ONLY_JOIN_ALLOWED_GROUPS=true
```

### Bot Setup with BotFather

1. **Create Bot**:
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Choose name: "FamilyXYZ Bot"
   - Choose username: "familyxyz_bot" (or available alternative)
   - Save the bot token

2. **Configure Bot**:
   ```
   /setdescription - FamilyXYZ: Strengthen family bonds with AI agents & G$ rewards
   /setabouttext - Earn G$ for meaningful family interactions with AI-powered conversations
   /setuserpic - Upload family-friendly bot avatar
   /setcommands - Upload command list (see below)
   ```

3. **Bot Commands for BotFather**:
   ```
   start - Welcome & family onboarding
   dashboard - Complete family overview
   wallet - G$ balance & UBI status  
   family - Family verification status
   streams - Active allowances & rewards
   activity - Recent family interactions
   claim - Claim daily UBI rewards
   send - Send G$ to family members
   allowance - Set up family allowances
   verify - Complete identity verification
   help_gooddollar - Complete help guide
   ```

## Usage Examples

### Family Onboarding Flow

1. **User starts bot**: `/start`
   - Welcome message with family benefits
   - Quick setup guide
   - Onboarding buttons

2. **Verification**: `/verify` or "Verify me as a parent"
   - Identity verification guidance
   - Face verification instructions
   - Family role confirmation

3. **Wallet setup**: `/wallet`
   - Balance display
   - Network status
   - UBI eligibility

4. **Stream creation**: "Set up monthly allowance of 100 G$ for my child"
   - Natural language processing
   - Stream configuration
   - Real-time activation

### Daily Family Usage

```javascript
// Morning UBI claim
User: "/claim"
Bot: "🎉 UBI Claimed Successfully! +10.0 G$ 
     ⏰ Next claim: 24 hours"

// Reward child for homework
User: "Send 5 G$ to my child for completing math homework"
Bot: "📤 Sending 5 G$ to Child User...
     ✅ Transfer complete! 
     🎯 Homework reward earned!"

// Check family progress
User: "/dashboard"
Bot: "📊 Family Health Score: 85%
     💰 Total Balance: 234.67 G$
     🌊 Active Streams: 2
     👥 Verified Members: 2/3"
```

### Stream Management

```javascript
// Create allowance
User: "Set up weekly allowance of 25 G$ for my daughter"
Bot: "🌊 Creating allowance stream...
     ✅ Stream active! 25 G$ per week
     💰 Flow rate: 0.149 G$/hour"

// Check streams
User: "/streams"  
Bot: "🌊 Family Streaming Overview
     📊 Active Streams: 2
     💰 Daily Flow: ~15.25 G$
     [Beautiful formatted stream details]"
```

## Family Chat Integration

### Group Chat Features

- **Smart Context**: Bot understands family relationships
- **Reward Notifications**: Real-time G$ earning alerts
- **Group Allowances**: Stream setup for multiple children
- **Family Challenges**: Collaborative goal tracking
- **Privacy Aware**: Sensitive data in private messages only

### Example Group Interaction

```
Parent: "Great job on your test, Sarah! 📚"
Bot: "🎉 Achievement detected! Sending 5 G$ reward to Sarah for academic excellence!"

Grandparent: "I have a story about when your dad was young..."
Bot: "👴 Story time! +3.5 G$ generational bonding reward for Grandparent!"

Child: "Thanks for the allowance this week! 💝"  
Bot: "💰 Weekly allowance stream active: 25 G$ flowing to Sarah"
```

## Technical Architecture

### Message Flow

```
User Message → Telegram API → TelegramClient 
            → GoodDollarTelegramBot → Service Layer
            → Response Formatting → Inline Keyboards
            → Telegram API → User
```

### Service Integration

```typescript
// GoodDollar services injected into bot
const gdService = runtime.getService<GoodDollarService>(GoodDollarService);
const identityService = runtime.getService<IdentityService>(IdentityService);  
const streamingService = runtime.getService<StreamingService>(StreamingService);

// Natural language processing
const response = await processNaturalLanguage(userMessage);
const gDollarAction = extractGDollarIntent(response);
await executeGDollarAction(gDollarAction);
```

### Error Handling

- **Service Unavailable**: Graceful degradation with informative messages
- **Network Issues**: Retry mechanisms with user feedback
- **Insufficient Balance**: Clear error messages with solution suggestions
- **Verification Needed**: Guided verification flow

## Message Formatting

### Rich Text Formatting

```typescript
// Wallet overview with emoji and markdown
const walletMessage = 
    `💰 *Family Wallet Overview*\n\n` +
    `📍 Address: \`${address.slice(0,6)}...${address.slice(-4)}\`\n` +
    `🌐 Network: ${network.toUpperCase()}\n` +
    `💎 Balance: **${balance} G$**\n` +
    `${canClaim ? '🎁 UBI Ready!' : '⏰ Next UBI in 18h'}\n\n` +
    `🏆 *Family Features:* ✅ All Active`;
```

### Interactive Elements

```typescript
// Inline keyboard with contextual actions
const keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('💰 Claim UBI', 'gd_claim_ubi'),
        Markup.button.callback('📤 Send G$', 'gd_send_menu')
    ],
    [
        Markup.button.callback('🌊 Streams', 'gd_streams'),
        Markup.button.callback('🔄 Refresh', 'gd_refresh')
    ]
]);
```

## Family Experience Design

### Coherence Principles

1. **Unified Visual Language**: Consistent emoji usage across all features
2. **Natural Conversation**: Commands feel like family chat, not technical operations
3. **Progressive Disclosure**: Advanced features unlock as family engages
4. **Context Awareness**: Bot remembers family relationships and preferences
5. **Celebration Focus**: Every G$ reward feels like a family achievement

### User Journey Optimization

```
First Contact → Welcome & Value Prop → Quick Setup → First Success
    ↓
Regular Usage → Daily UBI Claims → Family Interactions → Stream Setup
    ↓  
Power Features → Advanced Streaming → Family Challenges → Cross-Gen Rewards
```

### Accessibility Features

- **Multi-generational**: Simple commands for grandparents, rich features for tech-savvy
- **Mobile-first**: Optimized for phone usage patterns
- **Offline Resilience**: Cached data and retry mechanisms
- **Multiple Languages**: Ready for localization

## Development

### Building

```bash
cd packages/clients/telegram
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Local Bot Testing

```bash
# Set environment variables
export TELEGRAM_BOT_TOKEN=your_test_bot_token
export GOODDOLLAR_NETWORK=fuse
export GOODDOLLAR_PRIVATE_KEY=test_key

# Start development server
npm run dev

# Test with your bot in Telegram
# Use @YourTestBot for development
```

## Security & Privacy

### Family Data Protection

- **Minimal Data Storage**: Only essential family relationship data
- **Encryption**: All sensitive data encrypted in transit
- **Privacy Controls**: Users control data sharing preferences
- **Compliance**: GDPR-ready data handling

### Bot Security

- **Token Protection**: Bot tokens stored securely in environment
- **Group Authorization**: Configurable allowed groups list
- **Rate Limiting**: Built-in message throttling
- **Error Sanitization**: No sensitive data in error messages

## Monitoring & Analytics

### Family Engagement Metrics

- Daily active families
- G$ rewards distributed
- Stream creation rate
- Verification completion rate
- Cross-generational interaction frequency

### Bot Performance

- Message response times
- Command success rates
- Error frequency by type
- User flow completion rates

## Contributing

When adding new Telegram features:

1. **Maintain Family Context**: All features should enhance family relationships
2. **Beautiful Formatting**: Rich text with consistent emoji usage
3. **Natural Language**: Support conversational interactions
4. **Inline Keyboards**: Provide quick action buttons
5. **Graceful Degradation**: Handle service unavailability elegantly
6. **Comprehensive Testing**: Test across different family configurations

## Roadmap

### Immediate Enhancements
- [ ] Voice message support for multi-generational accessibility
- [ ] Photo sharing with G$ rewards for family moments
- [ ] Scheduled allowance notifications
- [ ] Family milestone celebration automation

### Advanced Features
- [ ] Multi-language family support
- [ ] Voice-to-text for grandparents
- [ ] Family calendar integration with G$ rewards
- [ ] Cross-family challenges and leaderboards
- [ ] Integration with external family apps

This Telegram integration represents the "priority platform for coherence" in the FamilyXYZ ecosystem, providing families with a delightful, unified experience for managing G$ rewards through natural conversation and beautiful interfaces.