import React from "react";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Settings, TrendingUp, LayoutDashboard, Target, Heart } from "lucide-react";

interface TabNavigationProps {
    activeTab: "overview" | "insights" | "activities" | "social" | "members" | "bond-score" | "settings";
    onTabChange: (tab: "overview" | "insights" | "activities" | "social" | "members" | "bond-score" | "settings") => void;
}

const tabs = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "insights" as const, label: "Insights", icon: TrendingUp },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "activities" as const, label: "Activities", icon: Target },
    { id: "social" as const, label: "Social", icon: MessageCircle },
    { id: "bond-score" as const, label: "Bond Score", icon: Heart },
    { id: "settings" as const, label: "Settings", icon: Settings },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => {
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
};
