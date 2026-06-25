'use client';

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatSkeleton } from "@/components/ui/skeleton";

function MobileHeader() {
    const isMobile = useIsMobile();
    if (!isMobile) return null;
    return (
        <header className="sticky top-0 z-40 w-full border-b border-editorial-subtle/10 bg-editorial-bg/95 backdrop-blur">
            <div className="flex h-12 items-center px-4 gap-3">
                <SidebarTrigger />
                <span className="text-sm text-editorial-cream">Chat</span>
            </div>
        </header>
    );
}

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const agentId = params.agentId as string;
    const context = searchParams.get("context") || undefined;
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Brief delay so skeleton shows before chat loads
        const t = setTimeout(() => setReady(true), 120);
        return () => clearTimeout(t);
    }, []);

    if (!agentId) return <div className="min-h-screen bg-editorial-bg text-editorial-muted p-8">No agent selected.</div>;

    return (
        <div className="dark antialiased" style={{ colorScheme: "dark" }}>
            <TooltipProvider delayDuration={0}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="h-screen">
                        <MobileHeader />
                        <div className="flex-1 h-full">
                            {ready ? (
                                <ChatInterface initialAgentId={agentId} context={context} />
                            ) : (
                                <ChatSkeleton />
                            )}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </div>
    );
}
