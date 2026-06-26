import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import type { SessionData } from "./handlers.js";
import { dashboardUrlButton } from "./keyboards.js";

export interface FamilyMember {
    name: string;
    relationship: string;
    addedAt: number;
    cadenceGoal?: "daily" | "few_times_week" | "weekly" | "fortnightly" | "monthly" | "no_goal";
    interactions: Interaction[];
    nudgesEnabled: boolean;
    mentionCount: number;
    optedIn: boolean;
}

export interface Interaction {
    type: "called" | "walked" | "meal" | "gift" | "quality_time" | "messaged" | "visited";
    date: number;
    note?: string;
}

const INTERACTION_LABELS: Record<string, { emoji: string; label: string }> = {
    called: { emoji: "\u{1F4DE}", label: "Called" },
    walked: { emoji: "\u{1F6B6}", label: "Walk" },
    meal: { emoji: "\u{1F37D}\u{FE0F}", label: "Meal" },
    gift: { emoji: "\u{1F381}", label: "Gift/Surprise" },
    quality_time: { emoji: "\u{2615}", label: "Quality time" },
    messaged: { emoji: "\u{1F4AC}", label: "Messaged" },
    visited: { emoji: "\u{1F3E0}", label: "Visited" },
};

const CADENCE_LABELS: Record<string, string> = {
    daily: "Daily",
    few_times_week: "Few times a week",
    weekly: "Weekly",
    fortnightly: "Every couple weeks",
    monthly: "Monthly",
    no_goal: "No goal — just aware",
};

const RELATIONSHIP_TYPES = ["mum", "dad", "sister", "brother", "partner", "child", "grandparent", "uncle", "aunt", "cousin", "friend"];

export function familyListKeyboard(members: FamilyMember[]): InlineKeyboard {
    const kb = new InlineKeyboard();
    for (const member of members) {
        kb.text(`${relationshipEmoji(member.relationship)} ${member.name}`, `family:view:${member.name}`);
        kb.row();
    }
    kb.text("\u{2795} Add someone", "family:add");
    return kb;
}

export function memberActionsKeyboard(name: string): InlineKeyboard {
    const kb = new InlineKeyboard();
    kb.text("\u{1F4DE} Called", `flog:${name}:called`)
      .text("\u{1F6B6} Walk", `flog:${name}:walked`);
    kb.row();
    kb.text("\u{1F37D}\u{FE0F} Meal", `flog:${name}:meal`)
      .text("\u{2615} Time together", `flog:${name}:quality_time`);
    kb.row();
    kb.text("\u{1F4AC} Messaged", `flog:${name}:messaged`)
      .text("\u{1F3E0} Visited", `flog:${name}:visited`);
    kb.row();
    kb.text("\u{1F381} Gift/Surprise", `flog:${name}:gift`);
    kb.row();
    kb.text("\u{2190} Back", "family:list");
    return kb;
}

function cadenceKeyboard(name: string): InlineKeyboard {
    const kb = new InlineKeyboard();
    kb.text("Daily", `fcadence:${name}:daily`)
      .text("Few/week", `fcadence:${name}:few_times_week`);
    kb.row();
    kb.text("Weekly", `fcadence:${name}:weekly`)
      .text("Fortnightly", `fcadence:${name}:fortnightly`);
    kb.row();
    kb.text("Monthly", `fcadence:${name}:monthly`)
      .text("No goal", `fcadence:${name}:no_goal`);
    return kb;
}

function relationshipEmoji(rel: string): string {
    const map: Record<string, string> = {
        mum: "\u{1F469}", dad: "\u{1F468}", sister: "\u{1F467}", brother: "\u{1F466}",
        partner: "\u{1F491}", child: "\u{1F476}", grandparent: "\u{1F9D3}",
        uncle: "\u{1F468}", aunt: "\u{1F469}", cousin: "\u{1F9D1}", friend: "\u{1F91D}",
    };
    return map[rel] || "\u{1F9D1}";
}

function daysSince(timestamp: number): number {
    return Math.floor((Date.now() - timestamp) / 86400000);
}

function formatPulse(member: FamilyMember): string {
    const emoji = relationshipEmoji(member.relationship);
    const lastInteraction = member.interactions.length > 0
        ? member.interactions[member.interactions.length - 1]
        : null;

    let lastLine: string;
    if (!lastInteraction) {
        lastLine = "_No interactions logged yet_";
    } else {
        const days = daysSince(lastInteraction.date);
        const typeInfo = INTERACTION_LABELS[lastInteraction.type];
        if (days === 0) {
            lastLine = `Last: ${typeInfo.emoji} ${typeInfo.label} — today`;
        } else if (days === 1) {
            lastLine = `Last: ${typeInfo.emoji} ${typeInfo.label} — yesterday`;
        } else {
            lastLine = `Last: ${typeInfo.emoji} ${typeInfo.label} — ${days} days ago`;
        }
    }

    const cadenceLine = member.cadenceGoal && member.cadenceGoal !== "no_goal"
        ? `\nGoal: ${CADENCE_LABELS[member.cadenceGoal]}`
        : "";

    const totalCount = member.interactions.length;
    const recentCount = member.interactions.filter(i => daysSince(i.date) <= 30).length;

    return `${emoji} *${member.name}* (${member.relationship})\n${lastLine}${cadenceLine}\n` +
        `This month: ${recentCount} interaction${recentCount !== 1 ? "s" : ""}`;
}

export async function handleFamilyCommand(ctx: Context & { session: SessionData }): Promise<void> {
    const members = ctx.session.familyMembers || [];

    const chatId = ctx.chat?.id.toString();
    const userId = ctx.from?.id.toString();
    const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
    const btn = dashboardUrlButton(chatId, userId, isGroup);

    if (members.length === 0) {
        const kb = new InlineKeyboard()
            .text("\u{2795} Add my first person", "family:add")
            .row()
            .url(btn.text, btn.url);

        await ctx.reply(
            "*Family Connections* \u{1F493}\n\n" +
            "Track your connections with the people who matter most.\n\n" +
            "Add a family member or close friend, and I'll help you stay aware of " +
            "how often you connect — no pressure, just gentle awareness.\n\n" +
            "_Start by adding someone:_",
            { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
    }

    const pulses = members.filter(m => m.optedIn).map(formatPulse);
    const text = pulses.length > 0
        ? `*Your Connections* \u{1F493}\n\n${pulses.join("\n\n")}`
        : "*Your Connections* \u{1F493}\n\n_Add people below to start tracking._";

    const kb = familyListKeyboard(members);
    kb.row().url(btn.text, btn.url);

    await ctx.reply(text, {
        parse_mode: "Markdown",
        reply_markup: kb,
    });
}

export async function handleFamilyAdd(ctx: Context & { session: SessionData }): Promise<void> {
    ctx.session.familyAddState = "awaiting_name";
    await ctx.reply(
        "Who would you like to add?\n\n_Just type their name (e.g., Mum, Dad, Sarah):_"
    );
}

export async function handleFamilyNameInput(ctx: Context & { session: SessionData }, name: string): Promise<void> {
    ctx.session.pendingFamilyName = name;
    ctx.session.familyAddState = "awaiting_relationship";

    const kb = new InlineKeyboard();
    kb.text("Mum", `frel:mum`).text("Dad", `frel:dad`).text("Partner", `frel:partner`);
    kb.row();
    kb.text("Sister", `frel:sister`).text("Brother", `frel:brother`).text("Child", `frel:child`);
    kb.row();
    kb.text("Grandparent", `frel:grandparent`).text("Friend", `frel:friend`);

    await ctx.reply(
        `Got it — *${name}*. What's their relationship to you?`,
        { parse_mode: "Markdown", reply_markup: kb }
    );
}

export async function handleRelationshipSelect(
    ctx: Context & { session: SessionData },
    relationship: string
): Promise<void> {
    const name = ctx.session.pendingFamilyName;
    if (!name) return;

    if (!ctx.session.familyMembers) ctx.session.familyMembers = [];

    const member: FamilyMember = {
        name,
        relationship,
        addedAt: Date.now(),
        interactions: [],
        nudgesEnabled: false,
        mentionCount: 0,
        optedIn: true,
    };

    ctx.session.familyMembers.push(member);
    ctx.session.familyAddState = undefined;
    ctx.session.pendingFamilyName = undefined;

    await ctx.answerCallbackQuery({ text: `Added ${name}!` });

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `${relationshipEmoji(relationship)} *${name}* added!\n\n` +
            `How often would you _like_ to connect with ${name}? ` +
            `This isn't a target — just helps me know what matters to you.`,
            { parse_mode: "Markdown", reply_markup: cadenceKeyboard(name) }
        );
    }
}

export async function handleCadenceSelect(
    ctx: Context & { session: SessionData },
    memberName: string,
    cadence: string
): Promise<void> {
    const member = findMember(ctx.session, memberName);
    if (!member) return;

    member.cadenceGoal = cadence as FamilyMember["cadenceGoal"];
    await ctx.answerCallbackQuery();

    const cadenceText = CADENCE_LABELS[cadence] || cadence;

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `\u{2705} *${memberName}* — goal: ${cadenceText}\n\n` +
            `Whenever you connect with ${memberName}, tap a button below to log it. ` +
            `I'll keep a gentle pulse so you can see your connection over time.`,
            { parse_mode: "Markdown", reply_markup: memberActionsKeyboard(memberName) }
        );
    }
}

export async function handleInteractionLog(
    ctx: Context & { session: SessionData },
    memberName: string,
    interactionType: string
): Promise<void> {
    const member = findMember(ctx.session, memberName);
    if (!member) {
        await ctx.answerCallbackQuery({ text: "Person not found" });
        return;
    }

    const interaction: Interaction = {
        type: interactionType as Interaction["type"],
        date: Date.now(),
    };
    member.interactions.push(interaction);

    const typeInfo = INTERACTION_LABELS[interactionType];
    const total = member.interactions.length;

    await ctx.answerCallbackQuery({ text: `${typeInfo.emoji} Logged!` });

    // After 5 interactions, enable nudges
    if (total === 5 && !member.nudgesEnabled) {
        member.nudgesEnabled = true;
    }

    let celebration = "";
    if (total === 1) {
        celebration = "\n\n_First one logged! You're building awareness._";
    } else if (total === 5) {
        celebration = "\n\n\u{2728} _5 connections logged — I'll start weaving gentle awareness into our chats._";
    } else if (total % 10 === 0) {
        celebration = `\n\n\u{1F389} _${total} connections with ${memberName}!_`;
    }

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `${typeInfo.emoji} *${typeInfo.label}* with ${memberName} — logged!${celebration}\n\n` +
            `_Log another, or tap Back to see all connections._`,
            { parse_mode: "Markdown", reply_markup: memberActionsKeyboard(memberName) }
        );
    }
}

export async function handleViewMember(
    ctx: Context & { session: SessionData },
    memberName: string
): Promise<void> {
    const member = findMember(ctx.session, memberName);
    if (!member) {
        await ctx.answerCallbackQuery({ text: "Person not found" });
        return;
    }

    await ctx.answerCallbackQuery();

    const pulse = formatPulse(member);

    // Show recent interactions
    const recent = member.interactions.slice(-5).reverse();
    let historyText = "";
    if (recent.length > 0) {
        const lines = recent.map(i => {
            const info = INTERACTION_LABELS[i.type];
            const days = daysSince(i.date);
            const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;
            return `  ${info.emoji} ${info.label} — ${when}`;
        });
        historyText = "\n\n*Recent:*\n" + lines.join("\n");
    }

    if (ctx.callbackQuery?.message) {
        await ctx.api.editMessageText(
            ctx.callbackQuery.message.chat.id,
            ctx.callbackQuery.message.message_id,
            `${pulse}${historyText}\n\n_Log a new interaction:_`,
            { parse_mode: "Markdown", reply_markup: memberActionsKeyboard(memberName) }
        );
    }
}

/**
 * Layer 0→1: Detect family member mentions in free text.
 * Returns a soft opt-in prompt if a name is mentioned 3+ times and not yet tracked.
 */
export function checkForMemberMention(
    text: string,
    session: SessionData
): { name: string; prompt: string } | null {
    if (!session.familyMembers) session.familyMembers = [];
    if (!session.mentionedNames) session.mentionedNames = {};

    const familyWords = ["mum", "mom", "dad", "sister", "brother", "wife", "husband", "partner", "grandma", "grandpa", "nana", "papa"];
    const lowerText = text.toLowerCase();

    for (const word of familyWords) {
        if (!lowerText.includes(word)) continue;

        // Skip if already tracked
        const alreadyTracked = session.familyMembers.some(
            m => m.name.toLowerCase() === word || m.relationship === word
        );
        if (alreadyTracked) continue;

        // Increment mention count
        session.mentionedNames[word] = (session.mentionedNames[word] || 0) + 1;

        if (session.mentionedNames[word] === 3) {
            const displayName = word.charAt(0).toUpperCase() + word.slice(1);
            return {
                name: word,
                prompt: `You mention your ${word} often — would you like me to help you stay connected with them? I can gently keep track of when you last connected.`,
            };
        }
    }

    return null;
}

/**
 * Layer 3: Generate a contextual nudge if appropriate.
 * Returns null if no nudge is warranted.
 */
export function generateNudge(session: SessionData): string | null {
    if (session.nudgePaused) return null;
    if (!session.familyMembers || session.familyMembers.length === 0) return null;

    // Max 1 nudge per 3 days
    if (session.lastNudgeDate && daysSince(session.lastNudgeDate) < 3) return null;

    // Don't nudge on rough mood days
    if (session.checkInData?.mood === "rough") return null;

    for (const member of session.familyMembers) {
        if (!member.optedIn || !member.nudgesEnabled) continue;
        if (member.interactions.length < 5) continue;

        const lastInteraction = member.interactions[member.interactions.length - 1];
        if (!lastInteraction) continue;

        const days = daysSince(lastInteraction.date);
        const threshold = getCadenceThreshold(member.cadenceGoal);

        if (days >= threshold) {
            session.lastNudgeDate = Date.now();
            return generateNudgeText(member, days);
        }
    }

    return null;
}

function getCadenceThreshold(cadence?: string): number {
    switch (cadence) {
        case "daily": return 2;
        case "few_times_week": return 4;
        case "weekly": return 9;
        case "fortnightly": return 18;
        case "monthly": return 35;
        default: return 14;
    }
}

function generateNudgeText(member: FamilyMember, daysSinceContact: number): string {
    const name = member.name;
    const templates = [
        `Thinking of ${name}? Could be a nice day for a quick call.`,
        `${name} might love to hear from you — even a short message.`,
        `Any plans to see ${name} soon? No pressure, just checking in.`,
        `A good week to connect with ${name} if you get a chance.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Post-checkin nudge: after gratitude, if they mention a person who is tracked,
 * offer to let that person know.
 */
export function getPostCheckinSuggestion(
    gratitudeText: string,
    session: SessionData
): { memberName: string; suggestion: string } | null {
    if (!session.familyMembers) return null;

    const lower = gratitudeText.toLowerCase();
    for (const member of session.familyMembers) {
        if (lower.includes(member.name.toLowerCase())) {
            return {
                memberName: member.name,
                suggestion: `You mentioned ${member.name} — want to let them know they made your day?`,
            };
        }
    }
    return null;
}

function findMember(session: SessionData, name: string): FamilyMember | undefined {
    return session.familyMembers?.find(m => m.name.toLowerCase() === name.toLowerCase());
}
