import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

export const dynamic = "force-dynamic";

async function fetchAgentStatuses() {
    try {
        const res = await fetch(`${API_BASE}/agents`, { cache: "no-store" });
        if (!res.ok) return null;
        const json = await res.json();
        const agents = json.data?.agents ?? json.agents ?? json;
        if (!Array.isArray(agents)) return null;
        return agents.map((a: any) => {
            const name = a.name?.toLowerCase() || a.id;
            const agent = AGENTS.find(ag => ag.id === name);
            return {
                id: name,
                name: a.name || a.id,
                status: a.status === "running" ? "ACTIVE" : "IDLE",
                emoji: agent?.emoji ?? "\u{1F916}",
            };
        });
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
                isConnected: initial !== null,
            });
            controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

            intervalId = setInterval(async () => {
                const statuses = await fetchAgentStatuses();
                if (statuses) {
                    const data = JSON.stringify({
                        type: "agent-status",
                        agents: statuses,
                        isConnected: true,
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
