'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Book, Cog, Home, Beaker, ExternalLink, Send, ShieldCheck, Hash, Sun } from "lucide-react";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const AGENT_COLORS: Record<string, string> = {
    wisdom: "#6d28d9",
    intimacy: "#db2777",
    presence: "#0d9488",
    bridge: "#2563eb",
    growth: "#d97706",
};

const agents = [
    { id: "wisdom", name: "Wisdom", emoji: "\uD83E\uDDE0" },
    { id: "intimacy", name: "Intimacy", emoji: "\uD83D\uDC96" },
    { id: "presence", name: "Presence", emoji: "\uD83E\uDDD8" },
    { id: "bridge", name: "Bridge", emoji: "\uD83E\uDDD3" },
    { id: "growth", name: "Growth", emoji: "\uD83C\uDF31" },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar aria-label="Main navigation" className={`${playfair.variable}`}>
            {/* Warm accent line at top */}
            <div className="h-px mx-3 bg-gradient-to-r from-transparent via-editorial-accent/30 to-transparent" />

            <SidebarHeader className="pb-2">
                {/* Brand */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex items-center justify-center size-8 rounded-lg bg-editorial-accent/10 border border-editorial-accent/20">
                                    <span className="text-lg">👨‍👩‍👧‍👦</span>
                                </div>
                                <div className="flex flex-col gap-0 leading-none">
                                    <span className="font-[family-name:var(--font-playfair)] text-base font-bold tracking-[-0.01em] text-editorial-cream">
                                        famile.xyz
                                    </span>
                                    <span className="text-[0.55rem] tracking-[0.15em] uppercase text-editorial-subtle">
                                        Daily Council
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Nav items */}
                <SidebarMenu className="mt-3">
                    <SidebarMenuItem>
                        <Link href="/">
                            <SidebarMenuButton
                                isActive={pathname === "/"}
                                className="text-[0.65rem] tracking-[0.1em] uppercase"
                            >
                                <Sun className="h-3.5 w-3.5 mr-2" />
                                Today&apos;s Council
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/dashboard">
                            <SidebarMenuButton
                                isActive={pathname === "/dashboard"}
                                className="text-[0.65rem] tracking-[0.1em] uppercase"
                            >
                                <Home className="h-3.5 w-3.5 mr-2" />
                                Dashboard
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-editorial-accent/10 to-transparent" />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint px-3 pb-1">
                        Agents
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {agents.map((agent) => {
                                const color = AGENT_COLORS[agent.id] || "#c4542b";
                                const isActive = pathname.includes(agent.id);
                                return (
                                    <SidebarMenuItem key={agent.id}>
                                        <Link href={`/chat/${agent.id}`}>
                                            <SidebarMenuButton
                                                isActive={isActive}
                                                className="relative py-2.5 h-auto group"
                                            >
                                                {/* Active indicator */}
                                                {isActive && (
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )}
                                                <span className="text-base ml-1">
                                                    {agent.emoji}
                                                </span>
                                                <span className="flex-1 text-sm font-[family-name:var(--font-playfair)]">
                                                    {agent.name}
                                                </span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-editorial-accent/10 to-transparent" />

            <SidebarFooter className="space-y-1 pb-4 pt-2">
                <p className="px-3 text-[0.5rem] tracking-[0.2em] uppercase text-editorial-faint">
                    Connect
                </p>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://t.me/familexyzbot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs"
                            >
                                <Send className="h-3.5 w-3.5 text-blue-400/70" />
                                <span>Telegram Bot</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-auto text-editorial-faint" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://hashscan.io/testnet/topic/0.0.7304500"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs"
                            >
                                <ShieldCheck className="h-3.5 w-3.5 text-green-400/70" />
                                <span>Hedera HCS Logs</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-auto text-editorial-faint" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://hashscan.io/testnet/token/0.0.7304501"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs"
                            >
                                <Hash className="h-3.5 w-3.5 text-amber-400/70" />
                                <span>$FAM Token</span>
                                <ExternalLink className="h-2.5 w-2.5 ml-auto text-editorial-faint" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mx-3 h-px bg-gradient-to-r from-transparent via-editorial-accent/10 to-transparent my-1" />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href="/docs" target="_blank" className="text-xs">
                                <Book className="h-3.5 w-3.5" /> Documentation
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/hackathon" className="text-xs">
                                <Beaker className="h-3.5 w-3.5" /> Dev Lab
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled className="text-xs">
                            <Cog className="h-3.5 w-3.5" /> Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
