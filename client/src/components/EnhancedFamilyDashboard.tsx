import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bell, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FamilyLogo } from "@/components/FamilyLogo";
import { FamilyOnboarding } from "@/components/family/FamilyOnboarding";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TabNavigation } from "@/components/dashboard";
import type { DashboardTab } from "@/components/dashboard/TabNavigation";
import { useFamilyStats, useAgents } from "@/hooks/useFamilyData";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

// Tab components
import { OverviewTab } from "./dashboard/tabs/OverviewTab";
import { InsightsTab } from "./dashboard/tabs/InsightsTab";
import { ActivitiesTab } from "./dashboard/tabs/ActivitiesTab";
import { SocialTab } from "./dashboard/tabs/SocialTab";
import { MembersTab } from "./dashboard/tabs/MembersTab";
import { AgentsTab } from "./dashboard/tabs/AgentsTab";
import { SettingsTab } from "./dashboard/tabs/SettingsTab";
import { BondScoreTab } from "./dashboard/tabs/BondScoreTab";
import { FamilyTreasuryModal } from "./dashboard/FamilyTreasuryModal";

interface EnhancedFamilyDashboardProps {}

export const EnhancedFamilyDashboard: React.FC<EnhancedFamilyDashboardProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    (searchParams.get("tab") as DashboardTab) || "overview"
  );

  // Sync tab change to URL
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

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

  const handleOnboardingComplete = (profile?: any) => {
    if (profile) {
      baseHandleOnboardingComplete?.(profile);
    }
    setShowOnboarding(false);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <FamilyOnboarding
        onComplete={(profile) => {
          handleOnboardingComplete(profile);
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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-pink-50/30 pointer-events-none" />

      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-indigo-600/90"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <FamilyLogo size="lg" className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                  Family Connection Hub
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-white/90 drop-shadow mt-1">
                  AI-powered family wellness and growth platform
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 border border-white/30 transition-transform duration-200 ${showCelebration ? 'scale-110' : ''}`}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
                <span className="font-semibold text-white text-sm sm:text-base">
                  {familyStats?.healthScore || 85}%
                </span>
                <span className="text-xs text-white/90 hidden sm:inline">Bond Strength</span>
              </div>

              <Badge className="bg-green-500 text-white border-green-500 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-1.5 sm:mr-2"></div>
                <span>{familyMembers.length} Members</span>
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
              >
                <Bell className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => setShowTreasuryModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-sm text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                size="sm"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Treasury</span>
              </Button>

              {familyStats?.latestTransactionId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs h-8 sm:h-9 px-2 sm:px-3 hidden sm:inline-flex"
                  onClick={() =>
                    window.open(
                      `https://hashscan.io/testnet/transaction/${familyStats.latestTransactionId}`,
                      "_blank"
                    )
                  }
                >
                  <span className="mr-1.5">⛓️</span>
                  <span className="hidden md:inline">View on HashScan</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ErrorBoundary
        fallback={
          <Dialog open={showTreasuryModal} onOpenChange={() => setShowTreasuryModal(false)}>
            <DialogContent className="sm:max-w-md">
              <div className="p-6 text-center space-y-3">
                <p className="text-red-600 font-semibold">Wallet connection unavailable</p>
                <p className="text-sm text-gray-600">Please ensure HashPack or another supported wallet extension is installed.</p>
                <Button variant="outline" size="sm" onClick={() => setShowTreasuryModal(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <FamilyTreasuryModal
          isOpen={showTreasuryModal}
          onClose={() => setShowTreasuryModal(false)}
        />
      </ErrorBoundary>

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

          {activeTab === "activities" && <ActivitiesTab familyMembers={familyMembers} />}

          {activeTab === "social" && <SocialTab familyMembers={familyMembers} />}

          {activeTab === "agents" && (
            <AgentsTab
              agentsData={agentsData}
              selectedAgent={selectedAgent}
              onAgentSelect={setSelectedAgent}
            />
          )}

          {activeTab === "members" && (
            <MembersTab
              familyMembers={familyMembers}
              onMembersChange={setFamilyMembers}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === "bond-score" && <BondScoreTab />}

          {activeTab === "settings" && <SettingsTab />}
        </AnimatePresence>
      </div>
    </div>
  );
};
