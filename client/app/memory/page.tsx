'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fontVariables } from '@/lib/fonts';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useMemoryStatus,
    useRecallMemory,
    useRememberMemory,
    useForgetMemory,
    useImproveMemory,
} from '@/hooks/use-memory';

export default function MemoryPage() {
    const { data: status, isLoading: statusLoading } = useMemoryStatus();
    const recallMutation = useRecallMemory();
    const rememberMutation = useRememberMemory();
    const forgetMutation = useForgetMemory();
    const improveMutation = useImproveMemory();

    const [recallQuery, setRecallQuery] = useState('');
    const [rememberText, setRememberText] = useState('');
    const [showForgetConfirm, setShowForgetConfirm] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const enabled = status?.enabled ?? false;

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleRecall = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recallQuery.trim()) return;
        recallMutation.mutate(recallQuery.trim());
    };

    const handleRemember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rememberText.trim()) return;
        rememberMutation.mutate(
            { content: rememberText.trim() },
            {
                onSuccess: (data) => {
                    if (data.success) {
                        showToast('Memory stored.');
                        setRememberText('');
                    } else {
                        showToast(data.message || 'Memory layer not enabled.');
                    }
                },
                onError: () => showToast('Failed to store memory.'),
            },
        );
    };

    const handleForget = () => {
        forgetMutation.mutate(undefined, {
            onSuccess: (data) => {
                setShowForgetConfirm(false);
                if (data.success) {
                    showToast('All memories forgotten.');
                } else {
                    showToast(data.message || 'Memory layer not enabled.');
                }
            },
            onError: () => showToast('Failed to forget memory.'),
        });
    };

    const handleImprove = () => {
        improveMutation.mutate(undefined, {
            onSuccess: (data) => {
                if (data.success) {
                    showToast('Memory graph enriched.');
                } else {
                    showToast(data.message || 'Memory layer not enabled.');
                }
            },
            onError: () => showToast('Failed to improve memory.'),
        });
    };

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
                        Memory
                    </h1>
                    <p className="text-editorial-muted text-body-lg">
                        Your AI agents&apos; persistent memory, powered by Cognee&apos;s hybrid graph-vector layer.
                    </p>
                </header>

                {/* Status card */}
                <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d1">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint">
                            Memory Layer
                        </h2>
                        {statusLoading ? (
                            <Skeleton variant="bar" className="h-5 w-20 rounded-full" />
                        ) : (
                            <span
                                className={`text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-full border ${
                                    enabled
                                        ? 'border-green-500/30 text-green-400'
                                        : 'border-editorial-subtle/30 text-editorial-muted'
                                }`}
                            >
                                {enabled ? '🧠 Active' : '🔶 Disabled'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-editorial-muted mt-2">
                        {enabled
                            ? 'Cognee is connected. Your agents remember across sessions.'
                            : 'Set COGNEE_ENABLED=true with a Cognee Cloud API key to activate cross-session memory. The app works fully without it.'}
                    </p>
                </div>

                {/* Recall search */}
                <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d2">
                    <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-4">
                        Search Memories
                    </h2>
                    <form onSubmit={handleRecall} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={recallQuery}
                            onChange={(e) => setRecallQuery(e.target.value)}
                            placeholder="What did Wisdom say about my dad?"
                            disabled={!enabled || recallMutation.isPending}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-editorial-bg/50 border border-editorial-subtle/20 text-editorial-cream text-sm placeholder:text-editorial-faint focus:outline-none focus:border-editorial-accent/40 transition-colors disabled:opacity-40"
                        />
                        <button
                            type="submit"
                            disabled={!enabled || !recallQuery.trim() || recallMutation.isPending}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-editorial-accent text-white hover:bg-editorial-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {recallMutation.isPending ? 'Searching...' : 'Recall'}
                        </button>
                    </form>

                    {recallMutation.data && (
                        <div className="mt-4">
                            {recallMutation.data.count === 0 ? (
                                <p className="text-xs text-editorial-faint text-center py-4">
                                    No memories found for &quot;{recallMutation.data.query}&quot;
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint">
                                        {recallMutation.data.count} memor{recallMutation.data.count === 1 ? 'y' : 'ies'} recalled
                                    </p>
                                    {recallMutation.data.results.slice(0, 8).map((result, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-editorial-subtle/10 bg-editorial-bg/30 p-4 motion-fade-in"
                                            style={{ animationDelay: `${i * 60}ms` }}
                                        >
                                            <p className="text-sm text-editorial-cream leading-relaxed">
                                                {result}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {recallMutation.isError && (
                        <p className="text-xs text-red-400 mt-2">
                            Error: {recallMutation.error?.message}
                        </p>
                    )}
                </div>

                {/* Remember input */}
                <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d3">
                    <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-4">
                        Add a Memory
                    </h2>
                    <form onSubmit={handleRemember}>
                        <textarea
                            value={rememberText}
                            onChange={(e) => setRememberText(e.target.value)}
                            placeholder="Type something for your agents to remember..."
                            rows={3}
                            disabled={!enabled || rememberMutation.isPending}
                            className="w-full px-4 py-3 rounded-xl bg-editorial-bg/50 border border-editorial-subtle/20 text-editorial-cream text-sm placeholder:text-editorial-faint focus:outline-none focus:border-editorial-accent/40 transition-colors disabled:opacity-40 resize-none"
                        />
                        <button
                            type="submit"
                            disabled={!enabled || !rememberText.trim() || rememberMutation.isPending}
                            className="mt-3 px-5 py-2.5 rounded-xl text-sm font-medium border border-editorial-subtle/20 text-editorial-cream hover:border-editorial-subtle/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {rememberMutation.isPending ? 'Storing...' : 'Remember'}
                        </button>
                    </form>
                </div>

                {/* Memory lifecycle controls */}
                <div className="rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 mb-8 reveal-up reveal-d4">
                    <h2 className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-4">
                        Memory Lifecycle
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleImprove}
                            disabled={!enabled || improveMutation.isPending}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-editorial-subtle/20 text-editorial-cream hover:border-editorial-accent/40 hover:text-editorial-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {improveMutation.isPending ? 'Enriching...' : '✨ Improve Graph'}
                        </button>

                        {!showForgetConfirm ? (
                            <button
                                onClick={() => setShowForgetConfirm(true)}
                                disabled={!enabled}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-500/20 text-red-400/80 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                🗑️ Forget All
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-editorial-muted">Are you sure?</span>
                                <button
                                    onClick={handleForget}
                                    disabled={forgetMutation.isPending}
                                    className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                    {forgetMutation.isPending ? 'Deleting...' : 'Yes, delete'}
                                </button>
                                <button
                                    onClick={() => setShowForgetConfirm(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-medium border border-editorial-subtle/20 text-editorial-muted hover:text-editorial-cream transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-[0.6rem] text-editorial-faint mt-4">
                        <strong>Improve</strong> enriches the graph and prunes stale nodes.
                        <strong> Forget</strong> surgically deletes all your memory data.
                    </p>
                </div>

                <div className="flex gap-3 reveal-up reveal-d5">
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 rounded-xl text-sm font-medium border border-editorial-subtle/20 text-editorial-muted hover:text-editorial-cream hover:border-editorial-subtle/40 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                    <Link
                        href="/account"
                        className="px-6 py-3 rounded-xl text-sm font-medium border border-editorial-subtle/20 text-editorial-muted hover:text-editorial-cream hover:border-editorial-subtle/40 transition-colors"
                    >
                        Account
                    </Link>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-editorial-surface border border-editorial-subtle/20 text-sm text-editorial-cream shadow-lg motion-fade-in">
                    {toast}
                </div>
            )}
        </div>
    );
}
