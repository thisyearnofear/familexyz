'use client';

import React, { useState, useEffect } from 'react';
import { AgentActivityFeed } from './AgentActivityFeed';
import { BondScoreChart } from './BondScoreChart';

const AGENT_LIST = [
    { id: 'wisdom', name: 'Wisdom', emoji: '\uD83E\uDDE0', desc: 'Philosophy & EQ' },
    { id: 'intimacy', name: 'Intimacy', emoji: '\uD83D\uDC96', desc: 'Relationships' },
    { id: 'presence', name: 'Presence', emoji: '\uD83E\uDDD8', desc: 'Mindfulness' },
    { id: 'growth', name: 'Growth', emoji: '\uD83C\uDF31', desc: 'Challenges' },
    { id: 'bridge', name: 'Bridge', emoji: '\uD83E\uDDD3', desc: 'Generational' },
    { id: 'savings', name: 'Savings', emoji: '\uD83D\uDCB0', desc: 'FAM tokens' },
];

interface AgentStatus {
    id: string;
    name: string;
    status: string;
    emoji: string;
}

export const EnhancedFamilyDashboard: React.FC = () => {
    const [agents, setAgents] = useState<AgentStatus[]>(
        AGENT_LIST.map(a => ({ id: a.id, name: a.name, status: 'IDLE', emoji: a.emoji }))
    );
    const [bondScore, setBondScore] = useState(85);

    useEffect(() => {
        const eventSource = new EventSource('/api/agents');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'agent-status' && Array.isArray(data.agents)) {
                    setAgents(prev => {
                        const updated = [...prev];
                        for (const incoming of data.agents) {
                            const idx = updated.findIndex(a => a.id === incoming.id);
                            if (idx >= 0) {
                                updated[idx] = { ...updated[idx], status: incoming.status };
                            }
                        }
                        return updated;
                    });
                }
            } catch { }
        };

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        const es = new EventSource('/api/agents/primary/stream');
        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'metric' && data.data?.metric === 'bondScore') {
                    setBondScore(data.data.value);
                }
            } catch { }
        };
        return () => es.close();
    }, []);

    const activeCount = agents.filter(a => a.status !== 'IDLE').length;

    const bondColor = bondScore >= 80 ? 'text-green-400' :
                      bondScore >= 60 ? 'text-amber-400' : 'text-red-400';

    return (
        <div className="min-h-screen bg-background">
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                                Family Connection Hub
                            </h1>
                            <p className="text-xs sm:text-sm lg:text-base text-white/90 drop-shadow mt-1">
                                AI-powered family wellness and growth platform
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                <span className="font-semibold text-white text-sm">
                                    System Online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Family Bond Score
                        </h3>
                        <p className={`text-3xl font-bold ${bondColor}`}>
                            {bondScore}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {bondScore >= 80 ? 'Excellent bond strength' :
                             bondScore >= 60 ? 'Steady improvement' :
                             'Room for growth'}
                        </p>
                    </div>
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Active Agents
                        </h3>
                        <p className="text-3xl font-bold text-foreground">
                            {activeCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activeCount > 0
                                ? agents.filter(a => a.status !== 'IDLE').map(a => a.name).join(', ')
                                : 'All agents idle'}
                        </p>
                    </div>
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Agent Statuses
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {agents.map(agent => (
                                <span
                                    key={agent.id}
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                                        agent.status !== 'IDLE'
                                            ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                            : 'bg-muted border-border text-muted-foreground'
                                    }`}
                                >
                                    {agent.emoji} {agent.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BondScoreChart />
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {AGENT_LIST.map(agent => (
                                <a
                                    key={agent.id}
                                    href={`/chat/${agent.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <span className="text-xl">{agent.emoji}</span>
                                    <div>
                                        <p className="text-sm font-medium">{agent.name}</p>
                                        <p className="text-xs text-muted-foreground">{agent.desc}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                    <AgentActivityFeed
                        agentId="primary"
                        maxHeight="360px"
                    />
                </div>

                <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Hackathon Demo
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        Explore the full agent workspace with drag-and-drop input,
                        multi-agent content transformation, and real-time SSE streaming.
                    </p>
                    <a
                        href="/hackathon"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        \uD83D\uDE80 Launch Demo
                    </a>
                </div>
            </div>
        </div>
    );
};
