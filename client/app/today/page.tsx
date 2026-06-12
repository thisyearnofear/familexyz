'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AGENTS, type DailyTake } from "@/lib/agents";
import { useDailyTake } from "@/hooks/use-daily-take";
import { fontVariables } from "@/lib/fonts";

function ShareLink({ take, story }: { take: DailyTake['takes'][0]; story: DailyTake['story'] }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareText = `${take.emoji} ${take.agent} inspired by ${take.influence}\n\n"${take.take}"\n\n\u2014 Reacting to: ${story.headline}\nDaily Council \u00b7 famile.xyz`;

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
        <button onClick={handleShare} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
            {copied ? "copied" : "share"}
        </button>
    );
}

function WisdomTake({ take, agentMeta, onChat }: TakeProps) {
    return (
        <div className="reveal-up pl-6 sm:pl-10 border-l-2 py-2" style={{ borderColor: `${agentMeta.color}60` }}>
            <p className="font-[family-name:var(--font-caveat)] text-xs tracking-wide mb-3" style={{ color: agentMeta.color }}>
                A letter from {take.agent}
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-body-lg italic leading-[1.8] text-editorial-dim">
                &ldquo;{take.take}&rdquo;
            </p>
            <div className="flex items-center gap-4 mt-4 text-[0.6rem] tracking-[0.1em] uppercase">
                <button onClick={() => onChat(agentMeta.id)} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
                    continue this thought &rarr;
                </button>
                <ShareLink take={take} story={take._story!} />
            </div>
        </div>
    );
}

function IntimacyTake({ take, agentMeta, onChat }: TakeProps) {
    return (
        <div className="reveal-up grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 sm:gap-10 items-start">
            <div>
                <p className="text-[0.6rem] tracking-[0.15em] uppercase mb-3" style={{ color: agentMeta.color }}>
                    {take.agent} &middot; {take.influence}
                </p>
                <p className="font-[family-name:var(--font-playfair)] text-base italic leading-[1.8] text-editorial-dim">
                    &ldquo;{take.take}&rdquo;
                </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-3 sm:pt-8 text-[0.6rem] tracking-[0.1em] uppercase sm:border-l sm:pl-6" style={{ borderColor: `${agentMeta.color}15` }}>
                <button onClick={() => onChat(agentMeta.id)} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
                    explore &rarr;
                </button>
                <ShareLink take={take} story={take._story!} />
            </div>
        </div>
    );
}

function PresenceTake({ take, agentMeta, onChat }: TakeProps) {
    return (
        <div className="reveal-scale text-center py-8 sm:py-12">
            <p className="text-[0.6rem] tracking-[0.25em] uppercase mb-6" style={{ color: agentMeta.color }}>
                {take.agent}
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-body-lg italic leading-[2] text-editorial-dim max-w-md mx-auto">
                &ldquo;{take.take}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-6 mt-8 text-[0.6rem] tracking-[0.1em] uppercase">
                <button onClick={() => onChat(agentMeta.id)} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
                    sit with this &rarr;
                </button>
                <ShareLink take={take} story={take._story!} />
            </div>
        </div>
    );
}

function GrowthTake({ take, agentMeta, onChat }: TakeProps) {
    return (
        <div className="reveal-up">
            <p className="text-[0.6rem] tracking-[0.15em] uppercase mb-3 font-semibold" style={{ color: agentMeta.color }}>
                {take.agent} &middot; {take.influence}
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl not-italic font-medium leading-[1.6] text-editorial-cream">
                {take.take}
            </p>
            <div className="w-16 h-0.5 mt-4 rounded-full" style={{ backgroundColor: `${agentMeta.color}50` }} />
            <div className="flex items-center gap-4 mt-4 text-[0.6rem] tracking-[0.1em] uppercase">
                <button onClick={() => onChat(agentMeta.id)} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
                    act on this &rarr;
                </button>
                <ShareLink take={take} story={take._story!} />
            </div>
        </div>
    );
}

function BridgeTake({ take, agentMeta, onChat }: TakeProps) {
    return (
        <div className="reveal-up relative">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 opacity-20" style={{ backgroundColor: agentMeta.color }} />
            <div className="relative bg-editorial-bg py-4">
                <p className="text-[0.6rem] tracking-[0.15em] uppercase mb-3" style={{ color: agentMeta.color }}>
                    {take.agent} &middot; {take.influence}
                </p>
                <p className="font-[family-name:var(--font-playfair)] text-base italic leading-[1.8] text-editorial-dim">
                    &ldquo;{take.take}&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-4 text-[0.6rem] tracking-[0.1em] uppercase">
                    <button onClick={() => onChat(agentMeta.id)} className="hover-shift text-editorial-faint hover:text-editorial-accent transition-colors">
                        bridge the gap &rarr;
                    </button>
                    <ShareLink take={take} story={take._story!} />
                </div>
            </div>
        </div>
    );
}

interface TakeProps {
    take: DailyTake['takes'][0] & { _story?: DailyTake['story'] };
    agentMeta: (typeof AGENTS)[0];
    onChat: (slug: string) => void;
}

const TAKE_COMPONENTS: Record<string, React.FC<TakeProps>> = {
    Wisdom: WisdomTake,
    Intimacy: IntimacyTake,
    Presence: PresenceTake,
    Growth: GrowthTake,
    Bridge: BridgeTake,
};

export default function TodayPage() {
    const { data, isLoading: loading } = useDailyTake();
    const router = useRouter();

    const navigateToChat = useCallback((slug: string) => {
        router.push(`/chat/${slug}?context=today`);
    }, [router]);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    if (loading) {
        return (
            <div className={`${fontVariables} min-h-screen bg-[#1a1614] flex items-center justify-center`}>
                <div className="animate-pulse text-[#a09890] text-sm">Loading today&rsquo;s council...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`${fontVariables} min-h-screen bg-[#1a1614] flex items-center justify-center`}>
                <p className="text-[#a09890] text-sm">No take available yet today. Check back soon.</p>
            </div>
        );
    }

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-10 reveal-up"
                >
                    &larr; Home
                </Link>

                <header className="mb-14 reveal-up">
                    <p className="text-[0.55rem] tracking-[0.25em] uppercase text-editorial-faint mb-4">
                        {formattedDate}
                    </p>
                    <h1 className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream leading-[1.05] tracking-[-0.02em]">
                        Today&rsquo;s Council
                    </h1>
                </header>

                <section className="mb-16 reveal-up reveal-d1">
                    <div className="w-12 h-px bg-editorial-accent/30 mb-6" />
                    <h2 className="font-[family-name:var(--font-playfair)] text-headline font-semibold text-editorial-cream leading-[1.15] tracking-[-0.01em] mb-6">
                        {data.story.headline}
                    </h2>
                    <p className="text-body-lg leading-[1.8] text-editorial-muted max-w-prose">
                        {data.story.summary}
                    </p>
                    <p className="text-[0.6rem] tracking-[0.12em] uppercase text-editorial-subtle mt-5">
                        Source: {data.story.source}
                        {data.story.url && (
                            <>
                                <span className="mx-2 text-editorial-faint">&middot;</span>
                                <a
                                    href={data.story.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-editorial-muted hover:text-editorial-accent transition-colors hover-underline-wipe"
                                >
                                    Read original &rarr;
                                </a>
                            </>
                        )}
                    </p>
                </section>

                <div className="flex items-center gap-4 mb-12 reveal-up reveal-d2">
                    <span className="h-px flex-1 bg-editorial-subtle/15" />
                    <span className="text-[0.55rem] tracking-[0.25em] uppercase text-editorial-faint">
                        Five Perspectives
                    </span>
                    <span className="h-px flex-1 bg-editorial-subtle/15" />
                </div>

                <section className="space-y-14 sm:space-y-20">
                    {data.takes.map((take, i) => {
                        const agent = AGENTS.find(a => a.name === take.agent);
                        if (!agent) return null;

                        const Component = TAKE_COMPONENTS[take.agent];
                        if (!Component) return null;

                        const takeWithStory = { ...take, _story: data.story };
                        const delayClass = `reveal-d${Math.min(i + 3, 7)}`;

                        return (
                            <div key={take.agent} className={delayClass}>
                                <Component
                                    take={takeWithStory}
                                    agentMeta={agent}
                                    onChat={navigateToChat}
                                />
                            </div>
                        );
                    })}
                </section>

                <footer className="mt-20 pt-10 border-t border-editorial-subtle/10 reveal-up reveal-d7">
                    <p className="font-[family-name:var(--font-caveat)] text-lg text-editorial-subtle text-center">
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
                    <p className="text-[0.5rem] tracking-[0.25em] uppercase text-editorial-faint/40 text-center mt-5">
                        famile.xyz &middot; Daily Council
                    </p>
                </footer>
            </div>
        </div>
    );
}
