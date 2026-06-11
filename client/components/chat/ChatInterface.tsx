'use client';

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "@/lib/api";
import {
  AGENTS,
  getAgent,
  getAgentColor,
  CONTEXT_WELCOME,
  SUGGESTIONS,
  DEFAULT_SUGGESTIONS,
  type DailyTake,
} from "@/lib/agents";
import { fontVariables } from "@/lib/fonts";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface ChatInterfaceProps {
  initialAgentId: string;
  context?: string;
}

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
  const [exchangeCount, setExchangeCount] = useState(0);
  const hasSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const agent = getAgent(agentId);
  const profile = agent ?? { name: agentId, emoji: "\u{1F916}", tagline: "AI Agent" };
  const agentColor = getAgentColor(agentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (context === "today") {
      fetch("/api/today")
        .then((res) => res.json())
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
    setExchangeCount((c) => c + 1);

    abortRef.current = new AbortController();

    try {
      const data = await apiClient.sendMessage(agentId, textToSend);
      const reply = Array.isArray(data)
        ? data.map((d: any) => d.text || d.content || "").filter(Boolean).join("\n\n")
        : data.text || data.content || data.response || JSON.stringify(data);

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
    setExchangeCount(0);
    hasSentRef.current = false;
  };

  const suggestions =
    contextSeen
      ? SUGGESTIONS[context || ""] || DEFAULT_SUGGESTIONS
      : DEFAULT_SUGGESTIONS;

  const welcomeText =
    contextSeen && context && CONTEXT_WELCOME[context]
      ? CONTEXT_WELCOME[context]!(storyContext || undefined)
      : `Ask for advice, share how you\u2019re feeling, or explore ways to strengthen your family connections.`;

  return (
    <div
      className={`${fontVariables} flex flex-col h-full relative`}
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${agentColor}06 0%, transparent 50%), var(--editorial-bg, #1a1614)`,
      }}
    >
      {/* Agent Identity — full-bleed color wash */}
      <div className="relative px-6 sm:px-8 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-[0.55rem] tracking-[0.25em] uppercase mb-2" style={{ color: `${agentColor}99` }}>
            {profile.tagline}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-headline font-bold text-editorial-cream leading-[1.1] tracking-[-0.01em]">
            {profile.emoji} {profile.name}
          </h1>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.length === 0 && !isLoading && (
            <div className="py-10">
              <p className="text-sm text-editorial-muted leading-relaxed mb-8 max-w-md">
                {welcomeText}
              </p>
              <p className="text-[0.6rem] tracking-[0.15em] uppercase text-editorial-faint mb-4">
                Things I can help with
              </p>
              <ol className="space-y-2">
                {suggestions.map((suggestion, i) => (
                  <li key={suggestion}>
                    <button
                      onClick={() => setInput(suggestion)}
                      className="text-left text-sm text-editorial-subtle hover:text-editorial-cream transition-colors hover-shift leading-relaxed"
                    >
                      <span className="text-editorial-faint mr-2 tabular-nums">{i + 1}.</span>
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div
                  className="max-w-[85%] pl-4 py-2 border-l-2"
                  style={{ borderColor: `${agentColor}50` }}
                >
                  <p className="text-sm text-editorial-dim leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="max-w-[85%] bg-editorial-surface/40 rounded-tl-xl rounded-tr-xl rounded-bl-xl px-4 py-2.5">
                  <p className="text-sm text-editorial-cream leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {streamingContent && (
            <div className="flex justify-start">
              <div
                className="max-w-[85%] pl-4 py-2 border-l-2"
                style={{ borderColor: `${agentColor}50` }}
              >
                <p className="text-sm text-editorial-dim leading-relaxed whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: agentColor }} />
                </p>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="flex justify-start">
              <div
                className="pl-4 py-2 border-l-2"
                style={{ borderColor: `${agentColor}30` }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: `${agentColor}60`, animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: `${agentColor}60`, animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: `${agentColor}60`, animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  dismiss
                </button>
              </div>
            </div>
          )}

          {exchangeCount >= 3 && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
            <div className="text-center py-4">
              <a
                href="/today"
                className="text-xs text-editorial-faint hover:text-editorial-accent transition-colors hover-underline-wipe"
              >
                Want a second opinion? Read the full council &rarr;
              </a>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-editorial-subtle/10 bg-editorial-bg/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          {isLoading && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleCancel}
                className="text-xs px-3 py-1 rounded-full bg-red-500/15 text-red-400/80 hover:bg-red-500/25 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading
                  ? "Waiting for response..."
                  : `Ask ${profile.name} something...`
              }
              disabled={isLoading}
              className="flex-1 rounded-xl border border-editorial-subtle/15 bg-editorial-surface/30 px-4 py-2.5 text-sm text-editorial-cream placeholder:text-editorial-faint focus:outline-none focus:border-editorial-subtle/30 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isLoading || !input.trim()
                  ? "bg-editorial-surface/20 text-editorial-faint cursor-not-allowed"
                  : "text-editorial-cream hover:opacity-90 active:scale-95"
              }`}
              style={
                isLoading || !input.trim()
                  ? undefined
                  : { backgroundColor: `${agentColor}30`, color: agentColor }
              }
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
