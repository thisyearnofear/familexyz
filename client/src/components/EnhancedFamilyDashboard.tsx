import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FamilyLogo } from "@/components/FamilyLogo";
import { ChatInterface } from "@/components/ChatInterface";
import { FamilyOnboarding } from "@/components/family/FamilyOnboarding";
import { TabNavigation } from "@/components/dashboard";
import { useFamilyStats, useAgents } from "@/hooks/useFamilyData";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

// Tab components
import { OverviewTab } from "./dashboard/tabs/OverviewTab";
import { InsightsTab } from "./dashboard/tabs/InsightsTab";
import { AgentsTab } from "./dashboard/tabs/AgentsTab";
import { ActivitiesTab } from "./dashboard/tabs/ActivitiesTab";
import { SocialTab } from "./dashboard/tabs/SocialTab";
import { MembersTab } from "./dashboard/tabs/MembersTab";
import { SettingsTab } from "./dashboard/tabs/SettingsTab";

interface EnhancedFamilyDashboardProps {
  onAgentSelect?: (agentId: string) => void;
}

export const EnhancedFamilyDashboard: React.FC<EnhancedFamilyDashboardProps> = ({
  onAgentSelect,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "insights" | "agents" | "activities" | "social" | "members" | "settings"
  >("overview");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [familyGoals, setFamilyGoals] = useState<string[]>([]);

  // Custom hooks for data and state management
  const { data: familyStats, isLoading: isFamilyStatsLoading } = useFamilyStats();
  const { data: agentsData } = useAgents();
  const {
    familyMembers,
    setFamilyMembers,
    showOnboarding,
    setShowOnboarding,
    currentUserId,
    handleOnboardingComplete: baseHandleOnboardingComplete,
  } = useFamilyMembers();

  const handleOnboardingComplete = () => {
    baseHandleOnboardingComplete?.();
    setShowOnboarding(false);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setActiveTab("agents");
    onAgentSelect?.(agentId);
  };

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <FamilyOnboarding
        onComplete={(profile) => {
          baseHandleOnboardingComplete?.(profile);
          setShowOnboarding(false);
          handleOnboardingComplete();
        }}
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

              {familyStats?.latestTransactionId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() =>
                    window.open(
                      `https://hashscan.io/testnet/transaction/${familyStats.latestTransactionId}`,
                      "_blank"
                    )
                  }
                >
                  <span className="mr-2">⛓️</span>
                  View on HashScan
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-lg">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <OverviewTab
              familyStats={familyStats}
              isFamilyStatsLoading={isFamilyStatsLoading}
              agentsData={agentsData}
              familyMembers={familyMembers}
              onViewMembers={() => setActiveTab("members")}
            />
          )}

          {activeTab === "insights" && (
            <InsightsTab familyStats={familyStats} familyMembers={familyMembers} />
          )}

          {activeTab === "agents" && (
            <AgentsTab
              agentsData={agentsData}
              selectedAgent={selectedAgent}
              onAgentSelect={handleAgentSelect}
            />
          )}

          {activeTab === "activities" && <ActivitiesTab familyMembers={familyMembers} />}

          {activeTab === "social" && <SocialTab familyMembers={familyMembers} />}

          {activeTab === "members" && (
            <MembersTab
              familyMembers={familyMembers}
              onMembersChange={setFamilyMembers}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === "settings" && <SettingsTab />}
        </AnimatePresence>

        {/* Chat Interface */}
        {selectedAgent && (
          <div className="mt-8">
            <ChatInterface initialAgentId={selectedAgent} />
          </div>
        )}
      </div>
    </div>
  );
};
