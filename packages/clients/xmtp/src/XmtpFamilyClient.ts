/**
 * XMTP Family Client - Web3-native encrypted messaging
 * 
 * Uses XMTP Agent SDK (@xmtp/agent-sdk) - purpose-built for autonomous agents
 * Implements FamilyMessagingAdapter interface from @elizaos/core
 * 
 * Features:
 * - End-to-end encrypted conversations
 * - Agent identity derived from wallet
 * - Built-in SQLite persistence
 * - Event-driven message handling
 * - HCS message receipt logging (privacy-preserving)
 * - Group chat support
 */

import { Agent } from "@xmtp/agent-sdk";
import type {
    FamilyMessagingAdapter,
    IncomingMessage,
    OutgoingMessage,
    ChannelStatus,
    ChannelConfig,
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import type { HederaService } from "@elizaos/hedera-core";
import { generateContentHash, logMessageReceiptToHcs, type MessageReceipt } from "./HcsReceiptLogger.js";

/**
 * XMTP-specific configuration
 */
export interface XmtpChannelConfig extends ChannelConfig {
    credentials: {
        /** Private key for agent identity (hex format) */
        privateKey: string;
    };
    options?: {
        /** XMTP environment: local, dev, or production */
        env?: "local" | "dev" | "production";
        /** HCS topic ID for message receipts */
        hcsTopicId?: string;
        /** HederaService instance for HCS logging */
        hederaService?: HederaService;
        /** Database path for SQLite persistence (default: ./xmtp-db) */
        dbPath?: string;
    };
}

/**
 * Conversation tracking data
 */
interface ConversationData {
    conversationId: string;
    peerAddress: string;
    createdAt: number;
    lastMessageAt: number;
    messageCount: number;
}

/**
 * XMTP Family Client - implements FamilyMessagingAdapter
 * 
 * Uses XMTP Agent SDK for simplified, production-ready messaging
 * 
 * @example
 * ```typescript
 * const client = createXmtpClient();
 * await client.connect({
 *   credentials: { privateKey: process.env.XMTP_WALLET_KEY },
 *   options: { env: "dev", hederaService }
 * });
 * client.onMessage(async (msg) => {
 *   await client.sendMessage({ conversationId: msg.conversationId, text: "Hello!" });
 * });
 * ```
 */
export class XmtpFamilyClient implements FamilyMessagingAdapter {
    readonly name = "xmtp";

    private agent: Agent | null = null;
    private messageHandlers: Array<(message: IncomingMessage) => void> = [];
    private conversations: Map<string, ConversationData> = new Map();
    private status: ChannelStatus = {
        isConnected: false,
        error: "Not initialized",
    };
    private hcsTopicId?: string;
    private hederaService?: HederaService;
    private dbPath?: string;

    /**
     * Connect to XMTP network with Agent SDK
     * 
     * Benefits over manual implementation:
     * - Automatic identity management
     * - Built-in SQLite persistence
     * - Event-driven architecture
     * - Installation limit handling (10 per inbox)
     */
    async connect(config: XmtpChannelConfig): Promise<void> {
        try {
            const { privateKey } = config.credentials;
            const { 
                env = "dev", 
                hcsTopicId, 
                hederaService,
                dbPath = "./xmtp-db"
            } = config.options || {};

            if (!privateKey) {
                throw new Error("Private key is required for XMTP identity");
            }

            elizaLogger.info(`[XMTP] Initializing Agent SDK client (${env} network)...`);

            // Store configuration
            this.hcsTopicId = hcsTopicId;
            this.hederaService = hederaService;
            this.dbPath = dbPath;

            // Create Agent instance with environment variables
            // Agent SDK handles identity, persistence, and connection automatically
            process.env.XMTP_ENV = env;
            process.env.XMTP_WALLET_KEY = privateKey;
            process.env.XMTP_DB_ENCRYPTION_KEY = await this.generateDbEncryptionKey();
            process.env.XMTP_DB_PATH = dbPath;

            this.agent = await Agent.createFromEnv();

            // Update status
            this.status = {
                isConnected: true,
                lastActivity: Date.now(),
                details: {
                    address: this.agent.address,
                    environment: env,
                    inboxId: this.agent.inboxId,
                },
            };

            elizaLogger.info(
                `[XMTP] ✅ Agent connected: ${this.agent.address}`
            );

            // Set up event-driven message handling
            this.setupMessageHandlers();

            // Start the agent
            await this.agent.start();

            elizaLogger.info(`[XMTP] 🚀 Agent started and ready for messages`);
        } catch (error) {
            this.status = {
                isConnected: false,
                error: error instanceof Error ? error.message : "Connection failed",
            };
            elizaLogger.error("[XMTP] Connection error:", error);
            throw error;
        }
    }

    /**
     * Disconnect from XMTP network
     */
    async disconnect(): Promise<void> {
        if (this.agent) {
            elizaLogger.info("[XMTP] Stopping agent...");
            // Agent SDK handles cleanup
            this.agent = null;
        }

        this.status = {
            isConnected: false,
            error: "Disconnected",
        };

        elizaLogger.info("[XMTP] Agent disconnected");
    }

    /**
     * Send an encrypted message via XMTP
     */
    async sendMessage(message: OutgoingMessage): Promise<string> {
        if (!this.agent) {
            throw new Error("XMTP agent not connected");
        }

        try {
            const { conversationId, text } = message;

            // Get or create conversation
            // Agent SDK simplifies conversation management
            const conversation = await this.getOrCreateConversation(conversationId);

            if (!conversation) {
                throw new Error(`Conversation not found: ${conversationId}`);
            }

            // Send encrypted message
            await conversation.sendText(text);

            elizaLogger.debug(
                `[XMTP] ✅ Message sent to ${conversationId}`
            );

            // Log to HCS for verifiable receipt (privacy-preserving)
            if (this.hederaService) {
                const contentHash = await generateContentHash(text);
                await this.logMessageToHCS(
                    conversationId,
                    `msg_${Date.now()}`,
                    contentHash,
                    text
                );
            }

            return `msg_${Date.now()}`;
        } catch (error) {
            elizaLogger.error("[XMTP] Send message error:", error);
            throw error;
        }
    }

    /**
     * Register message handler for incoming encrypted messages
     * 
     * Agent SDK uses event-driven architecture:
     * agent.on('text', handler)
     */
    onMessage(handler: (message: IncomingMessage) => void): void {
        this.messageHandlers.push(handler);
        elizaLogger.debug(
            `[XMTP] Registered message handler (${this.messageHandlers.length} total)`
        );

        // If agent is already running, set up handler immediately
        if (this.agent) {
            this.setupMessageHandlers();
        }
    }

    /**
     * Get current connection status
     */
    getStatus(): ChannelStatus {
        return this.status;
    }

    /**
     * Get list of active conversations
     */
    getConversations(): ConversationData[] {
        return Array.from(this.conversations.values());
    }

    /**
     * Get agent instance
     */
    getAgent(): Agent | null {
        return this.agent;
    }

    /**
     * Set up event-driven message handlers using Agent SDK
     */
    private setupMessageHandlers(): void {
        if (!this.agent) {
            return;
        }

        // Agent SDK event-driven approach
        this.agent.on('text', async (ctx) => {
            const { conversation, message } = ctx;

            const incomingMessage: IncomingMessage = {
                id: message.id,
                from: message.senderAddress,
                fromUsername: undefined,
                conversationId: conversation.topic,
                text: message.content,
                timestamp: message.sentAt?.getTime() || Date.now(),
                metadata: {
                    isXmtp: true,
                    encrypted: true,
                    agentSdk: true,
                },
            };

            elizaLogger.debug(
                `[XMTP] 📨 Received message: ${incomingMessage.text.substring(0, 50)}...`
            );

            // Update conversation tracking
            this.updateConversation(conversation.topic, conversation.peerAddress);

            // Notify all handlers
            for (const handler of this.messageHandlers) {
                try {
                    await handler(incomingMessage);
                } catch (error) {
                    elizaLogger.error(
                        "[XMTP] Message handler error:",
                        error
                    );
                }
            }

            this.updateActivity();
        });

        // Handle agent start event
        this.agent.on('start', () => {
            elizaLogger.info(
                `[XMTP] 🚀 Agent started: ${this.agent?.address}`
            );
        });

        // Handle errors
        this.agent.on('error', (error) => {
            elizaLogger.error("[XMTP] Agent error:", error);
            this.status = {
                isConnected: this.status.isConnected,
                error: error.message,
                lastActivity: Date.now(),
            };
        });
    }

    /**
     * Get or create conversation
     * Agent SDK simplifies conversation management
     */
    private async getOrCreateConversation(conversationId: string): Promise<any> {
        if (!this.agent) {
            throw new Error("Agent not connected");
        }

        // Check cache
        const cached = this.conversations.get(conversationId);
        if (cached) {
            const conversations = await this.agent.client.conversations.list();
            return conversations.find((c: any) => c.topic === conversationId);
        }

        // For new conversations, extract peer address from ID
        // Format: "xmtp:<peer_address>"
        const peerAddress = conversationId.replace("xmtp:", "");

        // Create new conversation via Agent SDK
        const conversation = await this.agent.client.conversations.newConversation(
            peerAddress
        );

        // Cache conversation data
        this.updateConversation(conversation.topic, conversation.peerAddress);

        return conversation;
    }

    /**
     * Update conversation tracking
     */
    private updateConversation(conversationId: string, peerAddress: string): void {
        const existing = this.conversations.get(conversationId);
        
        this.conversations.set(conversationId, {
            conversationId,
            peerAddress,
            createdAt: existing?.createdAt || Date.now(),
            lastMessageAt: Date.now(),
            messageCount: (existing?.messageCount || 0) + 1,
        });
    }

    /**
     * Update last activity timestamp
     */
    private updateActivity(): void {
        this.status.lastActivity = Date.now();
    }

    /**
     * Generate database encryption key
     * In production, store this securely
     */
    private async generateDbEncryptionKey(): Promise<string> {
        // Generate 32-byte key (64 hex chars)
        // In production, derive from wallet key or store in secrets manager
        const keyBytes = crypto.getRandomValues(new Uint8Array(32));
        return Array.from(keyBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Log message hash to HCS for verifiable receipt
     * Privacy-preserving: only hash is logged, not content
     */
    private async logMessageToHCS(
        conversationId: string,
        messageId: string,
        contentHash: string,
        content: string
    ): Promise<void> {
        try {
            if (!this.hederaService) {
                elizaLogger.debug(
                    `[HCS] Skipping receipt logging - HederaService not initialized`
                );
                return;
            }

            elizaLogger.debug(
                `[HCS] Logging message receipt: ${messageId} for ${conversationId}`
            );

            // Create receipt object
            const receipt: MessageReceipt = {
                messageId,
                conversationId,
                sender: this.agent?.address || "unknown",
                recipient: conversationId,
                timestamp: Date.now(),
                contentHash,
                messageType: "xmtp",
            };

            // Log to HCS using actual HederaService
            const result = await logMessageReceiptToHcs(
                this.hederaService,
                receipt,
                this.hcsTopicId
            );

            if (result.success) {
                elizaLogger.info(
                    `[HCS] ✅ Message receipt logged: ${messageId} → ${result.transactionId}`
                );
            } else {
                elizaLogger.warn(
                    `[HCS] ⚠️ Message receipt logging failed: ${result.error}`
                );
            }
        } catch (error) {
            elizaLogger.error("[HCS] Message receipt logging error:", error);
            // Don't throw - HCS logging is optional
        }
    }
}

/**
 * Factory function to create XMTP client instance
 */
export function createXmtpClient(): XmtpFamilyClient {
    return new XmtpFamilyClient();
}
