import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter, Route, Routes } from "react-router";
import { lazy, Suspense } from "react";
import { ConnectionBanner } from "./components/ConnectionBanner";

// Lazy load routes
const Overview = lazy(() => import("./routes/overview"));
const Home = lazy(() => import("./routes/home"));
const Dashboard = lazy(() => import("./routes/dashboard"));
const Chat = lazy(() => import("./routes/chat"));

// Loading component for suspense
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
);

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
                <ConnectionBanner />
                <BrowserRouter>
                    <TooltipProvider delayDuration={0}>
                        <SidebarProvider>
                            <AppSidebar />
                            <SidebarInset>
                                <div
                                    className="flex flex-1 flex-col gap-4 size-full container"
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
