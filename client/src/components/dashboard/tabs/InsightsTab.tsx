import React from "react";
import { motion } from "framer-motion";
import { EnhancedAnalytics } from "@/components/family/EnhancedAnalytics";
import { PersonalizedRecommendations } from "@/components/family/PersonalizedRecommendations";
import type { FamilyStats } from "@/types/family";
import type { FamilyMember } from "@/types/family";

interface InsightsTabProps {
  familyStats?: FamilyStats;
  familyMembers: FamilyMember[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ familyStats, familyMembers }) => {
  return (
    <motion.div
      key="insights"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <EnhancedAnalytics stats={familyStats} history={undefined} />
      <PersonalizedRecommendations
        familyMembers={familyMembers}
        familyGoals={[]}
        recentActivities={[]}
        familyDynamics={{
          healthScore: familyStats?.healthScore || 80,
          strengths: ["Strong communication", "Shared values"],
          growthAreas: ["Digital balance", "Conflict resolution"],
        }}
      />
    </motion.div>
  );
};
