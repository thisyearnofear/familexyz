'use client';

import { useState } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { EnhancedFamilyDashboard } from "@/components/dashboard/EnhancedFamilyDashboard";

function MobileHeader() {
    const isMobile = useIsMobile();
    if (!isMobile) return null;
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                    <span className="font-semibold text-lg">FamilyXYZ</span>
                </div>
            </div>
        </header>
    );
}

export default function DashboardPage() {
    return (
        <div
            className="dark antialiased"
            style={{ colorScheme: "dark" }}
            role="application"
            aria-label="Family Connection Platform"
        >
            <TooltipProvider delayDuration={0}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <MobileHeader />
                        <div
                            className="flex flex-1 flex-col gap-4 size-full container px-4 sm:px-6 py-4"
                            role="main"
                            aria-label="Main content"
                        >
                            <EnhancedFamilyDashboard />
                        </div>
                    </SidebarInset>
                </SidebarProvider>
                <Toaster />
            </TooltipProvider>
        </div>
    );
}
