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
import { FamilyConnectionRings } from "@/components/family/FamilyConnectionRings";
import { FamilyOnboarding } from "@/components/family/FamilyOnboarding";
import { FamilyMemberProfiles } from "@/components/family/FamilyMemberProfiles";
import { PersonalizedRecommendations } from "@/components/family/PersonalizedRecommendations";
import { FamilySocialFeatures } from "@/components/family/FamilySocialFeatures";
import {
    TrendingUp,
    Heart,
    Zap,
    Target,
    BarChart3,
    Users,
    Star,
    Trophy,
    MessageCircle,
    Calendar,
    Gift,
    Leaf,
    Rocket,
    Brain,
    Baby,
    WifiOff,
    Settings,
    Bell,
    Share2,
    Sparkles,
    Home,
    UserPlus,
    Lightbulb,
    Award,
    Camera
} from "lucide-react";

interface EnhancedFamilyDashboardProps {
    onAgentSelect?: (agentId: string) => void;
}

interface FamilyMember {
    id: string;
    name: string;
    relationship: string;
    age?: number;
    interests: string[];
    communicationStyle: "visual" | "auditory" | "kinesthetic";
    personalityTraits: string[];
    avatar?: string;
    preferences: {
        notifications: boolean;
        privacy: "open" | "moderate" | "private";
        shareProgress: boolean;
    };
}

export const EnhancedFamilyDashboard: React.FC<EnhancedFamilyDashboardProps> = ({
    onAgentSelect,
}) => {
    const [activeTab, setActiveTab] = useState<
        "overview" | "insights" | "agents" | "activities" | "social" | "members" | "settings"
    >("overview");
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [familyGoals, setFamilyGoals] = useState<string[]>([]);
    const [currentUserId] = useState("user-1"); // This would come from auth context

    // Check if user needs onboarding
    useEffect(() => {
        const hasCompletedOnboarding = localStorage.getItem('familyOnboardingCompleted');
        if (!hasCompletedOnboarding && familyMembers.length === 0) {
            setShowOnboarding(true);
        }
    }, [familyMembers]);

    // Initialize sample family data
    useEffect(() => {
        const sampleMembers: FamilyMember[] = [
            {
                id: "user-1",
                name: "Alex Johnson",
                relationship: "Parent",
                age: 42,
                interests: ["Reading", "Cooking", "Technology"],
                communicationStyle: "visual",
                personalityTraits: ["Organized", "Empathetic", "Creative"],
                preferences: {
                    notifications: true,
                    privacy: "moderate",
                    shareProgress: true
                }
            },
            {
                id: "user-2",
                name: "Sam Johnson",
                relationship: "Child",
                age: 12,
                interests: ["Gaming", "Art", "Music"],
                communicationStyle: "kinesthetic",
                personalityTraits: ["Creative", "Energetic", "Curious"],
                preferences: {
                    notifications: true,
                    privacy: "moderate",
                    shareProgress: true
                }
            },
            {
                id: "user-3",
                name: "Jordan Johnson",
                relationship: "Teen",
                age: 16,
                interests: ["Sports", "Photography", "Movies"],
                communicationStyle: "auditory",
                personalityTraits: ["Social", "Adventurous", "Independent"],
                preferences: {
                    notifications: false,
                    privacy: "private",
                    shareProgress: false
                }
            }
        ];

        setFamilyMembers(sampleMembers);
        setFamilyGoals(["communication", "bonding", "growth"]);
    }, []);

    const { data: familyStats, isLoading: isFamilyStatsLoading } = useQuery({
        queryKey: ["familyStats"],
        queryFn: apiClient.getFamilyStats,
        refetchInterval: 10000,
    });

    const { data: familyHistory } = useQuery({
        queryKey: ["familyHistory"],
        queryFn: () => apiClient.getFamilyHistory(),
        refetchInterval: 30000,
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

    const handleOnboardingComplete = (profile: any) => {
        // Process onboarding data
        const newMembers: FamilyMember[] = profile.members.map((member: any, index: number) => ({
            id: `user-${index + 1}`,
            name: member.name,
            relationship: member.relationship,
            age: member.age,
            interests: member.interests || [],
            communicationStyle: member.communicationStyle || "visual",
            personalityTraits: member.personalityTraits || [],
            preferences: {
                notifications: true,
                privacy: "moderate",
                shareProgress: true
            }
        }));

        setFamilyMembers(newMembers);
        setFamilyGoals(profile.goals);
        localStorage.setItem('familyOnboardingCompleted', 'true');
        localStorage.setItem('familyProfile', JSON.stringify(profile));
        setShowOnboarding(false);
        setShowCelebration(true);

        setTimeout(() => setShowCelebration(false), 3000);
    };

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgent(agentId);
        setActiveTab("agents");
        onAgentSelect?.(agentId);
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "insights", label: "Insights", icon: Lightbulb },
        { id: "agents", label: "AI Agents", icon: Zap },
        { id: "activities", label: "Activities", icon: Target },
        { id: "social", label: "Social", icon: Share2 },
        { id: "members", label: "Family", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    // Show onboarding if needed
    if (showOnboarding) {
        return (
            <FamilyOnboarding
                onComplete={handleOnboardingComplete}
                onCancel={() => setShowOnboarding(false)}
            />
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 relative overflow-hidden"
            role="main"
            aria-label="Enhanced Family Dashboard"
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
                    style={{ animationDelay: "2s" }}
                ></div>
            </div>

            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-indigo-600/90"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <FamilyLogo size="lg" className="w-12 h-12" />
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                                    Family Connection Hub
                                </h1>
                                <p className="text-sm lg:text-base text-white/90 drop-shadow mt-1">
                                    AI-powered family wellness and growth platform
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <motion.div
                                className="flex items-center space-x-2"
                                animate={showCelebration ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                                    <Heart className="w-5 h-5 text-red-300" />
                                    <span className="font-semibold text-white">
                                        {familyStats?.healthScore || 85}%
                                    </span>
                                    <span className="text-xs text-white/90">Bond Strength</span>
                                </div>
                            </motion.div>

                            <Badge className="bg-green-500 text-white border-green-500">
                                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                <span>{familyMembers.length} Members</span>
                            </Badge>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10"
                            >
                                <Bell className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-purple-200/50 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex overflow-x-auto py-4 -mx-6 px-6" role="tablist">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex-shrink-0 relative overflow-hidden ${
                                        isActive
                                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105"
                                            : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 hover:shadow-md"
                                    }`}
                                    role="tab"
                                    aria-selected={isActive}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                {/* Celebration Animation */}
                <AnimatePresence>
                    {showCelebration && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.8 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-8 rounded-2xl shadow-2xl">
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 3 }}
                                    >
                                        <Trophy className="w-16 h-16 mx-auto mb-4" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold mb-2">Welcome to Your Family Journey!</h3>
                                    <p className="text-lg">Your family profile is ready. Let's start building stronger bonds!</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab Content */}
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
                            <FamilyMetricsCards
                                stats={familyStats}
                                isLoading={isFamilyStatsLoading}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card variant="premium" className="border-0">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Zap className="w-5 h-5 text-purple-600" />
                                            <span>Family Network</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center">
                                        <FamilyConnectionRings
                                            healthScore={familyStats?.healthScore}
                                            activeAgents={agentsData?.agents?.map((a: any) => a.name) || []}
                                        />
                                    </CardContent>
                                </Card>

                                <Card variant="gleam" className="border-0">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Target className="w-5 h-5 text-indigo-600" />
                                            <span>Family Dynamics</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FamilyRadarChart
                                            stats={familyStats}
                                            isLoading={isFamilyStatsLoading}
                                        />
                                    </CardContent>
                                </Card>

                                <Card variant="gleam" className="border-0">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <span>Family Members</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {familyMembers.slice(0, 3).map((member) => (
                                                <div key={member.id} className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-semibold">
                                                            {member.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{member.name}</div>
                                                        <div className="text-xs text-gray-600">{member.relationship}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActiveTab("members")}
                                                className="w-full mt-2"
                                            >
                                                View All Members
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "insights" && (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PersonalizedRecommendations
                                familyMembers={familyMembers}
                                familyGoals={familyGoals}
                                recentActivities={[]}
                                familyDynamics={{
                                    healthScore: familyStats?.healthScore || 85,
                                    strengths: ["Communication", "Emotional Support"],
                                    growthAreas: ["Digital Balance", "Conflict Resolution"]
                                }}
                            />
                        </motion.div>
                    )}

                    {activeTab === "social" && (
                        <motion.div
                            key="social"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FamilySocialFeatures
                                familyMembers={familyMembers}
                                currentUserId={currentUserId}
                            />
                        </motion.div>
                    )}

                    {activeTab === "members" && (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FamilyMemberProfiles
                                members={familyMembers}
                                onMembersChange={setFamilyMembers}
                                currentUserId={currentUserId}
                            />
                        </motion.div>
                    )}

                    {activeTab === "agents" && (
                        <motion.div
                            key="agents"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-12">
                                <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">AI Family Agents</h3>
                                <p className="text-gray-500 mb-6">
                                    Chat with your specialized AI family coaches
                                </p>
                                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Start Conversation
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "activities" && (
                        <motion.div
                            key="activities"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-12">
                                <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Family Activities</h3>
                                <p className="text-gray-500 mb-6">
                                    Discover personalized activities for your family
                                </p>
                                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Get Recommendations
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "settings" && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-12">
                                <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Family Settings</h3>
                                <p className="text-gray-500 mb-6">
                                    Customize your family's experience and preferences
                                </p>
                                <div className="space-x-4">
                                    <Button
                                        onClick={() => setShowOnboarding(true)}
                                        variant="outline"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Re-run Setup
                                    </Button>
                                    <Button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Preferences
                                    </Button>
                                </div>
                            </div>
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