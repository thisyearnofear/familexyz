/**
 * Daily Take Generator
 *
 * Finds one story from the zeitgeist daily, then generates
 * five agent perspectives through their unique intellectual lenses.
 *
 * Sources alternate between RSS feeds and web search.
 */

import { elizaLogger, type AgentRuntime, ModelClass } from "@elizaos/core";

const RSS_SOURCES = [
    { name: "The Atlantic - Family", url: "https://www.theatlantic.com/feed/channel/family/" },
    { name: "The Guardian - Family", url: "https://www.theguardian.com/lifeandstyle/family/rss" },
    { name: "NYT - Well Family", url: "https://rss.nytimes.com/services/xml/rss/nyt/Well.xml" },
    { name: "BBC - Family & Education", url: "https://feeds.bbci.co.uk/news/education/rss.xml" },
];

const AGENT_PROMPTS: Record<string, { influence: string; prompt: string }> = {
    wisdom: {
        influence: "Alain de Botton",
        prompt: `You are Alain de Botton writing about this story for The School of Life. Respond in EXACTLY 2-3 sentences. What does this reveal about the human condition? Be philosophical but plain-spoken. No preamble, no hedging, no "this study shows" — just your take.`,
    },
    intimacy: {
        influence: "Esther Perel",
        prompt: `You are Esther Perel reacting to this story on her podcast. Respond in EXACTLY 2-3 sentences. What does this mean for how we connect? Be curious, direct, alive to paradox. No preamble — just your take.`,
    },
    presence: {
        influence: "Thich Nhat Hanh",
        prompt: `You are Thich Nhat Hanh offering a brief reflection on this story. Respond in EXACTLY 2-3 short, spacious sentences. What does this ask us to notice? Speak simply. No preamble — just your take.`,
    },
    growth: {
        influence: "James Clear",
        prompt: `You are James Clear writing about this story in your newsletter. Respond in EXACTLY 2-3 sentences. What's the system, habit, or identity shift here? Be concrete and practical. No preamble — just your take.`,
    },
    bridge: {
        influence: "StoryCorps",
        prompt: `You are a StoryCorps interviewer reflecting on this story through bell hooks' lens. Respond in EXACTLY 2-3 sentences. What story are we passing down? Be warm and specific. No preamble — just your take.`,
    },
};

export interface DailyTake {
    date: string;
    story: {
        headline: string;
        source: string;
        url?: string;
        summary: string;
    };
    takes: Array<{
        agent: string;
        emoji: string;
        influence: string;
        take: string;
    }>;
    generatedAt: number;
    sourceMethod: "rss" | "search";
}

let cachedTake: DailyTake | null = null;

export function getCachedDailyTake(): DailyTake | null {
    if (!cachedTake) return null;
    const today = new Date().toISOString().split("T")[0];
    if (cachedTake.date !== today) return null;
    return cachedTake;
}

export function setCachedDailyTake(take: DailyTake): void {
    cachedTake = take;
}

export async function generateDailyTake(runtime: AgentRuntime): Promise<DailyTake | null> {
    const today = new Date().toISOString().split("T")[0];

    if (cachedTake?.date === today) {
        return cachedTake;
    }

    try {
        const story = await findTodaysStory(runtime);
        if (!story) {
            elizaLogger.warn("[DailyTake] Could not find a suitable story today");
            return null;
        }

        elizaLogger.info(`[DailyTake] Selected: "${story.headline}" (${story.source})`);

        const agentEmojis: Record<string, string> = {
            wisdom: "🧠",
            intimacy: "💖",
            presence: "🧘",
            growth: "🌱",
            bridge: "🧓",
        };

        const takes: DailyTake["takes"] = [];

        for (const [agentId, config] of Object.entries(AGENT_PROMPTS)) {
            try {
                const prompt = `Here is today's story:\n\nHeadline: ${story.headline}\nSource: ${story.source}\nSummary: ${story.summary}\n\n${config.prompt}\n\nRespond with ONLY your 2-3 sentence take, no preamble or labels.`;

                const { generateText } = await import("@elizaos/core");
                const take = await generateText({
                    runtime,
                    context: prompt,
                    modelClass: ModelClass.LARGE,
                });

                takes.push({
                    agent: agentId.charAt(0).toUpperCase() + agentId.slice(1),
                    emoji: agentEmojis[agentId] || "🤖",
                    influence: config.influence,
                    take: take.trim(),
                });
            } catch (err) {
                elizaLogger.warn(`[DailyTake] Failed to generate ${agentId} take:`, err);
                takes.push({
                    agent: agentId.charAt(0).toUpperCase() + agentId.slice(1),
                    emoji: agentEmojis[agentId] || "🤖",
                    influence: config.influence,
                    take: "Could not generate perspective today.",
                });
            }
        }

        const dailyTake: DailyTake = {
            date: today,
            story,
            takes,
            generatedAt: Date.now(),
            sourceMethod: story.url ? "rss" : "search",
        };

        cachedTake = dailyTake;
        elizaLogger.info(`[DailyTake] Generated ${takes.length} perspectives`);
        return dailyTake;
    } catch (error) {
        elizaLogger.error("[DailyTake] Generation failed:", error);
        return null;
    }
}

async function findTodaysStory(runtime: AgentRuntime): Promise<DailyTake["story"] | null> {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const useRss = dayOfYear % 2 === 0;

    if (useRss) {
        const story = await tryRssFeed();
        if (story) return story;
    }

    return await tryWebSearch(runtime);
}

async function tryRssFeed(): Promise<DailyTake["story"] | null> {
    const allItems: Array<{ item: RssItem; source: string }> = [];

    for (const source of RSS_SOURCES) {
        try {
            const res = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) continue;
            const text = await res.text();
            const items = parseRssItems(text);
            for (const item of items.slice(0, 5)) {
                allItems.push({ item, source: source.name });
            }
        } catch {
            continue;
        }
    }

    if (allItems.length === 0) return null;

    const familyKeywords = /family|parent|child|relationship|generation|marriage|partner|sibling|elder|teen|mother|father|kid|couple|home|divorce|caregiving|aging|school|adolescen/i;
    const familyStory = allItems.find(({ item }) =>
        familyKeywords.test(item.title + " " + item.description)
    );

    const chosen = familyStory || allItems[0];
    return {
        headline: chosen.item.title,
        source: chosen.source,
        url: chosen.item.link,
        summary: chosen.item.description.slice(0, 300),
    };
}

async function tryWebSearch(runtime: AgentRuntime): Promise<DailyTake["story"] | null> {
    try {
        const { generateText } = await import("@elizaos/core");
        const result = await generateText({
            runtime,
            context: `You are a news curator. Find ONE interesting, thought-provoking story from the current zeitgeist that relates to family life, relationships, parenting, or intergenerational dynamics. It should be something people are talking about right now — not generic advice content.

Respond in this exact JSON format (no markdown, no code fences):
{"headline": "The actual headline or topic", "source": "Publication or origin", "summary": "2-3 sentence summary of what happened and why it matters"}`,
            modelClass: ModelClass.LARGE,
        });

        const cleaned = result.trim().replace(/```json?\n?/g, "").replace(/```/g, "");
        const parsed = JSON.parse(cleaned);
        return {
            headline: parsed.headline,
            source: parsed.source,
            summary: parsed.summary,
        };
    } catch (err) {
        elizaLogger.warn("[DailyTake] Web search fallback failed:", err);
        return null;
    }
}

interface RssItem {
    title: string;
    link: string;
    description: string;
}

function parseRssItems(xml: string): RssItem[] {
    const items: RssItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const content = match[1];
        const title = extractTag(content, "title");
        const link = extractTag(content, "link");
        const description = extractTag(content, "description");

        if (title) {
            items.push({
                title: decodeEntities(title),
                link: link || "",
                description: decodeEntities(stripHtml(description || "")),
            });
        }
    }

    return items;
}

function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").trim();
}

function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
