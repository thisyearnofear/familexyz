'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ExternalLink, Send, ShieldCheck, Hash, Sun, Home } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { fontVariables } from "@/lib/fonts";

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar aria-label="Main navigation" className={fontVariables}>
            <div className="h-px mx-3 border-b" />

            <SidebarHeader className="pb-2">
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

            <div className="mx-3 h-px bg-border" />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[0.55rem] tracking-[0.2em] uppercase text-editorial-faint px-3 pb-1">
                        Agents
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {AGENTS.map((agent) => {
                                const isActive = pathname.includes(agent.id);
                                return (
                                    <SidebarMenuItem key={agent.id}>
                                        <Link href={`/chat/${agent.id}`}>
                                            <SidebarMenuButton
                                                isActive={isActive}
                                                className="relative py-2.5 h-auto group"
                                            >
                                                {isActive && (
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                                                        style={{ backgroundColor: agent.color }}
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

            <div className="mx-3 h-px bg-border" />

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
            </SidebarFooter>
        </Sidebar>
    );
}
