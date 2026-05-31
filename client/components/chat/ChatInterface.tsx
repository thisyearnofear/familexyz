'use client';

import React, { useState, useRef, useEffect } from "react";
import { Playfair_Display } from "next/font/google";
import { apiClient } from "@/lib/api";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const AGENT_COLORS: Record<string, string> = {
    wisdom: "#6d28d9",
    intimacy: "#db2777",
    presence: "#0d9488",
    growth: "#d97706",
    bridge: "#2563eb",
    savings: "#059669",
};

const AGENT_PROFILES: Record<string, { name: string; emoji: string; tagline: string }> = {
    wisdom:     { name: "Wisdom",    emoji: "🧠", tagline: "Philosophy & Emotional Intelligence" },
    intimacy:   { name: "Intimacy",  emoji: "💖", tagline: "Relationships & Connection" },
    presence:   { name: "Presence",  emoji: "🧘", tagline: "Mindfulness & Digital Wellness" },
    growth:     { name: "Growth",    emoji: "🌱", tagline: "Development & Achievements" },
    bridge:     { name: "Bridge",    emoji: "🧓", tagline: "Generational Connections" },
    savings:    { name: "Savings",   emoji: "💰", tagline: "FAM Token Vault" },
};

interface Message {
    role: "user" | "assistant";
    content: string;
    id: string;
}

interface DailyTake {
    date: string;
    story: { headline: string; source: string; url?: string; summary: string };
    takes: Array<{ agent: string; emoji: string; influence: string; take: string }>;
    generatedAt: number;
}

interface ChatInterfaceProps {
    initialAgentId: string;
    context?: string;
}

const CONTEXT_WELCOME: Record<string, (story?: DailyTake) => string> = {
    today: (story) => story
        ? `You just read my take on today's council story — "${story.story.headline}". Want to explore it further through my lens?`
        : "I see you just came from today's Daily Council. Want to explore today's story through my lens? Ask me anything about it.",
};

const SUGGESTIONS: Record<string, string[]> = {
    today: [
        "Tell me more about today's story through your lens",
        "How does this apply to our family?",
        "What would you focus on here?",
    ],
};

const DEFAULT_SUGGESTIONS = [
    "How can we build healthier communication habits?",
    "Suggest a family activity that strengthens our bond",
    "Help me work through a disagreement with empathy",
    "What family goals should we set this month?",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    initialAgentId,
    context,
}) => {
    const [agentId, setAgentId] = useState(initialAgentId);
    const [messages, setMessages] = useState<Message[]>([]);
    const [contextSeen, setContextSeen] = useState(!!context);
    const [storyContext, setStoryContext] = useState<DailyTake | null>(null);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const hasSentRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const profile = AGENT_PROFILES[agentId] || {
        name: agentId,
        emoji: "\U0001F916",
        tagline: "AI Agent",
    };
    const agentColor = AGENT_COLORS[agentId] || "#666666";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    useEffect(() => {
        if (context === "today") {
            fetch('/api/today')
                .then(res => res.json())
                .then(setStoryContext)
                .catch(() => {});
        }
    }, [context]);

    const enrichFirstMessage = (text: string): string => {
        if (hasSentRef.current || !storyContext) return text;
        hasSentRef.current = true;
        return `Regarding today's council story "${storyContext.story.headline}" (${storyContext.story.source}): ${text}`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const textToSend = enrichFirstMessage(input.trim());
        const userMessage: Message = {
            role: "user",
            content: input.trim(),
            id: crypto.randomUUID(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setStreamingContent("");
        setError(null);

        abortRef.current = new AbortController();

        try {
            const data = await apiClient.sendMessage(agentId, textToSend);
            const reply = Array.isArray(data)
                ? data.map((d: any) => d.text || d.content || "").filter(Boolean).join("\n\n")
                : data.text || data.content || data.response || JSON.stringify(data);

            // Word-by-word streaming effect
            let displayed = "";
            const words = reply.split(" ");
            for (let i = 0; i < words.length; i++) {
                displayed += (i > 0 ? " " : "") + words[i];
                setStreamingContent(displayed);
                await new Promise((r) => setTimeout(r, 15 + Math.random() * 25));
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: reply, id: crypto.randomUUID() },
            ]);
            setStreamingContent("");
        } catch (err: any) {
            if (err.name === "AbortError") return;
            setError(err.message || "Failed to get response");
        } finally {
            setIsLoading(false);
            abortRef.current = null;
        }
    };

    const handleCancel = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        setIsLoading(false);
        setStreamingContent("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const switchAgent = (newAgentId: string) => {
        setAgentId(newAgentId);
        setMessages([]);
        setStreamingContent("");
        setError(null);
    };

    return (
        <div className={`${playfair.variable} flex flex-col h-full`}>
            {/* Agent Identity Banner */}
            <div className="relative px-4 sm:px-6 py-4 border-b border-[#2d2a24]"
                style={{ background: `linear-gradient(135deg, ${agentColor}08 0%, transparent 70%)` }}>
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5"
                    style={{ backgroundColor: agentColor, opacity: 0.3 }} />
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                            background: `radial-gradient(circle at 50% 50%, ${agentColor}15 0%, transparent 70%)`,
                        }}>
                        <span className="text-xl">{profile.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-editorial-cream leading-tight">
                            {profile.name}
                        </h1>
                        <p className="text-xs text-editorial-subtle mt-0.5">{profile.tagline}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                        {Object.entries(AGENT_PROFILES).map(([id, p]) => {
                            const c = AGENT_COLORS[id] || "#666";
                            return (
                                <button
                                    key={id}
                                    onClick={() => switchAgent(id)}
                                    className="w-8 h-8 rounded-md flex items-center justify-center text-base transition-all duration-200"
                                    style={{
                                        background: id === agentId
                                            ? `${c}20`
                                            : "transparent",
                                        border: id === agentId
                                            ? `1px solid ${c}30`
                                            : "1px solid transparent",
                                    }}
                                    title={p.name}
                                >
                                    {p.emoji}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Empty state with suggestions */}
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="text-4xl mb-4">{profile.emoji}</span>
                            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-editorial-cream mb-2">
                                Chat with {profile.name}
                            </h2>
                            <p className="text-editorial-subtle text-sm max-w-md mb-8 leading-relaxed">
                                {contextSeen && context && CONTEXT_WELCOME[context]
                                    ? CONTEXT_WELCOME[context]!(storyContext || undefined)
                                    : "Ask for advice, share how you're feeling, or explore ways to strengthen your family connections."
                                }
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                {(contextSeen ? SUGGESTIONS[context || ''] || DEFAULT_SUGGESTIONS : DEFAULT_SUGGESTIONS).map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); }}
                                        className="text-left text-sm p-3 rounded-lg border border-[#2d2a24] text-editorial-subtle hover:text-editorial-cream transition-colors"
                                        style={{ background: `linear-gradient(135deg, ${agentColor}06 0%, transparent 70%)` }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message list */}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className="flex items-start gap-3 max-w-[80%]">
                                {msg.role === "assistant" && (
                                    <span className="text-xl flex-shrink-0 mt-1">{profile.emoji}</span>
                                )}
                                <div className={`rounded-2xl px-4 py-2.5 ${
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted border rounded-bl-md"
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === "user" && (
                                    <span className="text-sm flex-shrink-0 mt-1 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                                        \U0001F464
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Streaming content */}
                    {streamingContent && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-3 max-w-[80%]">
                                <span className="text-xl flex-shrink-0 mt-1">{profile.emoji}</span>
                                <div className="rounded-2xl px-4 py-2.5 bg-muted border rounded-bl-md">
                                    <p className="text-sm whitespace-pre-wrap">{streamingContent}<span className="animate-pulse">\u258C</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typing indicator */}
                    {isLoading && !streamingContent && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-3">
                                <span className="text-xl flex-shrink-0 mt-1">{profile.emoji}</span>
                                <div className="rounded-2xl px-4 py-3 bg-muted border rounded-bl-md">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{animationDelay: '0ms'}} />
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{animationDelay: '150ms'}} />
                                        <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{animationDelay: '300ms'}} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div className="flex justify-center">
                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                <span>\u26A0\uFE0F</span>
                                <span>{error}</span>
                                <button onClick={() => setError(null)} className="ml-2 text-xs underline hover:no-underline">Dismiss</button>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    {isLoading && (
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleCancel}
                                className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                                Cancel generation
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isLoading ? "Waiting for response..." : `Ask ${profile.name} something...`}
                            disabled={isLoading}
                            className="flex-1 rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isLoading || !input.trim()
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                            }`}
                        >
                            {isLoading ? "..." : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
