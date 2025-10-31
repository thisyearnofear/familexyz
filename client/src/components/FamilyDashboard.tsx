import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { FamilyLogo } from "@/components/FamilyLogo";
import { ChatInterface } from "@/components/ChatInterface";
import { FamilyMetricsCards } from "@/components/family/FamilyMetricsCards";
import { FamilyRadarChart } from "@/components/family/FamilyRadarChart";
import { FamilyLineChart } from "@/components/family/FamilyLineChart";
import { FamilyConnectionRings } from "@/components/family/FamilyConnectionRings";
import { visualEffects, familyTheme } from "@/lib/visual-effects";
import {
  TrendingUp,
  Heart,
  Zap,
  Target,
  BarChart3,
  Users,
  Star,
  Trophy
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Enhanced agent metadata with more descriptive information
const agentMetadata: Record<
    string,
    { icon: string; color: string; description: string; shortName?: string; purpose: string; benefits: string[]; personality: string }
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
        ],
        personality: "Wise, empathetic, and deeply caring. Focuses on understanding the 'why' behind family dynamics."
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
        ],
        personality: "Warm, nurturing, and relationship-focused. Specializes in creating safe spaces for sharing."
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
        ],
        personality: "Storyteller, bridge-builder, and memory keeper. Connects past, present, and future."
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
        ],
        personality: "Calm, centered, and present-focused. Encourages living in the moment together."
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
        ],
        personality: "Motivational, achievement-oriented, and celebratory. Keeps the family moving forward."
    },
};

interface FamilyDashboardProps {
    onAgentSelect?: (agentId: string) => void;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
    onAgentSelect,
}) => {
    const [activeTab, setActiveTab] = useState<"overview" | "insights" | "agents" | "activities" | "history">("overview");
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    const { data: familyStats, isLoading: isFamilyStatsLoading } = useQuery({
        queryKey: ["familyStats"],
        queryFn: apiClient.getFamilyStats,
        refetchInterval: 10000, // Auto-refresh every 10 seconds
    });

    const { data: familyHistory, isLoading: isFamilyHistoryLoading } = useQuery({
        queryKey: ["familyHistory"],
        queryFn: () => apiClient.getFamilyHistory(),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const { data: agentsData } = useQuery({
        queryKey: ["agents"],
        queryFn: async () => {
            try {
                const response = await apiClient.getAgents();
                if (response && response.data && response.data.agents) {
                    return response.data;
                } else if (Array.isArray(response)) {
                    return { agents: response, total: response.length };
                } else if (response && Array.isArray(response.agents)) {
                    return response;
                } else {
                    return { agents: [], total: 0 };
                }
            } catch (error) {
                console.error("Failed to load agents:", error);
                return { agents: [], total: 0 };
            }
        },
        refetchInterval: 30000,
    });

    // Calculate previous health score from history
    const previousHealthScore = familyHistory?.timeline && familyHistory.timeline.length > 1
        ? familyHistory.timeline[familyHistory.timeline.length - 2]?.health
        : undefined;

    // Check if there's been improvement to show celebration
    useEffect(() => {
        if (familyStats?.healthScore && familyStats.healthScore > 75) {
            const hasImproved = familyStats.healthScore > (previousHealthScore || 0);
            if (hasImproved) {
                setShowCelebration(true);
                const timer = setTimeout(() => setShowCelebration(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [familyStats, previousHealthScore]);

    // Create dynamic agent quick access from server data
    const agentQuickAccess = agentsData?.agents?.map((agent: any) => ({
        id: agent.id,
        name: agentMetadata[agent.name]?.shortName || agent.name,
        icon: agentMetadata[agent.name]?.icon || "🤖",
        color: agentMetadata[agent.name]?.color || "from-gray-500 to-gray-600",
        description: agentMetadata[agent.name]?.description || "Family Agent",
        purpose: agentMetadata[agent.name]?.purpose || "Helps strengthen family bonds",
        benefits: agentMetadata[agent.name]?.benefits || ["Supports family growth and connection"],
        personality: agentMetadata[agent.name]?.personality || "Cares about your family's wellbeing."
    })) || [];

    // GoodDollar minimal state & queries
    const [gdAddress, setGdAddress] = useState<string>("");
    const {
        data: gdBalance,
        refetch: refetchGdBalance,
        isFetching: isFetchingGdBalance,
    } = useQuery({
        queryKey: ["gdBalance", gdAddress],
        queryFn: () => apiClient.getGDBalance(gdAddress),
        enabled: gdAddress.length > 0,
        refetchInterval: 30000,
    });
    const { data: gdStatus, refetch: refetchGdStatus } = useQuery({
        queryKey: ["gdStatus", gdAddress],
        queryFn: () => apiClient.getGDStatus(gdAddress),
        enabled: gdAddress.length > 0,
        refetchInterval: 60000,
    });
    const [claiming, setClaiming] = useState(false);
    const handleClaim = async () => {
        if (!gdAddress) return;
        setClaiming(true);
        try {
            await apiClient.claimGoodDollar(gdAddress);
            await Promise.all([refetchGdBalance(), refetchGdStatus()]);
        } catch (e) {
            console.error("Claim error", e);
        } finally {
            setClaiming(false);
        }
    };

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgent(agentId);
        setActiveTab("agents");
        onAgentSelect?.(agentId);
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "insights", label: "Insights", icon: Target },
        { id: "agents", label: "Agents", icon: Zap },
        { id: "activities", label: "Activities", icon: Heart },
        { id: "history", label: "History", icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Enhanced Header with Celebration */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <FamilyLogo size="lg" className="w-12 h-12" />
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                                    Family Connection Hub
                                </h1>
                                <p className="text-sm lg:text-base text-white/90 drop-shadow mt-1">
                                    Strengthening your family bonds with AI-powered guidance
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 self-start lg:self-auto">
                            <motion.div
                                className="flex items-center space-x-2"
                                animate={showCelebration ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                                    <Heart className="w-5 h-5 text-red-300" />
                                    <span className="font-semibold text-white">
                                        {familyStats?.healthScore || 0}%
                                    </span>
                                    <span className="text-xs text-white/90">Bond Strength</span>
                                </div>
                            </motion.div>

                            <Badge className="bg-green-500 text-white border-green-500">
                                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                <span>5 Agents Active</span>
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex overflow-x-auto py-4 -mx-6 px-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0 ${
                                        isActive
                                            ? "bg-purple-100 text-purple-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Celebration Animation */}
                <AnimatePresence>
                    {showCelebration && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.8 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-2xl shadow-2xl">
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                    >
                                        <Trophy className="w-16 h-16 mx-auto mb-4" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold mb-2">Great Job!</h3>
                                    <p className="text-lg">Your family bond strength has improved!</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overview Tab */}
                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Quick Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <FamilyMetricsCards stats={familyStats} isLoading={isFamilyStatsLoading} />
                            </div>

                            {/* Family Connection Visualization */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card variant="premium" className="border-0">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Zap className="w-5 h-5 text-purple-600" />
                                            <span>Family Connection Network</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center">
                                        <FamilyConnectionRings
                                            healthScore={familyStats?.healthScore}
                                            activeAgents={agentQuickAccess.map((a: any) => a.name)}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Agent Quick Access */}
                                <Card variant="gleam" className="border-0">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <span>Your Family AI Team</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-3">
                                            {agentQuickAccess.slice(0, 3).map((agent: any, index: number) => (
                                                <motion.div
                                                    key={agent.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <Button
                                                        variant="premium"
                                                        onClick={() => handleAgentSelect(agent.id)}
                                                        className="w-full justify-start p-4 h-auto"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="text-2xl">{agent.icon}</div>
                                                            <div className="text-left">
                                                                <div className="font-semibold">{agent.name}</div>
                                                                <div className="text-xs opacity-90">{agent.description}</div>
                                                            </div>
                                                        </div>
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                onClick={() => setActiveTab("agents")}
                                                className="mt-2"
                                            >
                                                View All Agents
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Family Health Radar Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FamilyRadarChart stats={familyStats} isLoading={isFamilyStatsLoading} />
                                <FamilyLineChart history={familyHistory} isLoading={isFamilyHistoryLoading} />
                            </div>

                            {/* GoodDollar Wallet & UBI Claim */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Star className="w-5 h-5 text-amber-500" />
                                        <span>GoodDollar</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-600">Wallet Address</label>
                                            <Input
                                                placeholder="0x..."
                                                value={gdAddress}
                                                onChange={(e) => setGdAddress(e.target.value.trim())}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Balance</span>
                                            <span className="text-sm font-medium">
                                                {isFetchingGdBalance ? "…" : gdBalance?.balance ?? "—"} {gdBalance?.symbol ?? "G$"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Daily Claim Eligible</span>
                                            <Badge variant={gdStatus?.canClaim ? "default" : "outline"}>
                                                {gdStatus?.canClaim ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button disabled={!gdAddress || claiming || !gdStatus?.canClaim} onClick={handleClaim}>
                                                {claiming ? "Claiming…" : "Claim UBI"}
                                            </Button>
                                            <Button variant="outline" onClick={() => { refetchGdBalance(); refetchGdStatus(); }}>
                                                Refresh
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Privacy-first: address is used only for on-demand checks; no storage.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Activities */}
                            <Card variant="premium">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Heart className="w-5 h-5 text-red-500" />
                                        <span>Today's Family Activities</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { emoji: "💬", title: "Family Check-in", desc: "Ask each family member about their day", color: "blue", variant: "gleam" as const },
                                            { emoji: "🎯", title: "Weekly Goal", desc: "Set one family goal together", color: "green", variant: "premium" as const },
                                            { emoji: "📱", title: "Digital Break", desc: "30 minutes phone-free time", color: "purple", variant: "electric" as const }
                                        ].map((activity, index) => (
                                            <motion.div
                                                key={activity.title}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <Card variant={activity.variant} className="p-4 h-full">
                                                    <div className="text-center">
                                                        <motion.div
                                                            className="text-3xl mb-3"
                                                            animate={{ rotate: [0, 10, -10, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                                                        >
                                                            {activity.emoji}
                                                        </motion.div>
                                                        <div className="font-semibold mb-2">{activity.title}</div>
                                                        <p className="text-sm opacity-80 mb-3">{activity.desc}</p>
                                                        <Button
                                                            size="sm"
                                                            variant={activity.variant}
                                                            className="w-full"
                                                        >
                                                            Start Activity
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Insights Tab */}
                    {activeTab === "insights" && (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                        <span>Family Insights</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                            <h3 className="text-lg font-semibold text-purple-800 mb-2">Your Family's Strengths</h3>
                                            <p className="text-purple-700">Your family shows strong communication patterns and high emotional support.</p>
                                        </div>
                                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Growth Opportunity</h3>
                                            <p className="text-blue-700">Consider scheduling more cross-generational activities to strengthen inter-family bonds.</p>
                                        </div>
                                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                            <h3 className="text-lg font-semibold text-green-800 mb-2">Weekly Recommendation</h3>
                                            <p className="text-green-700">Try a "Family Mindfulness Minute" - one minute of shared breathing before dinner.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Agents Tab */}
                    {activeTab === "agents" && (
                        <motion.div
                            key="agents"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {agentQuickAccess.map((agent: any) => (
                                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center space-x-3">
                                            <div className={`text-2xl p-2 rounded-lg bg-gradient-to-r ${agent.color}`}>
                                                {agent.icon}
                                            </div>
                                            <div>
                                                <span className="text-lg">{agent.name}</span>
                                                <p className="text-sm font-normal text-gray-600">{agent.description}</p>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Purpose</h4>
                                                <p className="text-sm text-gray-600 mb-4">{agent.purpose}</p>
                                                <h4 className="font-semibold text-gray-800 mb-2">Personality</h4>
                                                <p className="text-sm text-gray-600">{agent.personality}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Benefits</h4>
                                                <ul className="space-y-1">
                                                    {agent.benefits.map((benefit: string, index: number) => (
                                                        <li key={index} className="flex items-start space-x-2">
                                                            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm text-gray-600">{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <Button
                                                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                    onClick={() => handleAgentSelect(agent.id)}
                                                >
                                                    Chat with {agent.name}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === "activities" && (
                        <motion.div
                            key="activities"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Heart className="w-5 h-5 text-red-500" />
                                        <span>Family Activity Suggestions</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[
                                            { title: "Story Sharing", emoji: "👵👦", time: "20 min", description: "Grandparents share childhood stories", difficulty: "Easy" },
                                            { title: "Mindful Dinner", emoji: "🍽️", time: "30 min", description: "Phone-free family meal with gratitude", difficulty: "Medium" },
                                            { title: "Family Game Night", emoji: "🎲", time: "1 hour", description: "Board games that bring everyone together", difficulty: "Easy" },
                                            { title: "Nature Walk", emoji: "🌳", time: "45 min", description: "Stroll while sharing daily highlights", difficulty: "Easy" },
                                            { title: "Goal Setting", emoji: "🎯", time: "30 min", description: "Weekly family goal planning session", difficulty: "Medium" },
                                            { title: "Kindness Challenge", emoji: "💝", time: "All day", description: "Each family member does one act of kindness", difficulty: "Easy" }
                                        ].map((activity, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                whileHover={{ y: -5 }}
                                                className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 cursor-pointer hover:shadow-lg transition-all"
                                            >
                                                <div className="text-center">
                                                    <div className="text-3xl mb-3">{activity.emoji}</div>
                                                    <h3 className="font-semibold text-gray-800 mb-1">{activity.title}</h3>
                                                    <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{activity.time}</span>
                                                        <span>{activity.difficulty}</span>
                                                    </div>
                                                    <Button size="sm" className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white">
                                                        Start Activity
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <span>Family Journey Timeline</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { date: "Today", activity: "Family health check", score: 85, change: "+5" },
                                            { date: "Yesterday", activity: "Game night activity", score: 80, change: "+2" },
                                            { date: "2 days ago", activity: "Mindfulness session", score: 78, change: "+3" },
                                            { date: "1 week ago", activity: "Story sharing", score: 75, change: "+4" },
                                        ].map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <div className="font-semibold text-gray-800">{entry.activity}</div>
                                                    <div className="text-sm text-gray-600">{entry.date}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-green-600">{entry.score}%</div>
                                                    <div className="text-sm text-green-500">+{entry.change}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Interface when agent is selected */}
                {selectedAgent && activeTab === "agents" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6"
                    >
                        <Card>
                            <CardContent className="p-0">
                                <ChatInterface initialAgentId={selectedAgent} />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
};