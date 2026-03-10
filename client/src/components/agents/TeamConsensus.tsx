import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTeamConsensus } from "@/hooks/useAgentInsights";

/**
 * TeamConsensus card — displays when multiple agents agree on a recommendation.
 * Follows AGENTS.md spec: purple-themed, shows agent emojis and collaborative insight.
 */
export const TeamConsensus: React.FC = () => {
  const { hasConsensus, consensusAgents, consensusMessage } = useTeamConsensus();

  if (!hasConsensus) return null;

  return (
    <Card className="border-0 bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex -space-x-1 text-2xl flex-shrink-0 pt-0.5">
            {consensusAgents.map((emoji, i) => (
              <span key={i} className="drop-shadow-sm">{emoji}</span>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">
              Team Consensus
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {consensusMessage}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
