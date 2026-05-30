import { NextResponse } from "next/server";

// In-memory agent status store (used by SSE endpoint)
const agentStatuses = [
    { id: "wisdom", name: "Wisdom", status: "IDLE", emoji: "\uD83E\uDDE0" },
    {
        id: "intimacy",
        name: "Intimacy",
        status: "IDLE",
        emoji: "\uD83D\uDC96",
    },
    {
        id: "presence",
        name: "Presence",
        status: "IDLE",
        emoji: "\uD83E\uDDD8",
    },
    {
        id: "generational",
        name: "Generational",
        status: "IDLE",
        emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66",
    },
    { id: "growth", name: "Growth", status: "IDLE", emoji: "\uD83C\uDF31" },
];

const encoder = new TextEncoder();

function broadcastStatus(statuses: typeof agentStatuses) {
    const data = JSON.stringify({ type: "agent-status", agents: statuses });
    // Store in global for SSE endpoint to pick up
    // @ts-ignore
    global.__agentStatuses = statuses;
}

async function simulateAgentWork(content: string): Promise<string> {
    const updateAgent = (id: string, status: string) => {
        const agent = agentStatuses.find((a) => a.id === id);
        if (agent) {
            agent.status = status;
            broadcastStatus(agentStatuses);
        }
    };

    // Simulate wisdom agent analyzing
    updateAgent("wisdom", "BUSY");
    await new Promise((r) => setTimeout(r, 600));
    updateAgent("wisdom", "DONE");

    // Simulate intimacy agent
    updateAgent("intimacy", "BUSY");
    await new Promise((r) => setTimeout(r, 400));
    updateAgent("intimacy", "DONE");

    // Simulate presence agent
    updateAgent("presence", "BUSY");
    await new Promise((r) => setTimeout(r, 500));
    updateAgent("presence", "DONE");

    // Simulate generational agent (intentional delay to show grid activity)
    updateAgent("generational", "BUSY");
    await new Promise((r) => setTimeout(r, 700));
    updateAgent("generational", "DONE");

    // Simulate growth agent (with retry)
    updateAgent("growth", "BUSY");
    await new Promise((r) => setTimeout(r, 300));
    updateAgent("growth", "CRSH");
    await new Promise((r) => setTimeout(r, 400));
    updateAgent("growth", "RETRY");
    await new Promise((r) => setTimeout(r, 500));
    updateAgent("growth", "DONE");

    // Construct enriched response
    const lines = content.split("\n").filter(Boolean);
    const transformed = lines
        .map((line) => {
            return `> ${line.trim()}\n\n_Wisdom note:_ Reframed with empathy and clarity.\n_Intimacy insight:_ This reflects deep family connection.\n_Presence check:_ Grounded in the present moment.`;
        })
        .join("\n\n---\n\n");

    return transformed || content;
}

export async function POST(request: Request) {
    try {
        const { content, identityId } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Reset all agents to IDLE
        agentStatuses.forEach((a) => (a.status = "IDLE"));
        broadcastStatus(agentStatuses);

        const transformed = await simulateAgentWork(content);

        // Reset all agents back to IDLE after work
        setTimeout(() => {
            agentStatuses.forEach((a) => (a.status = "IDLE"));
            broadcastStatus(agentStatuses);
        }, 1000);

        return NextResponse.json({
            transformed,
            agents: agentStatuses.map((a) => ({
                id: a.id,
                name: a.name,
                status: a.status,
            })),
        });
    } catch (error) {
        console.error("Transform error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
