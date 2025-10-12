import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChatInterface } from "./ChatInterface";
import { PlatformIntegration } from "./platform/PlatformIntegration";
import { FamilyLogo } from "./FamilyLogo";
import { apiClient } from "@/lib/api";
import { telegramIntegration } from "@/services/telegramIntegration";
import type { FamilyStats } from "@/types/family";

import {
    MessageCircle,
    TrendingUp,
    ChevronRight,
    ChevronDown,
    Heart,
    Zap,
    Target,
    Calendar,
    BarChart3,
    Smartphone,
    Users,
    Settings,
} from "lucide-react";

// Enhanced agent metadata with more descriptive information for better user understanding
const agentMetadata: Record<
    string,
    { icon: string; color: string; description: string; shortName?: string; purpose: string; benefits: string[] }
> = {
    Wisdom: {
        icon: "🧠",
        color: "from-purple-500 to-purple-600",
        description: "Emotional guidance",
        shortName: "Wisdom",
        purpose: "Provides life lessons and philosophical insights to help your family navigate complex emotions and decisions",
        benefits: [
            "Shares timeless wisdom from diverse cultures and philosophies",
            "Helps resolve family conflicts through thoughtful reflection",
            "Guides decision-making with deep emotional intelligence"
        ]
    },
    Intimacy: {
        icon: "💑",
        color: "from-pink-500 to-pink-600",
        description: "Relationship coaching",
        shortName: "Intimacy",
        purpose: "Strengthens emotional bonds between family members through guided conversations and activities",
        benefits: [
            "Facilitates deeper, more meaningful family conversations",
            "Helps family members understand each other's emotional needs",
            "Provides exercises to build trust and vulnerability"
        ]
    },
    GenerationalBridge: {
        icon: "👵👦",
        color: "from-blue-500 to-blue-600",
        description: "Cross-generational",
        shortName: "Bridge",
        purpose: "Connects different generations in your family by finding common ground and shared experiences",
        benefits: [
            "Translates communication styles between age groups",
            "Shares stories that resonate across generations",
            "Creates activities that bring grandparents, parents, and children together"
        ]
    },
    Presence: {
        icon: "🧘",
        color: "from-green-500 to-green-600",
        description: "Mindful wellness",
        shortName: "Presence",
        purpose: "Promotes mindful awareness and quality time together as a family",
        benefits: [
            "Guides phone-free family moments",
            "Teaches mindfulness techniques for stress reduction",
            "Helps create sacred spaces for family connection"
        ]
    },
    Growth: {
        icon: "🚀",
        color: "from-orange-500 to-orange-600",
        description: "Family challenges",
        shortName: "Growth",
        purpose: "Encourages personal and collective family development through engaging challenges",
        benefits: [
            "Sets achievable family goals and tracks progress",
            "Creates friendly competition to motivate positive habits",
            "Celebrates milestones in family development journey"
        ]
    },
};

interface ModularDashboardProps {
    onAgentSelect?: (agentId: string) => void;
}

export const ModularDashboard: React.FC<ModularDashboardProps> = ({
    onAgentSelect,
}) => {
    const [activeView, setActiveView] = useState<
        "overview" | "chat" | "insights" | "platforms"
    >("overview");
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["quick-access"]),
    );
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [, setIsLoading] = useState(false);

    const { data: familyStats } = useQuery<FamilyStats>({
        queryKey: ["familyStats"],
        queryFn: apiClient.getFamilyStats,
    });

    const { data: agentsData } = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    // Create dynamic agent quick access from server data with enhanced information
    const agentQuickAccess =
        agentsData?.data?.agents?.map((agent: any) => ({
            id: agent.id,
            name: agentMetadata[agent.name]?.shortName || agent.name,
            icon: agentMetadata[agent.name]?.icon || "🤖",
            color:
                agentMetadata[agent.name]?.color || "from-gray-500 to-gray-600",
            description:
                agentMetadata[agent.name]?.description || "Family Agent",
            purpose: agentMetadata[agent.name]?.purpose || "Helps strengthen family bonds",
            benefits: agentMetadata[agent.name]?.benefits || ["Supports family growth and connection"],
        })) || [];

    // Platform integration handlers
    const handlePlatformConnect = async (platformId: string) => {
        setIsLoading(true);
        try {
            if (platformId === "telegram") {
                const status = await telegramIntegration.getStatus();
                if (status.isConnected) {
                    alert(
                        "Telegram bot is already connected! Check your family group.",
                    );
                } else {
                    // Show setup instructions instead of attempting direct connection
                    alert(
                        "Telegram Integration Setup:\n\n1. Contact your family admin for bot token\n2. Configure bot in family settings\n3. Add bot to your family group\n4. Type /start to activate",
                    );
                }
            }
        } catch (error) {
            console.error("Platform connection error:", error);
            alert("Failed to connect platform. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlatformConfigure = async (platformId: string) => {
        if (platformId === "telegram") {
            try {
                const familyGroups =
                    await telegramIntegration.getFamilyGroups();
                // Open configuration modal or navigate to settings
                console.log("Current Telegram groups:", familyGroups);
                alert("Telegram configuration panel would open here.");
            } catch (error) {
                console.error("Configuration error:", error);
                alert(
                    "Failed to load configuration. Please ensure Telegram is connected.",
                );
            }
        }
    };

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgent(agentId);
        setActiveView("chat");
        onAgentSelect?.(agentId);
    };

    // Settings and user management handlers
    const handleUserManagement = () => {
        alert(
            "User management panel would open here.\n\nFeatures:\n- Add/remove family members\n- Set permissions\n- Manage agent access",
        );
    };

    const handleSettings = () => {
        alert(
            "Settings panel would open here.\n\nFeatures:\n- Notification preferences\n- Privacy settings\n- Agent configurations\n- Platform integrations",
        );
    };

    // Main navigation tabs
    const navigationTabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "chat", label: "Chat", icon: MessageCircle },
        { id: "insights", label: "Insights", icon: TrendingUp },
        { id: "platforms", label: "Platforms", icon: Smartphone },
    ];

    // Load initial data
    useEffect(() => {
        // Any initialization logic can go here
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Simplified Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FamilyLogo size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Family Dashboard
                            </h1>
                            <p className="text-sm text-gray-600">
                                Strengthen your family bonds with AI guidance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUserManagement}
                            className="flex items-center space-x-1"
                        >
                            <Users className="w-4 h-4" />
                            <span>Users</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSettings}
                            className="flex items-center space-x-1"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Button>
                        <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            All Agents Online
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-100 px-4">
                <div className="flex space-x-1">
                    {navigationTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                                    activeView === tab.id
                                        ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-4 space-y-6">
                {activeView === "overview" && (
                    <div className="space-y-6">
                        {/* Quick Agent Access - Always Visible */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                        <span>Family Agents</span>
                                    </CardTitle>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {agentQuickAccess.length} Specialized Agents
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Five AI specialists working together to strengthen your family across generations
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {agentQuickAccess.map((agent) => (
                                        <div 
                                            key={agent.id}
                                            className={`rounded-xl bg-gradient-to-br ${agent.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
                                            onClick={() => handleAgentSelect(agent.id)}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-2xl">
                                                        {agent.icon}
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs font-semibold">
                                                        Click to Chat
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="text-sm font-bold">
                                                        {agent.name} Agent
                                                    </div>
                                                    <div className="text-xs opacity-90 mt-1">
                                                        {agent.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 rounded-b-xl p-3">
                                                <div className="text-xs font-medium truncate">
                                                    {agent.purpose}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Agent Benefits Summary */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                        How Our Agents Work Together
                                    </h3>
                                    <p className="text-xs text-blue-700">
                                        Each agent specializes in a different aspect of family connection. 
                                        They collaborate behind the scenes to provide comprehensive guidance 
                                        that strengthens your family bonds across generations.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Family Connection Strength - Enhanced Metrics */}
                        <Card>
                            <CardHeader className="pb-3">
                                <button
                                    onClick={() =>
                                        toggleSection("health-score")
                                    }
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <CardTitle className="flex items-center space-x-2">
                                        <Heart className="w-5 h-5 text-red-500" />
                                        <span>Family Connection Strength</span>
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-green-50 text-green-700"
                                        >
                                            {familyStats?.healthScore || 0}%
                                        </Badge>
                                        {expandedSections.has(
                                            "health-score",
                                        ) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                                {expandedSections.has("health-score") && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Measures how well your family connects across five dimensions. Higher scores indicate stronger bonds.
                                    </p>
                                )}
                            </CardHeader>
                            {expandedSections.has("health-score") && (
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Overall Score Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Overall Strength</span>
                                                <span className="font-bold text-green-600">{familyStats?.healthScore || 0}%</span>
                                            </div>
                                            <Progress
                                                value={familyStats?.healthScore || 0}
                                                className="h-3"
                                            />
                                            <div className="text-xs text-gray-500">
                                                {familyStats?.healthScore >= 80 
                                                    ? "🎉 Excellent! Your family bonds are strong." 
                                                    : familyStats?.healthScore >= 60 
                                                    ? "👍 Good progress! Keep strengthening connections." 
                                                    : "💪 Opportunity to grow your family bonds."}
                                            </div>
                                        </div>

                                        {/* Dimension Scores with Agent Mapping */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-lg">💑</div>
                                                    <div>
                                                        <div className="font-semibold text-blue-700 text-sm">Intimacy</div>
                                                        <div className="text-xs text-blue-600">{familyStats?.intimacy?.affection || 0}%</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Emotional closeness and trust between family members
                                                </div>
                                                <div className="mt-1">
                                                    <Progress value={familyStats?.intimacy?.affection || 0} className="h-1.5" />
                                                </div>
                                            </div>

                                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-lg">🧘</div>
                                                    <div>
                                                        <div className="font-semibold text-green-700 text-sm">Presence</div>
                                                        <div className="text-xs text-green-600">{familyStats?.presence?.attention || 0}%</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Quality time and mindful attention together
                                                </div>
                                                <div className="mt-1">
                                                    <Progress value={familyStats?.presence?.attention || 0} className="h-1.5" />
                                                </div>
                                            </div>

                                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-lg">👵👦</div>
                                                    <div>
                                                        <div className="font-semibold text-purple-700 text-sm">Bridge</div>
                                                        <div className="text-xs text-purple-600">{familyStats?.generational?.bridge || 0}%</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Connection across different generations
                                                </div>
                                                <div className="mt-1">
                                                    <Progress value={familyStats?.generational?.bridge || 0} className="h-1.5" />
                                                </div>
                                            </div>

                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-lg">🚀</div>
                                                    <div>
                                                        <div className="font-semibold text-orange-700 text-sm">Growth</div>
                                                        <div className="text-xs text-orange-600">{familyStats?.growth?.growth || 0}%</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-600">
                                                    Personal and collective family development
                                                </div>
                                                <div className="mt-1">
                                                    <Progress value={familyStats?.growth?.growth || 0} className="h-1.5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Agent Connection Mapping */}
                                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <div className="text-indigo-600">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <div className="font-medium text-indigo-700 text-sm">
                                                    How Agents Strengthen Each Dimension
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                                <div className="text-center p-2 bg-white bg-opacity-50 rounded">
                                                    <div className="text-blue-600">💑</div>
                                                    <div className="font-medium">Intimacy</div>
                                                    <div className="text-gray-600">Wisdom</div>
                                                </div>
                                                <div className="text-center p-2 bg-white bg-opacity-50 rounded">
                                                    <div className="text-pink-600">💕</div>
                                                    <div className="font-medium">Love</div>
                                                    <div className="text-gray-600">Intimacy</div>
                                                </div>
                                                <div className="text-center p-2 bg-white bg-opacity-50 rounded">
                                                    <div className="text-purple-600">👵👦</div>
                                                    <div className="font-medium">Bridge</div>
                                                    <div className="text-gray-600">Bridge</div>
                                                </div>
                                                <div className="text-center p-2 bg-white bg-opacity-50 rounded">
                                                    <div className="text-green-600">🧘</div>
                                                    <div className="font-medium">Presence</div>
                                                    <div className="text-gray-600">Presence</div>
                                                </div>
                                                <div className="text-center p-2 bg-white bg-opacity-50 rounded">
                                                    <div className="text-orange-600">🚀</div>
                                                    <div className="font-medium">Growth</div>
                                                    <div className="text-gray-600">Growth</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Today's Family Activities - Enhanced Suggestions */}
                        <Card>
                            <CardHeader className="pb-3">
                                <button
                                    onClick={() => toggleSection("suggestions")}
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <CardTitle className="flex items-center space-x-2">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                        <span>Today's Family Activities</span>
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="secondary">3 Personalized</Badge>
                                        {expandedSections.has("suggestions") ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                                {expandedSections.has("suggestions") && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        AI-powered suggestions tailored to strengthen your family bonds today
                                    </p>
                                )}
                            </CardHeader>
                            {expandedSections.has("suggestions") && (
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                                            <div className="text-2xl">💬</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-blue-800 text-sm">
                                                    Family Check-in
                                                </div>
                                                <div className="text-xs text-blue-600 mt-1">
                                                    Ask each family member about their day
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                        5-10 mins
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                                        All Ages
                                                    </Badge>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2 text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                                                    onClick={() => console.log("Starting Family Check-in")}
                                                >
                                                    Start Activity
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                                            <div className="text-2xl">🎲</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-green-800 text-sm">
                                                    Game Night
                                                </div>
                                                <div className="text-xs text-green-600 mt-1">
                                                    Schedule 30 minutes of family fun
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                                        30 mins
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                                        Ages 6+
                                                    </Badge>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2 text-xs bg-white border-green-300 text-green-700 hover:bg-green-100"
                                                    onClick={() => console.log("Starting Game Night")}
                                                >
                                                    Plan Game Night
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                                            <div className="text-2xl">📱</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-purple-800 text-sm">
                                                    Digital Wellness
                                                </div>
                                                <div className="text-xs text-purple-600 mt-1">
                                                    Try a 15-minute phone-free conversation
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                                        15 mins
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                                                        Mindfulness
                                                    </Badge>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-2 text-xs bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
                                                    onClick={() => console.log("Starting Digital Wellness")}
                                                >
                                                    Begin Practice
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Suggestion Generator */}
                                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="text-indigo-600">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div className="font-medium text-indigo-800 text-sm">
                                                Want More Ideas?
                                            </div>
                                        </div>
                                        <p className="text-xs text-indigo-700 mb-3">
                                            Our AI agents analyze your family dynamics to suggest personalized activities.
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                            onClick={() => console.log("Generating more suggestions")}
                                        >
                                            Generate Personalized Suggestions
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                )}

                {activeView === "chat" && (
                    <div className="max-w-4xl mx-auto">
                        <ChatInterface
                            initialAgentId={selectedAgent || undefined}
                        />
                    </div>
                )}

                {activeView === "insights" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    <span>Family Insights</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Detailed insights coming soon...</p>
                                    <p className="text-sm mt-2">
                                        We're analyzing your family's
                                        interaction patterns
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeView === "platforms" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                    <span>Platform Integrations</span>
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    Connect your family agents across different
                                    platforms
                                </p>
                            </CardHeader>
                            <CardContent>
                                <PlatformIntegration
                                    onPlatformConnect={handlePlatformConnect}
                                    onPlatformConfigure={
                                        handlePlatformConfigure
                                    }
                                />

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-blue-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-900">
                                                Implementation Status
                                            </div>
                                            <div className="text-sm text-blue-700 mt-1">
                                                <strong>Telegram:</strong> Ready
                                                for testing - bot integration
                                                active
                                                <br />
                                                <strong>
                                                    Discord:
                                                </strong> In development -
                                                server templates ready
                                                <br />
                                                <strong>WhatsApp:</strong>{" "}
                                                Business API approval pending
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};
