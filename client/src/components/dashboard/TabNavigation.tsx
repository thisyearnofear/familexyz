import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, MessageCircle, Settings, TrendingUp, Heart } from "lucide-react";

interface TabNavigationProps {
    activeTab: "overview" | "insights" | "agents" | "activities" | "social" | "members" | "settings";
    onTabChange: (tab: "overview" | "insights" | "agents" | "activities" | "social" | "members" | "settings") => void;
}

const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "insights" as const, label: "Insights", icon: TrendingUp },
    { id: "agents" as const, label: "AI Agents", icon: Heart },
    { id: "members" as const, label: "Members", icon: Users },
    { id: "activities" as const, label: "Activities", icon: MessageCircle },
    { id: "social" as const, label: "Social", icon: MessageCircle },
    { id: "settings" as const, label: "Settings", icon: Settings },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                            relative whitespace-nowrap transition-all
                            ${isActive
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }
                        `}
                    >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}

                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-purple-600 rounded-md -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Button>
                );
            })}
        </div>
    );
};
