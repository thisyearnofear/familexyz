import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const AGENTS = [
    { id: "wisdom", name: "Wisdom", emoji: "🧠", influence: "Alain de Botton" },
    { id: "intimacy", name: "Intimacy", emoji: "💖", influence: "Esther Perel" },
    { id: "presence", name: "Presence", emoji: "🧘", influence: "Thich Nhat Hanh" },
    { id: "growth", name: "Growth", emoji: "🌱", influence: "James Clear" },
    { id: "bridge", name: "Bridge", emoji: "🧓", influence: "StoryCorps" },
];

interface DailyTake {
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
}

export async function GET() {
    try {
        const res = await fetch(`${API_BASE}/daily-take`, { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }
    } catch {}

    const fallback: DailyTake = {
        date: new Date().toISOString().split("T")[0],
        story: {
            headline: "The Rise of \"Soft Parenting\" — And Why It's Sparking Debate",
            source: "The Atlantic",
            summary: "A growing movement of parents is rejecting punishment-based discipline in favor of emotional co-regulation, but critics worry it creates children who can't handle boundaries.",
        },
        takes: [
            {
                agent: "Wisdom",
                emoji: "🧠",
                influence: "Alain de Botton",
                take: "De Botton would remind us that every generation reinvents parenting in reaction to its own wounds. The question isn't whether 'soft parenting' is right, but what unexamined pain drives us to either extreme. The examined family life notices the pendulum without being captured by it.",
            },
            {
                agent: "Intimacy",
                emoji: "💖",
                influence: "Esther Perel",
                take: "Perel would ask: what are we really debating here? The tension between security and freedom lives in every relationship — including parent-child. A child needs both the safety of attunement AND the growth that comes from navigating frustration. The art is holding both without collapsing into either.",
            },
            {
                agent: "Presence",
                emoji: "🧘",
                influence: "Thich Nhat Hanh",
                take: "Before choosing a parenting philosophy, pause. Are you fully present with your child right now, or performing a technique? Thich Nhat Hanh taught that a parent's calm presence IS the discipline. When you are truly here, the right response arises naturally.",
            },
            {
                agent: "Growth",
                emoji: "🌱",
                influence: "James Clear",
                take: "Clear would reframe this entirely: don't pick a parenting 'identity' — build systems. What daily micro-interactions are you repeating? Those compound. One consistent repair after a rupture teaches more resilience than any philosophy. Focus on the reps, not the label.",
            },
            {
                agent: "Bridge",
                emoji: "🧓",
                influence: "StoryCorps",
                take: "Ask your own parents: how were you disciplined, and how did it shape you? StoryCorps has recorded thousands of these conversations. What emerges isn't a 'right answer' — it's understanding. Every family's approach is a response to the generation before. Name it, and you're free to choose consciously.",
            },
        ],
        generatedAt: Date.now(),
    };

    return NextResponse.json(fallback);
}
