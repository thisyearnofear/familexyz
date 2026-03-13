/**
 * Telegram Family Client - Real implementation using grammy
 * Implements FamilyMessagingAdapter interface from @elizaos/core
 * 
 * Features:
 * - Bot setup with webhook/long-polling
 * - Message routing to agent runtimes
 * - Response delivery back to Telegram
 * - Slash commands: /start, /agents, /ask, /status
 * - Group mapping: Telegram group ID → familyId
 */

import { Bot, Context, session } from "grammy";
import type {
    FamilyMessagingAdapter,
    IncomingMessage,
    OutgoingMessage,
    ChannelStatus,
    ChannelConfig,
    Media,
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

/**
 * Telegram-specific configuration
 */
export interface TelegramChannelConfig extends ChannelConfig {
    credentials: {
        botToken: string;
    };
    options?: {
        webhookUrl?: string;
        pollingInterval?: number;
    };
}

/**
 * Group mapping data structure
 */
interface GroupMapping {
    telegramGroupId: string;
    telegramGroupTitle: string;
    familyId: string;
    enabledAgents: string[];
    createdAt: number;
}

/**
 * Session data for conversation tracking
 */
interface SessionData {
    userId: string;
    username?: string;
    lastMessageTime: number;
    conversationState: "active" | "idle";
}

/**
 * Telegram Family Client - implements FamilyMessagingAdapter
 */
export class TelegramFamilyClient implements FamilyMessagingAdapter {
    readonly name = "telegram";

    private bot: Bot<Context & { session: SessionData }> | null = null;
    private messageHandlers: Array<(message: IncomingMessage) => void> = [];
    private groupMappings: Map<string, GroupMapping> = new Map();
    private status: ChannelStatus = {
        isConnected: false,
        error: "Not initialized",
    };

    /**
     * Connect to Telegram using bot token
     */
    async connect(config: TelegramChannelConfig): Promise<void> {
        try {
            const { botToken } = config.credentials;
            const { webhookUrl, pollingInterval = 1000 } = config.options || {};

            if (!botToken) {
                throw new Error("Bot token is required");
            }

            elizaLogger.info("[Telegram] Initializing bot...");

            // Initialize grammy bot
            this.bot = new Bot<Context & { session: SessionData }>(botToken);

            // Setup session middleware for conversation tracking
            this.bot.use(
                session({
                    initial: (): SessionData => ({
                        userId: "",
                        lastMessageTime: 0,
                        conversationState: "idle",
                    }),
                })
            );

            // Setup command handlers
            this.setupCommandHandlers();

            // Setup message handlers
            this.setupMessageHandlers();

            // Start bot
            if (webhookUrl) {
                // Webhook mode for production
                elizaLogger.info(`[Telegram] Setting up webhook: ${webhookUrl}`);
                await this.bot.start({
                    webhook: {
                        url: webhookUrl,
                    },
                });
            } else {
                // Long polling for development
                elizaLogger.info("[Telegram] Starting long polling...");
                this.bot.start({
                    onStartInfo: {
                        allowedUpdates: ["message", "callback_query"],
                    },
                }).catch((err) => {
                    elizaLogger.error("[Telegram] Polling error:", err);
                    this.status = {
                        isConnected: false,
                        error: err instanceof Error ? err.message : "Polling failed",
                    };
                });
            }

            // Update status
            const botInfo = await this.bot.getMe();
            this.status = {
                isConnected: true,
                lastActivity: Date.now(),
                details: {
                    botUsername: botInfo.username,
                    botName: botInfo.first_name,
                },
            };

            elizaLogger.info(
                `[Telegram] Bot connected: @${botInfo.username}`
            );
        } catch (error) {
            this.status = {
                isConnected: false,
                error: error instanceof Error ? error.message : "Connection failed",
            };
            throw error;
        }
    }

    /**
     * Disconnect from Telegram
     */
    async disconnect(): Promise<void> {
        if (this.bot) {
            elizaLogger.info("[Telegram] Stopping bot...");
            await this.bot.stop();
            this.bot = null;
        }

        this.status = {
            isConnected: false,
            error: "Disconnected",
        };

        elizaLogger.info("[Telegram] Bot disconnected");
    }

    /**
     * Send a message to Telegram
     */
    async sendMessage(message: OutgoingMessage): Promise<string> {
        if (!this.bot) {
            throw new Error("Bot not connected");
        }

        try {
            const { conversationId, text, inReplyTo } = message;

            // Parse conversation ID (format: "telegram:<chat_id>")
            const chatId = this.parseConversationId(conversationId);

            if (!chatId) {
                throw new Error(`Invalid conversation ID: ${conversationId}`);
            }

            // Send message
            const sentMessage = await this.bot.api.sendMessage(chatId, text, {
                reply_to_message_id: inReplyTo,
            });

            elizaLogger.debug(
                `[Telegram] Message sent to ${chatId}: ${sentMessage.message_id}`
            );

            return sentMessage.message_id.toString();
        } catch (error) {
            elizaLogger.error("[Telegram] Send message error:", error);
            throw error;
        }
    }

    /**
     * Register message handler
     */
    onMessage(handler: (message: IncomingMessage) => void): void {
        this.messageHandlers.push(handler);
        elizaLogger.debug(
            `[Telegram] Registered message handler (${this.messageHandlers.length} total)`
        );
    }

    /**
     * Get current connection status
     */
    getStatus(): ChannelStatus {
        return this.status;
    }

    /**
     * Get group mappings
     */
    getGroupMappings(): GroupMapping[] {
        return Array.from(this.groupMappings.values());
    }

    /**
     * Add or update group mapping
     */
    addGroupMapping(mapping: GroupMapping): void {
        this.groupMappings.set(mapping.telegramGroupId, mapping);
        elizaLogger.info(
            `[Telegram] Added group mapping: ${mapping.telegramGroupTitle} → ${mapping.familyId}`
        );
    }

    /**
     * Setup command handlers
     */
    private setupCommandHandlers(): void {
        if (!this.bot) return;

        // /start command - Initialize family group
        this.bot.command("start", async (ctx) => {
            elizaLogger.info(
                `[Telegram] /start command from ${ctx.from?.username || "unknown"}`
            );

            const chatId = ctx.chat?.id.toString();
            const chatTitle = ctx.chat?.title || "Private Chat";
            const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

            if (isGroup) {
                // Auto-register group
                const mapping: GroupMapping = {
                    telegramGroupId: chatId!,
                    telegramGroupTitle: chatTitle,
                    familyId: `telegram_${chatId}`,
                    enabledAgents: ["wisdom", "intimacy", "presence"],
                    createdAt: Date.now(),
                };
                this.addGroupMapping(mapping);

                await ctx.reply(
                    `🤖 *FamilyXYZ Bot Activated*\n\n` +
                    `I've connected to *${chatTitle}*!\n\n` +
                    `*Active Agents:*\n` +
                    `🧠 Wisdom - Philosophy & EQ\n` +
                    `💑 Intimacy - Relationships\n` +
                    `🧘 Presence - Mindfulness\n\n` +
                    `Use /agents to configure which agents are active.\n` +
                    `Use /help to see all commands.`,
                    { parse_mode: "Markdown" }
                );
            } else {
                await ctx.reply(
                    `👋 Welcome to FamilyXYZ!\n\n` +
                    `Add me to your family group chat to get started.\n` +
                    `I'll help strengthen your family bonds with AI-powered insights.`
                );
            }

            this.updateActivity();
        });

        // /agents command - List/configure agents
        this.bot.command("agents", async (ctx) => {
            const chatId = ctx.chat?.id.toString();
            const mapping = chatId ? this.groupMappings.get(chatId) : null;

            if (!mapping) {
                await ctx.reply(
                    "⚠️ This group is not registered yet.\n" +
                    "Use /start to activate FamilyXYZ agents."
                );
                return;
            }

            const agentEmojis: Record<string, string> = {
                wisdom: "🧠",
                intimacy: "💑",
                presence: "🧘",
                growth: "🚀",
                generationalbridge: "👵👦",
            };

            const agentList = mapping.enabledAgents
                .map((agent) => `${agentEmojis[agent] || "🤖"} ${agent}`)
                .join("\n");

            await ctx.reply(
                `⚙️ *Active Agents for ${mapping.telegramGroupTitle}*\n\n` +
                `${agentList}\n\n` +
                `To configure agents, use the web dashboard.`,
                { parse_mode: "Markdown" }
            );

            this.updateActivity();
        });

        // /ask command - Direct question to specific agent
        this.bot.command("ask", async (ctx) => {
            const args = ctx.match?.split(" ");
            if (!args || args.length < 2) {
                await ctx.reply(
                    "❌ Usage: /ask <agent> <question>\n\n" +
                    "Example: /ask wisdom How can we improve communication?"
                );
                return;
            }

            const agentName = args[0].toLowerCase();
            const question = args.slice(1).join(" ");

            // Forward to message handlers for agent processing
            const incomingMessage: IncomingMessage = {
                id: ctx.message?.message_id.toString() || Date.now().toString(),
                from: ctx.from?.id.toString() || "unknown",
                fromUsername: ctx.from?.username,
                conversationId: `telegram:${ctx.chat?.id}`,
                text: `/ask ${agentName} ${question}`,
                timestamp: Date.now(),
                metadata: {
                    agentName,
                    isDirectQuestion: true,
                },
            };

            // Notify all handlers
            for (const handler of this.messageHandlers) {
                await handler(incomingMessage);
            }

            this.updateActivity();
        });

        // /status command - Show bot status
        this.bot.command("status", async (ctx) => {
            const status = this.getStatus();

            await ctx.reply(
                `📊 *FamilyXYZ Status*\n\n` +
                `*Connection:* ${status.isConnected ? "✅ Connected" : "❌ Disconnected"}\n` +
                `*Groups:* ${this.groupMappings.size}\n` +
                `*Last Activity:* ${status.lastActivity ? new Date(status.lastActivity).toLocaleString() : "Never"}`,
                { parse_mode: "Markdown" }
            );
        });

        // /help command
        this.bot.command("help", async (ctx) => {
            await ctx.reply(
                `📖 *FamilyXYZ Help*\n\n` +
                `*Commands:*\n` +
                `/start - Activate bot in group\n` +
                `/agents - List active agents\n` +
                `/ask <agent> <question> - Ask specific agent\n` +
                `/status - Show bot status\n` +
                `/help - Show this help\n\n` +
                `*Tips:*\n` +
                `- Just mention a topic and I'll respond with insights\n` +
                `- Use /ask for direct questions to specific agents\n` +
                `- Configure agents via the web dashboard`,
                { parse_mode: "Markdown" }
            );
        });
    }

    /**
     * Setup message handlers for regular messages
     */
    private setupMessageHandlers(): void {
        if (!this.bot) return;

        // Handle regular messages (not commands)
        this.bot.on("message:text", async (ctx) => {
            const text = ctx.message.text;

            // Skip if it's a command (handled separately)
            if (text.startsWith("/")) {
                return;
            }

            const incomingMessage: IncomingMessage = {
                id: ctx.message.message_id.toString(),
                from: ctx.from?.id.toString() || "unknown",
                fromUsername: ctx.from?.username,
                conversationId: `telegram:${ctx.chat?.id}`,
                text,
                timestamp: Date.now(),
                metadata: {
                    chatType: ctx.chat?.type,
                    isReply: !!ctx.message.reply_to_message,
                },
            };

            elizaLogger.debug(
                `[Telegram] Received message: ${text.substring(0, 50)}...`
            );

            // Notify all handlers
            for (const handler of this.messageHandlers) {
                try {
                    await handler(incomingMessage);
                } catch (error) {
                    elizaLogger.error(
                        "[Telegram] Message handler error:",
                        error
                    );
                }
            }

            this.updateActivity();
        });
    }

    /**
     * Parse conversation ID from format "telegram:<chat_id>"
     */
    private parseConversationId(conversationId: string): string | null {
        if (conversationId.startsWith("telegram:")) {
            return conversationId.replace("telegram:", "");
        }
        return conversationId;
    }

    /**
     * Update last activity timestamp
     */
    private updateActivity(): void {
        this.status.lastActivity = Date.now();
    }
}

/**
 * Factory function to create Telegram client instance
 */
export function createTelegramClient(): TelegramFamilyClient {
    return new TelegramFamilyClient();
}
