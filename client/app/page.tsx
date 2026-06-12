'use client';

import React, { useState, useEffect } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDailyTake } from "@/hooks/use-daily-take";
import { AGENTS } from "@/lib/agents";
import { fontVariables } from "@/lib/fonts";
import Link from "next/link";

function MobileHeader() {
    const isMobile = useIsMobile();
    if (!isMobile) return null;
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-editorial-bg/95 backdrop-blur">
            <div className="flex h-14 items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                    <span className="font-semibold text-lg font-[family-name:var(--font-playfair)]">famile.xyz</span>
                </div>
            </div>
        </header>
    );
}

function HomePage() {
    const { data, isLoading: loading } = useDailyTake();
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const visited = localStorage.getItem('famile-visited');
        if (!visited) {
            setShowIntro(true);
            localStorage.setItem('famile-visited', '1');
            setTimeout(() => setShowIntro(false), 2500);
        }
    }, []);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            {/* First-visit intro overlay */}
            {showIntro && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-bg"
                    style={{ animation: 'fadeOut 0.6s ease-in 2s forwards' }}>
                    <div className="text-center">
                        <p className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream"
                            style={{ animation: 'revealScale 0.8s ease-out forwards' }}>
                            famile.xyz
                        </p>
                        <p className="mt-3 text-editorial-muted text-sm opacity-0"
                            style={{ animation: 'revealUp 0.6s ease-out 0.8s forwards' }}>
                            Five minds. One family.
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">

                {/* ── Masthead ── */}
                <header className="text-center mb-12 reveal-up">
                    <p className="text-[0.6rem] tracking-[0.3em] uppercase text-editorial-faint mb-6">
                        {formattedDate}
                    </p>
                    <h1 className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream">
                        famile.xyz
                    </h1>
                    <p className="mt-3 text-editorial-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                        Five minds on today&rsquo;s world. Your family&rsquo;s council, every day.
                    </p>
                </header>

                {/* ── Agent Masthead (newspaper-style row) ── */}
                <nav className="reveal-up reveal-d1 border-y border-editorial-faint/20 py-3 mb-14">
                    <div className="flex items-center justify-center gap-x-5 gap-y-2 flex-wrap text-xs">
                        <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">
                            Your Council
                        </span>
                        {AGENTS.map((agent, i) => (
                            <React.Fragment key={agent.id}>
                                {i > 0 && (
                                    <span className="text-editorial-faint/30 hidden sm:inline">|</span>
                                )}
                                <Link
                                    href={`/chat/${agent.id}`}
                                    className="flex items-center gap-1.5 text-editorial-subtle hover-underline-wipe hover-shift"
                                    style={{ color: agent.color }}
                                >
                                    <span className="text-sm">{agent.emoji}</span>
                                    <span className="font-[family-name:var(--font-playfair)] text-sm font-medium">
                                        {agent.name}
                                    </span>
                                </Link>
                            </React.Fragment>
                        ))}
                    </div>
                </nav>

                {/* ── Feature Story (if available) ── */}
                {data && (
                    <section className="mb-16 reveal-up reveal-d2">
                        <div className="text-center mb-8">
                            <p className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint mb-4">
                                Today&rsquo;s Story &middot; {data.story.source}
                            </p>
                            <h2 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-tight max-w-3xl mx-auto">
                                {data.story.headline}
                            </h2>
                            {data.story.url && (
                                <a
                                    href={data.story.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-4 text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors hover-underline-wipe"
                                >
                                    Read original &rarr;
                                </a>
                            )}
                        </div>
                        <p className="text-body-lg text-editorial-muted leading-relaxed max-w-prose mx-auto text-center">
                            {data.story.summary}
                        </p>
                    </section>
                )}

                {!data && !loading && (
                    <section className="mb-16 reveal-up reveal-d2 text-center">
                        <p className="text-editorial-subtle text-sm italic">
                            Today&rsquo;s council is being prepared. Check back soon.
                        </p>
                    </section>
                )}

                {loading && (
                    <section className="mb-16 text-center">
                        <p className="text-editorial-subtle text-sm animate-pulse">
                            Loading today&rsquo;s council...
                        </p>
                    </section>
                )}

                {/* ── Agent Takes (editorial columns, not cards) ── */}
                {data && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 justify-center mb-10 reveal-up reveal-d3">
                            <span className="w-12 h-px bg-editorial-faint/20" />
                            <span className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">
                                Five Perspectives
                                {data.isFallback && (
                                    <span className="ml-2 text-editorial-faint/60 normal-case tracking-normal">
                                        &middot; sample council
                                    </span>
                                )}
                            </span>
                            <span className="w-12 h-px bg-editorial-faint/20" />
                        </div>

                        {/* First take: featured full-width */}
                        {data.takes[0] && (() => {
                            const agent = AGENTS.find(a => a.name === data.takes[0].agent);
                            return (
                                <div className="mb-12 reveal-up reveal-d3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">{data.takes[0].emoji}</span>
                                        <div>
                                            <span
                                                className="font-[family-name:var(--font-playfair)] text-lg font-semibold"
                                                style={{ color: agent?.color }}
                                            >
                                                {data.takes[0].agent}
                                            </span>
                                            <span className="text-editorial-faint text-xs ml-2">
                                                via {data.takes[0].influence}
                                            </span>
                                        </div>
                                    </div>
                                    <blockquote className="border-l-2 pl-6 font-[family-name:var(--font-playfair)] text-xl sm:text-2xl italic leading-snug text-editorial-dim max-w-3xl"
                                        style={{ borderColor: agent?.color + "40" }}>
                                        {data.takes[0].take}
                                    </blockquote>
                                    <Link
                                        href={`/chat/${agent?.id ?? data.takes[0].agent.toLowerCase()}`}
                                        className="inline-block mt-4 text-[0.6rem] tracking-[0.1em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors hover-shift"
                                    >
                                        Continue the conversation &rarr;
                                    </Link>
                                </div>
                            );
                        })()}

                        {/* Remaining takes: alternating 2-col editorial layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                            {data.takes.slice(1).map((take, i) => {
                                const agent = AGENTS.find(a => a.name === take.agent);
                                const isLeft = i % 2 === 0;
                                return (
                                    <div
                                        key={take.agent}
                                        className={`reveal-up reveal-d${Math.min(i + 4, 7)}`}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">{take.emoji}</span>
                                            <span
                                                className="font-[family-name:var(--font-playfair)] text-sm font-semibold"
                                                style={{ color: agent?.color }}
                                            >
                                                {take.agent}
                                            </span>
                                            <span className="text-editorial-faint text-[0.6rem] tracking-[0.08em] uppercase">
                                                / {take.influence}
                                            </span>
                                        </div>
                                        <blockquote
                                            className={`font-[family-name:var(--font-playfair)] text-sm italic leading-relaxed text-editorial-dim ${
                                                take.agent === "Presence" ? "text-center py-4" : ""
                                            } ${
                                                take.agent === "Growth" ? "not-italic font-medium text-base" : ""
                                            }`}
                                            style={
                                                take.agent === "Growth"
                                                    ? { borderBottom: `1px solid ${agent?.color}30`, paddingBottom: "0.5rem" }
                                                    : undefined
                                            }
                                        >
                                            &ldquo;{take.take}&rdquo;
                                        </blockquote>
                                        <div className="flex items-center gap-4 mt-3">
                                            <Link
                                                href={`/chat/${agent?.id ?? take.agent.toLowerCase()}`}
                                                className="text-[0.6rem] tracking-[0.1em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors hover-shift"
                                            >
                                                Chat &rarr;
                                            </Link>
                                            {agent?.focus && (
                                                <span className="text-[0.55rem] text-editorial-faint">
                                                    {agent.focus}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── CTA ── */}
                {data && (
                    <div className="text-center mb-14 reveal-up reveal-d6">
                        <Link
                            href="/today"
                            className="text-sm text-editorial-muted hover:text-editorial-accent transition-colors hover-underline-wipe"
                        >
                            Read the full council &rarr;
                        </Link>
                    </div>
                )}

                {/* ── Start CTA ── */}
                <div className="text-center mb-14 reveal-up reveal-d5">
                    <Link
                        href="/today"
                        className="inline-block text-sm font-[family-name:var(--font-playfair)] text-editorial-accent hover:text-editorial-cream transition-colors hover-shift"
                    >
                        Start with today&rsquo;s council &rarr;
                    </Link>
                </div>

                {/* ── Telegram CTA ── */}
                <footer className="text-center reveal-up reveal-d6">
                    <div className="w-24 h-px mx-auto mb-6 bg-editorial-faint/15" />
                    <p className="font-[family-name:var(--font-caveat)] text-lg text-editorial-subtle">
                        Get tomorrow&rsquo;s council on{` `}
                        <a
                            href="https://t.me/familexyzbot?start=subscribe_daily"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-editorial-accent hover:text-editorial-accent/80 transition-colors hover-underline-wipe"
                        >
                            Telegram
                        </a>
                    </p>
                </footer>

                {/* ── Enterprise whisper ── */}
                <div className="text-center mt-8 reveal-up reveal-d7">
                    <p className="text-[0.45rem] tracking-[0.25em] uppercase text-editorial-faint/40">
                        Verifiable on Hedera &middot; FAM token incentives &middot; Privacy-preserving
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
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
    );
}
