'use client';

import React, { useState, useEffect } from 'react';
import { AGENTS } from "@/lib/agents";
import { fontVariables } from "@/lib/fonts";
import Link from 'next/link';

function BondBar({ score }: { score: number | null }) {
    const pct = score ?? 0;
    const color = score == null
        ? '#504a42'
        : score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';

    return (
        <div className="reveal-up">
            <div className="flex items-baseline justify-between mb-2">
                <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">
                    Bond Score
                </span>
                <span className="font-[family-name:var(--font-playfair)] text-display font-bold tabular-nums"
                    style={{ color }}>
                    {score != null ? score : '\u2014'}
                </span>
            </div>
            <div className="h-1 w-full rounded-full bg-editorial-subtle/10 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            {score == null && (
                <p className="text-[0.6rem] text-editorial-faint mt-2">
                    Start a conversation to see your family bond score
                </p>
            )}
        </div>
    );
}

function AgentStrip() {
    return (
        <div className="reveal-up reveal-d1 flex flex-wrap items-center gap-x-6 gap-y-2">
            {AGENTS.map((agent) => (
                <Link
                    key={agent.id}
                    href={`/chat/${agent.id}`}
                    className="flex items-center gap-2 group hover-shift"
                >
                    <span className="text-sm">{agent.emoji}</span>
                    <span className="text-xs text-editorial-muted group-hover:text-editorial-cream transition-colors">
                        {agent.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                </Link>
            ))}
        </div>
    );
}

function SparkBars({ data }: { data: number[] }) {
    if (data.length === 0) {
        return (
            <div className="reveal-up reveal-d2 py-6 text-center">
                <p className="text-xs text-editorial-faint">
                    No history yet — chart appears after your first week
                </p>
            </div>
        );
    }

    const max = Math.max(...data, 100);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;

    return (
        <div className="reveal-up reveal-d2">
            <div className="flex items-baseline justify-between mb-4">
                <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">
                    Weekly Trend
                </span>
                <span className={`text-xs tabular-nums ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trend >= 0 ? '+' : ''}{trend}
                </span>
            </div>
            <div className="flex items-end gap-1 h-24">
                {data.map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full relative rounded-t-sm overflow-hidden" style={{ height: `${(score / max) * 100}%` }}>
                            <div className="absolute inset-0 bg-editorial-accent/40" />
                        </div>
                        <span className="text-[0.5rem] text-editorial-faint">
                            {days[i % 7]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const EnhancedFamilyDashboard: React.FC = () => {
    const [bondScore, setBondScore] = useState<number | null>(null);
    const [bondHistory, setBondHistory] = useState<number[]>([]);

    useEffect(() => {
        fetch('/api/families/primary/bond-score')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.score != null) {
                    setBondScore(data.score);
                    setBondHistory(data.history || []);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 space-y-12">
                <header className="reveal-up">
                    <h1 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
                        Dashboard
                    </h1>
                </header>

                <BondBar score={bondScore} />

                <div className="h-px bg-editorial-subtle/10" />

                <AgentStrip />

                <div className="h-px bg-editorial-subtle/10" />

                <SparkBars data={bondHistory} />

                <div className="h-px bg-editorial-subtle/10" />

                <div className="reveal-up reveal-d3 flex items-center justify-between">
                    <p className="text-sm text-editorial-muted">
                        Today&rsquo;s council is ready
                    </p>
                    <Link
                        href="/today"
                        className="text-xs text-editorial-accent hover:text-editorial-accent/80 transition-colors hover-shift"
                    >
                        Read it &rarr;
                    </Link>
                </div>

                <div className="reveal-up reveal-d4 text-center pt-4">
                    <p className="text-[0.6rem] text-editorial-faint">
                        Daily council delivered to{` `}
                        <a
                            href="https://t.me/familexyzbot?start=subscribe_daily"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-editorial-accent/70 hover:text-editorial-accent transition-colors hover-underline-wipe"
                        >
                            Telegram
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
