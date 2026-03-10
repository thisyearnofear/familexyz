import React from "react";

interface AgentReactionProps {
  agentEmoji: string;
  agentName: string;
  message: string;
}

/**
 * AgentReaction — purple-themed reaction bubble from an agent.
 * Used in social feed when agents celebrate family achievements.
 */
export const AgentReaction: React.FC<AgentReactionProps> = ({
  agentEmoji,
  agentName,
  message,
}) => {
  return (
    <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
      <span className="text-xl flex-shrink-0">{agentEmoji}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-purple-700">{agentName}</p>
        <p className="text-sm text-purple-900">{message}</p>
      </div>
    </div>
  );
};

/**
 * Pre-built reaction templates for agent-generated social reactions.
 */
export const AGENT_REACTION_TEMPLATES: Record<string, string[]> = {
  wisdom: [
    "Beautiful reflection! This kind of awareness deepens understanding 🧠✨",
    "What a thoughtful conversation — wisdom grows through sharing 💜",
  ],
  intimacy: [
    "Love seeing this connection! Moments like these build lasting bonds 💖",
    "This is what quality time looks like — keep nurturing these bonds 💕",
  ],
  generationalbridge: [
    "What a precious intergenerational moment! Stories like these are treasures 📚",
    "Bridging generations through shared experiences — wonderful! 👵👦",
  ],
  presence: [
    "Fully present and connected — this is mindful family time at its best 🧘",
    "Choosing presence over distraction — your family feels the difference ✨",
  ],
  growth: [
    "Achievement unlocked! Your family is growing stronger together 🚀",
    "Every challenge completed brings your family closer to its goals 🌟",
  ],
};
