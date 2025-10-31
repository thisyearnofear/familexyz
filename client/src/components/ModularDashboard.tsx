import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { getAgentColorClasses, familyTheme } from "@/lib/theme";
import { visualEffects } from "@/lib/visual-effects";
import { cn } from "@/lib/utils";
import { telegramIntegration } from "@/lib/platforms";
import type { FamilyStats } from "@/types/family";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FamilyLogo } from "@/components/FamilyLogo";
import { ChatInterface } from "@/components/ChatInterface";
import { ConnectionStatus } from "@/components/connection-status";
import { FamilyConnectionRings } from "@/components/family/FamilyConnectionRings";
import { FamilyRadarChart } from "@/components/family/FamilyRadarChart";
import { FamilyMetricsCards } from "@/components/family/FamilyMetricsCards";
import { FamilyWelcome } from "@/components/family/FamilyWelcome";
import { AgentCard, AgentGrid } from "@/components/ui/agent-card";
import {
    BarChart3,
    Zap,
    Target,
    Heart,
    TrendingUp,
    Settings,
    Brain,
    Users,
    Leaf,
    Rocket,
    MessageCircle,
    Home,
    User,
    Book,
    Cog,
    Bell,
    Shield,
    Palette,
    Moon,
    Sun,
    Plus,
    Minus,
    Edit,
    Save,
    Upload,
    Download,
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Grid,
    List,
    Clock,
    MapPin,
    Phone,
    Mail,
    Globe,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    Github,
    Slack,
    Discord,
    Whatsapp,
    Telegram,
    FileText,
    Image,
    Video,
    Music,
    Camera,
    Gift,
    ShoppingCart,
    CreditCard,
    DollarSign,
    Euro,
    PoundSterling,
    IndianRupee,
    JapaneseYen,
    Wallet,
    Banknote,
    PiggyBank,
    TrendingUpDown,
} from "lucide-react";

// Enhanced agent metadata with more descriptive information for better user understanding
const agentMetadata: Record<
    string,
    {
        icon: React.ReactNode;
        color: string;
        description: string;
        shortName?: string;
        purpose: string;
        benefits: string[];
    }
> = {
    Wisdom: {
        icon: <Brain className="w-6 h-6" />,
        color: "from-purple-500 to-purple-600",
        description: "Emotional guidance",
        shortName: "Wisdom",
        purpose:
            "Provides life lessons and philosophical insights to help your family navigate complex emotions and decisions",
        benefits: [
            "Shares timeless wisdom from diverse cultures and philosophies",
            "Helps resolve family conflicts through thoughtful reflection",
            "Guides decision-making with deep emotional intelligence",
        ],
    },
    Intimacy: {
        icon: <Heart className="w-6 h-6" />,
        color: "from-pink-500 to-pink-600",
        description: "Relationship coaching",
        shortName: "Intimacy",
        purpose:
            "Strengthens emotional bonds between family members through guided conversations and activities",
        benefits: [
            "Facilitates deeper, more meaningful family conversations",
            "Helps family members understand each other's emotional needs",
            "Provides exercises to build trust and vulnerability",
        ],
    },
    GenerationalBridge: {
        icon: <Users className="w-6 h-6" />,
        color: "from-blue-500 to-blue-600",
        description: "Cross-generational",
        shortName: "Bridge",
        purpose:
            "Connects different generations in your family by finding common ground and shared experiences",
        benefits: [
            "Translates communication styles between age groups",
            "Shares stories that resonate across generations",
            "Creates activities that bring grandparents, parents, and children together",
        ],
    },
    Presence: {
        icon: <Leaf className="w-6 h-6" />,
        color: "from-green-500 to-green-600",
        description: "Mindful wellness",
        shortName: "Presence",
        purpose:
            "Promotes mindful awareness and quality time together as a family",
        benefits: [
            "Guides phone-free family moments",
            "Teaches mindfulness techniques for stress reduction",
            "Helps create sacred spaces for family connection",
        ],
    },
    Growth: {
        icon: <Rocket className="w-6 h-6" />,
        color: "from-orange-500 to-orange-600",
        description: "Family challenges",
        shortName: "Growth",
        purpose:
            "Encourages personal and collective family development through engaging challenges",
        benefits: [
            "Sets achievable family goals and tracks progress",
            "Creates friendly competition to motivate positive habits",
            "Celebrates milestones in family development journey",
        ],
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

    const { data: familyStats, isLoading: isFamilyStatsLoading } =
        useQuery<FamilyStats>({
            queryKey: ["familyStats"],
            queryFn: apiClient.getFamilyStats,
        });

    const { data: agentsData, isLoading: isAgentsLoading } = useQuery({
        queryKey: ["agents"],
        queryFn: async () => {
            try {
                const response = await apiClient.getAgents();
                // Handle different response structures
                if (response && response.data && response.data.agents) {
                    return response.data;
                } else if (Array.isArray(response)) {
                    // If it's an array of agents directly
                    return { agents: response, total: response.length };
                } else if (response && Array.isArray(response.agents)) {
                    // If agents are directly in response
                    return response;
                } else {
                    // Fallback to empty structure
                    return { agents: [], total: 0 };
                }
            } catch (error) {
                console.error("Failed to load agents:", error);
                return { agents: [], total: 0 };
            }
        },
        refetchInterval: 5_000,
    });

    // Create dynamic agent quick access from server data with enhanced information
    const agentQuickAccess =
        agentsData?.agents?.map((agent: any) => ({
            id: agent.id,
            name: agentMetadata[agent.name]?.shortName || agent.name,
            icon: agentMetadata[agent.name]?.icon || "🤖",
            color:
                agentMetadata[agent.name]?.color || "from-gray-500 to-gray-600",
            description:
                agentMetadata[agent.name]?.description || "Family Agent",
            purpose:
                agentMetadata[agent.name]?.purpose ||
                "Helps strengthen family bonds",
            benefits: agentMetadata[agent.name]?.benefits || [
                "Supports family growth and connection",
            ],
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
            {/* Vibrant Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <FamilyLogo size="sm" className="w-10 h-10" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                                Family Dashboard
                            </h1>
                            <p className="text-xs sm:text-sm text-white/90 drop-shadow">
                                Strengthen your family bonds with AI guidance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <GlowEffect active={true}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUserManagement}
                                className="flex items-center space-x-1 text-xs sm:text-sm px-3 py-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                            >
                                <Users className="w-4 h-4" />
                                <span className="hidden xs:inline">Users</span>
                            </Button>
                        </GlowEffect>
                        <GlowEffect active={true}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSettings}
                                className="flex items-center space-x-1 text-xs sm:text-sm px-3 py-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden xs:inline">
                                    Settings
                                </span>
                            </Button>
                        </GlowEffect>
                        <Badge className="bg-green-500 text-white border-green-500 text-xs shadow-lg">
                            <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                            <span className="hidden xs:inline">
                                All Agents Online
                            </span>
                            <span className="xs:hidden">Online</span>
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Interactive Navigation Tabs */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-4">
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4">
                    {navigationTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeView === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex-shrink-0 transform hover:scale-105 ${
                                    isActive
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                        : "text-gray-700 hover:bg-white/50 hover:text-purple-700"
                                }`}
                            >
                                <Icon
                                    className={`w-4 h-4 ${isActive ? "text-white" : "text-purple-600"}`}
                                />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
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
                                        {isAgentsLoading
                                            ? "Loading..."
                                            : `${agentQuickAccess.length} Specialized Agents`}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Five AI specialists working together to
                                    strengthen your family across generations
                                </p>
                            </CardHeader>
                            <CardContent>
                                {isAgentsLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {[...Array(5)].map((_, index) => (
                                            <AgentCardSkeleton key={index} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <PulseAnimation>
                                            <AgentGrid
                                                agents={agentQuickAccess.map(
                                                    (agent) => ({
                                                        id: agent.id,
                                                        name: agent.name,
                                                        description:
                                                            agent.description,
                                                        purpose: agent.purpose,
                                                        benefits:
                                                            agent.benefits,
                                                        onClick: () =>
                                                            handleAgentSelect(
                                                                agent.id,
                                                            ),
                                                    }),
                                                )}
                                                onAgentSelect={
                                                    handleAgentSelect
                                                }
                                                selectedAgentId={selectedAgent}
                                            />
                                        </PulseAnimation>

                                        {/* Highlighted family metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <InteractiveTooltip content="Total family interactions">
                                                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-xl border border-purple-200 text-center hover:shadow-lg transition-shadow">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        <AnimatedCounter
                                                            value={
                                                                familyStats?.total ||
                                                                0
                                                            }
                                                        />
                                                    </div>
                                                    <div className="text-xs text-purple-700 font-medium">
                                                        Interactions
                                                    </div>
                                                </div>
                                            </InteractiveTooltip>

                                            <InteractiveTooltip content="Positive family moments">
                                                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl border border-green-200 text-center hover:shadow-lg transition-shadow">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        <AnimatedCounter
                                                            value={
                                                                familyStats?.positive ||
                                                                0
                                                            }
                                                        />
                                                    </div>
                                                    <div className="text-xs text-green-700 font-medium">
                                                        Positive
                                                    </div>
                                                </div>
                                            </InteractiveTooltip>

                                            <InteractiveTooltip content="Connection strength">
                                                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-xl border border-blue-200 text-center hover:shadow-lg transition-shadow">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        <AnimatedCounter
                                                            value={
                                                                familyStats?.healthScore ||
                                                                0
                                                            }
                                                            suffix="%"
                                                        />
                                                    </div>
                                                    <div className="text-xs text-blue-700 font-medium">
                                                        Health Score
                                                    </div>
                                                </div>
                                            </InteractiveTooltip>

                                            <InteractiveTooltip content="Active agents">
                                                <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-4 rounded-xl border border-orange-200 text-center hover:shadow-lg transition-shadow">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        <AnimatedCounter
                                                            value={
                                                                agentQuickAccess.length
                                                            }
                                                        />
                                                    </div>
                                                    <div className="text-xs text-orange-700 font-medium">
                                                        Active Agents
                                                    </div>
                                                </div>
                                            </InteractiveTooltip>
                                        </div>
                                    </div>
                                )}

                                {/* Agent Benefits Summary */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                        How Our Agents Work Together
                                    </h3>
                                    <p className="text-xs text-blue-700">
                                        Each agent specializes in a different
                                        aspect of family connection. They
                                        collaborate behind the scenes to provide
                                        comprehensive guidance that strengthens
                                        your family bonds across generations.
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
                                            {isFamilyStatsLoading
                                                ? "..."
                                                : `${familyStats?.healthScore || 0}%`}
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
                                        Measures how well your family connects
                                        across five dimensions. Higher scores
                                        indicate stronger bonds.
                                    </p>
                                )}
                            </CardHeader>
                            {expandedSections.has("health-score") && (
                                <CardContent>
                                    {isFamilyStatsLoading ? (
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-lg">
                                            <div className="animate-pulse space-y-6">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="space-y-2">
                                                        <div className="h-6 bg-purple-200 rounded w-48"></div>
                                                        <div className="h-4 bg-purple-200 rounded w-64"></div>
                                                    </div>
                                                    <div className="h-8 bg-purple-200 rounded w-20"></div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between">
                                                        <div className="h-4 bg-purple-200 rounded w-32"></div>
                                                        <div className="h-4 bg-purple-200 rounded w-12"></div>
                                                    </div>
                                                    <div className="h-3 bg-purple-200 rounded-full w-full"></div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                        {[...Array(4)].map(
                                                            (_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="p-4 bg-white rounded-lg border border-purple-100"
                                                                >
                                                                    <div className="h-6 bg-purple-200 rounded w-8 mb-2 mx-auto"></div>
                                                                    <div className="h-4 bg-purple-200 rounded w-16 mb-2"></div>
                                                                    <div className="h-2 bg-purple-100 rounded-full w-full"></div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Overall Score Progress with Enhanced Contrast */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-lg text-gray-800">
                                                        Overall Strength
                                                    </span>
                                                    <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                                        {familyStats?.healthScore ||
                                                            0}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${familyStats?.healthScore || 0}%`,
                                                        }}
                                                        transition={{
                                                            duration: 1,
                                                            ease: "easeOut",
                                                        }}
                                                        className={`
                                                            h-full bg-gradient-to-r ${
                                                                (familyStats?.healthScore ||
                                                                    0) >= 80
                                                                    ? "from-green-500 to-emerald-600"
                                                                    : (familyStats?.healthScore ||
                                                                            0) >=
                                                                        60
                                                                      ? "from-blue-500 to-cyan-600"
                                                                      : "from-orange-500 to-red-500"
                                                            } rounded-full relative overflow-hidden
                                                        `}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                                                    </motion.div>
                                                </div>
                                                <div
                                                    className={`text-sm font-medium ${
                                                        (familyStats?.healthScore ||
                                                            0) >= 80
                                                            ? "text-green-700"
                                                            : (familyStats?.healthScore ||
                                                                    0) >= 60
                                                              ? "text-blue-700"
                                                              : "text-orange-700"
                                                    }`}
                                                >
                                                    {familyStats?.healthScore >=
                                                    80
                                                        ? "🎉 Excellent! Your family bonds are strong."
                                                        : familyStats?.healthScore >=
                                                            60
                                                          ? "👍 Good progress! Keep strengthening connections."
                                                          : "💪 Opportunity to grow your family bonds."}
                                                </div>
                                            </div>

                                            {/* Dimension Scores with Agent Mapping - Enhanced */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[
                                                    {
                                                        key: "intimacy",
                                                        label: "Intimacy",
                                                        emoji: "💑",
                                                        value:
                                                            familyStats
                                                                ?.intimacy
                                                                ?.affection ||
                                                            0,
                                                        color: "from-pink-500 to-rose-500",
                                                        bg: "bg-gradient-to-br from-pink-50 to-rose-50",
                                                        text: "text-pink-700",
                                                    },
                                                    {
                                                        key: "presence",
                                                        label: "Presence",
                                                        emoji: "🧘",
                                                        value:
                                                            familyStats
                                                                ?.presence
                                                                ?.attention ||
                                                            0,
                                                        color: "from-emerald-500 to-green-600",
                                                        bg: "bg-gradient-to-br from-emerald-50 to-green-50",
                                                        text: "text-emerald-700",
                                                    },
                                                    {
                                                        key: "generational",
                                                        label: "Bridge",
                                                        emoji: "👵👦",
                                                        value:
                                                            familyStats
                                                                ?.generational
                                                                ?.bridge || 0,
                                                        color: "from-blue-500 to-indigo-600",
                                                        bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
                                                        text: "text-blue-700",
                                                    },
                                                    {
                                                        key: "growth",
                                                        label: "Growth",
                                                        emoji: "🚀",
                                                        value:
                                                            familyStats?.growth
                                                                ?.growth || 0,
                                                        color: "from-orange-500 to-amber-600",
                                                        bg: "bg-gradient-to-br from-orange-50 to-amber-50",
                                                        text: "text-orange-700",
                                                    },
                                                ].map((dimension, index) => (
                                                    <motion.div
                                                        key={dimension.key}
                                                        initial={{
                                                            opacity: 0,
                                                            y: 20,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            delay: index * 0.1,
                                                        }}
                                                        className={`${dimension.bg} p-5 rounded-xl border-2 ${dimension.color.replace("from-", "border-")} shadow-lg hover:shadow-xl transition-shadow duration-300`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="text-2xl">
                                                                {
                                                                    dimension.emoji
                                                                }
                                                            </div>
                                                            <div
                                                                className={`text-2xl font-bold bg-gradient-to-r ${dimension.color} bg-clip-text text-transparent`}
                                                            >
                                                                {
                                                                    dimension.value
                                                                }
                                                                %
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-lg text-gray-800 mb-2">
                                                            {dimension.label}
                                                        </div>
                                                        <div className="text-sm text-gray-700 mb-3">
                                                            {dimension.key ===
                                                                "intimacy" &&
                                                                "Emotional closeness and trust between family members"}
                                                            {dimension.key ===
                                                                "presence" &&
                                                                "Quality time and mindful attention together"}
                                                            {dimension.key ===
                                                                "generational" &&
                                                                "Connection across different generations"}
                                                            {dimension.key ===
                                                                "growth" &&
                                                                "Personal and collective family development"}
                                                        </div>
                                                        <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{
                                                                    width: 0,
                                                                }}
                                                                animate={{
                                                                    width: `${dimension.value}%`,
                                                                }}
                                                                transition={{
                                                                    duration: 1,
                                                                    ease: "easeOut",
                                                                }}
                                                                className={`h-full bg-gradient-to-r ${dimension.color} rounded-full`}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Agent Connection Mapping - Enhanced */}
                                            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                        <Zap className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="font-bold text-lg text-gray-800">
                                                        How Agents Strengthen
                                                        Each Dimension
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                    {[
                                                        {
                                                            emoji: "💑",
                                                            label: "Intimacy",
                                                            agent: "Wisdom",
                                                            color: "text-pink-500",
                                                        },
                                                        {
                                                            emoji: "💕",
                                                            label: "Love",
                                                            agent: "Intimacy",
                                                            color: "text-rose-500",
                                                        },
                                                        {
                                                            emoji: "👵👦",
                                                            label: "Bridge",
                                                            agent: "Bridge",
                                                            color: "text-blue-500",
                                                        },
                                                        {
                                                            emoji: "🧘",
                                                            label: "Presence",
                                                            agent: "Presence",
                                                            color: "text-emerald-500",
                                                        },
                                                        {
                                                            emoji: "🚀",
                                                            label: "Growth",
                                                            agent: "Growth",
                                                            color: "text-orange-500",
                                                        },
                                                    ].map((mapping, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.9,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                            }}
                                                            transition={{
                                                                delay:
                                                                    index * 0.1,
                                                            }}
                                                            className="text-center p-3 bg-white rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                                                        >
                                                            <div
                                                                className={`text-2xl mb-1 ${mapping.color}`}
                                                            >
                                                                {mapping.emoji}
                                                            </div>
                                                            <div className="font-semibold text-sm text-gray-800">
                                                                {mapping.label}
                                                            </div>
                                                            <div className="text-xs text-purple-600">
                                                                {mapping.agent}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                        <Badge variant="secondary">
                                            3 Personalized
                                        </Badge>
                                        {expandedSections.has("suggestions") ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                                {expandedSections.has("suggestions") && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        AI-powered suggestions tailored to
                                        strengthen your family bonds today
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
                                                    Ask each family member about
                                                    their day
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                                    >
                                                        5-10 mins
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                                    >
                                                        All Ages
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                                                    onClick={() =>
                                                        console.log(
                                                            "Starting Family Check-in",
                                                        )
                                                    }
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
                                                    Schedule 30 minutes of
                                                    family fun
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-green-100 text-green-700 border-green-200"
                                                    >
                                                        30 mins
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-green-100 text-green-700 border-green-200"
                                                    >
                                                        Ages 6+
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 text-xs bg-white border-green-300 text-green-700 hover:bg-green-100"
                                                    onClick={() =>
                                                        console.log(
                                                            "Starting Game Night",
                                                        )
                                                    }
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
                                                    Try a 15-minute phone-free
                                                    conversation
                                                </div>
                                                <div className="mt-2 flex items-center space-x-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                                    >
                                                        15 mins
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                                    >
                                                        Mindfulness
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 text-xs bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
                                                    onClick={() =>
                                                        console.log(
                                                            "Starting Digital Wellness",
                                                        )
                                                    }
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
                                            Our AI agents analyze your family
                                            dynamics to suggest personalized
                                            activities.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                            onClick={() =>
                                                console.log(
                                                    "Generating more suggestions",
                                                )
                                            }
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
                        <InsightsEmptyState
                            onGetStarted={() => setActiveView("chat")}
                        />
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
