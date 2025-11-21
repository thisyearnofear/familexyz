import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface AgentBadgeProps {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  insight?: string;
  size?: "sm" | "md" | "lg";
  onAskAgent?: (agentId: string) => void;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({
  agentId,
  agentName,
  agentEmoji,
  insight,
  size = "md",
  onAskAgent,
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Badge
        className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white ${sizeClasses[size]} cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all`}
        onClick={() => onAskAgent?.(agentId)}
      >
        <span className="mr-1">{agentEmoji}</span>
        {agentName}
      </Badge>
      {insight && (
        <span className="text-xs text-gray-600 italic">"{insight}"</span>
      )}
    </div>
  );
};

interface AgentContributionProps {
  agents: Array<{
    id: string;
    name: string;
    emoji: string;
    contribution: string;
  }>;
  onAskAgent?: (agentId: string) => void;
}

export const AgentContribution: React.FC<AgentContributionProps> = ({
  agents,
  onAskAgent,
}) => {
  if (agents.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="text-xs font-semibold text-blue-900 mt-0.5">
          Powered by your AI team:
        </div>
        <div className="flex-1 space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2">
              <AgentBadge
                agentId={agent.id}
                agentName={agent.name}
                agentEmoji={agent.emoji}
                size="sm"
                onAskAgent={onAskAgent}
              />
              <span className="text-xs text-blue-800">{agent.contribution}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AskAgentButtonProps {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  context?: string;
  onAskAgent?: (agentId: string) => void;
}

export const AskAgentButton: React.FC<AskAgentButtonProps> = ({
  agentId,
  agentName,
  agentEmoji,
  context,
  onAskAgent,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
      onClick={() => onAskAgent?.(agentId)}
    >
      <MessageCircle className="w-3 h-3 mr-1" />
      <span className="mr-1">{agentEmoji}</span>
      Ask {agentName}
      {context && <span className="ml-1 text-xs opacity-75">about {context}</span>}
    </Button>
  );
};
