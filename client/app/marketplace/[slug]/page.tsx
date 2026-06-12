'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMarketplaceAgent } from '@/hooks/use-marketplace';
import { fontVariables } from '@/lib/fonts';
import { AGENTS } from '@/lib/agents';

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { data, isLoading } = useMarketplaceAgent(slug);
    const meta = AGENTS.find(a => a.slug === slug);

    if (isLoading) {
        return (
            <div className={`${fontVariables} min-h-screen bg-editorial-bg flex items-center justify-center`}>
                <p className="text-editorial-faint text-sm animate-pulse">Loading...</p>
            </div>
        );
    }

    if (!data?.agent) {
        return (
            <div className={`${fontVariables} min-h-screen bg-editorial-bg flex items-center justify-center`}>
                <p className="text-editorial-faint text-sm">Agent not found.</p>
            </div>
        );
    }

    const agent = data.agent;
    const color = meta?.color || '#a09890';

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
                <Link
                    href="/marketplace"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-10 reveal-up"
                >
                    &larr; Marketplace
                </Link>

                <div className="reveal-up">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl">{meta?.emoji || '\u{1F916}'}</span>
                        <div>
                            <h1
                                className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream leading-[1.05] tracking-[-0.02em]"
                                style={{ color }}
                            >
                                {agent.name}
                            </h1>
                            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mt-1">
                                {agent.category}
                            </p>
                        </div>
                    </div>

                    <p className="font-[family-name:var(--font-playfair)] text-body-lg text-editorial-dim leading-[1.8] mb-8">
                        {agent.description}
                    </p>

                    {meta?.influence && (
                        <div className="border-l-2 pl-6 py-2 mb-8" style={{ borderColor: `${color}40` }}>
                            <p className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                Inspired by
                            </p>
                            <p className="font-[family-name:var(--font-playfair)] text-lg text-editorial-cream">
                                {meta.influence}
                            </p>
                            <p className="text-sm text-editorial-muted mt-1">
                                {meta.influenceBio}
                            </p>
                        </div>
                    )}

                    <div className="rounded-xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8">
                        <h3 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-4">
                            Subscription Tier
                        </h3>
                        <div className="flex items-center gap-3">
                            <span
                                className="text-sm font-medium px-3 py-1 rounded-full border"
                                style={{
                                    borderColor: `${color}40`,
                                    color,
                                }}
                            >
                                {agent.tier_required}
                            </span>
                            {data.subscriptionInfo && (
                                <span className="text-sm text-editorial-muted">
                                    {data.subscriptionInfo.hasAccess
                                        ? '\u2713 Available on your plan'
                                        : `Upgrade to ${data.subscriptionInfo.requiredTier} to access`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/chat/${agent.slug}`)}
                            className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                            style={{
                                backgroundColor: `${color}20`,
                                color,
                                border: `1px solid ${color}30`,
                            }}
                        >
                            Start chatting &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
