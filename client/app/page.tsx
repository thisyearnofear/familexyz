'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Playfair_Display, Caveat } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { FamilyLogo } from "@/components/family/FamilyLogo";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

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

function MobileHeader() {
    const isMobile = useIsMobile();
    if (!isMobile) return null;
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                    <FamilyLogo size="sm" className="w-8 h-8" />
                    <span className="font-semibold text-lg">famile.xyz</span>
                </div>
            </div>
        </header>
    );
}

function HomePage() {
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

    const agentEntries = Object.entries(AGENT_META);

    return (
        <div className={`${playfair.variable} ${caveat.variable} min-h-screen bg-editorial-bg`}>
            <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
                {/* Hero */}
                <header className="text-center mb-14 fade-in">
                    <div className="w-20 h-px mx-auto mb-5 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                    <p className="text-[0.65rem] tracking-[0.25em] uppercase text-editorial-muted/50 mb-4 font-[family-name:var(--font-playfair)]">
                        famile.xyz
                    </p>
                    <h1 className="font-[family-name:var(--font-playfair)] text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
                        AI agents for deeper<br />family connections
                    </h1>
                    <p className="mt-4 text-editorial-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                        Five specialized personalities helping your family communicate, connect, and grow stronger together.
                    </p>
                    <div className="w-32 h-px mx-auto mt-5 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                </header>

                {/* Agents */}
                <section className="mb-14">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {agentEntries.map(([name, meta]) => {
                            const take = data?.takes.find(t => t.agent === name);
                            const influence = take?.influence;
                            const influenceBio = influence ? INFLUENCER_BIO[influence] : null;

                            return (
                                <div
                                    key={name}
                                    className="group relative rounded-lg p-5 transition-all duration-300 hover:-translate-y-0.5 fade-in cursor-pointer"
                                    style={{ background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 70%)` }}
                                    onClick={() => navigateToChat(meta.slug)}
                                >
                                    {/* Wax seal for Wisdom */}
                                    {name === "Wisdom" && (
                                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-purple-500/30 flex items-center justify-center text-sm bg-editorial-bg">
                                            <span className="text-purple-400/60">{meta.emoji}</span>
                                        </div>
                                    )}

                                    {/* Connection line for Bridge */}
                                    {name === "Bridge" && (
                                        <>
                                            <div className="absolute -left-6 top-1/2 w-6 h-px bg-blue-500/20 hidden lg:block" />
                                            <div className="absolute -right-6 top-1/2 w-6 h-px bg-blue-500/20 hidden lg:block" />
                                        </>
                                    )}

                                    <div className="flex items-start gap-3 mb-3">
                                        {/* Icon container: distinct per agent */}
                                        <div className={`
                                            flex-shrink-0 flex items-center justify-center
                                            ${name === "Wisdom" ? "w-10 h-10 rounded-full border-2" : ""}
                                            ${name === "Intimacy" ? "w-10 h-10 rounded-2xl" : ""}
                                            ${name === "Presence" ? "w-10 h-10 border-l-2 border-transparent pl-3" : ""}
                                            ${name === "Growth" ? "w-10 h-10 rounded-lg" : ""}
                                            ${name === "Bridge" ? "w-10 h-10" : ""}
                                        `}
                                            style={{
                                                borderColor: name === "Wisdom" ? `${meta.color}40` : undefined,
                                                background: name === "Intimacy" ? `radial-gradient(circle at 50% 50%, ${meta.color}15 0%, transparent 70%)` : undefined,
                                                boxShadow: name === "Growth" ? `0 0 20px ${meta.color}15` : undefined,
                                                borderLeftColor: name === "Presence" ? meta.color : undefined,
                                            }}
                                        >
                                            <span className="text-lg">{meta.emoji}</span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold leading-tight"
                                                style={{ color: meta.color }}>
                                                {name}
                                            </h3>
                                            <p className="text-editorial-muted text-xs mt-0.5 leading-relaxed">
                                                {meta.focus}
                                            </p>
                                        </div>
                                    </div>

                                    {influence && (
                                        <p className="text-[0.65rem] tracking-[0.08em] uppercase text-editorial-subtle mb-2">
                                            inspired by {influence}
                                            {influenceBio && (
                                                <span className="relative ml-1 group/tip cursor-help text-editorial-muted/40">
                                                    &#9432;
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded bg-editorial-surface text-editorial-cream text-[0.6rem] leading-tight whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg border border-white/5">
                                                        {influenceBio}
                                                    </span>
                                                </span>
                                            )}
                                        </p>
                                    )}

                                    {take && (
                                        <p className="font-[family-name:var(--font-playfair)] text-sm italic leading-relaxed text-editorial-dim">
                                            &ldquo;{take.take.length > 100 ? take.take.slice(0, 100) + "…" : take.take}&rdquo;
                                        </p>
                                    )}

                                    {!take && (
                                        <p className="text-editorial-subtle text-xs italic">
                                            {loading ? "Loading…" : "No take available yet today."}
                                        </p>
                                    )}

                                    <p className="mt-3 text-[0.6rem] tracking-[0.1em] uppercase text-editorial-subtle group-hover:text-editorial-accent transition-colors">
                                        Chat &rarr;
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Daily Council preview */}
                {data && (
                    <section className="mb-14 fade-in fade-in-d5">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-3 text-editorial-subtle text-xs">
                                <span className="w-8 h-px bg-editorial-subtle/20" />
                                <span className="tracking-[0.15em] uppercase">Today&rsquo;s Council</span>
                                <span className="w-8 h-px bg-editorial-subtle/20" />
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <p className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl italic leading-snug text-editorial-dim max-w-2xl mx-auto">
                                &ldquo;{data.story.headline}&rdquo;
                            </p>
                            <p className="text-[0.65rem] tracking-[0.15em] uppercase text-editorial-subtle mt-2">
                                {data.story.source} &middot; {formattedDate}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-editorial-subtle mb-5">
                            {data.takes.map(t => (
                                <span key={t.agent} className="flex items-center gap-1.5">
                                    <span>{t.emoji}</span>
                                    <span className="text-editorial-muted">{t.agent}</span>
                                    <span className="text-editorial-faint max-w-[160px] truncate">&ldquo;{t.take.slice(0, 50)}&rdquo;</span>
                                </span>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => router.push('/today')}
                                className="inline-flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase text-editorial-muted hover:text-editorial-accent transition-colors border-b border-transparent hover:border-editorial-accent/30"
                            >
                                Read today&rsquo;s full council &rarr;
                            </button>
                        </div>
                    </section>
                )}

                {/* P.S. Telegram */}
                <footer className="text-center fade-in fade-in-d7">
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
                </footer>
            </div>
        </div>
    );
}

export default function Home() {
    const [queryClient] = useState(
        () => new QueryClient({
            defaultOptions: { queries: { staleTime: 30_000 } },
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <div className="dark antialiased font-sans" style={{ colorScheme: "dark" }} role="application" aria-label="Family Connection Platform">
                <TooltipProvider delayDuration={0}>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <MobileHeader />
                            <div className="flex flex-1 flex-col size-full" role="main" aria-label="Main content">
                                <HomePage />
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                </TooltipProvider>
            </div>
        </QueryClientProvider>
    );
}
