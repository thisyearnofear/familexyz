import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    Zap,
    Target,
    MessageCircle,
    TrendingUp,
    Brain,
    Users,
    Leaf,
    Rocket,
    Check,
} from "lucide-react";
import { getAgentColorClasses, familyTheme } from "@/lib/theme";

interface AgentCardProps {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    purpose: string;
    benefits: string[];
    onClick?: () => void;
    isSelected?: boolean;
    className?: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({
    id,
    name,
    icon,
    description,
    purpose,
    benefits,
    onClick,
    isSelected = false,
    className = "",
}) => {
    const colorClasses = getAgentColorClasses(name);

    return (
        <Card
            className={`
        ${familyTheme.transitions.interactive}
        ${
            isSelected
                ? `ring-4 ${colorClasses.ring} bg-gradient-to-br ${colorClasses.primary} text-white cursor-default shadow-lg transform scale-[1.02]`
                : `border-2 ${colorClasses.border} cursor-pointer hover:shadow-xl hover:transform hover:scale-105 active:scale-95`
        }
        group relative overflow-hidden
        ${className}
      `}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${name} agent card, ${isSelected ? "selected" : "not selected"}`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick && onClick();
                }
            }}
        >
            {/* Enhanced gradient background */}
            <div
                className={`
        absolute inset-0 bg-gradient-to-br ${colorClasses.primary}
        opacity-10 group-hover:opacity-20 transition-opacity duration-300
      `}
                aria-hidden="true"
            />

            <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div
                            className={`
              transform group-hover:scale-125 group-hover:rotate-6
              transition-all duration-300 ${isSelected ? "text-white" : colorClasses.accent}
            `}
                        >
                            {icon}
                        </div>
                        <div>
                            <h3
                                className={`
                font-bold text-lg ${isSelected ? "text-white" : "text-gray-900"}
                group-hover:text-white transition-colors duration-300
              `}
                            >
                                {name} Agent
                            </h3>
                            <p
                                className={`
                text-sm ${isSelected ? "text-white/90" : "text-gray-700"}
              `}
                            >
                                {description}
                            </p>
                        </div>
                    </div>

                    {isSelected && (
                        <div
                            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              bg-white text-${colorClasses.bg.replace("bg-", "")}-600
              animate-bounce shadow-lg
            `}
                            aria-label="Selected"
                        >
                            <Check className="w-4 h-4 text-purple-600" />
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <p
                        className={`
            text-sm leading-relaxed ${isSelected ? "text-white/90" : "text-gray-800"}
          `}
                    >
                        {purpose}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {benefits.slice(0, 3).map((benefit, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className={`
                px-3 py-1 text-xs font-medium shadow-sm
                ${isSelected ? "bg-white/20 text-white" : colorClasses.secondary}
                hover:scale-105 transition-transform duration-200
              `}
                        >
                            {benefit}
                        </Badge>
                    ))}
                    {benefits.length > 3 && (
                        <Badge
                            variant="outline"
                            className={`
                px-3 py-1 text-xs font-medium border-2 ${colorClasses.border}
                ${isSelected ? "text-white/80 border-white/30" : "text-gray-700"}
              `}
                        >
                            +{benefits.length - 3} more
                        </Badge>
                    )}
                </div>
            </CardContent>

            {/* Animated border accent */}
            <div
                className={`
        absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses.primary}
        transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300
      `}
                aria-hidden="true"
            />
            <div
                className={`
        absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses.primary}
        transform translate-y-full group-hover:translate-y-0 transition-transform duration-300
      `}
                aria-hidden="true"
            />
        </Card>
    );
};

// Enhanced Agent Grid for consistent layout
interface AgentGridProps {
    agents: AgentCardProps[];
    onAgentSelect: (agentId: string) => void;
    selectedAgentId?: string;
    className?: string;
}

export const AgentGrid: React.FC<AgentGridProps> = ({
    agents,
    onAgentSelect,
    selectedAgentId,
    className = "",
}) => {
    return (
        <div
            className={`
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5
      gap-4
      ${className}
    `}
        >
            {agents.map((agent) => (
                <AgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    icon={agent.icon}
                    description={agent.description}
                    purpose={agent.purpose}
                    benefits={agent.benefits}
                    onClick={() => onAgentSelect(agent.id)}
                    isSelected={selectedAgentId === agent.id}
                />
            ))}
        </div>
    );
};

// Specialized family agent cards
const FamilyAgentIcons = {
    Wisdom: <Brain className="w-6 h-6" />,
    Intimacy: <Heart className="w-6 h-6" />,
    GenerationalBridge: <Users className="w-6 h-6" />,
    Presence: <Leaf className="w-6 h-6" />,
    Growth: <Rocket className="w-6 h-6" />,
    Default: <Users className="w-6 h-6" />,
};

export const FamilyAgentCard: React.FC<
    Omit<AgentCardProps, "icon"> & { type?: string }
> = ({ type = "default", ...props }) => {
    const icon =
        FamilyAgentIcons[type as keyof typeof FamilyAgentIcons] ||
        FamilyAgentIcons.Default;

    return <AgentCard {...props} icon={icon} />;
};
