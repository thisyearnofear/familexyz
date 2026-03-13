# XMTP Client for FamilyXYZ

Web3-native encrypted messaging for FamilyXYZ agents using **XMTP Agent SDK** - purpose-built for autonomous agents.

## Features

- ✅ End-to-end encrypted conversations
- ✅ **Agent SDK** - Purpose-built for autonomous agents (v2.0.1)
- ✅ **Built-in SQLite persistence** - Automatic identity and message history storage
- ✅ **Event-driven architecture** - Simple `on('text')` handlers
- ✅ Wallet-based authentication
- ✅ **Automatic installation management** - Handles 10-installation limit per inbox
- ✅ **Group chat support** - Built-in with permissions
- ✅ **Rich content types** - Actions, reactions, replies, attachments
- ✅ HCS message receipt logging (privacy-preserving)
- ✅ **Test playground** - xmtp.chat for testing agents

## Installation

```bash
pnpm add @elizaos/client-xmtp
```

## Quick Start

### Basic Setup (5 lines!)

```typescript
import { createXmtpClient } from "@elizaos/client-xmtp";

const client = createXmtpClient();

await client.connect({
  credentials: {
    privateKey: process.env.XMTP_WALLET_KEY,
  },
  options: { env: "dev" }
});

client.onMessage(async (message) => {
  console.log(`Received: ${message.text}`);
  await client.sendMessage({
    conversationId: message.conversationId,
    text: "Hello from your family agent! 🤖",
  });
});
```

### With HCS Receipt Logging

```typescript
import { createXmtpClient } from "@elizaos/client-xmtp";
import { HederaService } from "@elizaos/hedera-core";

// Initialize HederaService
const hederaService = HederaService.getInstance({
  network: "testnet",
  accountId: process.env.HEDERA_OPERATOR_ID!,
  privateKey: process.env.HEDERA_OPERATOR_KEY!,
  familyTopicId: process.env.HEDERA_FAMILY_TOPIC_ID,
});

// Create XMTP client with HCS logging
const client = createXmtpClient();

await client.connect({
  credentials: {
    privateKey: process.env.XMTP_WALLET_KEY,
  },
  options: {
    env: "dev",
    hcsTopicId: process.env.HEDERA_XMTP_RECEIPTS_TOPIC_ID,
    hederaService, // Enables automatic HCS receipt logging
  },
});
```

## Configuration

### Environment Variables

```bash
# XMTP Configuration
XMTP_WALLET_KEY=your_wallet_private_key_hex
XMTP_ENV=dev  # local, dev, or production

# Database (auto-generated if not provided)
XMTP_DB_ENCRYPTION_KEY=64_hex_chars_32_bytes
XMTP_DB_PATH=./xmtp-db

# HCS Receipt Logging (optional)
HEDERA_XMTP_RECEIPTS_TOPIC_ID=0.0.xxxxx
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=your_private_key
```

### Network Options

| Network | Use Case |
|---------|----------|
| `local` | Local XMTP backend (Docker) |
| `dev` | **XMTP test network** (recommended for development) |
| `production` | Production apps |

## API Reference

### XmtpFamilyClient

Implements `FamilyMessagingAdapter` interface - compatible with all FamilyXYZ messaging clients.

#### Methods

```typescript
// Connect to XMTP network
await client.connect(config: XmtpChannelConfig)

// Disconnect from network
await client.disconnect()

// Send encrypted message
const messageId = await client.sendMessage({
  conversationId: "xmtp:0x...",
  text: "Hello!",
})

// Register message handler (event-driven)
client.onMessage(async (message: IncomingMessage) => {
  console.log(`Received from ${message.from}: ${message.text}`)
})

// Get connection status
const status = client.getStatus()
// { isConnected: true, details: { address: "0x...", inboxId: "..." } }

// Get active conversations
const conversations = client.getConversations()
```

#### Events (Agent SDK)

The Agent SDK uses event-driven architecture:

- `start` - Fired when agent is ready
- `text` - Fired when a text message is received
- `error` - Fired on errors

```typescript
client.getAgent()?.on('text', async (ctx) => {
  await ctx.conversation.sendText('Hello!');
});
```

### IncomingMessage

```typescript
interface IncomingMessage {
  id: string;                    // Message ID
  from: string;                  // Sender address
  fromUsername?: string;         // Username (if available)
  conversationId: string;        // Conversation identifier
  text: string;                  // Message content
  timestamp: number;             // Message timestamp
  metadata?: {
    isXmtp: true;
    encrypted: true;
    agentSdk: true;
  };
}
```

### OutgoingMessage

```typescript
interface OutgoingMessage {
  conversationId: string;        // Target conversation
  inReplyTo?: string;            // Reply-to message ID
  text: string;                  // Message content
  attachments?: Media[];         // Optional attachments
  metadata?: Record<string, unknown>;
}
```

## HCS Receipt Logging

Message receipts are **automatically** logged to Hedera Consensus Service when:
1. `hederaService` is provided in config
2. `hcsTopicId` is configured (or uses `familyTopicId` fallback)

### What Gets Logged

Receipts include (HCS-10 compatible):
```json
{
  "v": "1.0",
  "mid": "message-id",
  "cid": "conversation-id",
  "s": "sender-address",
  "r": "recipient-agent",
  "ts": 1234567890,
  "h": "sha256-hash-of-content",
  "t": "xmtp",
  "standard": "HCS-10"
}
```

**Privacy-Preserving:** Only the **hash** is logged, **not the message content**.

### Manual Receipt Logging

```typescript
import { logMessageReceiptToHcs, generateContentHash } from "@elizaos/client-xmtp";

const contentHash = await generateContentHash("Hello, world!");

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
  console.log(`✅ Receipt logged: ${result.transactionId}`);
}
```

## Testing

### Use xmtp.chat Playground

1. Start your agent
2. Log the agent address: `console.log(client.getStatus().details?.address)`
3. Go to **[xmtp.chat](https://xmtp.chat)**
4. Enter your agent's address
5. Start chatting!

### Test with Code

```typescript
import { createXmtpClient } from "@elizaos/client-xmtp";
import { getTestUrl } from "@xmtp/agent-sdk";

const client = createXmtpClient();
await client.connect({ /* config */ });

// Get test URL for this agent
const testUrl = getTestUrl(client.getAgent()!.client);
console.log(`Test your agent at: ${testUrl}`);
```

## Migration from @xmtp/xmtp-js

If you're migrating from the legacy `@xmtp/xmtp-js` implementation:

### Before (xmtp-js)

```typescript
import { Client } from "@xmtp/xmtp-js";
const client = await Client.create(wallet);
const stream = await client.conversations.stream();
for await (const conversation of stream) {
  // Handle conversation...
}
```

### After (Agent SDK)

```typescript
import { Agent } from "@xmtp/agent-sdk";
const agent = await Agent.createFromEnv();
agent.on('text', async (ctx) => {
  await ctx.conversation.sendText('Hello!');
});
await agent.start();
```

**Benefits:**
- ✅ 60% less code
- ✅ Automatic persistence
- ✅ Event-driven (simpler)
- ✅ Built-in installation management

## Debugging

Enable debug logging:

```typescript
import { elizaLogger } from "@elizaos/core";
elizaLogger.setLevel("debug");
```

Common issues:

| Issue | Solution |
|-------|----------|
| "Private key required" | Ensure `XMTP_WALLET_KEY` is set in hex format |
| "Installation limit" | Agent SDK auto-manages this (10 per inbox) |
| "Database locked" | Check `XMTP_DB_PATH` is writable |
| HCS logging fails | Verify `hederaService` is initialized |

## Architecture

```
┌─────────────────────────────────────────┐
│     FamilyXYZ Agent Runtime             │
├─────────────────────────────────────────┤
│  FamilyMessagingAdapter (interface)     │
├─────────────────────────────────────────┤
│  XmtpFamilyClient (Agent SDK)           │
│  ├─ Event-driven message handling       │
│  ├─ SQLite persistence (auto)           │
│  └─ HCS receipt logging (optional)      │
├─────────────────────────────────────────┤
│  XMTP Network (decentralized)           │
│  Hedera Consensus Service (HCS-10)      │
└─────────────────────────────────────────┘
```

## Resources

- **[XMTP Agent SDK Docs](https://docs.xmtp.org/agents)** - Official documentation
- **[XMTP Agent SDK on npm](https://www.npmjs.com/package/@xmtp/agent-sdk)** - Latest version
- **[xmtp.chat](https://xmtp.chat)** - Test playground
- **[XMTP GitHub](https://github.com/xmtp)** - Source code and examples
- **[HCS-10 Standard](https://docs.hedera.com/hcs)** - Hedera Consensus Service

## License

MIT

---

**Built with XMTP Agent SDK v2.0.1** - Purpose-built for autonomous agents 🤖
