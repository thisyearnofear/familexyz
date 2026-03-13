import { useQuery } from "@tanstack/react-query";
import info from "@/lib/info.json";
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
import { NavLink, useLocation } from "react-router";
import type { UUID } from "@elizaos/core";
import { Book, Cog, Home, MessageSquareQuote } from "lucide-react";
import ConnectionStatus from "./connection-status";
import { useAgentInsights } from "@/hooks/useAgentInsights";

export function AppSidebar() {
    const location = useLocation();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.data?.agents;
    const { insights } = useAgentInsights();

    return (
        <Sidebar aria-label="Main navigation">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/">
                                <div className="flex items-center justify-center size-7">
                                    <div className="flex items-center justify-center size-7 text-2xl">
                                        👨‍👩‍👧‍👦
                                    </div>
                                </div>

                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        FamilyXYZ
                                    </span>
                                    <span className="">v{info?.version}</span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {/* Dashboard links */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <NavLink to="/dashboard">
                            <SidebarMenuButton>
                                <Home className="h-5 w-5 mr-2" />
                                Dashboard
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavLink to="/chat/wisdom-agent?protocol=ag-ui">
                            <SidebarMenuButton isActive={location.search.includes("protocol=ag-ui")}>
                                <MessageSquareQuote className="h-5 w-5 mr-2 text-purple-600" />
                                <span className="font-medium text-purple-900 dark:text-purple-100">Protocol Chat</span>
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-bold uppercase">New</span>
                            </SidebarMenuButton>
                        </NavLink>
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
                                        ),
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {agents?.map(
                                        (agent: { id: UUID; name: string }) => {
                                            // Map agent names to emojis
                                            const agentEmojis: { [key: string]: string } = {
                                                "wisdom": "🧠",
                                                "intimacy": "💖",
                                                "presence": "🧘",
                                                "bridge": "👵👦",
                                                "growth": "🌱"
                                            };

                                            const agentName = agent.name.toLowerCase();
                                            const emoji = agentEmojis[agentName] || "🤖";

                                            // Show notification dot only when agent has real insights from the backend
                                            const agentInsight = insights.find(i => 
                                                i.agentId === agent.id || i.agentName.toLowerCase() === agentName
                                            );
                                            const hasNotification = !!agentInsight;

                                            return (
                                                <SidebarMenuItem key={agent.id} className="mb-3">
                                                    <NavLink
                                                        to={`/chat/${agent.id}`}
                                                    >
                                                        <SidebarMenuButton
                                                            isActive={location.pathname.includes(
                                                                agent.id,
                                                            )}
                                                            className="relative py-3 h-auto"
                                                        >
                                                            <div className="relative flex-shrink-0">
                                                                <span className="text-lg">{emoji}</span>
                                                                {hasNotification && (
                                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full border border-white animate-pulse" />
                                                                )}
                                                            </div>
                                                            <span className="flex-1">
                                                                {agent.name}
                                                            </span>
                                                            {hasNotification && (
                                                                <span className="ml-auto flex-shrink-0">
                                                                    <span className="inline-flex items-center justify-center w-2 h-2 bg-purple-500 rounded-full" />
                                                                </span>
                                                            )}
                                                        </SidebarMenuButton>
                                                    </NavLink>
                                                </SidebarMenuItem>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <NavLink to="/docs" target="_blank">
                            <SidebarMenuButton>
                                <Book className="h-4 w-4" /> Documentation
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            <Cog className="h-4 w-4" /> Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <ConnectionStatus />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
