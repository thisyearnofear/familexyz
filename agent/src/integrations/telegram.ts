/**
 * Telegram Integration - Real Implementation
 * 
 * Replaces mock endpoints with actual grammy-based client
 * Follows ENHANCEMENT FIRST: extends DirectClient properly
 * Follows DRY: uses shared FamilyMessagingAdapter interface
 */

import { DirectClient } from "@elizaos/client-direct";
import { TelegramFamilyClient, createTelegramClient, AGENT_PROFILES } from "@elizaos/client-telegram";
import { InlineKeyboard } from "grammy";
import type { AgentRuntime, IncomingMessage, Memory, UUID } from "@elizaos/core";
import {
    composeContext,
    elizaLogger,
    generateMessageResponse,
    generateShouldRespond,
    shouldRespondFooter,
    ModelClass,
} from "@elizaos/core";

// Store Telegram client instance
let telegramClient: TelegramFamilyClient | null = null;
let runtimeInstance: AgentRuntime | null = null;

/**
 * Smart Agent Routing
 *
 * Classifies message intent by keywords/patterns and routes to the most
 * relevant agent. Falls back to the user's preferred agent or "wisdom" (general).
 */
const AGENT_ROUTING_RULES: Array<{ agent: string; patterns: RegExp[] }> = [
    {
        agent: "intimacy",
        patterns: [
            /\b(partner|spouse|husband|wife|marriage|romantic|love life|date night|reconnect|intimacy|affection|relationship|disconnect(ed)?|argue|argument|fighting)\b/i,
            /\b(closer|drifting apart|quality time|physical touch|emotional connect|trust issues|jealous|boundaries)\b/i,
        ],
    },
    {
        agent: "presence",
        patterns: [
            /\b(mindful|meditation|screen time|device|phone|distract|present|focus|attention|digital|unplug|overwhelm|stress|anxious|anxiety|calm|breath|peace)\b/i,
            /\b(work.life balance|burnout|too busy|no time|rushing|slow down|self.care|mental health)\b/i,
        ],
    },
    {
        agent: "bridge",
        patterns: [
            /\b(grandparent|grandma|grandpa|elder|aging|generation|tradition|heritage|story|stories|legacy|wisdom.*elder|parent.*aging|old.school)\b/i,
            /\b(generation gap|boomer|millennial|gen.?z|culture clash|family history|ancestor|roots)\b/i,
        ],
    },
    {
        agent: "growth",
        patterns: [
            /\b(challenge|goal|habit|improve|growth|develop|learn|skill|resilience|setback|fail|succeed|achievement|milestone|progress|motivat)\b/i,
            /\b(new year|resolution|accountability|discipline|routine|stuck|potential|overcome)\b/i,
        ],
    },
    {
        agent: "wisdom",
        patterns: [
            /\b(communicat|conflict|disagree|fight|misunderstand|listen|empathy|emotional intelligence|forgive|apologize|boundaries|conversation)\b/i,
            /\b(family meeting|difficult topic|hard talk|sensitive|navigate|mediate|resolve)\b/i,
        ],
    },
];

function detectAgentFromMessage(text: string): string | null {
    let bestMatch: { agent: string; score: number } | null = null;

    for (const rule of AGENT_ROUTING_RULES) {
        let score = 0;
        for (const pattern of rule.patterns) {
            const matches = text.match(pattern);
            if (matches) score += matches.length;
        }
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { agent: rule.agent, score };
        }
    }

    return bestMatch?.agent ?? null;
}

/**
 * Default template for handling Telegram messages via the agent runtime.
 * Uses state keys populated by runtime.composeState().
 * Falls back to this if the character doesn't have a telegramMessageHandlerTemplate.
 */
const defaultTelegramHandlerTemplate = `{{actionNames}}
{{actions}}

# About {{agentName}}:
{{bio}}
{{lore}}

{{knowledge}}

{{providers}}

{{recentMessages}}

# Instructions:
Write the next message as {{agentName}} in this conversation.
Respond naturally, staying in character as {{agentName}}.
Be warm, helpful, and family-friendly.
Keep responses concise (2-4 sentences max unless explaining something complex).

Optionally suggest 1-2 relevant follow-up actions the user might want to take.
Available actions: checkin (daily mood check-in), bondscore (view family bond score), agents (switch coaching agent), challenge (family challenge), savings (savings vault).

Return your response as a JSON object:
{"text": "Your message here", "suggestedActions": ["checkin", "bondscore"]}

If no follow-up actions are relevant, omit suggestedActions or return an empty array.
{"text": "Your message here"}`;

/**
 * Default template for deciding whether the agent should respond in Telegram.
 * Uses SMALL model for a quick, cheap filtering pass.
 */
const defaultTelegramShouldRespondTemplate = `# About {{agentName}}:
{{bio}}
{{lore}}

{{knowledge}}

{{providers}}

{{recentMessages}}

# Instructions:
{{agentName}} is a family support agent. Decide if {{agentName}} should respond to the last message.
- [RESPOND] if the message directly addresses {{agentName}}, asks a question, requests help, or discusses family-related topics
- [IGNORE] if the message is casual chit-chat between other users that doesn't involve {{agentName}}
- [STOP] if {{agentName}} has been talking too much and should pause

${shouldRespondFooter}`;

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
 * Routes to appropriate agent based on message content and chat context
 */
async function handleTelegramMessage(message: IncomingMessage, runtime: AgentRuntime): Promise<void> {
    try {
        const { text, from, conversationId, metadata } = message;
        const chatType = metadata?.chatType as string | undefined;
        const isPrivate = chatType === "private";
        const preferredAgent = metadata?.preferredAgent as string | undefined;

        elizaLogger.debug(`[Telegram] Processing message from ${from} (${chatType}): ${text.substring(0, 50)}...`);

        // Check if it's a council request (/council command)
        if (metadata?.isCouncilRequest) {
            elizaLogger.info(`[Telegram] Council request: ${text}`);
            await handleCouncilRequest(text, from, conversationId, runtime, isPrivate);
            return;
        }

        // Check if it's a direct agent question (/ask command)
        if (metadata?.isDirectQuestion && metadata?.agentName) {
            const agentName = metadata.agentName as string;
            elizaLogger.info(`[Telegram] Direct question to ${agentName}: ${text}`);
            await routeToAgent(text, from, conversationId, runtime, { agentName, isPrivate });
            return;
        }

        // Smart routing: detect intent from message content
        const detectedAgent = detectAgentFromMessage(text);
        const routedAgent = detectedAgent || preferredAgent;

        if (detectedAgent && detectedAgent !== preferredAgent) {
            elizaLogger.info(`[Telegram] Smart-routed "${text.substring(0, 40)}..." → ${detectedAgent} (preferred was ${preferredAgent || "none"})`);
        }

        await routeToAgent(text, from, conversationId, runtime, {
            agentName: detectedAgent || undefined,
            preferredAgent: detectedAgent ? undefined : preferredAgent,
            isPrivate,
        });
    } catch (error) {
        elizaLogger.error("[Telegram] Message handling error:", error);
    }
}

interface RouteOptions {
    agentName?: string;
    preferredAgent?: string;
    isPrivate?: boolean;
}

/**
 * Route message to agent runtime for processing
 */
async function routeToAgent(
    text: string,
    userId: string,
    conversationId: string,
    runtime: AgentRuntime,
    options: RouteOptions = {}
): Promise<void> {
    try {
        await runtime.ensureConnection(
            userId,
            conversationId,
            userId,
            userId,
            "telegram"
        );

        const messageId = `${conversationId}-${Date.now()}`;

        const memory: Memory = {
            id: messageId as UUID,
            userId: userId as UUID,
            agentId: runtime.agentId,
            roomId: conversationId as UUID,
            content: {
                text,
                source: "telegram",
            },
            createdAt: Date.now(),
        };

        await runtime.messageManager.createMemory(memory);

        // In private DMs, always respond. In groups, use should-respond guard.
        const alwaysRespond =
            options.isPrivate ||
            process.env.TELEGRAM_ALWAYS_RESPOND?.toLowerCase() === "true";

        const state = await runtime.composeState(memory);

        if (!alwaysRespond) {
            const shouldRespondTemplate =
                runtime.character.templates?.shouldRespondTemplate ??
                defaultTelegramShouldRespondTemplate;

            const shouldRespondContext = composeContext({
                state,
                template: shouldRespondTemplate,
            });

            const shouldRespond = await generateShouldRespond({
                runtime,
                context: shouldRespondContext,
                modelClass: ModelClass.SMALL,
            });

            if (shouldRespond === "IGNORE" || shouldRespond === "STOP") {
                elizaLogger.debug(
                    `[Telegram] Skipping response (${shouldRespond}) for message: ${messageId}`
                );
                return;
            }
        }

        // Build agent-specific context prefix if an agent is selected
        const activeAgent = options.agentName || options.preferredAgent;
        let agentPrefix = "";
        if (activeAgent && AGENT_PROFILES[activeAgent]) {
            const profile = AGENT_PROFILES[activeAgent];
            agentPrefix = `\n\nYou are currently acting as the ${profile.name} agent (${profile.desc}). ` +
                `Stay focused on ${profile.desc.toLowerCase()} topics while remaining warm and helpful.\n`;
        }

        const responseTemplate =
            runtime.character.templates?.telegramMessageHandlerTemplate ??
            defaultTelegramHandlerTemplate;

        const responseContext = composeContext({
            state,
            template: responseTemplate + agentPrefix,
        });

        const responseContent = await generateMessageResponse({
            runtime,
            context: responseContext,
            modelClass: ModelClass.LARGE,
        });

        if (responseContent?.text) {
            const responseMemory: Memory = {
                id: `${conversationId}-response-${Date.now()}` as UUID,
                userId: runtime.agentId,
                agentId: runtime.agentId,
                roomId: conversationId as UUID,
                content: {
                    text: responseContent.text,
                    source: "telegram",
                    action: responseContent.action,
                    inReplyTo: messageId as UUID,
                },
                createdAt: Date.now(),
            };

            await runtime.messageManager.createMemory(responseMemory);

            // Build inline keyboard from suggestedActions if present
            const replyMarkup = buildSuggestedActionsKeyboard(responseContent);

            await sendTelegramMessage(conversationId, responseContent.text, messageId, replyMarkup);

            elizaLogger.info(`[Telegram] Response sent to ${conversationId}`);
        } else {
            elizaLogger.warn("[Telegram] generateMessageResponse returned empty content");
        }
    } catch (error) {
        elizaLogger.error("[Telegram] Route to agent error:", error);
    }
}

const ACTION_BUTTON_LABELS: Record<string, { emoji: string; label: string; callback: string }> = {
    checkin: { emoji: "\u{1F4AC}", label: "Check In", callback: "action:checkin" },
    bondscore: { emoji: "\u{1F4CA}", label: "Bond Score", callback: "action:bondscore" },
    agents: { emoji: "\u{1F916}", label: "Agents", callback: "action:agents" },
    challenge: { emoji: "\u{1F3AF}", label: "Challenge", callback: "action:challenge" },
    savings: { emoji: "\u{1F4B0}", label: "Savings", callback: "action:savings" },
};

function buildSuggestedActionsKeyboard(responseContent: any): InlineKeyboard | undefined {
    const actions = responseContent?.suggestedActions;
    if (!Array.isArray(actions) || actions.length === 0) return undefined;

    const kb = new InlineKeyboard();
    let added = 0;
    for (const action of actions) {
        const btn = ACTION_BUTTON_LABELS[action];
        if (btn && added < 3) {
            kb.text(`${btn.emoji} ${btn.label}`, btn.callback);
            added++;
        }
    }
    return added > 0 ? kb : undefined;
}

/**
 * Family Council: ask all agents and combine perspectives
 */
async function handleCouncilRequest(
    text: string,
    userId: string,
    conversationId: string,
    runtime: AgentRuntime,
    isPrivate: boolean
): Promise<void> {
    const agents = ["wisdom", "intimacy", "presence", "growth", "bridge"];

    const responses: Array<{ agent: string; emoji: string; text: string }> = [];

    for (const agentKey of agents) {
        const profile = AGENT_PROFILES[agentKey];
        if (!profile) continue;

        const agentPrefix = `\nYou are the ${profile.name} agent (${profile.desc}). ` +
            `Give a focused 1-2 sentence perspective on the user's question from your specialty area. Be concrete and actionable.\n`;

        const messageId = `${conversationId}-council-${agentKey}-${Date.now()}`;

        const memory: Memory = {
            id: messageId as UUID,
            userId: userId as UUID,
            agentId: runtime.agentId,
            roomId: conversationId as UUID,
            content: { text, source: "telegram" },
            createdAt: Date.now(),
        };

        try {
            const state = await runtime.composeState(memory);
            const responseTemplate =
                runtime.character.templates?.telegramMessageHandlerTemplate ??
                defaultTelegramHandlerTemplate;

            const responseContext = composeContext({
                state,
                template: responseTemplate + agentPrefix,
            });

            const responseContent = await generateMessageResponse({
                runtime,
                context: responseContext,
                modelClass: ModelClass.LARGE,
            });

            if (responseContent?.text) {
                responses.push({
                    agent: profile.name,
                    emoji: profile.emoji,
                    text: responseContent.text,
                });
            }
        } catch (error) {
            elizaLogger.warn(`[Council] ${agentKey} failed:`, error);
            responses.push({
                agent: profile.name,
                emoji: profile.emoji,
                text: "_Could not respond at this time._",
            });
        }
    }

    const formatted = responses
        .map((r) => `${r.emoji} *${r.agent}:*\n${r.text}`)
        .join("\n\n");

    const reply = `*Family Council* 🏛️\n_\"${text.length > 80 ? text.substring(0, 77) + "..." : text}\"_\n\n${formatted}`;

    await sendTelegramMessage(conversationId, reply);
}

/**
 * Send message via Telegram client
 * Used by agent runtimes to respond to Telegram messages
 */
export async function sendTelegramMessage(
    conversationId: string,
    text: string,
    inReplyTo?: string,
    replyMarkup?: any
): Promise<string> {
    if (!telegramClient) {
        throw new Error("Telegram client not initialized");
    }

    return await telegramClient.sendMessage({
        conversationId,
        text,
        inReplyTo,
        metadata: replyMarkup ? { reply_markup: replyMarkup } : undefined,
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
 * Extend DirectClient with Telegram API endpoints and Daily Take
 */
export function extendDirectClientWithTelegram(directClient: DirectClient): void {
    elizaLogger.info("[Telegram] Extending DirectClient with Telegram endpoints");

    // Daily Take endpoint
    directClient.app.get("/daily-take", async (req, res) => {
        try {
            const { getCachedDailyTake, generateDailyTake } = await import("../jobs/DailyTakeGenerator.js");
            let take = getCachedDailyTake();
            if (!take && runtimeInstance) {
                take = await generateDailyTake(runtimeInstance);
            }
            if (take) {
                res.json(take);
            } else {
                res.status(503).json({ error: "Daily take not yet generated" });
            }
        } catch (error) {
            elizaLogger.error("[DailyTake] Error:", error);
            res.status(500).json({ error: "Failed to generate daily take" });
        }
    });

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
