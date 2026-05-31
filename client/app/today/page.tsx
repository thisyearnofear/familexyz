'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Playfair_Display, Caveat } from "next/font/google";
import Link from 'next/link';

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const caveat = Caveat({
    subsets: ["latin"],
    variable: "--font-caveat",
    display: "swap",
});

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

const AGENT_META: Record<string, { emoji: string; color: string; focus: string; slug: string }> = {
    Wisdom: { emoji: "🧠", color: "#6d28d9", focus: "Emotional education & conflict resolution", slug: "wisdom" },
    Intimacy: { emoji: "💖", color: "#db2777", focus: "Relationship quality & deep connection", slug: "intimacy" },
    Presence: { emoji: "🧘", color: "#0d9488", focus: "Mindfulness & digital wellness", slug: "presence" },
    Growth: { emoji: "🌱", color: "#d97706", focus: "Habits, resilience & family challenges", slug: "growth" },
    Bridge: { emoji: "🧓", color: "#2563eb", focus: "Cross-generational bonds & legacy", slug: "bridge" },
};

const INFLUENCER_BIO: Record<string, string> = {
    "Alain de Botton": "Philosopher and author exploring love, art, and modern life",
    "Esther Perel": "Therapist and author on relationships and intimacy",
    "Thich Nhat Hanh": "Buddhist monk, peace activist, and mindfulness teacher",
    "James Clear": "Author of Atomic Habits, focused on habit formation",
    "StoryCorps": "Nonprofit preserving and sharing humanity's stories",
};

function ShareButton({ take, story }: { take: DailyTake['takes'][0]; story: DailyTake['story'] }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
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
        <button
            onClick={handleShare}
            className="text-[0.6rem] tracking-[0.1em] uppercase text-[#504a42] hover:text-[#c4542b] transition-colors"
        >
            {copied ? "Copied" : "Share"}
        </button>
    );
}

export default function TodayPage() {
    const [data, setData] = useState<DailyTake | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/today')
            .then(res => res.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const navigateToChat = useCallback((slug: string) => {
        router.push(`/chat/${slug}?context=today`);
    }, [router]);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    if (loading) {
        return (
            <div className={`${playfair.variable} ${caveat.variable} min-h-screen bg-[#1a1614] flex items-center justify-center`}>
                <div className="animate-pulse text-[#a09890] text-sm">Loading today&rsquo;s council...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`${playfair.variable} ${caveat.variable} min-h-screen bg-[#1a1614] flex items-center justify-center`}>
                <p className="text-[#a09890] text-sm">No take available yet today. Check back soon.</p>
            </div>
        );
    }

    return (
        <div className={`${playfair.variable} ${caveat.variable} min-h-screen bg-editorial-bg`}>
            <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-8 fade-in"
                >
                    &larr; Back to Home
                </Link>

                {/* Header */}
                <header className="text-center mb-12 fade-in fade-in-d1">
                    <div className="w-20 h-px mx-auto mb-5 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                    <h1 className="font-[family-name:var(--font-playfair)] text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
                        Today&rsquo;s Council
                    </h1>
                    <p className="text-[0.65rem] tracking-[0.15em] uppercase text-editorial-subtle mt-3">
                        {formattedDate}
                    </p>
                    <div className="w-32 h-px mx-auto mt-5 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                </header>

                {/* Story */}
                <section className="mb-14 fade-in fade-in-d2">
                    <div className="text-center mb-8">
                        <p className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl italic leading-snug text-editorial-dim max-w-3xl mx-auto">
                            &ldquo;{data.story.headline}&rdquo;
                        </p>
                        <p className="text-[0.65rem] tracking-[0.15em] uppercase text-editorial-subtle mt-3">
                            {data.story.source}
                            {data.story.url && (
                                <>
                                    <span className="mx-2 text-editorial-faint">&middot;</span>
                                    <a
                                        href={data.story.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-editorial-muted hover:text-editorial-accent transition-colors"
                                    >
                                        Read original
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                    <p className="text-editorial-muted text-sm leading-relaxed max-w-2xl mx-auto text-center">
                        {data.story.summary}
                    </p>
                </section>

                {/* Section divider */}
                <div className="flex items-center gap-3 justify-center mb-8 fade-in fade-in-d3">
                    <span className="w-12 h-px bg-editorial-subtle/20" />
                    <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">Five Perspectives</span>
                    <span className="w-12 h-px bg-editorial-subtle/20" />
                </div>

                {/* Takes */}
                <section className="space-y-5 mb-14">
                    {data.takes.map((take, i) => {
                        const meta = AGENT_META[take.agent];
                        const influenceBio = take.influence ? INFLUENCER_BIO[take.influence] : null;
                        const delayClass = `fade-in-d${Math.min(i + 4, 6)}`;

                        return (
                            <div
                                key={take.agent}
                                className={`group relative rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 fade-in ${delayClass}`}
                                style={{ background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 70%)` }}
                            >
                                {/* Wax seal for Wisdom */}
                                {take.agent === "Wisdom" && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-purple-500/30 flex items-center justify-center text-sm bg-editorial-bg">
                                        <span className="text-purple-400/60">{take.emoji}</span>
                                    </div>
                                )}

                                {/* Connection line for Bridge */}
                                {take.agent === "Bridge" && (
                                    <>
                                        <div className="absolute -left-6 top-1/2 w-6 h-px bg-blue-500/20 hidden lg:block" />
                                        <div className="absolute -right-6 top-1/2 w-6 h-px bg-blue-500/20 hidden lg:block" />
                                    </>
                                )}

                                <div className="flex items-start gap-3 mb-3">
                                    {/* Icon container: distinct per agent */}
                                    <div className={`
                                        flex-shrink-0 flex items-center justify-center
                                        ${take.agent === "Wisdom" ? "w-10 h-10 rounded-full border-2" : ""}
                                        ${take.agent === "Intimacy" ? "w-10 h-10 rounded-2xl" : ""}
                                        ${take.agent === "Presence" ? "w-10 h-10 border-l-2 border-transparent pl-3" : ""}
                                        ${take.agent === "Growth" ? "w-10 h-10 rounded-lg" : ""}
                                        ${take.agent === "Bridge" ? "w-10 h-10" : ""}
                                    `}
                                        style={{
                                            borderColor: take.agent === "Wisdom" ? `${meta.color}40` : undefined,
                                            background: take.agent === "Intimacy" ? `radial-gradient(circle at 50% 50%, ${meta.color}15 0%, transparent 70%)` : undefined,
                                            boxShadow: take.agent === "Growth" ? `0 0 20px ${meta.color}15` : undefined,
                                            borderLeftColor: take.agent === "Presence" ? meta.color : undefined,
                                        }}
                                    >
                                        <span className="text-lg">{take.emoji}</span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold leading-tight"
                                                style={{ color: meta.color }}>
                                                {take.agent}
                                            </h3>
                                            <span className="text-editorial-faint text-xs">/</span>
                                            <span className="text-[0.55rem] tracking-[0.08em] uppercase text-editorial-subtle">
                                                {take.influence}
                                                {influenceBio && (
                                                    <span className="relative ml-1 group/tip cursor-help text-editorial-muted/40">
                                                        &#9432;
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded bg-editorial-surface text-editorial-cream text-[0.6rem] leading-tight whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg border border-white/5">
                                                            {influenceBio}
                                                        </span>
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-editorial-muted text-xs mt-0.5 leading-relaxed">
                                            {meta.focus}
                                        </p>
                                    </div>
                                </div>

                                <p className="font-[family-name:var(--font-playfair)] text-sm italic leading-relaxed text-editorial-dim mb-3">
                                    &ldquo;{take.take}&rdquo;
                                </p>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => navigateToChat(meta.slug)}
                                        className="text-[0.6rem] tracking-[0.1em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors"
                                    >
                                        Chat about this &rarr;
                                    </button>
                                    <ShareButton take={take} story={data.story} />
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Telegram CTA */}
                <footer className="text-center fade-in fade-in-d6">
                    <div className="w-24 h-px mx-auto mb-6 bg-gradient-to-r from-transparent via-editorial-accent/20 to-transparent" />
                    <p className="font-[family-name:var(--font-caveat)] text-lg text-editorial-subtle">
                        P.S. Get tomorrow&rsquo;s council on{` `}
                        <a
                            href="https://t.me/familexyzbot?start=subscribe_daily"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-editorial-accent hover:text-editorial-accent/80 transition-colors border-b border-editorial-accent/20 hover:border-editorial-accent/50"
                        >
                            Telegram
                        </a>
                    </p>
                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint/50 mt-4">
                        famile.xyz &middot; Daily Council
                    </p>
                    <Link
                        href="/"
                        className="inline-block mt-6 text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-muted transition-colors"
                    >
                        &larr; Back to Home
                    </Link>
                </footer>
            </div>
        </div>
    );
}
