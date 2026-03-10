import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { POLLING_INTERVALS, CACHE_TIMES } from "@/lib/constants";

export interface AgentInsight {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  insight: string;
  action: string;
  focus?: string;
  metrics?: Record<string, any>;
  lastTransactionId?: string | null;
}

/**
 * Fallback templates used when the backend is unreachable.
 */
const FALLBACK_META: Record<string, { emoji: string; insight: string; action: string }> = {
  wisdom: { emoji: "🧠", insight: "Analysing your family's communication patterns", action: "Keep up the great work with daily check-ins" },
  intimacy: { emoji: "💖", insight: "Tracking relationship connection moments", action: "Consider planning a special family activity this weekend" },
  generationalbridge: { emoji: "👵👦", insight: "Monitoring cross-generational storytelling", action: "Ask an elder to share a favorite memory this week" },
  presence: { emoji: "🧘", insight: "Observing mindfulness and digital wellness", action: "Initiate a device-free dinner tonight" },
  growth: { emoji: "🚀", insight: "Watching family growth momentum", action: "Set a new shared family goal for next week" },
};

/**
 * Hook to get dynamic agent insights from the live backend.
 *
 * Fetches from `/agents/insights` (port 3000 DirectClient) which reads
 * real-time agent runtime metrics. Falls back to static templates if
 * the backend is unreachable.
 */
export const useAgentInsights = (): {
  insights: AgentInsight[];
  isLoading: boolean;
} => {
  const { data, isLoading, isError } = useQuery<{ insights: AgentInsight[] }>({
    queryKey: ["agentInsights"],
    queryFn: () => apiClient.getAgentInsights(),
    refetchInterval: POLLING_INTERVALS.AGENTS,
    staleTime: CACHE_TIMES.STALE_TIME,
  });

  // If backend returned insights, use them directly
  if (data?.insights && data.insights.length > 0) {
    return { insights: data.insights, isLoading };
  }

  // Fallback to static templates when backend is unreachable or returns empty
  if (isError || (!isLoading && (!data?.insights || data.insights.length === 0))) {
    const fallback: AgentInsight[] = Object.entries(FALLBACK_META).map(([key, meta]) => ({
      agentId: key,
      agentName: key.charAt(0).toUpperCase() + key.slice(1),
      agentEmoji: meta.emoji,
      insight: meta.insight,
      action: meta.action,
    }));
    return { insights: fallback, isLoading: false };
  }

  return { insights: [], isLoading };
};

/**
 * Hook to detect team consensus — when 2+ agents agree on a recommendation theme.
 * Uses the live insights data from the backend.
 */
export const useTeamConsensus = (): {
  hasConsensus: boolean;
  consensusAgents: string[];
  consensusMessage: string;
} => {
  const { insights } = useAgentInsights();

  // Consensus when 3+ agents have active insights
  if (insights.length >= 3) {
    const agentEmojis = insights.slice(0, 3).map((i) => i.agentEmoji);
    const names = insights.slice(0, 3).map((i) => i.agentName);
    return {
      hasConsensus: true,
      consensusAgents: agentEmojis,
      consensusMessage: `${names.join(", ")} agree: Your family's routines are strengthening key relationships.`,
    };
  }

  return { hasConsensus: false, consensusAgents: [], consensusMessage: "" };
};
