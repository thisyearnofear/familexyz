import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Settings, TrendingUp, LayoutDashboard, Target, Bot, MoreHorizontal } from "lucide-react";

export type DashboardTab = "overview" | "insights" | "activities" | "social" | "members" | "agents" | "settings";

interface TabNavigationProps {
    activeTab: DashboardTab;
    onTabChange: (tab: DashboardTab) => void;
    variant?: "top" | "bottom";
}

const allTabs = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard, primary: true },
    { id: "insights" as const, label: "Insights", icon: TrendingUp, primary: true },
    { id: "agents" as const, label: "Agents", icon: Bot, primary: true },
    { id: "members" as const, label: "Members", icon: Users, primary: false },
    { id: "activities" as const, label: "Activities", icon: Target, primary: false },
    { id: "social" as const, label: "Social", icon: MessageCircle, primary: false },
    { id: "settings" as const, label: "Settings", icon: Settings, primary: true },
];

const primaryTabs = allTabs.filter(t => t.primary);
const secondaryTabs = allTabs.filter(t => !t.primary);

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, variant = "top" }) => {
    const [showMore, setShowMore] = useState(false);

    // Desktop: horizontal row with all tabs
    if (variant === "top") {
        return (
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {allTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <Button
                            key={tab.id}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                relative whitespace-nowrap transition-all duration-200 shrink-0
                                ${isActive
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }
                            `}
                        >
                            <Icon className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </Button>
                    );
                })}
            </div>
        );
    }

    // Mobile: fixed bottom bar with primary tabs + More
    const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);

    return (
        <>
            {/* More menu overlay */}
            {showMore && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setShowMore(false)}
                />
            )}
            {showMore && (
                <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border p-2 flex gap-2 justify-center">
                    {secondaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <Button
                                key={tab.id}
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                onClick={() => { onTabChange(tab.id); setShowMore(false); }}
                                className={isActive ? "bg-purple-600 text-white" : "text-muted-foreground"}
                            >
                                <Icon className="w-4 h-4 mr-1.5" />
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
            )}

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border safe-area-pb">
                <div className="flex items-center justify-around h-14 px-1">
                    {primaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { onTabChange(tab.id); setShowMore(false); }}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                                    isActive ? "text-purple-400" : "text-muted-foreground"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                    {/* More button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                            isSecondaryActive || showMore ? "text-purple-400" : "text-muted-foreground"
                        }`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
};
