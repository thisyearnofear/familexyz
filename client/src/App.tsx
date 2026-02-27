import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter, Route, Routes } from "react-router";
import { lazy, Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FamilyLogo } from "@/components/FamilyLogo";
import { cn } from "@/lib/utils";

// Lazy load routes
const Overview = lazy(() => import("./routes/overview"));
const Home = lazy(() => import("./routes/home"));
const Dashboard = lazy(() => import("./routes/dashboard"));
const Chat = lazy(() => import("./routes/chat"));

// Loading component for suspense
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
    </div>
);

// Mobile header component - visible only on mobile devices
const MobileHeader = () => {
    const isMobile = useIsMobile();
    const { openMobile, setOpenMobile } = useSidebar();

    if (!isMobile) return null;

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
                <button
                    onClick={() => setOpenMobile(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 shrink-0"
                    aria-label="Open menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                    >
                        <line x1="4" x2="20" y1="12" y2="12" />
                        <line x1="4" x2="20" y1="6" y2="6" />
                        <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <FamilyLogo size="sm" className="w-8 h-8" />
                    <span className="font-semibold text-lg">FamilyXYZ</span>
                </div>
            </div>
        </header>
    );
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div
                className="dark antialiased"
                style={{
                    colorScheme: "dark",
                }}
                role="application"
                aria-label="Family Connection Platform"
            >
                <BrowserRouter>
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
                                    <Suspense fallback={<LoadingSpinner />}>
                                        <Routes>
                                            <Route
                                                path="/"
                                                element={<Home />}
                                            />
                                            <Route
                                                path="/dashboard"
                                                element={<Dashboard />}
                                            />
                                            <Route
                                                path="chat/:agentId"
                                                element={<Chat />}
                                            />
                                            <Route
                                                path="settings/:agentId"
                                                element={<Overview />}
                                            />
                                        </Routes>
                                    </Suspense>
                                </div>
                            </SidebarInset>
                        </SidebarProvider>
                        <Toaster />
                    </TooltipProvider>
                </BrowserRouter>
            </div>
        </QueryClientProvider>
    );
}

export default App;
