/**
 * Telegram Integration - Real Implementation
 * 
 * Replaces mock endpoints with actual grammy-based client
 * Follows ENHANCEMENT FIRST: extends DirectClient properly
 * Follows DRY: uses shared FamilyMessagingAdapter interface
 */

import { DirectClient } from "@elizaos/client-direct";
import { TelegramFamilyClient, createTelegramClient } from "@elizaos/client-telegram";
import type { AgentRuntime, IncomingMessage } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";

// Store Telegram client instance
let telegramClient: TelegramFamilyClient | null = null;
let runtimeInstance: AgentRuntime | null = null;

/**
 * Initialize Telegram integration
 * Called from agent startup when character has telegram client enabled
 */
export async function initializeTelegram(runtime: AgentRuntime): Promise<TelegramFamilyClient | null> {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            elizaLogger.warn("[Telegram] Bot token not configured, skipping initialization");
            return null;
        }

        elizaLogger.info("[Telegram] Initializing...");

        // Create Telegram client
        telegramClient = createTelegramClient();

        // Connect with bot token
        await telegramClient.connect({
            credentials: {
                botToken,
            },
            options: {
                webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
                pollingInterval: parseInt(process.env.TELEGRAM_POLLING_INTERVAL || "1000"),
            },
        });

        // Register message handler to route to agent
        telegramClient.onMessage(async (message: IncomingMessage) => {
            await handleTelegramMessage(message, runtime);
        });

        // Store runtime for later use
        runtimeInstance = runtime;

        elizaLogger.info(`[Telegram] Initialized successfully (@${telegramClient.getStatus().details?.botUsername})`);

        return telegramClient;
    } catch (error) {
        elizaLogger.error("[Telegram] Initialization failed:", error);
        return null;
    }
}

/**
 * Handle incoming Telegram message
 * Routes to appropriate agent based on message content
 */
async function handleTelegramMessage(message: IncomingMessage, runtime: AgentRuntime): Promise<void> {
    try {
        const { text, from, conversationId, metadata } = message;

        elizaLogger.debug(`[Telegram] Processing message from ${from}: ${text.substring(0, 50)}...`);

        // Check if it's a direct agent question (/ask command)
        if (metadata?.isDirectQuestion && metadata?.agentName) {
            const agentName = metadata.agentName as string;
            const question = text.replace(`/ask ${agentName}`, "").trim();

            elizaLogger.info(`[Telegram] Direct question to ${agentName}: ${question}`);

            // Route to specific agent
            await routeToAgent(question, from, conversationId, runtime);
            return;
        }

        // Regular message - let agent respond naturally
        await routeToAgent(text, from, conversationId, runtime);
    } catch (error) {
        elizaLogger.error("[Telegram] Message handling error:", error);
    }
}

/**
 * Route message to agent runtime for processing
 */
async function routeToAgent(
    text: string,
    userId: string,
    conversationId: string,
    runtime: AgentRuntime
): Promise<void> {
    try {
        // Ensure user connection exists
        await runtime.ensureConnection(
            userId,
            conversationId,
            userId,
            userId,
            "telegram"
        );

        // Create memory for the message
        const messageId = `${conversationId}-${Date.now()}`;

        const memory = {
            id: messageId,
            userId,
            agentId: runtime.agentId,
            roomId: conversationId,
            content: {
                text,
                source: "telegram",
            },
            createdAt: Date.now(),
        };

        // Add to memory manager
        await runtime.messageManager.createMemory(memory);

        elizaLogger.debug(`[Telegram] Message stored in memory: ${messageId}`);

        // Agent will process this message through its normal flow
        // and respond via the Telegram client
    } catch (error) {
        elizaLogger.error("[Telegram] Route to agent error:", error);
    }
}

/**
 * Send message via Telegram client
 * Used by agent runtimes to respond to Telegram messages
 */
export async function sendTelegramMessage(
    conversationId: string,
    text: string,
    inReplyTo?: string
): Promise<string> {
    if (!telegramClient) {
        throw new Error("Telegram client not initialized");
    }

    return await telegramClient.sendMessage({
        conversationId,
        text,
        inReplyTo,
    });
}

/**
 * Get Telegram client instance
 */
export function getTelegramClient(): TelegramFamilyClient | null {
    return telegramClient;
}

/**
 * Get group mappings for API endpoints
 */
export function getGroupMappings() {
    if (!telegramClient) {
        return [];
    }
    return telegramClient.getGroupMappings();
}

/**
 * Extend DirectClient with Telegram API endpoints
 */
export function extendDirectClientWithTelegram(directClient: DirectClient): void {
    elizaLogger.info("[Telegram] Extending DirectClient with Telegram endpoints");

    // Telegram Integration Status
    directClient.app.get("/integrations/telegram/status", (req, res) => {
        try {
            if (!telegramClient) {
                return res.json({
                    isConnected: false,
                    error: "Telegram client not initialized",
                    connectedGroups: 0,
                });
            }

            const status = telegramClient.getStatus();
            const groupMappings = telegramClient.getGroupMappings();

            res.json({
                isConnected: status.isConnected,
                botUsername: status.details?.botUsername || "@FamilyBot",
                connectedGroups: groupMappings.length,
                lastActivity: status.lastActivity ? new Date(status.lastActivity) : null,
                error: status.error,
            });
        } catch (error) {
            elizaLogger.error("[Telegram] Status endpoint error:", error);
            res.status(500).json({
                error: "Failed to get status",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Connect Telegram Bot
    directClient.app.post("/integrations/telegram/connect", async (req, res) => {
        try {
            const { botToken, botUsername } = req.body;

            if (!botToken) {
                return res.status(400).json({ error: "Bot token is required" });
            }

            // If client already exists, disconnect first
            if (telegramClient) {
                await telegramClient.disconnect();
            }

            // Create and connect new client
            telegramClient = createTelegramClient();
            await telegramClient.connect({
                credentials: { botToken },
            });

            elizaLogger.info(`[Telegram] Connected bot: ${botUsername || "unknown"}`);

            res.json({
                success: true,
                message: "Telegram bot connected successfully",
                botUsername: botUsername || telegramClient.getStatus().details?.botUsername,
            });
        } catch (error) {
            elizaLogger.error("[Telegram] Connect endpoint error:", error);
            res.status(500).json({
                error: "Connection failed",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Get Family Groups
    directClient.app.get("/integrations/telegram/groups", (req, res) => {
        try {
            const groups = getGroupMappings().map((mapping) => ({
                id: mapping.familyId,
                telegramId: mapping.telegramGroupId,
                name: mapping.telegramGroupTitle,
                memberCount: 0, // Would need to fetch from Telegram API
                agentsEnabled: mapping.enabledAgents,
                lastActivity: new Date(mapping.createdAt),
            }));

            res.json(groups);
        } catch (error) {
            elizaLogger.error("[Telegram] Groups endpoint error:", error);
            res.status(500).json({
                error: "Failed to get groups",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Configure Group Agents
    directClient.app.put("/integrations/telegram/groups/:groupId/agents", async (req, res) => {
        try {
            const { groupId } = req.params;
            const { agentIds } = req.body;

            if (!Array.isArray(agentIds)) {
                return res.status(400).json({ error: "agentIds must be an array" });
            }

            // Find and update group mapping
            const mappings = getGroupMappings();
            const mapping = mappings.find((m) => m.familyId === groupId || m.telegramGroupId === groupId);

            if (!mapping) {
                return res.status(404).json({ error: "Group not found" });
            }

            // Update enabled agents
            mapping.enabledAgents = agentIds;

            elizaLogger.info(`[Telegram] Updated agents for group ${groupId}:`, agentIds);

            res.json({
                success: true,
                message: `Configured ${agentIds.length} agents for group ${groupId}`,
                agentIds,
            });
        } catch (error) {
            elizaLogger.error("[Telegram] Configure endpoint error:", error);
            res.status(500).json({
                error: "Configuration failed",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Send Test Message
    directClient.app.post("/integrations/telegram/test", async (req, res) => {
        try {
            const { groupId, agentId, message } = req.body;

            if (!groupId || !agentId) {
                return res.status(400).json({
                    error: "groupId and agentId are required",
                });
            }

            if (!telegramClient) {
                return res.status(500).json({
                    error: "Telegram client not initialized",
                });
            }

            // Send test message
            const messageId = await sendTelegramMessage(
                `telegram:${groupId}`,
                message || "Hello! This is a test message from your family agent. I'm ready to help strengthen your family bonds! 🤖❤️"
            );

            elizaLogger.info(`[Telegram] Test message sent: ${messageId}`);

            res.json({
                success: true,
                message: "Test message sent successfully",
                messageId,
            });
        } catch (error) {
            elizaLogger.error("[Telegram] Test message endpoint error:", error);
            res.status(500).json({
                error: "Test message failed",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    // Disconnect Telegram
    directClient.app.post("/integrations/telegram/disconnect", async (req, res) => {
        try {
            if (telegramClient) {
                await telegramClient.disconnect();
                telegramClient = null;
            }

            elizaLogger.info("[Telegram] Disconnected via API");

            res.json({
                success: true,
                message: "Telegram integration disconnected",
            });
        } catch (error) {
            elizaLogger.error("[Telegram] Disconnect endpoint error:", error);
            res.status(500).json({
                error: "Disconnect failed",
                detail: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
}
