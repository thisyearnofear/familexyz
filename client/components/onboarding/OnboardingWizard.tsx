'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AGENTS } from '@/lib/agents';

const STEPS = ['welcome', 'agents', 'ready'] as const;

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1 rounded-full transition-all motion-reduce:transition-none ${
                        i <= current
                            ? 'w-8 bg-editorial-accent'
                            : 'w-2 bg-editorial-subtle/20'
                    }`}
                    style={{
                        transition: 'width 0.4s var(--ease-smooth-out), background-color 0.3s var(--ease-smooth-out)',
                    }}
                />
            ))}
        </div>
    );
}

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const router = useRouter();

    const handleDismiss = useCallback(() => {
        onComplete();
    }, [onComplete]);

    const handleNext = useCallback(() => {
        if (step < STEPS.length - 1) {
            setStep((s) => s + 1);
        } else {
            handleDismiss();
        }
    }, [step, handleDismiss]);

    const handleAgentPick = useCallback(
        (id: string) => {
            handleDismiss();
            router.push(`/chat/${id}`);
        },
        [handleDismiss, router]
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-editorial-bg/95 backdrop-blur-sm">
            <div className="max-w-lg mx-auto px-6 w-full motion-fade-in">
                <StepIndicator current={step} total={STEPS.length} />

                {/* Step 1: Welcome */}
                {step === 0 && (
                    <div className="text-center motion-fade-in">
                        <p className="text-4xl mb-6">👨‍👩‍👧‍👦</p>
                        <h1 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em] mb-4">
                            Welcome to<br />famile.xyz
                        </h1>
                        <p className="text-editorial-muted text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-8">
                            Five specialized AI agents — each drawing from a distinct intellectual tradition — designed to help your family thrive.
                        </p>
                        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-editorial-subtle mb-8">
                            {AGENTS.map((a) => (
                                <span key={a.id} className="flex items-center gap-1.5">
                                    <span>{a.emoji}</span>
                                    <span className="font-[family-name:var(--font-playfair)]">{a.name}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 rounded-xl text-sm font-medium bg-editorial-accent text-white hover:opacity-90 transition-all active:scale-[0.97] motion-reduce:active:scale-100"
                            >
                                Show me around
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-3 text-xs text-editorial-faint hover:text-editorial-muted transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Pick an Agent */}
                {step === 1 && (
                    <div className="motion-fade-in">
                        <p className="text-center text-[0.55rem] tracking-[0.25em] uppercase text-editorial-faint mb-6">
                            Choose Your Guide
                        </p>
                        <p className="text-center text-sm text-editorial-muted mb-8 max-w-xs mx-auto">
                            Pick the agent that resonates most with what your family needs right now.
                        </p>
                        <div className="space-y-2">
                            {AGENTS.map((agent, i) => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleAgentPick(agent.id)}
                                    className="w-full text-left group rounded-xl border border-editorial-subtle/10 bg-editorial-surface/5 p-4 hover:bg-editorial-surface/15 transition-all motion-reduce:transition-none hover-scale"
                                    style={{
                                        animation: `revealUp 0.4s var(--ease-smooth-out) ${i * 40}ms both`,
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl">{agent.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-editorial-cream"
                                                style={{ color: agent.color }}
                                            >
                                                {agent.name}
                                            </p>
                                            <p className="text-xs text-editorial-muted truncate">
                                                {agent.focus}
                                            </p>
                                        </div>
                                        <span className="text-editorial-faint text-xs group-hover:text-editorial-accent transition-colors motion-reduce:transition-none">
                                            Chat &rarr;
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="text-center mt-6">
                            <button
                                onClick={() => {
                                    handleDismiss();
                                    router.push('/today');
                                }}
                                className="text-xs text-editorial-faint hover:text-editorial-muted transition-colors"
                            >
                                Or browse the council first &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Ready */}
                {step === 2 && (
                    <div className="text-center motion-fade-in">
                        <p className="text-4xl mb-6">✨</p>
                        <h2 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-[1.1] mb-4">
                            You're all set
                        </h2>
                        <p className="text-editorial-muted text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-8">
                            Start with today&rsquo;s council — five perspectives on one story from the zeitgeist — or jump into a conversation with any agent.
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => {
                                    handleDismiss();
                                    router.push('/today');
                                }}
                                className="px-8 py-3 rounded-xl text-sm font-medium bg-editorial-accent text-white hover:opacity-90 transition-all active:scale-[0.97] motion-reduce:active:scale-100"
                            >
                                Read Today&rsquo;s Council
                            </button>
                            <button
                                onClick={() => {
                                    handleDismiss();
                                    router.push(`/chat/${AGENTS[0].id}`);
                                }}
                                className="text-xs text-editorial-faint hover:text-editorial-muted transition-colors"
                            >
                                Or start chatting with {AGENTS[0].name} &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* Dismiss hint */}
                <p className="text-center mt-8 text-[0.5rem] tracking-[0.2em] uppercase text-editorial-faint/40">
                    Press ESC to dismiss
                </p>
            </div>
        </div>
    );
}
