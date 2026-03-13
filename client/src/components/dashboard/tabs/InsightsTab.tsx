import React, { useState } from "react";
import { motion } from "framer-motion";
import { EnhancedAnalytics } from "@/components/family/EnhancedAnalytics";
import { PersonalizedRecommendations } from "@/components/family/PersonalizedRecommendations";
import { AgentContribution } from "@/components/agents";
import { BondScoreDashboard } from "../bond-score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Heart } from "lucide-react";
import type { FamilyStats } from "@/types/family";
import type { FamilyMember } from "@/types/family";

interface InsightsTabProps {
  familyStats?: FamilyStats;
  familyMembers: FamilyMember[];
}

const metricAgentMapping = [
  {
    label: "Family Health Forecast",
    agents: [
      { id: "wisdom", name: "Wisdom", emoji: "🧠", contribution: "Emotional analysis" },
    ],
  },
  {
    label: "Stability Index",
    agents: [
      { id: "presence", name: "Presence", emoji: "🧘", contribution: "Consistency tracking" },
    ],
  },
  {
    label: "Communication Depth",
    agents: [
      { id: "intimacy", name: "Intimacy", emoji: "💖", contribution: "Connection metrics" },
      { id: "wisdom", name: "Wisdom", emoji: "🧠", contribution: "Clarity analysis" },
    ],
  },
  {
    label: "Growth Momentum",
    agents: [
      { id: "growth", name: "Growth", emoji: "🚀", contribution: "Challenge tracking" },
    ],
  },
];

export const InsightsTab: React.FC<InsightsTabProps> = ({ familyStats, familyMembers }) => {
  const [showBondScore, setShowBondScore] = useState(false);

  return (
    <motion.div
      key="insights"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Agent-attributed metric cards */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Agent-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricAgentMapping.map((metric) => (
              <div key={metric.label} className="p-4 bg-muted rounded-lg border">
                <p className="text-sm font-semibold text-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-purple-400 mb-2">
                  {metric.label === "Family Health Forecast"
                    ? `${familyStats?.healthScore || 78}/100`
                    : metric.label === "Stability Index"
                    ? "85/100"
                    : metric.label === "Communication Depth"
                    ? "82/100"
                    : "76/100"}
                </p>
                <AgentContribution agents={metric.agents} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bond Score — embedded in Insights (CONSOLIDATION) */}
      <div className="flex items-center justify-between">
        <Button
          variant={showBondScore ? "default" : "outline"}
          size="sm"
          onClick={() => setShowBondScore(!showBondScore)}
          className={showBondScore ? "bg-purple-600 hover:bg-purple-700" : ""}
        >
          <Heart className="w-4 h-4 mr-2" />
          {showBondScore ? "Hide Bond Score" : "View Bond Score"}
        </Button>
      </div>
      {showBondScore && (
        <BondScoreDashboard familyId="default-family" familyName="My Family" />
      )}

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
