'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fontVariables } from '@/lib/fonts';

const CATEGORIES = ['family', 'wellness', 'education', 'general'];
const TIERS = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];

export default function PublishPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [tierRequired, setTierRequired] = useState('FREE');
    const [publisherName, setPublisherName] = useState('');
    const [publisherEmail, setPublisherEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSlugChange = (value: string) => {
        setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";
            const token = typeof window !== 'undefined' ? localStorage.getItem('famile_token') : null;

            const res = await fetch(`${BASE_URL}/api/marketplace/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ name, slug, description, category, tierRequired, publisherName, publisherEmail }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Submission failed');
                return;
            }
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`${fontVariables} min-h-screen bg-editorial-bg bg-noise`}>
            <div className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-block text-[0.6rem] tracking-[0.2em] uppercase text-editorial-faint hover:text-editorial-accent transition-colors mb-10 reveal-up"
                >
                    &larr; Home
                </Link>

                <header className="mb-10 reveal-up">
                    <h1 className="font-[family-name:var(--font-playfair)] text-display font-bold text-editorial-cream leading-[1.05] tracking-[-0.02em] mb-3">
                        Publish an Agent
                    </h1>
                    <p className="text-editorial-muted text-body-lg">
                        Submit your AI agent for the FamilyXYZ marketplace
                    </p>
                </header>

                {submitted ? (
                    <div className="rounded-2xl border border-editorial-accent/20 bg-editorial-accent/5 p-8 text-center reveal-up">
                        <p className="text-2xl mb-3">{'\u2713'}</p>
                        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-editorial-cream mb-2">
                            Submission Received
                        </h2>
                        <p className="text-sm text-editorial-muted mb-6">
                            Your agent is pending review. We&rsquo;ll notify you once it&rsquo;s been reviewed.
                        </p>
                        <Link
                            href="/marketplace"
                            className="text-sm text-editorial-accent hover:text-editorial-accent/80 transition-colors"
                        >
                            Browse Marketplace &rarr;
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 reveal-up reveal-d1">
                        <div>
                            <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                Agent Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30"
                                placeholder="e.g. Mindful Mentor"
                            />
                        </div>

                        <div>
                            <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                Slug (URL identifier) *
                            </label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                required
                                className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30"
                                placeholder="e.g. mindful-mentor"
                            />
                        </div>

                        <div>
                            <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={3}
                                className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30 resize-none"
                                placeholder="What does your agent help families with?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream focus:outline-none focus:border-editorial-subtle/30"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                    Minimum Tier
                                </label>
                                <select
                                    value={tierRequired}
                                    onChange={(e) => setTierRequired(e.target.value)}
                                    className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream focus:outline-none focus:border-editorial-subtle/30"
                                >
                                    {TIERS.map((tier) => (
                                        <option key={tier} value={tier}>{tier}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    value={publisherName}
                                    onChange={(e) => setPublisherName(e.target.value)}
                                    className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={publisherEmail}
                                    onChange={(e) => setPublisherEmail(e.target.value)}
                                    className="w-full rounded-xl border border-editorial-subtle/15 bg-editorial-surface/10 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !name || !slug || !description}
                            className="w-full px-6 py-3 rounded-xl text-sm font-medium bg-editorial-accent/10 text-editorial-accent border border-editorial-accent/20 hover:bg-editorial-accent/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit for Review'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
