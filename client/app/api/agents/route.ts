import { NextResponse } from "next/server";

// Shared agent statuses - sync with transform route
const defaultAgentStatuses = [
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

export const dynamic = "force-dynamic";

// GET: SSE stream for agent status updates
export async function GET() {
    const encoder = new TextEncoder();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const stream = new ReadableStream({
        start(controller) {
            // Send initial status
            const initialData = JSON.stringify({
                type: "agent-status",
                agents: defaultAgentStatuses,
            });
            controller.enqueue(
                encoder.encode(`data: ${initialData}\n\n`)
            );

            // Track active controllers globally
            // @ts-ignore
            global.__agentStreamControllers ??= [];
            // @ts-ignore
            global.__agentStreamControllers.push(controller);

            // Poll shared global for status updates
            intervalId = setInterval(() => {
                // @ts-ignore
                const statuses = global.__agentStatuses;
                if (statuses) {
                    const data = JSON.stringify({
                        type: "agent-status",
                        agents: statuses,
                    });
                    try {
                        controller.enqueue(
                            encoder.encode(`data: ${data}\n\n`)
                        );
                    } catch {
                        // Stream closed
                        if (intervalId) clearInterval(intervalId);
                    }
                }
            }, 500);

            // Wait 30s then close (keep-alive timeout)
            timeoutId = setTimeout(() => {
                if (intervalId) clearInterval(intervalId);
                try { controller.close(); } catch {}
            }, 30000);
        },
        cancel() {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            // Remove from global tracking
            // @ts-ignore
            if (global.__agentStreamControllers) {
                // @ts-ignore
                const idx = global.__agentStreamControllers.indexOf(this);
                // @ts-ignore
                if (idx > -1) global.__agentStreamControllers.splice(idx, 1);
            }
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
