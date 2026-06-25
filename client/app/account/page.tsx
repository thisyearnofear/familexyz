'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fontVariables } from '@/lib/fonts';
import { Skeleton } from '@/components/ui/skeleton';

function useSubscriptionStatus() {
    return useQuery({
        queryKey: ['subscription-status'],
        queryFn: () => {
            const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";
            return fetch(`${BASE_URL}/api/subscription/status`).then(r => r.json());
        },
        staleTime: 60_000,
        retry: 1,
    });
}

const TIER_PRICES: Record<string, number> = {
    FREE: 0,
    BASIC: 9.99,
    PREMIUM: 24.99,
    FAMILY: 49.99,
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | 'unlimited' }) {
    const isUnlimited = limit === 'unlimited';
    const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between text-[0.6rem] tracking-[0.1em] uppercase text-editorial-faint mb-1.5">
                <span>{label}</span>
                <span>{used} / {isUnlimited ? '\u221E' : limit}</span>
            </div>
            <div className="h-1.5 bg-editorial-subtle/10 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#d97706' : '#0d9488',
                    }}
                />
            </div>
        </div>
    );
}

export default function AccountPage() {
    const { data, isLoading } = useSubscriptionStatus();

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-10 reveal-up"
                >
                    &larr; Home
                </Link>

                <header className="mb-10 reveal-up">
                    <h1 className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream leading-[1.05] tracking-[-0.02em] mb-3">
                        Account
                    </h1>
                    <p className="text-editorial-muted text-body-lg">
                        Manage your subscription and usage
                    </p>
                </header>

                {isLoading ? (
                    <div className="space-y-8">
                        <Skeleton variant="card" className="h-40" />
                        <Skeleton variant="card" className="h-52" />
                    </div>
                ) : (
                    <>
                        <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d1">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint">
                                    Current Plan
                                </h2>
                                <span className="text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-full border border-editorial-accent/30 text-editorial-accent">
                                    {data?.subscription?.tier || 'FREE'}
                                </span>
                            </div>
                            <p className="font-[family-name:var(--font-playfair)] text-2xl text-editorial-cream mb-1">
                                ${TIER_PRICES[data?.subscription?.tier || 'FREE'] || 0}<span className="text-sm text-editorial-muted">/month</span>
                            </p>
                            <p className="text-sm text-editorial-muted mt-2">
                                {data?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                                {data?.subscription?.cancelAtPeriodEnd && ' (cancels at period end)'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d2">
                            <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-6">
                                Usage This Period
                            </h2>
                            {data?.usage?.usage?.map((stat: any) => {
                                const labels: Record<string, string> = {
                                    ai_messages: 'AI Messages',
                                    web_searches: 'Web Searches',
                                    advanced_models: 'Advanced Models',
                                    api_calls: 'API Calls',
                                };
                                return (
                                    <UsageBar
                                        key={stat.feature}
                                        label={labels[stat.feature] || stat.feature}
                                        used={stat.used}
                                        limit={stat.limit}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex gap-3 reveal-up reveal-d3">
                            <Link
                                href="/marketplace"
                                className="px-6 py-3 rounded-xl text-sm font-medium border border-editorial-subtle/20 text-editorial-muted hover:text-editorial-cream hover:border-editorial-subtle/40 transition-colors"
                            >
                                Browse Marketplace
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
