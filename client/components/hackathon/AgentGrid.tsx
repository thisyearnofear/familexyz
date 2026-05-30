'use client';

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion" ;

type AgentStatus = "IDLE" | "BUSY" | "DONE" | "CRSH" | "RETRY";

interface Agent {
    id: string;
    name: string;
    status: AgentStatus;
    emoji: string;
}

const defaultAgents: Agent[] = [
    { id: "wisdom", name: "Wisdom", status: "IDLE", emoji: "\uD83E\uDDE0" },
    { id: "intimacy", name: "Intimacy", status: "IDLE", emoji: "\uD83D\uDC96" },
    { id: "presence", name: "Presence", status: "IDLE", emoji: "\uD83E\uDDD8" },
    { id: "generational", name: "Generational", status: "IDLE", emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66" },
    { id: "growth", name: "Growth", status: "IDLE", emoji: "\uD83C\uDF31" },
];

const statusColors: Record<AgentStatus, string> = {
    IDLE: "border-gray-700 text-gray-500",
    BUSY: "border-yellow-500 text-yellow-400",
    DONE: "border-green-500 text-green-400",
    CRSH: "border-red-500 text-red-400",
    RETRY: "border-orange-500 text-orange-400",
};

const statusLabels: Record<AgentStatus, string> = {
    IDLE: "AWAITING",
    BUSY: "PROCESSING...",
    DONE: "COMPLETE",
    CRSH: "ERROR",
    RETRY: "RETRYING...",
};

interface AgentGridProps {
    isTransforming: boolean;
}

export function AgentGrid({ isTransforming }: AgentGridProps) {
    const [agents, setAgents] = useState<Agent[]>(defaultAgents);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const es = new EventSource("/api/agents");
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "agent-status" && data.agents) {
                    setAgents(data.agents);
                }
            } catch (e) {
                // ignore parse errors
            }
        };

        es.onerror = () => {
            es.close();
        };

        return () => {
            es.close();
        };
    }, []);

    return (
        <div className="border border-green-500/30 rounded-lg p-4 bg-black/50">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                    Agent Grid
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600">
                        {agents.filter((a) => a.status === "DONE").length}/
                        {agents.length} active
                    </span>
                    {isTransforming && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {agents.map((agent) => (
                    <AgentCell key={agent.id} agent={agent} />
                ))}
            </div>
        </div>
    );
}

function AgentCell({ agent }: { agent: Agent }) {
    return (
        <motion.div
            layout
            className={`border rounded-lg p-3 text-center transition-colors duration-300 ${statusColors[agent.status]} ${
                agent.status === "BUSY"
                    ? "bg-yellow-500/5 border-yellow-500/50"
                    : agent.status === "CRSH"
                      ? "bg-red-500/5 border-red-500/50"
                      : "bg-black/30"
            }`}
            animate={{
                scale: agent.status === "BUSY" ? [1, 1.05, 1] : 1,
                transition: {
                    repeat:
                        agent.status === "BUSY"
                            ? Infinity
                            : 0,
                    duration: 1.5,
                },
            }}
        >
            <div className="text-2xl mb-1">{agent.emoji}</div>
            <div className="text-xs font-medium mb-1">{agent.name}</div>
            <div
                className={`text-[10px] font-mono uppercase tracking-wider ${
                    agent.status === "BUSY"
                        ? "text-yellow-400"
                        : agent.status === "DONE"
                          ? "text-green-400"
                          : agent.status === "CRSH"
                            ? "text-red-400"
                            : agent.status === "RETRY"
                              ? "text-orange-400"
                              : "text-gray-600"
                }`}
            >
                {agent.status === "BUSY" ? (
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                        PROCESSING
                    </span>
                ) : (
                    statusLabels[agent.status]
                )}
            </div>
        </motion.div>
    );
}
