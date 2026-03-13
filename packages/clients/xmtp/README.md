# XMTP Client for FamilyXYZ

Web3-native encrypted messaging for FamilyXYZ agents using XMTP protocol.

## Features

- ✅ End-to-end encrypted conversations
- ✅ Wallet-based authentication (via viem)
- ✅ 1:1 and group conversation management
- ✅ Automatic conversation streaming
- ✅ HCS message receipt logging (privacy-preserving)
- ✅ Content hash verification for message receipts

## Installation

```bash
pnpm add @elizaos/client-xmtp
```

## Usage

### Basic Setup

```typescript
import { createXmtpClient, type XmtpChannelConfig } from "@elizaos/client-xmtp";
import { HederaService } from "@elizaos/hedera-core";

// Initialize HederaService
const hederaService = HederaService.getInstance({
  network: "testnet",
  accountId: process.env.HEDERA_OPERATOR_ID!,
  privateKey: process.env.HEDERA_OPERATOR_KEY!,
  familyTopicId: process.env.HEDERA_FAMILY_TOPIC_ID,
});

// Create XMTP client
const xmtpClient = createXmtpClient();

// Connect with wallet-derived identity
await xmtpClient.connect({
  credentials: {
    privateKey: process.env.XMTP_WALLET_PRIVATE_KEY!,
  },
  options: {
    env: "dev", // or "production"
    hcsTopicId: process.env.HEDERA_XMTP_RECEIPTS_TOPIC_ID,
    hederaService, // For HCS receipt logging
  },
});

// Register message handler
xmtpClient.onMessage(async (message) => {
  console.log(`Received from ${message.from}: ${message.text}`);
  
  // Process with agent...
  
  // Send response
  await xmtpClient.sendMessage({
    conversationId: message.conversationId,
    text: "Hello from your family agent!",
  });
});
```

### HCS Receipt Logging

Message receipts are automatically logged to Hedera Consensus Service when:
1. `hederaService` is provided in config
2. `hcsTopicId` is configured (or uses familyTopicId as fallback)

Receipts include:
- Message ID
- Conversation ID
- Sender/recipient addresses
- Content hash (SHA-256, not the actual content)
- Timestamp
- Message type (xmtp/telegram/direct)

**Privacy-Preserving:** Only the hash is logged, not the message content.

### Manual Receipt Logging

```typescript
import { logMessageReceiptToHcs, generateContentHash } from "@elizaos/client-xmtp";

const contentHash = await generateContentHash(messageContent);

const result = await logMessageReceiptToHcs(hederaService, {
  messageId: "msg_123",
  conversationId: "conv_456",
  sender: "0x...",
  recipient: "agent_wisdom",
  timestamp: Date.now(),
  contentHash,
  messageType: "xmtp",
});

if (result.success) {
  console.log(`Receipt logged: ${result.transactionId}`);
}
```

## Configuration

### Environment Variables

```bash
# XMTP Configuration
XMTP_WALLET_PRIVATE_KEY=your_wallet_private_key
XMTP_ENV=dev  # local, dev, or production

# HCS Receipt Logging (optional)
HEDERA_XMTP_RECEIPTS_TOPIC_ID=0.0.xxxxx
```

### Network Options

| Network | Use Case |
|---------|----------|
| `local` | Local XMTP backend (Docker) |
| `dev` | XMTP test network (recommended for development) |
| `production` | Production apps |

## Migration to XMTP Agent SDK

**Note:** XMTP has released a dedicated Agent SDK (`@xmtp/agent-sdk` v2.0.1) that is purpose-built for building agents.

### Current Implementation (`@xmtp/xmtp-js`)

**Pros:**
- More control over low-level operations
- Custom message handling
- Direct integration with existing code

**Cons:**
- More boilerplate code
- Manual identity management
- Manual conversation streaming

### Recommended: XMTP Agent SDK (`@xmtp/agent-sdk`)

**Pros:**
- Purpose-built for agents
- Built-in SQLite persistence
- Event-driven architecture (`on('text')`)
- Automatic installation management
- Built-in group chat support
- Rich content types (actions, reactions, replies)
- Test playground (xmtp.chat)

**Cons:**
- Less low-level control
- Newer library (less battle-tested)

### Migration Example

```typescript
// Current approach (this package)
import { createXmtpClient } from "@elizaos/client-xmtp";
const client = createXmtpClient();
await client.connect({ credentials: { privateKey } });
client.onMessage(handler);

// Agent SDK approach (recommended)
import { Agent } from "@xmtp/agent-sdk";
const agent = await Agent.createFromEnv();
agent.on('text', async (ctx) => {
  await ctx.conversation.sendText('Hello!');
});
await agent.start();
```

**See:** [XMTP Agent SDK Documentation](https://docs.xmtp.org/agents/get-started/build-an-agent)

## API Reference

### XmtpFamilyClient

#### Methods

- `connect(config: XmtpChannelConfig)` - Connect to XMTP network
- `disconnect()` - Disconnect from network
- `sendMessage(message: OutgoingMessage)` - Send encrypted message
- `onMessage(handler)` - Register message handler
- `getStatus()` - Get connection status
- `getConversations()` - Get active conversations

#### Events

Messages are delivered via the `onMessage` handler with `IncomingMessage` objects containing:
- `id` - Message ID
- `from` - Sender address
- `conversationId` - Conversation identifier
- `text` - Message content
- `timestamp` - Message timestamp
- `metadata` - Platform-specific metadata

## Testing

Use **[xmtp.chat](https://xmtp.chat)** - the official XMTP playground:
1. Enter your agent's address (`client.getStatus().details?.address`)
2. Start a conversation and send messages

## Debugging

Enable debug logging:

```typescript
import { elizaLogger } from "@elizaos/core";
elizaLogger.setLevel("debug");
```

## Resources

- [XMTP Documentation](https://xmtp.org/docs)
- [XMTP Agent SDK](https://docs.xmtp.org/agents)
- [XMTP Playground](https://xmtp.chat)
- [XMTP GitHub](https://github.com/xmtp)

## License

MIT
