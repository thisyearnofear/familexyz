'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMarketplaceAgents, type CatalogAgent } from '@/hooks/use-marketplace';
import { fontVariables } from '@/lib/fonts';
import { AGENTS } from '@/lib/agents';

const CATEGORIES = ['all', 'family', 'wellness', 'education'] as const;

function getAgentMeta(slug: string) {
    return AGENTS.find(a => a.slug === slug);
}

function TierBadge({ tier }: { tier: string }) {
    const colors: Record<string, string> = {
        FREE: '#6B7280',
        BASIC: '#3B82F6',
        PREMIUM: '#8B5CF6',
        FAMILY: '#EC4899',
    };
    return (
        <span
            className="text-[0.5rem] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border"
            style={{
                borderColor: `${colors[tier] || '#6B7280'}40`,
                color: colors[tier] || '#6B7280',
            }}
        >
            {tier}
        </span>
    );
}

function AgentCard({ agent }: { agent: CatalogAgent }) {
    const meta = getAgentMeta(agent.slug);
    const color = meta?.color || '#a09890';

    return (
        <Link
            href={`/marketplace/${agent.slug}`}
            className="group block rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 hover:border-editorial-subtle/25 transition-all hover:bg-editorial-surface/10"
        >
            <div className="flex items-start gap-4">
                <span className="text-2xl">{meta?.emoji || '\u{1F916}'}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3
                            className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-editorial-cream group-hover:text-editorial-accent transition-colors"
                        >
                            {agent.name}
                        </h3>
                        <TierBadge tier={agent.tier_required} />
                    </div>
                    <p className="text-sm text-editorial-muted leading-relaxed line-clamp-2">
                        {agent.description || meta?.focus}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-[0.55rem] tracking-[0.1em] uppercase text-editorial-faint">
                            {agent.category}
                        </span>
                        {meta?.influence && (
                            <>
                                <span className="text-editorial-faint/30">&middot;</span>
                                <span className="text-[0.55rem] tracking-[0.1em] uppercase text-editorial-faint">
                                    inspired by {meta.influence}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function MarketplacePage() {
    const [category, setCategory] = useState<string>('all');
    const { data, isLoading } = useMarketplaceAgents(category === 'all' ? undefined : category);

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-10 reveal-up"
                >
                    &larr; Home
                </Link>

                <header className="mb-10 reveal-up">
                    <h1 className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream leading-[1.05] tracking-[-0.02em] mb-3">
                        Marketplace
                    </h1>
                    <p className="text-editorial-muted text-body-lg">
                        Your family&rsquo;s council of AI guides
                    </p>
                </header>

                <div className="flex items-center gap-2 mb-8 reveal-up reveal-d1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-[0.6rem] tracking-[0.15em] uppercase px-4 py-1.5 rounded-full border transition-colors ${
                                category === cat
                                    ? 'border-editorial-accent/40 text-editorial-accent bg-editorial-accent/5'
                                    : 'border-editorial-subtle/10 text-editorial-faint hover:text-editorial-muted hover:border-editorial-subtle/20'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="py-20 text-center">
                        <p className="text-editorial-faint text-sm animate-pulse">Loading agents...</p>
                    </div>
                ) : (
                    <div className="grid gap-4 reveal-up reveal-d2">
                        {data?.agents?.map((agent) => (
                            <AgentCard key={agent.id} agent={agent} />
                        ))}
                        {(!data?.agents || data.agents.length === 0) && (
                            <p className="py-12 text-center text-editorial-faint text-sm">
                                No agents found in this category.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
