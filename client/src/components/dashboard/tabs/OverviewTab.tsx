import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FamilyMetricsCards } from "@/components/family/FamilyMetricsCards";
import { FamilyRadarChart } from "@/components/family/FamilyRadarChart";
import { FamilyConnectionRings } from "@/components/family/FamilyConnectionRings";
import { Zap, Target, Users } from "lucide-react";
import type { FamilyStats } from "@/types/family";
import type { FamilyMember } from "@/types/family";

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
            <FamilyRadarChart stats={familyStats} isLoading={isFamilyStatsLoading} />
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
