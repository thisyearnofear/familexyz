import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FamilyMetricsCards } from "@/components/family/FamilyMetricsCards";
import { FamilyRadarChart } from "@/components/family/FamilyRadarChart";
import { FamilyNetwork3DLazy } from "@/components/family/FamilyNetwork3D.lazy";
import { Zap, Target, Users, Sparkles } from "lucide-react";
import type { FamilyStats } from "@/types/family";
import type { FamilyMember } from "@/types/family";
import { AgentBadge, AskAgentButton } from "@/components/agents";

interface OverviewTabProps {
  familyStats?: FamilyStats;
  isFamilyStatsLoading: boolean;
  agentsData?: { agents: any[]; total: number };
  familyMembers: FamilyMember[];
  onViewMembers: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  familyStats,
  isFamilyStatsLoading,
  agentsData,
  familyMembers,
  onViewMembers,
}) => {
  // Agent highlights - proactive insights from agents
  const agentHighlights = [
    {
      agentId: "wisdom",
      agentName: "Wisdom",
      agentEmoji: "🧠",
      insight: "Your family's communication score improved 15% this week!",
      action: "Keep up the great work with daily check-ins"
    },
    {
      agentId: "intimacy",
      agentName: "Intimacy",
      agentEmoji: "💖",
      insight: "Quality time together is at an all-time high",
      action: "Consider planning a special family activity this weekend"
    },
    {
      agentId: "presence",
      agentName: "Presence",
      agentEmoji: "🧘",
      insight: "Mindfulness practices are showing positive results",
      action: "Try extending your morning walks by 10 minutes"
    }
  ];

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <FamilyMetricsCards stats={familyStats} isLoading={isFamilyStatsLoading} />

      {/* Agent Highlights Card */}
      <Card className="border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Agent Highlights</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agentHighlights.map((highlight) => (
              <div
                key={highlight.agentId}
                className="bg-white bg-opacity-70 backdrop-blur-sm p-4 rounded-xl border border-purple-200 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <AgentBadge
                    agentId={highlight.agentId}
                    agentName={highlight.agentName}
                    agentEmoji={highlight.agentEmoji}
                    size="sm"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {highlight.insight}
                </p>
                <p className="text-xs text-gray-700 mb-3">
                  💡 {highlight.action}
                </p>
                <AskAgentButton
                  agentId={highlight.agentId}
                  agentName={highlight.agentName}
                  agentEmoji={highlight.agentEmoji}
                  context="this insight"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Family Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
                        <FamilyNetwork3DLazy healthScore={familyStats?.healthScore || 85} />
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>Family Dynamics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FamilyRadarChart stats={familyStats} isLoading={isFamilyStatsLoading} />
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
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
                onClick={onViewMembers}
                className="w-full mt-2"
              >
                View All Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
