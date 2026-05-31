import type { Context } from "grammy";
import {
    agentSelectorKeyboard,
    moodKeyboard,
    bondScoreKeyboard,
    savingsKeyboard,
    checkinFollowUpKeyboard,
    formatBondScore,
    AGENT_PROFILES,
} from "./keyboards.js";
import { saveCheckin, updateUser, getUser } from "./userStore.js";

export interface SessionData {
    userId: string;
    username?: string;
    lastMessageTime: number;
    conversationState: "active" | "idle";
    onboardingComplete: boolean;
    preferredAgent?: string;
    checkInState?: "mood" | "gratitude" | "story" | null;
    checkInData?: { mood?: string; gratitude?: string };
    checkInStreak: number;
    lastCheckIn?: number;
    // Relationship tracking (progressive enablement)
    familyMembers?: import("./relationships.js").FamilyMember[];
    familyAddState?: "awaiting_name" | "awaiting_relationship" | undefined;
    pendingFamilyName?: string;
    mentionedNames?: Record<string, number>;
    nudgePaused?: boolean;
    lastNudgeDate?: number;
}

export function initialSession(): SessionData {
    return {
        userId: "",
        lastMessageTime: 0,
        conversationState: "idle",
        onboardingComplete: false,
        checkInStreak: 0,
    };
}

export async function handleCheckIn(ctx: Context): Promise<void> {
    await ctx.reply(
        "*How are you feeling today?*\n\nYour check-in helps track your family's emotional pulse.",
        { parse_mode: "Markdown", reply_markup: moodKeyboard() }
    );
}

export async function handleBondScore(ctx: Context): Promise<void> {
    const score = formatBondScore({
        overall: 72,
        generational: 65,
        reciprocity: 80,
        sentiment: 75,
        challenges: 60,
        presence: 78,
        network: 70,
        consensus: 68,
    });

    await ctx.reply(
        score + "\n\n_Updated weekly. Keep engaging to improve!_",
        { parse_mode: "Markdown", reply_markup: bondScoreKeyboard() }
    );
}

export async function handleAgents(ctx: Context): Promise<void> {
    const lines = Object.entries(AGENT_PROFILES).map(
        ([, a]) => `${a.emoji} *${a.name}* — ${a.desc}`
    );

    await ctx.reply(
        "*Choose an Agent*\n\n" +
        lines.join("\n") +
        "\n\n_Select one to switch your coaching focus:_",
        { parse_mode: "Markdown", reply_markup: agentSelectorKeyboard() }
    );
}

export async function handleChallenge(ctx: Context): Promise<void> {
    const { InlineKeyboard } = await import("grammy");
    const suggestedChallenges = new InlineKeyboard()
        .text("\u{1F4F1} Device-Free Dinner", "challenge:pick:devicefree")
        .row()
        .text("\u{1F373} Cook Together 3x", "challenge:pick:cook")
        .row()
        .text("\u{1F4DE} Call a Relative", "challenge:pick:call")
        .row()
        .text("\u{1F3B2} Random Challenge", "challenge:pick:random");

    await ctx.reply(
        "*Family Challenges* \u{1F3AF}\n\n" +
        "No active challenge right now.\n\n" +
        "*Pick a challenge to start this week:*",
        { parse_mode: "Markdown", reply_markup: suggestedChallenges }
    );
}

export async function handleSavings(ctx: Context): Promise<void> {
    await ctx.reply(
        "*Family Savings Vault*\n\n" +
        "\u{1F4B0} Balance: *0 FAM*\n" +
        "\u{1F4C8} APY: *4.5%* (Bonzo Finance)\n" +
        "\u{1F3AF} Goal: _Not set_\n\n" +
        "_Grow your family fund together._",
        { parse_mode: "Markdown", reply_markup: savingsKeyboard() }
    );
}

export async function handleHelp(ctx: Context): Promise<void> {
    const { InlineKeyboard } = await import("grammy");
    const quickStart = new InlineKeyboard()
        .text("\u{1F4AC} Try Check-In", "action:checkin")
        .text("\u{1F916} Pick Agent", "action:agents")
        .row()
        .text("\u{1F4CA} Bond Score", "action:bondscore")
        .text("\u{1F3AF} Challenge", "action:challenge");

    await ctx.reply(
        "*FamilyXYZ — Your Family Companion* \u{1F3E1}\n\n" +
        "*Commands:*\n" +
        "\u{1F4AC} `/checkin` — Daily mood & gratitude\n" +
        "\u{1F916} `/agents` — Switch coaching agent\n" +
        "\u{1F3DB} `/council <question>` — All 5 agents weigh in\n" +
        "\u{1F4AD} `/ask <agent> <question>` — Ask a specific agent\n" +
        "\u{1F4CA} `/bondscore` — Family health metrics\n" +
        "\u{1F3AF} `/challenge` — Weekly family goals\n" +
        "\u{1F4B0} `/savings` — FAM token vault\n\n" +
        "*Smart routing:* Just type naturally — I detect your topic and route to the right agent automatically.\n\n" +
        "_Try something:_",
        { parse_mode: "Markdown", reply_markup: quickStart }
    );
}

export async function handleMoodSelection(
    ctx: Context,
    mood: string,
    session: SessionData
): Promise<void> {
    session.checkInState = "gratitude";
    session.checkInData = { mood };

    const moodEmoji: Record<string, string> = {
        thriving: "\u{2728}",
        good: "\u{1F60A}",
        okay: "\u{1F610}",
        rough: "\u{1F614}",
    };

    await ctx.answerCallbackQuery({ text: `Mood: ${moodEmoji[mood] || ""} ${mood}` });

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `Mood: ${moodEmoji[mood] || ""} *${mood}*`,
            { parse_mode: "Markdown" }
        );
    }

    await ctx.reply(
        "What's *one thing* you're grateful for in your family today?",
        { parse_mode: "Markdown" }
    );
}

export async function handleGratitude(
    ctx: Context,
    text: string,
    session: SessionData
): Promise<void> {
    session.checkInData = { ...session.checkInData, gratitude: text };
    session.checkInState = "story";

    await ctx.reply(
        "Beautiful. Would you like to share a family moment from today?",
        { reply_markup: checkinFollowUpKeyboard() }
    );
}

export async function handleCheckInComplete(
    ctx: Context,
    session: SessionData
): Promise<void> {
    const mood = session.checkInData?.mood || "good";
    const gratitude = session.checkInData?.gratitude || "";

    // Persist to database
    if (session.userId) {
        saveCheckin(session.userId, mood, gratitude || undefined);
        const user = getUser(session.userId);
        if (user) {
            session.checkInStreak = user.checkin_streak;
            session.lastCheckIn = user.last_checkin_at || undefined;
        }
    } else {
        // Fallback: session-only streak calc
        const today = new Date().toDateString();
        const lastDay = session.lastCheckIn ? new Date(session.lastCheckIn).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDay === yesterday) {
            session.checkInStreak += 1;
        } else if (lastDay !== today) {
            session.checkInStreak = 1;
        }
        session.lastCheckIn = Date.now();
    }

    session.checkInState = null;

    const moodEmoji: Record<string, string> = {
        thriving: "\u{2728}",
        good: "\u{1F60A}",
        okay: "\u{1F610}",
        rough: "\u{1F614}",
    };

    const { InlineKeyboard } = await import("grammy");
    const nextSteps = new InlineKeyboard()
        .text("\u{1F4CA} See Bond Score", "action:bondscore")
        .text("\u{1F3AF} Try a Challenge", "action:challenge");

    let encouragement = "";
    if (session.checkInStreak >= 7) {
        encouragement = "\n\u{1F3C6} _Amazing! A full week of check-ins._";
    } else if (session.checkInStreak >= 3) {
        encouragement = "\n\u{1F4AA} _Keep it up! You're building a habit._";
    }

    await ctx.reply(
        "*Check-in complete!* \u{2705}\n\n" +
        `${moodEmoji[mood] || ""} Mood: *${mood}*\n` +
        (gratitude ? `\u{1F64F} Gratitude: _${gratitude}_\n` : "") +
        `\n\u{1F525} Streak: *${session.checkInStreak} day${session.checkInStreak > 1 ? "s" : ""}*` +
        encouragement +
        "\n\n_+2 Presence score. What's next?_",
        { parse_mode: "Markdown", reply_markup: nextSteps }
    );

    session.checkInData = undefined;
}

export async function handleAgentSelection(
    ctx: Context,
    agentKey: string,
    session: SessionData
): Promise<void> {
    const agent = AGENT_PROFILES[agentKey];
    if (!agent) {
        await ctx.answerCallbackQuery({ text: "Unknown agent" });
        return;
    }

    session.preferredAgent = agentKey;
    if (session.userId) {
        updateUser(session.userId, { preferred_agent: agentKey });
    }
    await ctx.answerCallbackQuery({ text: `Switched to ${agent.name}` });

    const starters: Record<string, string[]> = {
        wisdom: ["How can I resolve a conflict with my partner?", "What does healthy boundaries look like?"],
        intimacy: ["How do we reconnect after a busy week?", "Tips for deeper conversations?"],
        growth: ["I'm struggling with a setback", "How do I build resilience in my family?"],
        presence: ["Help me be more present with my kids", "Guide me through a mindfulness moment"],
        bridge: ["How do I connect with my aging parents?", "Ways to share family stories?"],
        savings: ["How should our family start saving?", "Explain the FAM vault to me"],
    };

    const suggestions = starters[agentKey] || ["Ask me anything!"];
    const promptText = suggestions.map(s => `• _${s}_`).join("\n");

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `${agent.emoji} *Now chatting with ${agent.name}*\n_${agent.desc}_\n\n` +
            `Try asking:\n${promptText}\n\n` +
            `Or just type your question — I'm here to help.`,
            { parse_mode: "Markdown" }
        );
    }
}

export async function handleOnboardCallback(ctx: Context, topic: string): Promise<void> {
    await ctx.answerCallbackQuery();

    switch (topic) {
        case "checkins":
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{1F4AC} *Daily Check-Ins*\n\nTrack your mood, practice gratitude, and share family moments. Builds your Presence score.\n\n_Let's try one now — how are you feeling?_",
                    { parse_mode: "Markdown" }
                );
            }
            await handleCheckIn(ctx);
            return;

        case "agents":
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{1F916} *6 Specialized Agents*\n\nEach agent brings unique coaching expertise. Pick one and your conversations will be guided by their specialty.\n\n_Choose your first agent:_",
                    { parse_mode: "Markdown" }
                );
            }
            await handleAgents(ctx);
            return;

        case "bond":
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{1F4CA} *Bond Score*\n\n7 metrics tracking your family health. Improves through daily check-ins, challenges, and family engagement.\n\n_Here's where you stand:_",
                    { parse_mode: "Markdown" }
                );
            }
            await handleBondScore(ctx);
            return;

        case "challenges":
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{1F3AF} *Family Challenges*\n\nSet goals together — cook 3x this week, device-free dinner, share a story with grandma.\n\n_Here's your challenge board:_",
                    { parse_mode: "Markdown" }
                );
            }
            await handleChallenge(ctx);
            return;

        case "savings":
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{1F4B0} *Savings Vault*\n\nPool FAM tokens as a family, earn 4.5% APY through Bonzo Finance.\n\n_Here's your vault:_",
                    { parse_mode: "Markdown" }
                );
            }
            await handleSavings(ctx);
            return;

        case "help":
        default: {
            const { onboardingKeyboard } = await import("./keyboards.js");
            if (ctx.callbackQuery?.message) {
                await ctx.api.editMessageText(
                    ctx.callbackQuery.message.chat.id,
                    ctx.callbackQuery.message.message_id,
                    "\u{2753} *Getting Started*\n\nJust talk naturally! I'll route your message to the right agent.\n\nOr use the menu buttons below for quick actions.\n\n_Tap any feature to try it:_",
                    { parse_mode: "Markdown", reply_markup: onboardingKeyboard() }
                );
            }
            return;
        }
    }
}
