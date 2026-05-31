'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Share2, Check, ChevronDown, MessageCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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

const INFLUENCER_BIO: Record<string, string> = {
    "Alain de Botton": "Philosopher and author exploring love, art, and modern life",
    "Esther Perel": "Therapist and author on relationships and intimacy",
    "Thich Nhat Hanh": "Buddhist monk, peace activist, and mindfulness teacher",
    "James Clear": "Author of Atomic Habits, focused on habit formation",
    "StoryCorps": "Nonprofit preserving and sharing humanity's stories",
};

const AGENT_COLORS: Record<string, string> = {
    Wisdom: '#7c3aed',
    Intimacy: '#ec4899',
    Presence: '#14b8a6',
    Growth: '#f59e0b',
    Bridge: '#3b82f6',
};

const AGENT_SLUGS: Record<string, string> = {
    Wisdom: 'wisdom',
    Intimacy: 'intimacy',
    Presence: 'presence',
    Growth: 'growth',
    Bridge: 'bridge',
};

function TakeCard({ take, story, onChat }: { take: DailyTake['takes'][0]; story: DailyTake['story']; onChat?: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareText = `${take.emoji} ${take.agent} inspired by ${take.influence}\n\n"${take.take}"\n\n— Reacting to: ${story.headline}\nDaily Council · famile.xyz`;

        if (navigator.share) {
            try {
                await navigator.share({ text: shareText });
                return;
            } catch {}
        }
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-border/60 bg-card transition-colors overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{take.emoji}</span>
                        <div>
                            <span className="font-semibold text-foreground">{take.agent}</span>
                            <span className="text-muted-foreground text-sm ml-2">
                                inspired by{" "}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-help underline decoration-dotted underline-offset-2 decoration-muted-foreground/30">
                                            {take.influence}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                                        {INFLUENCER_BIO[take.influence] || "Influential thinker"}
                                    </TooltipContent>
                                </Tooltip>
                            </span>
                        </div>
                    </div>
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: AGENT_COLORS[take.agent] || '#7c3aed' }}
                    />
                </div>
                <div className="border-l-2 pl-4 ml-1" style={{ borderColor: AGENT_COLORS[take.agent] + '40' }}>
                    <p className="text-foreground leading-relaxed text-[15px]">
                        &ldquo;{take.take}&rdquo;
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-t border-border/50">
                <button
                    onClick={onChat}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat about this
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    {copied ? (
                        <><Check className="w-3.5 h-3.5" /> Copied</>
                    ) : (
                        <><Share2 className="w-3.5 h-3.5" /> Share</>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function TodayPage() {
    const [data, setData] = useState<DailyTake | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAllTakes, setShowAllTakes] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/today')
            .then(res => res.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const navigateToChat = useCallback((agentName: string) => {
        const slug = AGENT_SLUGS[agentName];
        if (slug) router.push(`/chat/${slug}?context=today`);
    }, [router]);

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
        <TooltipProvider>
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-6 py-10 sm:py-14">
                <div className="max-w-5xl mx-auto">
                    <Link href="/" className="text-white/50 hover:text-white text-xs uppercase tracking-[0.15em] mb-3 inline-block">
                        &larr; Back to Home
                    </Link>
                    <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
                        Today&apos;s Council
                    </h1>
                    <p className="text-white/60 text-sm mt-2">
                        {formattedDate}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
                <div className="space-y-6 sm:space-y-8 pb-12">
                    <div className="bg-card border rounded-xl p-6 sm:p-8 shadow-sm">
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                            <span className="text-2xl sm:text-3xl mt-0.5">📰</span>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                                    {data.story.headline}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1.5">
                                    {data.story.source}
                                    {data.story.url && (
                                        <>
                                            <span className="mx-1.5">·</span>
                                            <a href={data.story.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
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

                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                                Five Perspectives
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Each agent brings their unique intellectual tradition.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAllTakes(!showAllTakes)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors sm:hidden"
                        >
                            {showAllTakes ? 'Collapse' : 'Show all'}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllTakes ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.takes.slice(0, 3).map((take) => (
                            <TakeCard key={take.agent} take={take} story={data.story} onChat={() => navigateToChat(take.agent)} />
                        ))}
                    </div>
                    <div className="hidden lg:grid lg:grid-cols-2 gap-4">
                        {data.takes.slice(3).map((take) => (
                            <TakeCard key={take.agent} take={take} story={data.story} onChat={() => navigateToChat(take.agent)} />
                        ))}
                    </div>

                    <div className="sm:hidden space-y-4">
                        {(showAllTakes ? data.takes : data.takes.slice(0, 2)).map((take) => (
                            <TakeCard key={take.agent} take={take} story={data.story} onChat={() => navigateToChat(take.agent)} />
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 sm:p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <p className="text-foreground font-semibold mb-2">
                                Get tomorrow&apos;s council on Telegram
                            </p>
                            <p className="text-muted-foreground text-sm mb-4">
                                Fresh perspectives delivered daily. Subscribe for free.
                            </p>
                            <a
                                href="https://t.me/familexyzbot?start=subscribe_daily"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.669.087.669l-1.677 7.88c-.145.684-.55.838-.924.514l-2.547-1.99-1.232 1.19c-.136.128-.25.234-.523.234-.334 0-.432-.232-.432-.232l-.977-3.231-2.81-.978c-.607-.21-.61-.604-.124-.894l10.895-4.205c.271-.1.503-.07.678.044z"/>
                                </svg>
                                Subscribe on Telegram
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </TooltipProvider>
    );
}
