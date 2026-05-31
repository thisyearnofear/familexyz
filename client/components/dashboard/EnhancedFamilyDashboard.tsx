'use client';

import React, { useState, useEffect } from 'react';
import { Playfair_Display } from "next/font/google";
import { BondScoreChart } from './BondScoreChart';
import Link from 'next/link';

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const AGENT_META: Record<string, { name: string; emoji: string; color: string; desc: string; tagline: string }> = {
    wisdom:   { name: "Wisdom",    emoji: "\uD83E\uDDE0", color: "#6d28d9", desc: "Philosophy & EQ", tagline: "Alain de Botton on life, love, and family" },
    intimacy: { name: "Intimacy",  emoji: "\uD83D\uDC96", color: "#db2777", desc: "Relationships", tagline: "Esther Perel on connection and desire" },
    presence: { name: "Presence",  emoji: "\uD83E\uDDD8", color: "#0d9488", desc: "Mindfulness", tagline: "Thich Nhat Hanh on being here now" },
    growth:   { name: "Growth",    emoji: "\uD83C\uDF31", color: "#d97706", desc: "Challenges", tagline: "James Clear on habits that compound" },
    bridge:   { name: "Bridge",    emoji: "\uD83E\uDDD3", color: "#2563eb", desc: "Generational", tagline: "StoryCorps on family narratives" },
    savings:  { name: "Savings",   emoji: "\uD83D\uDCB0", color: "#059669", desc: "FAM tokens", tagline: "Coming soon" },
};

const ACTIVE_AGENTS = Object.entries(AGENT_META).filter(([id]) => id !== 'savings');

interface AgentStatus {
    id: string;
    name: string;
    status: string;
    emoji: string;
}

export const EnhancedFamilyDashboard: React.FC = () => {
    const [agents, setAgents] = useState<AgentStatus[]>(
        Object.entries(AGENT_META).map(([id, a]) => ({ id, name: a.name, status: 'IDLE', emoji: a.emoji }))
    );
    const [bondScore, setBondScore] = useState(85);
    const [bondHistory, setBondHistory] = useState<number[]>([62, 65, 68, 72, 75, 78, 82, 85]);

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
                            if (idx >= 0) updated[idx] = { ...updated[idx], status: incoming.status };
                        }
                        return updated;
                    });
                }
            } catch {}
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
                    if (data.data?.history) setBondHistory(data.data.history);
                }
            } catch {}
        };
        return () => es.close();
    }, []);

    const activeCount = agents.filter(a => a.status !== 'IDLE').length;
    const bondColor = bondScore >= 80 ? 'text-green-400' : bondScore >= 60 ? 'text-amber-400' : 'text-red-400';

    return (
        <div className={`${playfair.variable} min-h-screen fade-in`}>
            {/* Header */}
            <div className="px-6 py-10 sm:py-14">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="w-16 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                    <h1 className="font-[family-name:var(--font-playfair)] text-[clamp(1.4rem,3vw,2.2rem)] font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
                        Family Connection Hub
                    </h1>
                    <p className="mt-2 text-editorial-muted text-sm">
                        Your family&rsquo;s personalized agent council
                    </p>
                    <div className="w-24 h-px mx-auto mt-4 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in fade-in-d1">
                    <div className="rounded-lg p-5 border border-[#2d2a24]"
                        style={{ background: "linear-gradient(135deg, #c4542b08 0%, transparent 70%)" }}>
                        <p className="text-xs tracking-[0.1em] uppercase text-editorial-subtle mb-2">
                            Family Bond Score
                        </p>
                        <p className={`text-3xl font-bold tracking-tight ${bondColor}`}>
                            {bondScore}%
                        </p>
                        <p className="text-xs text-editorial-subtle mt-1">
                            {bondScore >= 80 ? 'Strong connection \u2014 keep nurturing it' :
                             bondScore >= 60 ? 'Building momentum \u2014 stay consistent' :
                             'Room to grow \u2014 small steps add up'}
                        </p>
                    </div>
                    <div className="rounded-lg p-5 border border-[#2d2a24]"
                        style={{ background: "linear-gradient(135deg, #db277708 0%, transparent 70%)" }}>
                        <p className="text-xs tracking-[0.1em] uppercase text-editorial-subtle mb-2">
                            Active Agents
                        </p>
                        <p className="text-3xl font-bold tracking-tight text-editorial-cream">
                            {activeCount}
                        </p>
                        <p className="text-xs text-editorial-subtle mt-1">
                            {activeCount > 0
                                ? agents.filter(a => a.status !== 'IDLE').map(a => a.name).join(', ')
                                : 'All agents ready to help'}
                        </p>
                    </div>
                    <div className="rounded-lg p-5 border border-[#2d2a24]"
                        style={{ background: "linear-gradient(135deg, #0d948808 0%, transparent 70%)" }}>
                        <p className="text-xs tracking-[0.1em] uppercase text-editorial-subtle mb-2">
                            Today&rsquo;s Council
                        </p>
                        <p className="text-3xl font-bold tracking-tight text-editorial-accent">
                            New
                        </p>
                        <p className="text-xs text-editorial-subtle mt-1">
                            5 perspectives on today&rsquo;s story
                        </p>
                    </div>
                </div>

                {/* Chart + Agents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in fade-in-d2">
                    <BondScoreChart
                        data={bondHistory.map((score, i) => ({
                            day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7] + (i >= 7 ? `+${Math.floor(i/7)}` : ''),
                            score,
                            target: Math.min(100, score + 8),
                        }))}
                    />
                    <div className="rounded-lg p-5 border border-[#2d2a24]"
                        style={{ background: "linear-gradient(135deg, #2563eb08 0%, transparent 70%)" }}>
                        <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-editorial-cream mb-4">
                            Your Agents
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {ACTIVE_AGENTS.map(([id, agent]) => (
                                <a
                                    key={id}
                                    href={`/chat/${id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:-translate-y-0.5 duration-200"
                                    style={{ background: `linear-gradient(135deg, ${agent.color}08 0%, transparent 70%)` }}
                                >
                                    <span className="text-lg">{agent.emoji}</span>
                                    <div>
                                        <p className="text-sm font-medium text-editorial-cream">{agent.name}</p>
                                        <p className="text-xs text-editorial-subtle">{agent.desc}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Today's Council CTA */}
                <div className="rounded-lg p-5 border border-editorial-accent/20 fade-in fade-in-d3"
                    style={{ background: "linear-gradient(135deg, #c4542b08 0%, transparent 70%)" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-editorial-cream mb-1">
                                Today&rsquo;s Council
                            </h2>
                            <p className="text-editorial-subtle text-sm max-w-lg">
                                One story from the zeitgeist, five distinct perspectives.
                                Wisdom, Intimacy, Presence, Growth, and Bridge weigh in.
                            </p>
                        </div>
                        <Link
                            href="/today"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs tracking-[0.1em] uppercase bg-editorial-accent/10 border border-editorial-accent/20 text-editorial-accent hover:bg-editorial-accent/20 transition-colors whitespace-nowrap"
                        >
                            Read today&rsquo;s take
                        </Link>
                    </div>
                </div>

                {/* Meet Your Agents */}
                <div className="space-y-3 fade-in fade-in-d4">
                    <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-editorial-cream text-center">
                        Meet Your Agents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ACTIVE_AGENTS.map(([id, agent]) => (
                            <a
                                key={id}
                                href={`/chat/${id}`}
                                className="group relative rounded-lg p-4 transition-all duration-300 hover:-translate-y-0.5"
                                style={{ background: `linear-gradient(135deg, ${agent.color}08 0%, transparent 70%)` }}
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    <span className="text-xl">{agent.emoji}</span>
                                    <div>
                                        <p className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-editorial-cream"
                                            style={{ color: agent.color }}>
                                            {agent.name}
                                        </p>
                                        <p className="text-xs text-editorial-subtle">{agent.desc}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-editorial-muted leading-relaxed">
                                    {agent.tagline}
                                </p>
                                <p className="mt-2 text-[0.55rem] tracking-[0.1em] uppercase text-editorial-faint group-hover:text-editorial-accent transition-colors">
                                    Chat &rarr;
                                </p>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Telegram */}
                <div className="text-center fade-in fade-in-d5">
                    <div className="w-16 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-editorial-accent/20 to-transparent" />
                    <p className="text-xs text-editorial-subtle">
                        Get the council on{` `}
                        <a
                            href="https://t.me/familexyzbot?start=subscribe_daily"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-editorial-accent hover:text-editorial-accent/80 transition-colors border-b border-editorial-accent/20 hover:border-editorial-accent/50"
                        >
                            Telegram
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
