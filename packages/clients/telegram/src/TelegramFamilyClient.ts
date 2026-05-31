/**
 * Telegram Family Client - grammy-based bot with interactive UX
 *
 * Features:
 * - Persistent reply keyboard with quick actions
 * - Inline keyboards for agent selection, check-ins, challenges
 * - Callback query routing
 * - Multi-step conversation flows (check-in state machine)
 * - DM vs group differentiation
 * - Agent switching with session persistence
 */

import { Bot, Context, session } from "grammy";
import type {
    FamilyMessagingAdapter,
    IncomingMessage,
    OutgoingMessage,
    ChannelStatus,
    ChannelConfig,
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import {
    persistentKeyboard,
    onboardingKeyboard,
    agentSelectorKeyboard,
    REPLY_KEYBOARD_ACTIONS,
    AGENT_PROFILES,
} from "./keyboards.js";
import {
    type SessionData,
    initialSession,
    handleCheckIn,
    handleBondScore,
    handleAgents,
    handleChallenge,
    handleSavings,
    handleHelp,
    handleMoodSelection,
    handleGratitude,
    handleCheckInComplete,
    handleAgentSelection,
    handleOnboardCallback,
} from "./handlers.js";
import {
    handleFamilyCommand,
    handleFamilyAdd,
    handleFamilyNameInput,
    handleRelationshipSelect,
    handleCadenceSelect,
    handleInteractionLog,
    handleViewMember,
    checkForMemberMention,
    generateNudge,
    getPostCheckinSuggestion,
} from "./relationships.js";
import {
    ensureUser,
    updateUser,
    getUser,
    saveCheckin,
    getFamilyMembers,
    getInteractions,
    getLastInteraction,
} from "./userStore.js";
import {
    handleMe,
    handlePrivacy,
    handleExport,
    handleDeleteConfirm,
    handleDeleteFinal,
    handlePrivacyCancel,
    handlePrivacyAccept,
    showPrivacyDisclosureIfNeeded,
} from "./privacy.js";
import {
    handleHederaStatus,
    handleMilestone,
    handleReward,
    handleTransfer,
    handleBalance,
    handleDemo,
} from "./hederaHandlers.js";

export interface TelegramChannelConfig extends ChannelConfig {
    credentials: {
        botToken: string;
    };
    options?: {
        webhookUrl?: string;
        pollingInterval?: number;
    };
}

interface GroupMapping {
    telegramGroupId: string;
    telegramGroupTitle: string;
    familyId: string;
    enabledAgents: string[];
    createdAt: number;
}

type BotContext = Context & { session: SessionData };

export class TelegramFamilyClient implements FamilyMessagingAdapter {
    readonly name = "telegram";

    private bot: Bot<BotContext> | null = null;
    private messageHandlers: Array<(message: IncomingMessage) => void> = [];
    private groupMappings: Map<string, GroupMapping> = new Map();
    private status: ChannelStatus = {
        isConnected: false,
        error: "Not initialized",
    };

    async connect(config: TelegramChannelConfig): Promise<void> {
        try {
            const { botToken } = config.credentials;
            const { webhookUrl } = config.options || {};

            if (!botToken) {
                throw new Error("Bot token is required");
            }

            elizaLogger.info("[Telegram] Initializing bot...");

            this.bot = new Bot<BotContext>(botToken);

            this.bot.use(
                session({ initial: initialSession })
            );

            // Hydrate user from DB on every update
            this.bot.use(async (ctx, next) => {
                if (ctx.from) {
                    const user = ensureUser(
                        ctx.from.id.toString(),
                        ctx.from.username,
                        ctx.from.first_name
                    );
                    // Sync DB state into session
                    ctx.session.userId = ctx.from.id.toString();
                    ctx.session.username = ctx.from.username;
                    ctx.session.onboardingComplete = user.onboarding_complete === 1;
                    ctx.session.preferredAgent = user.preferred_agent || undefined;
                    ctx.session.checkInStreak = user.checkin_streak;
                    ctx.session.lastCheckIn = user.last_checkin_at || undefined;
                    ctx.session.nudgePaused = user.nudge_paused === 1;
                }
                await next();
            });

            this.setupCommandHandlers();
            this.setupCallbackHandlers();
            this.setupMessageHandlers();

            if (webhookUrl) {
                elizaLogger.info(`[Telegram] Setting up webhook: ${webhookUrl}`);
                await this.bot.start({ webhook: { url: webhookUrl } });
            } else {
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

            const botInfo = await this.bot.api.getMe();
            this.status = {
                isConnected: true,
                lastActivity: Date.now(),
                details: {
                    botUsername: botInfo.username,
                    botName: botInfo.first_name,
                },
            };

            elizaLogger.info(`[Telegram] Bot connected: @${botInfo.username}`);
        } catch (error) {
            this.status = {
                isConnected: false,
                error: error instanceof Error ? error.message : "Connection failed",
            };
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.bot) {
            elizaLogger.info("[Telegram] Stopping bot...");
            await this.bot.stop();
            this.bot = null;
        }
        this.status = { isConnected: false, error: "Disconnected" };
        elizaLogger.info("[Telegram] Bot disconnected");
    }

    async sendMessage(message: OutgoingMessage): Promise<string> {
        if (!this.bot) {
            throw new Error("Bot not connected");
        }

        try {
            const { conversationId, text, inReplyTo, metadata } = message;
            const chatId = this.parseConversationId(conversationId);

            if (!chatId) {
                throw new Error(`Invalid conversation ID: ${conversationId}`);
            }

            const options: any = {
                parse_mode: "Markdown",
            };

            if (inReplyTo) {
                options.reply_to_message_id = parseInt(inReplyTo, 10) || undefined;
            }

            if (metadata?.reply_markup) {
                options.reply_markup = metadata.reply_markup;
            } else {
                options.reply_markup = persistentKeyboard();
            }

            if (metadata?.editMessageId) {
                await this.bot.api.editMessageText(
                    chatId, metadata.editMessageId, text, { parse_mode: "Markdown" }
                );
                return metadata.editMessageId.toString();
            }

            const sentMessage = await this.bot.api.sendMessage(chatId, text, options);
            return sentMessage.message_id.toString();
        } catch (error) {
            elizaLogger.error("[Telegram] Send message error:", error);
            throw error;
        }
    }

    onMessage(handler: (message: IncomingMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    getStatus(): ChannelStatus {
        return this.status;
    }

    getGroupMappings(): GroupMapping[] {
        return Array.from(this.groupMappings.values());
    }

    addGroupMapping(mapping: GroupMapping): void {
        this.groupMappings.set(mapping.telegramGroupId, mapping);
        elizaLogger.info(`[Telegram] Group mapped: ${mapping.telegramGroupTitle}`);
    }

    private setupCommandHandlers(): void {
        if (!this.bot) return;

        this.bot.command("start", async (ctx) => {
            elizaLogger.info(`[Telegram] /start from ${ctx.from?.username || "unknown"}`);

            const chatId = ctx.chat?.id.toString();
            const chatTitle = ctx.chat?.title || "Private Chat";
            const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";

            if (isGroup) {
                const mapping: GroupMapping = {
                    telegramGroupId: chatId!,
                    telegramGroupTitle: chatTitle,
                    familyId: `telegram_${chatId}`,
                    enabledAgents: ["wisdom", "intimacy", "presence", "growth", "bridge", "savings"],
                    createdAt: Date.now(),
                };
                this.addGroupMapping(mapping);

                await ctx.reply(
                    `*Welcome to FamilyXYZ* \u{1F3E1}\n\n` +
                    `I'm your family's AI companion, here to strengthen bonds and grow together.\n\n` +
                    `*What I can do:*\n` +
                    `\u{1F4AC} Daily check-ins & gratitude\n` +
                    `\u{1F916} 6 specialized coaching agents\n` +
                    `\u{1F4CA} Track your family bond score\n` +
                    `\u{1F3AF} Family challenges & goals\n` +
                    `\u{1F4B0} Savings vault (4.5% APY)\n\n` +
                    `Use the menu below to get started!`,
                    { parse_mode: "Markdown", reply_markup: persistentKeyboard() }
                );
            } else {
                ctx.session.onboardingComplete = false;
                await ctx.reply(
                    `*Hey there* \u{1F44B}\n\n` +
                    `I'm FamilyXYZ — your personal family wellness companion.\n\n` +
                    `I help you build deeper connections through daily reflection, emotional coaching, and shared goals.\n\n` +
                    `*Explore what's possible:*`,
                    { parse_mode: "Markdown", reply_markup: onboardingKeyboard() }
                );

                // Show privacy disclosure for first-time users
                await showPrivacyDisclosureIfNeeded(ctx);
            }

            this.updateActivity();
        });

        this.bot.command("checkin", async (ctx) => {
            await handleCheckIn(ctx);
            this.updateActivity();
        });

        this.bot.command("family", async (ctx) => {
            await handleFamilyCommand(ctx);
            this.updateActivity();
        });

        this.bot.command("agents", async (ctx) => {
            await handleAgents(ctx);
            this.updateActivity();
        });

        this.bot.command("bondscore", async (ctx) => {
            await handleBondScore(ctx);
            this.updateActivity();
        });

        this.bot.command("challenge", async (ctx) => {
            await handleChallenge(ctx);
            this.updateActivity();
        });

        this.bot.command("savings", async (ctx) => {
            await handleSavings(ctx);
            this.updateActivity();
        });

        this.bot.command("ask", async (ctx) => {
            const args = ctx.match?.split(" ");
            if (!args || args.length < 2) {
                await ctx.reply(
                    "Usage: `/ask <agent> <question>`\n\nExample: `/ask wisdom How can we improve communication?`\n\n" +
                    "Available agents: wisdom, intimacy, growth, presence, bridge, savings",
                    { parse_mode: "Markdown" }
                );
                return;
            }

            const agentName = args[0].toLowerCase();
            const question = args.slice(1).join(" ");

            if (!AGENT_PROFILES[agentName]) {
                await ctx.reply(
                    `Unknown agent "${agentName}".\n\nAvailable: wisdom, intimacy, growth, presence, bridge, savings`
                );
                return;
            }

            const incomingMessage: IncomingMessage = {
                id: ctx.message?.message_id.toString() || Date.now().toString(),
                from: ctx.from?.id.toString() || "unknown",
                fromUsername: ctx.from?.username,
                conversationId: `telegram:${ctx.chat?.id}`,
                text: question,
                timestamp: Date.now(),
                metadata: {
                    agentName,
                    isDirectQuestion: true,
                    chatType: ctx.chat?.type,
                },
            };

            for (const handler of this.messageHandlers) {
                await handler(incomingMessage);
            }
            this.updateActivity();
        });

        this.bot.command("status", async (ctx) => {
            const hederaEnabled = !!(process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_KEY);
            
            await ctx.reply(
                `📊 *FamilyXYZ Status*\n\n` +
                `Connection: ${this.status.isConnected ? "✅ Online" : "❌ Offline"}\n` +
                `Groups: ${this.groupMappings.size}\n` +
                `Agents: 6 available\n` +
                `Bot: @${this.status.details?.botUsername || "familexyzbot"}\n\n` +
                `🏦 *Hedera:* ${hederaEnabled ? "✅ Connected" : "❌ Not configured"}\n\n` +
                `*Commands:*\n` +
                `/checkin — Daily mood & gratitude\n` +
                `/agents — Switch coaching agent\n` +
                `/bondscore — View family score\n` +
                `/challenge — Family goals\n` +
                `/savings — FAM vault\n` +
                `/hedera — Hedera status & tools\n` +
                `/demo — Full Hedera walkthrough\n` +
                `/ask <agent> <q> — Ask a specific agent\n` +
                `/help — Feature overview`,
                { parse_mode: "Markdown" }
            );
        });

        this.bot.command("help", async (ctx) => {
            await handleHelp(ctx);
        });

        this.bot.command("me", async (ctx) => {
            await handleMe(ctx);
            this.updateActivity();
        });

        this.bot.command("privacy", async (ctx) => {
            await handlePrivacy(ctx);
            this.updateActivity();
        });

        this.bot.command("export", async (ctx) => {
            await handleExport(ctx);
            this.updateActivity();
        });

        this.bot.command("deletedata", async (ctx) => {
            const { InlineKeyboard } = await import("grammy");
            const kb = new InlineKeyboard()
                .text("\u{274C} Yes, delete everything", "privacy:delete_final")
                .row()
                .text("\u{2190} Cancel", "privacy:cancel");
            await ctx.reply(
                "*Delete all data?* \u{26A0}\u{FE0F}\n\n" +
                "This will permanently remove your profile, check-in history, " +
                "family connections, and all preferences.\n\n" +
                "_This cannot be undone._",
                { parse_mode: "Markdown", reply_markup: kb }
            );
            this.updateActivity();
        });

        // Hedera commands
        this.bot.command("hedera", async (ctx) => {
            await handleHederaStatus(ctx);
            this.updateActivity();
        });

        this.bot.command("milestone", async (ctx) => {
            await handleMilestone(ctx);
            this.updateActivity();
        });

        this.bot.command("reward", async (ctx) => {
            await handleReward(ctx);
            this.updateActivity();
        });

        this.bot.command("transfer", async (ctx) => {
            await handleTransfer(ctx);
            this.updateActivity();
        });

        this.bot.command("balance", async (ctx) => {
            await handleBalance(ctx);
            this.updateActivity();
        });

        this.bot.command("demo", async (ctx) => {
            await handleDemo(ctx);
            this.updateActivity();
        });
    }

    private setupCallbackHandlers(): void {
        if (!this.bot) return;

        this.bot.on("callback_query:data", async (ctx) => {
            const data = ctx.callbackQuery.data;
            const [category, ...rest] = data.split(":");
            const payload = rest.join(":");

            try {
                switch (category) {
                    case "mood":
                        await handleMoodSelection(ctx, payload, ctx.session);
                        break;

                    case "agent":
                        await handleAgentSelection(ctx, payload, ctx.session);
                        break;

                    case "onboard":
                        await handleOnboardCallback(ctx, payload);
                        if (!ctx.session.onboardingComplete) {
                            ctx.session.onboardingComplete = true;
                            if (ctx.session.userId) {
                                updateUser(ctx.session.userId, { onboarding_complete: 1 });
                            }
                        }
                        break;

                    case "checkin":
                        if (payload === "share") {
                            ctx.session.checkInState = "story";
                            await ctx.answerCallbackQuery();
                            await ctx.reply("Tell me about a family moment from today:");
                        } else if (payload === "done") {
                            await ctx.answerCallbackQuery();
                            await handleCheckInComplete(ctx, ctx.session);
                        }
                        break;

                    case "challenge":
                        await ctx.answerCallbackQuery();
                        if (payload === "new") {
                            const { challengeCategoryKeyboard } = await import("./keyboards.js");
                            await ctx.reply(
                                "*New Challenge*\n\nPick a category:",
                                { parse_mode: "Markdown", reply_markup: challengeCategoryKeyboard() }
                            );
                        } else if (payload.startsWith("pick:")) {
                            const challengeId = payload.replace("pick:", "");
                            await this.handleChallengeAccept(ctx, challengeId);
                        }
                        break;

                    case "bond":
                        await ctx.answerCallbackQuery();
                        if (payload === "tips") {
                            await ctx.reply(
                                "*Tips to Improve Your Bond Score:*\n\n" +
                                "1. Do daily check-ins together\n" +
                                "2. Complete a family challenge\n" +
                                "3. Share stories across generations\n" +
                                "4. Practice device-free time\n" +
                                "5. Respond to each other promptly",
                                { parse_mode: "Markdown" }
                            );
                        }
                        break;

                    case "savings":
                        await ctx.answerCallbackQuery({ text: "Savings feature coming soon!" });
                        break;

                    case "help":
                        await handleOnboardCallback(ctx, payload);
                        break;

                    case "action":
                        await ctx.answerCallbackQuery();
                        switch (payload) {
                            case "checkin": await handleCheckIn(ctx); break;
                            case "bondscore": await handleBondScore(ctx); break;
                            case "agents": await handleAgents(ctx); break;
                            case "challenge": await handleChallenge(ctx); break;
                            case "savings": await handleSavings(ctx); break;
                            case "family": await handleFamilyCommand(ctx); break;
                        }
                        break;

                    case "family":
                        await ctx.answerCallbackQuery();
                        if (payload === "add") {
                            await handleFamilyAdd(ctx);
                        } else if (payload === "list") {
                            await handleFamilyCommand(ctx);
                        } else if (payload.startsWith("view:")) {
                            await handleViewMember(ctx, payload.replace("view:", ""));
                        }
                        break;

                    case "frel":
                        await handleRelationshipSelect(ctx, payload);
                        break;

                    case "fcadence": {
                        const [cName, cValue] = payload.split(":");
                        await handleCadenceSelect(ctx, cName, cValue);
                        break;
                    }

                    case "flog": {
                        const [lName, lType] = payload.split(":");
                        await handleInteractionLog(ctx, lName, lType);
                        break;
                    }

                    case "mention":
                        if (payload === "yes") {
                            await ctx.answerCallbackQuery();
                            await handleFamilyAdd(ctx);
                        } else {
                            await ctx.answerCallbackQuery({ text: "No problem!" });
                            if (ctx.callbackQuery?.message) {
                                await ctx.api.editMessageText(
                                    ctx.callbackQuery.message.chat.id,
                                    ctx.callbackQuery.message.message_id,
                                    "_Got it — I won't ask again about this person._",
                                    { parse_mode: "Markdown" }
                                );
                            }
                        }
                        break;

                    case "nudge":
                        if (payload === "pause") {
                            ctx.session.nudgePaused = true;
                            if (ctx.session.userId) updateUser(ctx.session.userId, { nudge_paused: 1 });
                            await ctx.answerCallbackQuery({ text: "Nudges paused" });
                            if (ctx.callbackQuery?.message) {
                                await ctx.api.editMessageText(
                                    ctx.callbackQuery.message.chat.id,
                                    ctx.callbackQuery.message.message_id,
                                    "_Nudges paused. Use /family to resume anytime._",
                                    { parse_mode: "Markdown" }
                                );
                            }
                        } else if (payload === "resume") {
                            ctx.session.nudgePaused = false;
                            if (ctx.session.userId) updateUser(ctx.session.userId, { nudge_paused: 0 });
                            await ctx.answerCallbackQuery({ text: "Nudges resumed!" });
                        }
                        break;

                    case "privacy":
                        if (payload === "export") {
                            await ctx.answerCallbackQuery();
                            await handleExport(ctx);
                        } else if (payload === "delete_confirm") {
                            await handleDeleteConfirm(ctx);
                        } else if (payload === "delete_final") {
                            await handleDeleteFinal(ctx);
                        } else if (payload === "cancel") {
                            await handlePrivacyCancel(ctx);
                        } else if (payload === "accept") {
                            await handlePrivacyAccept(ctx);
                        } else if (payload === "full") {
                            await ctx.answerCallbackQuery();
                            await handlePrivacy(ctx);
                        }
                        break;

                    default:
                        await ctx.answerCallbackQuery();
                        break;
                }
            } catch (error) {
                elizaLogger.error("[Telegram] Callback error:", error);
                await ctx.answerCallbackQuery({ text: "Something went wrong" });
            }

            this.updateActivity();
        });
    }

    private setupMessageHandlers(): void {
        if (!this.bot) return;

        this.bot.on("message:text", async (ctx) => {
            const text = ctx.message.text;

            if (text.startsWith("/")) return;

            // Handle family member add flow
            if (ctx.session.familyAddState === "awaiting_name") {
                await handleFamilyNameInput(ctx, text.trim());
                this.updateActivity();
                return;
            }

            // Handle check-in state machine
            if (ctx.session.checkInState === "gratitude") {
                await handleGratitude(ctx, text, ctx.session);

                // Layer 2: After gratitude, check if they mentioned a tracked person
                const suggestion = getPostCheckinSuggestion(text, ctx.session);
                if (suggestion) {
                    const { InlineKeyboard } = await import("grammy");
                    const kb = new InlineKeyboard()
                        .text("\u{1F4AC} Send them a message", `flog:${suggestion.memberName}:messaged`)
                        .text("\u{23E9} Skip", "action:checkin_continue");
                    await ctx.reply(
                        `\u{1F495} ${suggestion.suggestion}`,
                        { reply_markup: kb }
                    );
                }

                this.updateActivity();
                return;
            }

            if (ctx.session.checkInState === "story") {
                await handleCheckInComplete(ctx, ctx.session);
                this.updateActivity();
                return;
            }

            // Route reply-keyboard quick actions
            const quickAction = REPLY_KEYBOARD_ACTIONS[text];
            if (quickAction) {
                switch (quickAction) {
                    case "checkin": await handleCheckIn(ctx); break;
                    case "family": await handleFamilyCommand(ctx); break;
                    case "bondscore": await handleBondScore(ctx); break;
                    case "agents": await handleAgents(ctx); break;
                    case "challenge": await handleChallenge(ctx); break;
                    case "savings": await handleSavings(ctx); break;
                    case "help": await handleHelp(ctx); break;
                }
                this.updateActivity();
                return;
            }

            // Layer 0→1: Detect family mentions for progressive opt-in
            const mentionPrompt = checkForMemberMention(text, ctx.session);
            if (mentionPrompt) {
                const { InlineKeyboard } = await import("grammy");
                const kb = new InlineKeyboard()
                    .text("\u{2705} Yes, help me stay connected", "mention:yes")
                    .row()
                    .text("\u{274C} No thanks", "mention:no");

                // Send after a slight delay so it doesn't interrupt the LLM response
                setTimeout(async () => {
                    try {
                        await ctx.reply(mentionPrompt.prompt, { reply_markup: kb });
                    } catch (e) {
                        elizaLogger.error("[Telegram] Mention prompt error:", e);
                    }
                }, 2000);
            }

            // Layer 3: Nudge check (piggyback on regular messages)
            const nudge = generateNudge(ctx.session);
            if (nudge) {
                const { InlineKeyboard } = await import("grammy");
                const kb = new InlineKeyboard()
                    .text("\u{1F493} Log a connection", "action:family")
                    .text("\u{1F6D1} Pause nudges", "nudge:pause");

                // Deliver nudge after LLM response
                setTimeout(async () => {
                    try {
                        await ctx.reply(`\u{1F4AD} _${nudge}_`, { parse_mode: "Markdown", reply_markup: kb });
                    } catch (e) {
                        elizaLogger.error("[Telegram] Nudge error:", e);
                    }
                }, 4000);
            }

            // Show typing indicator while processing
            const chatId = ctx.chat?.id;
            if (chatId) {
                ctx.api.sendChatAction(chatId, "typing").catch(() => {});
                const typingInterval = setInterval(() => {
                    ctx.api.sendChatAction(chatId, "typing").catch(() => {});
                }, 4000);

                // Forward to LLM pipeline
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
                        preferredAgent: ctx.session.preferredAgent,
                    },
                };

                try {
                    for (const handler of this.messageHandlers) {
                        try {
                            await handler(incomingMessage);
                        } catch (error) {
                            elizaLogger.error("[Telegram] Message handler error:", error);
                        }
                    }
                } finally {
                    clearInterval(typingInterval);
                }
            }

            this.updateActivity();
        });
    }

    private async handleChallengeAccept(ctx: BotContext, challengeId: string): Promise<void> {
        const challenges: Record<string, { name: string; desc: string; duration: string }> = {
            devicefree: { name: "Device-Free Dinner", desc: "No phones at the dinner table for 7 days", duration: "7 days" },
            cook: { name: "Cook Together 3x", desc: "Prepare a meal together 3 times this week", duration: "7 days" },
            call: { name: "Call a Relative", desc: "Call a family member you haven't spoken to recently", duration: "3 days" },
            random: { name: "Story Swap", desc: "Share a childhood memory with someone in the family", duration: "3 days" },
        };

        const challenge = challenges[challengeId] || challenges.random;
        const { InlineKeyboard } = await import("grammy");
        const progressKb = new InlineKeyboard()
            .text("\u{2705} Mark Done", "challenge:complete:" + challengeId)
            .text("\u{1F4AC} Share Progress", "challenge:progress:" + challengeId);

        if (ctx.callbackQuery?.message) {
            await ctx.api.editMessageText(
                ctx.callbackQuery.message.chat.id,
                ctx.callbackQuery.message.message_id,
                `*Challenge Accepted!* \u{1F525}\n\n` +
                `\u{1F3AF} *${challenge.name}*\n` +
                `${challenge.desc}\n\n` +
                `\u{23F0} Duration: ${challenge.duration}\n` +
                `\u{1F4C5} Started: today\n\n` +
                `_I'll check in on your progress. Good luck!_`,
                { parse_mode: "Markdown", reply_markup: progressKb }
            );
        }
    }

    private parseConversationId(conversationId: string): string | null {
        if (conversationId.startsWith("telegram:")) {
            return conversationId.replace("telegram:", "");
        }
        return conversationId;
    }

    private updateActivity(): void {
        this.status.lastActivity = Date.now();
    }
}

export function createTelegramClient(): TelegramFamilyClient {
    return new TelegramFamilyClient();
}
