import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AgentEvent {
    id: string;
    type: 'text' | 'tool_call' | 'tool_result' | 'state_delta' | 'interrupt' | 'reasoning' | 'metric';
    content: string;
    timestamp: number;
    agentId?: string;
    toolName?: string;
    data?: Record<string, unknown>;
}

const AGENTS = [
    { id: 'wisdom', name: 'Wisdom', emoji: '\uD83E\uDDE0' },
    { id: 'intimacy', name: 'Intimacy', emoji: '\uD83D\uDC96' },
    { id: 'presence', name: 'Presence', emoji: '\uD83E\uDDD8' },
    { id: 'growth', name: 'Growth', emoji: '\uD83C\uDF31' },
    { id: 'bridge', name: 'Bridge', emoji: '\uD83E\uDDD3' },
    { id: 'savings', name: 'Savings', emoji: '\uD83D\uDCB0' },
];

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDemoEvent(agentId: string): AgentEvent {
    const eventTypes: AgentEvent['type'][] = ['text', 'tool_call', 'tool_result', 'reasoning', 'state_delta'];
    const type = randomItem(eventTypes);

    const demoContent: Record<string, string[]> = {
        text: [
            "I've analyzed your family's recent interactions and noticed a positive trend in communication.",
            "Based on your check-in data, I recommend focusing on quality time this weekend.",
            "Your bond score has improved by 5 points this week. Great progress!",
            "I see you've been consistent with daily check-ins. Keep it up!",
            "The family wellness indicators are looking strong this week.",
        ],
        tool_call: [
            "Analyzing family interaction patterns...",
            "Querying bond score metrics...",
            "Checking recent check-in history...",
            "Processing emotional sentiment data...",
            "Calculating family health indicators...",
        ],
        tool_result: [
            "Found 12 positive interactions this week",
            "Bond score calculation complete: 78/100",
            "Check-in streak: 5 days",
            "Sentiment analysis: 85% positive",
            "Family health score: 82/100",
        ],
        reasoning: [
            "The user seems to be building a consistent habit with check-ins.",
            "Family communication patterns suggest room for improvement in active listening.",
            "Recent milestone suggests increased family engagement.",
            "Growth trajectory indicates positive momentum.",
        ],
        state_delta: [
            "Family health metrics updated",
            "Agent attention shifted to bond score analysis",
            "Processing completed for weekly summary",
        ],
    };

    const contents = demoContent[type] || demoContent.text;
    const content = randomItem(contents);

    return {
        id: crypto.randomUUID(),
        type,
        content,
        timestamp: Date.now(),
        agentId,
        toolName: type === 'tool_call' ? randomItem(['analyzeFamilyMetrics', 'calculateBondScore', 'processCheckIn', 'generateRecommendation']) : undefined,
    };
}

let bondScores: number[] = [62, 65, 68, 72, 75, 78, 82, 85];

function generateMetricEvent(): AgentEvent {
    const lastScore = bondScores[bondScores.length - 1];
    const newScore = Math.min(100, Math.max(0, lastScore + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)));
    bondScores.push(newScore);
    if (bondScores.length > 30) bondScores.shift();

    return {
        id: crypto.randomUUID(),
        type: 'metric',
        content: 'Bond score updated',
        timestamp: Date.now(),
        agentId: 'system',
        data: {
            metric: 'bondScore',
            value: newScore,
            history: [...bondScores.slice(-7)],
            activeAgents: Math.floor(Math.random() * 3) + 4,
        },
    };
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    const { agentId } = await params;
    const encoder = new TextEncoder();

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const activeTimers: ReturnType<typeof setTimeout>[] = [];

    const stream = new ReadableStream({
        start(controller) {
            const send = (event: AgentEvent) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                } catch { }
            };

            send({
                id: crypto.randomUUID(),
                type: 'state_delta',
                content: `Connected to ${agentId} agent stream`,
                timestamp: Date.now(),
                agentId,
            });

            const activeAgent = AGENTS.find(a => a.id === agentId);
            if (activeAgent) {
                send({
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: `${activeAgent.emoji} ${activeAgent.name} agent online. Ready to process family data.`,
                    timestamp: Date.now(),
                    agentId,
                });
            }

            const initialEvent = generateDemoEvent(agentId);
            send(initialEvent);

            const metricInterval = setInterval(() => {
                send(generateMetricEvent());
            }, 8000);

            const scheduleNext = () => {
                const delay = 4000 + Math.random() * 6000;
                const timer = setTimeout(() => {
                    const event = generateDemoEvent(agentId);
                    send(event);
                    scheduleNext();
                }, delay);
                activeTimers.push(timer);
            };
            scheduleNext();

            timeoutId = setTimeout(() => {
                clearInterval(metricInterval);
                activeTimers.forEach(clearTimeout);
                try { controller.close(); } catch { }
            }, 60000);

            stream.cancel = async () => {
                clearInterval(metricInterval);
                activeTimers.forEach(clearTimeout);
                if (timeoutId) clearTimeout(timeoutId);
            };
        },
        cancel() {
            if (timeoutId) clearTimeout(timeoutId);
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
