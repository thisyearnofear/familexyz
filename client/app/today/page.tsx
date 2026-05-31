'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyTake {
    date: string;
    story: {
        headline: string;
        source: string;
        url?: string;
        summary: string;
    };
    takes: Array<{
        agent: string;
        emoji: string;
        influence: string;
        take: string;
    }>;
    generatedAt: number;
}

export default function TodayPage() {
    const [data, setData] = useState<DailyTake | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/today')
            .then(res => res.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading today&apos;s council...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">No take available yet today. Check back soon.</p>
            </div>
        );
    }

    const formattedDate = new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/" className="text-white/70 hover:text-white text-sm mb-2 inline-block">
                                &larr; Back to Hub
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                Today&apos;s Council
                            </h1>
                            <p className="text-white/80 text-sm mt-1">
                                {formattedDate}
                            </p>
                        </div>
                        <div className="text-4xl">🏛️</div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                <div className="bg-card border rounded-xl p-6 sm:p-8">
                    <div className="flex items-start gap-3 mb-4">
                        <span className="text-2xl">📰</span>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                                {data.story.headline}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {data.story.source}
                                {data.story.url && (
                                    <>
                                        {' '}&middot;{' '}
                                        <a
                                            href={data.story.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            Read original
                                        </a>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                        {data.story.summary}
                    </p>
                </div>

                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground px-1">
                        Five Perspectives
                    </h3>
                    <p className="text-sm text-muted-foreground px-1 mb-4">
                        Each agent brings their unique intellectual tradition to today&apos;s story.
                    </p>

                    <div className="space-y-4">
                        {data.takes.map((take) => {
                            const isExpanded = expandedAgent === take.agent;
                            return (
                                <div
                                    key={take.agent}
                                    className="bg-card border rounded-xl overflow-hidden transition-all"
                                >
                                    <button
                                        onClick={() => setExpandedAgent(isExpanded ? null : take.agent)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{take.emoji}</span>
                                            <div>
                                                <span className="font-semibold text-foreground">
                                                    {take.agent}
                                                </span>
                                                <span className="text-muted-foreground text-sm ml-2">
                                                    via {take.influence}
                                                </span>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isExpanded && (
                                        <div className="px-6 pb-5 pt-0">
                                            <div className="pl-11">
                                                <p className="text-foreground leading-relaxed">
                                                    {take.take}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-muted/30 border border-dashed rounded-xl p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        New story and perspectives every day. Join the conversation on{' '}
                        <a
                            href="https://t.me/familexyzbot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            Telegram
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
