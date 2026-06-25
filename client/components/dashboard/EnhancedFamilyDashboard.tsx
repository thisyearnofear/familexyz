'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AGENTS } from "@/lib/agents";
import { fontVariables } from "@/lib/fonts";
import { useDailyTake } from "@/hooks/use-daily-take";
import { useBondScore, type BondScoreSignals } from "@/hooks/use-bond-score";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

const SIGNAL_LABELS: Record<keyof BondScoreSignals, string> = {
    generational: 'Generational Interaction',
    reciprocity: 'Response Reciprocity',
    sentiment: 'Sentiment Trajectory',
    challenges: 'Challenge Completion',
    presence: 'Presence Consistency',
    topology: 'Network Topology',
    consensus: 'Hedera Consensus',
};

const SIGNAL_ICONS: Record<keyof BondScoreSignals, string> = {
    generational: '\u2194\ufe0f',
    reciprocity: '\u21c9',
    sentiment: '\u2b50',
    challenges: '\ud83c\udf1f',
    presence: '\ud83d\udca1',
    topology: '\ud83d\udd17',
    consensus: '\u26a1',
};

function SignalBreakdown({ signals, loading }: { signals: BondScoreSignals | null | undefined; loading?: boolean }) {
    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton variant="bar" className="h-3 w-20" />
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Skeleton variant="bar" className="h-3 w-28" />
                        <div className="flex-1">
                            <Skeleton variant="bar" className="h-1.5 w-full" />
                        </div>
                        <Skeleton variant="bar" className="h-3 w-6" />
                    </div>
                ))}
            </div>
        );
    }

    if (!signals) {
        return (
            <p className="text-[0.6rem] text-editorial-faint text-center py-2">
                No signal data yet
            </p>
        );
    }

    return (
        <div className="motion-fade-in motion-fade-in-d1 space-y-3">
            <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint block mb-3">
                Signal Breakdown
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {(Object.keys(SIGNAL_LABELS) as (keyof BondScoreSignals)[]).map((key) => {
                    const value = signals[key] ?? 0;
                    const color = value >= 70 ? '#4ade80' : value >= 40 ? '#fbbf24' : value >= 10 ? '#f87171' : '#504a42';
                    return (
                        <div key={key} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1.5 text-[0.55rem] tracking-wide text-editorial-muted group-hover:text-editorial-cream transition-colors">
                                    <span className="text-xs">{SIGNAL_ICONS[key]}</span>
                                    {SIGNAL_LABELS[key]}
                                </span>
                                <span className="text-[0.55rem] font-medium tabular-nums" style={{ color }}>
                                    {value}
                                </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-editorial-subtle/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all motion-reduce:transition-none"
                                    style={{
                                        width: `${Math.min(value, 100)}%`,
                                        backgroundColor: color,
                                        transition: 'width 0.8s var(--ease-smooth-out)',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BondBar({ score, loading }: { score: number | null; loading?: boolean }) {
    if (loading) {
        return (
            <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                    <Skeleton variant="bar" className="h-4 w-24" />
                    <Skeleton variant="bar" className="h-10 w-16" />
                </div>
                <Skeleton variant="bar" className="h-1 w-full" />
            </div>
        );
    }

    const pct = score ?? 0;
    const color = score == null
        ? '#504a42'
        : score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';

    return (
        <div className="motion-fade-in">
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
                    className="h-full rounded-full transition-all motion-reduce:transition-none"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        transition: 'width 1s var(--ease-smooth-out)',
                    }}
                />
            </div>
            {score == null && !loading && (
                <p className="text-[0.6rem] text-editorial-faint mt-2">
                    Start a conversation to see your family bond score
                </p>
            )}
        </div>
    );
}

function AgentStrip() {
    return (
        <div className="motion-fade-in motion-fade-in-d1 flex flex-wrap items-center gap-x-6 gap-y-2">
            {AGENTS.map((agent) => (
                <Link
                    key={agent.id}
                    href={`/chat/${agent.id}`}
                    className="flex items-center gap-2 group hover-scale"
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

function SparkBars({ data, loading }: { data: number[]; loading?: boolean }) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                    <Skeleton variant="bar" className="h-4 w-24" />
                    <Skeleton variant="bar" className="h-3 w-12" />
                </div>
                <div className="flex items-end gap-1 h-24">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <Skeleton
                                variant="bar"
                                className="w-full"
                                style={{ height: `${40 + (i * 8)}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="motion-fade-in motion-fade-in-d2 py-6 text-center">
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
        <div className="motion-fade-in motion-fade-in-d2">
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
                        <div
                            className="w-full relative rounded-t-sm overflow-hidden transition-all motion-reduce:transition-none"
                            style={{
                                height: `${(score / max) * 100}%`,
                                transition: 'height 0.6s var(--ease-smooth-out)',
                            }}
                        >
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

const STORAGE_KEY = 'famile-family-id';

function useFamilyId(): string {
    const searchParams = useSearchParams();
    const urlFamilyId = searchParams.get('familyId')?.trim();

    // If familyId is in the URL, persist it for subsequent visits
    if (urlFamilyId) {
        try {
            localStorage.setItem(STORAGE_KEY, urlFamilyId);
        } catch { /* localStorage unavailable */ }
        return urlFamilyId;
    }

    // Fall back to previously stored value
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored?.trim()) return stored.trim();
        } catch { /* localStorage unavailable */ }
    }

    return 'primary';
}

export const EnhancedFamilyDashboard: React.FC = () => {
    const familyId = useFamilyId();
    const { data: dailyTake, isLoading: dailyLoading } = useDailyTake();
    const { data: bondData, isLoading: bondLoading } = useBondScore(familyId);

    const bondScore = bondData?.current?.bondScore ?? null;
    const bondHistory = (bondData?.history ?? []).map((h) => h.bondScore);
    const isReady = !bondLoading;

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 space-y-12">
                <header className={isReady ? 'motion-fade-in' : ''}>
                    <h1 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
                        Dashboard
                    </h1>
                </header>

                <BondBar score={bondScore} loading={bondLoading} />

                <SignalBreakdown signals={bondData?.signals} loading={bondLoading} />

                <div className="h-px bg-editorial-subtle/10" />

                <AgentStrip />

                <div className="h-px bg-editorial-subtle/10" />

                <SparkBars data={bondHistory} loading={bondLoading} />

                <div className="h-px bg-editorial-subtle/10" />

                <div className="flex items-center justify-between">
                    <p className="text-sm text-editorial-muted">
                        {dailyTake
                            ? `Today\u2019s council: ${dailyTake.story.headline.slice(0, 60)}...`
                            : dailyLoading
                            ? 'Loading today\u2019s council...'
                            : 'Today\u2019s council is ready'}
                    </p>
                    <Link
                        href="/today"
                        className="text-xs text-editorial-accent hover:text-editorial-accent/80 transition-colors hover-scale"
                    >
                        Read it &rarr;
                    </Link>
                </div>

                <div className="text-center pt-4">
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
