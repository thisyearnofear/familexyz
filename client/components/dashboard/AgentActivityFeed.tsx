'use client';

import React, { useState } from 'react';
import { useAgentActivity, type AgentEvent } from '@/hooks/useAgentActivity';
import { cn } from '@/lib/utils';

interface AgentActivityFeedProps {
    agentId?: string;
    className?: string;
    maxHeight?: string;
}

const EVENT_TYPE_ICONS: Record<AgentEvent['type'], string> = {
    text: '💬',
    tool_call: '🔧',
    tool_result: '✅',
    state_delta: '📊',
    interrupt: '⚠️',
    reasoning: '🤔',
};

const EVENT_TYPE_COLORS: Record<AgentEvent['type'], string> = {
    text: 'text-blue-400',
    tool_call: 'text-amber-400',
    tool_result: 'text-green-400',
    state_delta: 'text-purple-400',
    interrupt: 'text-red-400',
    reasoning: 'text-cyan-400',
};

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function EventItem({ event }: { event: AgentEvent }) {
    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg bg-muted/50 border",
            event.type === 'interrupt' && "border-red-500/30 bg-red-500/10",
            event.type === 'tool_call' && "border-amber-500/30"
        )}>
            <span className="text-lg flex-shrink-0">
                {EVENT_TYPE_ICONS[event.type]}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                        "text-xs font-medium uppercase",
                        EVENT_TYPE_COLORS[event.type]
                    )}>
                        {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                    </span>
                </div>
                <p className="text-sm mt-1 break-words">
                    {event.content}
                </p>
                {event.toolName && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        {event.toolName}
                    </span>
                )}
            </div>
        </div>
    );
}

export function AgentActivityFeed({
    agentId = 'primary',
    className,
    maxHeight = '400px',
}: AgentActivityFeedProps) {
    const { isConnected, events, error, connect, disconnect, clearEvents } =
        useAgentActivity({ agentId });

    const [autoScroll, setAutoScroll] = useState(true);

    return (
        <div className={cn("flex flex-col", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Agent Activity</h3>
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        isConnected ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-muted-foreground">
                        {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="w-3 h-3"
                        />
                        Auto-scroll
                    </label>
                    <button
                        onClick={clearEvents}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                    >
                        Clear
                    </button>
                    {isConnected ? (
                        <button
                            onClick={disconnect}
                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                            Disconnect
                        </button>
                    ) : (
                        <button
                            onClick={connect}
                            className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                            Connect
                        </button>
                    )}
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Events list */}
            <div
                className="flex-1 overflow-y-auto space-y-2 pr-2"
                style={{ maxHeight }}
            >
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <span className="text-3xl mb-2">📡</span>
                        <p className="text-sm">
                            {isConnected
                                ? 'Waiting for agent activity...'
                                : 'Click Connect to start streaming'}
                        </p>
                    </div>
                ) : (
                    events.map((event) => (
                        <EventItem key={event.id} event={event} />
                    ))
                )}
            </div>

            {/* Footer stats */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>{events.length} events</span>
                {events.length > 0 && (
                    <span>
                        Last: {formatTimestamp(events[0].timestamp)}
                    </span>
                )}
            </div>
        </div>
    );
}
