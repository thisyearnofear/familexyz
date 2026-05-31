import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

const EMOJI_MAP: Record<string, string> = {
    wisdom: "\uD83E\uDDE0",
    intimacy: "\uD83D\uDC96",
    presence: "\uD83E\uDDD8",
    generationalbridge: "\uD83E\uDDD3",
    growth: "\uD83C\uDF31",
    savings: "\uD83D\uDCB0",
};

export const dynamic = "force-dynamic";

async function fetchAgentStatuses() {
    try {
        const res = await fetch(`${API_BASE}/agents`, { cache: "no-store" });
        if (!res.ok) return null;
        const json = await res.json();
        const agents = json.data?.agents ?? json.agents ?? json;
        if (!Array.isArray(agents)) return null;
        return agents.map((a: any) => ({
            id: a.name?.toLowerCase() || a.id,
            name: a.name || a.id,
            status: a.status === "running" ? "ACTIVE" : "IDLE",
            emoji: EMOJI_MAP[a.name?.toLowerCase()] || "\uD83E\uDD16",
        }));
    } catch {
        return null;
    }
}

export async function GET() {
    const encoder = new TextEncoder();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const stream = new ReadableStream({
        async start(controller) {
            const initial = await fetchAgentStatuses();
            const initialData = JSON.stringify({
                type: "agent-status",
                agents: initial || [],
            });
            controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

            intervalId = setInterval(async () => {
                const statuses = await fetchAgentStatuses();
                if (statuses) {
                    const data = JSON.stringify({
                        type: "agent-status",
                        agents: statuses,
                    });
                    try {
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    } catch {
                        if (intervalId) clearInterval(intervalId);
                    }
                }
            }, 10000);

            timeoutId = setTimeout(() => {
                if (intervalId) clearInterval(intervalId);
                try { controller.close(); } catch {}
            }, 60000);
        },
        cancel() {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
