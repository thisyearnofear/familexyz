'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentGrid } from "@/components/hackathon/AgentGrid";
import { IdentityPanel } from "@/components/hackathon/IdentityPanel";
import { DropZone } from "@/components/hackathon/DropZone";
import { OutputPanel } from "@/components/hackathon/OutputPanel";

type Phase = "boot" | "workspace";

export default function HackathonPage() {
    const [phase, setPhase] = useState<Phase>("boot");
    const [bootComplete, setBootComplete] = useState(false);
    const [transformedContent, setTransformedContent] = useState<string | null>(
        null
    );
    const [isTransforming, setIsTransforming] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setBootComplete(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (bootComplete) {
            const timer = setTimeout(() => setPhase("workspace"), 800);
            return () => clearTimeout(timer);
        }
    }, [bootComplete]);

    const handleTransform = async (content: string) => {
        setIsTransforming(true);
        try {
            const response = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await response.json();
            setTransformedContent(data.transformed);
        } catch (err) {
            console.error("Transform failed", err);
        } finally {
            setIsTransforming(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono">
            <AnimatePresence mode="wait">
                {phase === "boot" && <BootScreen />}
                {phase === "workspace" && (
                    <motion.div
                        key="workspace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 sm:p-8 max-w-7xl mx-auto"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <AgentGrid
                                    isTransforming={isTransforming}
                                />
                                <DropZone
                                    onDrop={handleTransform}
                                    isLoading={isTransforming}
                                />
                                {transformedContent && (
                                    <OutputPanel
                                        content={transformedContent}
                                    />
                                )}
                            </div>
                            <div>
                                <IdentityPanel />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BootScreen() {
    const [line, setLine] = useState(0);
    const lines = [
        "jarvis.os · session_active",
        "",
        "loading identity...",
        "  name:          Agent Prime",
        "  role:          Family Orchestrator",
        "  tone:          Warm, empathetic, direct",
        "  format:        Markdown-friendly prose",
        "  banned:        Jargon, passive voice, negativity",
        "",
        "system ready. awaiting input...",
    ];

    useEffect(() => {
        if (line < lines.length) {
            const timer = setTimeout(() => setLine((l) => l + 1), 150);
            return () => clearTimeout(timer);
        }
    }, [line, lines.length]);

    return (
        <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-8"
        >
            <div className="w-full max-w-2xl">
                {lines.slice(0, line).map((l, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${
                            l.startsWith("  ")
                                ? "text-green-600/70 ml-4"
                                : l.startsWith("system")
                                  ? "text-green-400/50"
                                  : "text-green-400"
                        }`}
                    >
                        {l || "\u00A0"}
                    </motion.div>
                ))}
                {line <= lines.length && (
                    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
                )}
            </div>
        </motion.div>
    );
}
