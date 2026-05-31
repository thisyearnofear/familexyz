'use client';

import { useQuery } from "@tanstack/react-query";
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
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api";
import { Book, Cog, Home, Beaker, ExternalLink, Send, Hash, ShieldCheck } from "lucide-react";

const info = { version: "0.1.0" };

const agentEmojis: Record<string, string> = {
    wisdom: "\uD83E\uDDE0",
    intimacy: "\uD83D\uDC96",
    presence: "\uD83E\uDDD8",
    bridge: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66",
    growth: "\uD83C\uDF31",
};

export function AppSidebar() {
    const pathname = usePathname();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

    return (
        <Sidebar aria-label="Main navigation">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex items-center justify-center size-7">
                                    <div className="flex items-center justify-center size-7 text-2xl">
                                        👨‍👩‍👧‍👦
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        FamilyXYZ
                                    </span>
                                    <span>v{info?.version}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/dashboard">
                            <SidebarMenuButton
                                isActive={pathname === "/dashboard"}
                            >
                                <Home className="h-5 w-5 mr-2" />
                                Dashboard
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/hackathon">
                            <SidebarMenuButton
                                isActive={pathname === "/hackathon"}
                            >
                                <Beaker className="h-5 w-5 mr-2" />
                                <span>Hackathon</span>
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-bold uppercase">
                                    New
                                </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Agents</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {query?.isPending ? (
                                <div>
                                    {Array.from({ length: 5 }).map(
                                        (_, index) => (
                                            <SidebarMenuItem key={index}>
                                                <SidebarMenuSkeleton />
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {(agents as any[])?.map(
                                        (agent: {
                                            id: string;
                                            name: string;
                                        }) => {
                                            const agentName =
                                                agent.name.toLowerCase();
                                            const emoji =
                                                agentEmojis[agentName] || "🤖";

                                            return (
                                                <SidebarMenuItem
                                                    key={agent.id}
                                                    className="mb-3"
                                                >
                                                    <Link
                                                        href={`/chat/${agent.id}`}
                                                    >
                                                        <SidebarMenuButton
                                                            isActive={pathname.includes(
                                                                agent.id
                                                            )}
                                                            className="relative py-3 h-auto"
                                                        >
                                                            <span className="text-lg">
                                                                {emoji}
                                                            </span>
                                                            <span className="flex-1">
                                                                {agent.name}
                                                            </span>
                                                        </SidebarMenuButton>
                                                    </Link>
                                                </SidebarMenuItem>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="space-y-1 pb-3">
                <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground">
                    Connect
                </SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://t.me/familexyzbot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <Send className="h-4 w-4 text-blue-400" />
                                <span>Telegram Bot</span>
                                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://hashscan.io/testnet/topic/0.0.7304500"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <ShieldCheck className="h-4 w-4 text-green-400" />
                                <span>Hedera HCS Logs</span>
                                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a
                                href="https://hashscan.io/testnet/token/0.0.7304501"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <Hash className="h-4 w-4 text-amber-400" />
                                <span>$FAM Token</span>
                                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href="/docs" target="_blank">
                                <Book className="h-4 w-4" /> Documentation
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            <Cog className="h-4 w-4" /> Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
