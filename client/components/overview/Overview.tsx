'use client';

import { Playfair_Display } from "next/font/google";
import type { Character } from "@/types/elizaos";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

interface OverviewProps {
    character: Character;
}

const AGENT_COLORS: Record<string, string> = {
    wisdom: "#6d28d9",
    intimacy: "#db2777",
    presence: "#0d9488",
    growth: "#d97706",
    bridge: "#2563eb",
};

function agentIdFromName(name: string): string {
    const map: Record<string, string> = {
        Wisdom: "wisdom", Intimacy: "intimacy", Presence: "presence",
        Growth: "growth", Bridge: "bridge",
    };
    return map[name] || "wisdom";
}

export const Overview: React.FC<OverviewProps> = ({ character }) => {
    const agentId = agentIdFromName(character.name);
    const color = AGENT_COLORS[agentId] || "#c4542b";

    return (
        <div className={`${playfair.variable} min-h-screen fade-in`}>
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="text-center mb-10">
                    <div className="w-16 h-px mx-auto mb-4 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                    <h1 className="font-[family-name:var(--font-playfair)] text-[clamp(1.4rem,3vw,2rem)] font-bold text-editorial-cream tracking-[-0.01em]">
                        {character.name}
                    </h1>
                    <p className="text-xs tracking-[0.15em] uppercase text-editorial-subtle mt-2">
                        {character.modelProvider}
                    </p>
                    <div className="w-24 h-px mx-auto mt-4 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />
                </header>

                <div className="space-y-4">
                    {/* Bio */}
                    <div className="relative rounded-lg p-5 border border-[#2d2a24] fade-in fade-in-d1"
                        style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)` }}>
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                            style={{ backgroundColor: color, opacity: 0.3 }} />
                        <h3 className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint mb-2">
                            Bio
                        </h3>
                        <p className="text-sm text-editorial-muted leading-relaxed">
                            {Array.isArray(character.bio)
                                ? character.bio.join(" ")
                                : character.bio}
                        </p>
                    </div>

                    {/* Lore */}
                    {character.lore && character.lore.length > 0 && (
                        <div className="relative rounded-lg p-5 border border-[#2d2a24] fade-in fade-in-d2"
                            style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)` }}>
                            <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                                style={{ backgroundColor: color, opacity: 0.3 }} />
                            <h3 className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint mb-2">
                                Lore
                            </h3>
                            <ul className="space-y-1">
                                {character.lore.map((item, i) => (
                                    <li key={i} className="text-sm text-editorial-muted leading-relaxed">
                                        &mdash; {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Style Guide */}
                    <div className="relative rounded-lg p-5 border border-[#2d2a24] fade-in fade-in-d3"
                        style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)` }}>
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                            style={{ backgroundColor: color, opacity: 0.3 }} />
                        <h3 className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint mb-3">
                            Style Guide
                        </h3>
                        <div className="space-y-3">
                            {character.style?.all && (
                                <div>
                                    <span className="text-[0.5rem] tracking-[0.15em] uppercase text-editorial-faint block mb-1">
                                        General
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {character.style.all.map((s, i) => (
                                            <span key={i}
                                                className="text-xs px-2 py-0.5 rounded border border-[#2d2a24] text-editorial-subtle"
                                                style={{ background: `${color}08` }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {character.style?.chat && (
                                <div>
                                    <span className="text-[0.5rem] tracking-[0.15em] uppercase text-editorial-faint block mb-1">
                                        Chat
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {character.style.chat.map((s, i) => (
                                            <span key={i}
                                                className="text-xs px-2 py-0.5 rounded border border-[#2d2a24] text-editorial-subtle"
                                                style={{ background: `${color}08` }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-10 fade-in fade-in-d4">
                    <div className="w-16 h-px mx-auto bg-gradient-to-r from-transparent via-editorial-accent/20 to-transparent" />
                    <p className="text-[0.5rem] tracking-[0.2em] uppercase text-editorial-faint mt-4">
                        {character.name} &middot; famile.xyz
                    </p>
                </div>
            </div>
        </div>
    );
}
