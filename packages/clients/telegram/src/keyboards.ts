import { InlineKeyboard, Keyboard } from "grammy";

export const AGENT_PROFILES: Record<string, { emoji: string; name: string; desc: string }> = {
    wisdom: { emoji: "\u{1F9E0}", name: "Wisdom", desc: "Philosophy & EQ" },
    intimacy: { emoji: "\u{1F491}", name: "Intimacy", desc: "Relationships" },
    growth: { emoji: "\u{1F680}", name: "Growth", desc: "Challenges & resilience" },
    presence: { emoji: "\u{1F9D8}", name: "Presence", desc: "Mindfulness" },
    bridge: { emoji: "\u{1F9D3}", name: "Bridge", desc: "Generational connection" },
    savings: { emoji: "\u{1F4B0}", name: "Savings", desc: "FAM tokens & yield" },
};

export function persistentKeyboard(): Keyboard {
    return new Keyboard()
        .text("\u{1F4AC} Check In").text("\u{1F493} Family")
        .row()
        .text("\u{1F916} Agents").text("\u{1F3AF} Challenge")
        .row()
        .text("\u{1F4CA} Bond Score").text("\u{2753} Help")
        .persistent()
        .resized();
}

export function agentSelectorKeyboard(): InlineKeyboard {
    const kb = new InlineKeyboard();
    const agents = Object.entries(AGENT_PROFILES);
    for (let i = 0; i < agents.length; i += 2) {
        const [key1, a1] = agents[i];
        kb.text(`${a1.emoji} ${a1.name}`, `agent:${key1}`);
        if (agents[i + 1]) {
            const [key2, a2] = agents[i + 1];
            kb.text(`${a2.emoji} ${a2.name}`, `agent:${key2}`);
        }
        if (i + 2 < agents.length) kb.row();
    }
    return kb;
}

export function moodKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{2728} Thriving", "mood:thriving")
        .text("\u{1F60A} Good", "mood:good")
        .text("\u{1F610} Okay", "mood:okay")
        .text("\u{1F614} Rough", "mood:rough");
}

export function checkinFollowUpKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F4DD} Share a Moment", "checkin:share")
        .text("\u{2705} Done", "checkin:done");
}

export function challengeKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{2705} Mark Complete", "challenge:complete")
        .text("\u{1F4CB} View All", "challenge:list")
        .row()
        .text("\u{2795} New Challenge", "challenge:new");
}

export function challengeCategoryKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F491} Connection", "challenge:cat:connection")
        .text("\u{1F3C3} Activity", "challenge:cat:activity")
        .row()
        .text("\u{1F331} Growth", "challenge:cat:growth")
        .text("\u{1F4B0} Savings", "challenge:cat:savings");
}

export function onboardingKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F916} Meet the Agents", "onboard:agents")
        .text("\u{1F4AC} Daily Check-Ins", "onboard:checkins")
        .row()
        .text("\u{1F4CA} Bond Score", "onboard:bond")
        .text("\u{1F3AF} Challenges", "onboard:challenges")
        .row()
        .text("\u{1F4B0} Savings Vault", "onboard:savings")
        .text("\u{2753} Quick Help", "onboard:help");
}

export function bondScoreKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F4C8} Improve Tips", "bond:tips")
        .text("\u{1F4C5} History", "bond:history");
}

export function savingsKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F4B5} Deposit", "savings:deposit")
        .text("\u{1F4B8} Withdraw", "savings:withdraw")
        .row()
        .text("\u{1F3AF} Set Goal", "savings:goal")
        .text("\u{1F4CA} Details", "savings:details");
}

export function helpKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("\u{1F916} Agents", "help:agents")
        .text("\u{1F4AC} Check-Ins", "help:checkins")
        .row()
        .text("\u{1F4CA} Bond Score", "help:bond")
        .text("\u{1F3AF} Challenges", "help:challenges")
        .row()
        .text("\u{1F4B0} Savings", "help:savings");
}

export const REPLY_KEYBOARD_ACTIONS: Record<string, string> = {
    "\u{1F4AC} Check In": "checkin",
    "\u{1F493} Family": "family",
    "\u{1F916} Agents": "agents",
    "\u{1F3AF} Challenge": "challenge",
    "\u{1F4CA} Bond Score": "bondscore",
    "\u{1F4B0} Savings": "savings",
    "\u{2753} Help": "help",
};

export function formatBondScore(scores: {
    overall: number;
    generational?: number;
    reciprocity?: number;
    sentiment?: number;
    challenges?: number;
    presence?: number;
    network?: number;
    consensus?: number;
}): string {
    const bar = (score: number) => {
        const filled = Math.round(score / 10);
        return "█".repeat(filled) + "░".repeat(10 - filled);
    };

    const trend = scores.overall >= 70 ? "\u{1F4C8}" : scores.overall >= 40 ? "\u{27A1}\u{FE0F}" : "\u{1F4C9}";

    const lines = [
        `*Family Bond Score: ${scores.overall}/100* ${trend}`,
        "",
    ];

    if (scores.generational !== undefined) lines.push(`Generational: ${bar(scores.generational)} ${scores.generational}`);
    if (scores.reciprocity !== undefined) lines.push(`Reciprocity:  ${bar(scores.reciprocity)} ${scores.reciprocity}`);
    if (scores.sentiment !== undefined) lines.push(`Sentiment:    ${bar(scores.sentiment)} ${scores.sentiment}`);
    if (scores.challenges !== undefined) lines.push(`Challenges:   ${bar(scores.challenges)} ${scores.challenges}`);
    if (scores.presence !== undefined) lines.push(`Presence:     ${bar(scores.presence)} ${scores.presence}`);
    if (scores.network !== undefined) lines.push(`Network:      ${bar(scores.network)} ${scores.network}`);
    if (scores.consensus !== undefined) lines.push(`Consensus:    ${bar(scores.consensus)} ${scores.consensus}`);

    return lines.join("\n");
}
