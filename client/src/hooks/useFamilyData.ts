import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { FamilyStats } from "@/types/family";

/**
 * Custom hook to fetch family statistics
 * Refetches every 10 seconds to keep data fresh
 */
export const useFamilyStats = () => {
  return useQuery({
    queryKey: ["familyStats"],
    queryFn: apiClient.getFamilyStats,
    refetchInterval: 10000,
  });
};

/**
 * Custom hook to fetch agents data
 * Handles various response formats from the API
 */
export const useAgents = () => {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      try {
        const response = await apiClient.getAgents();
        if (response && response.data && response.data.agents) {
          return response.data;
        } else if (Array.isArray(response)) {
          return { agents: response, total: response.length };
        } else if (response && Array.isArray(response.agents)) {
          return response;
        } else {
          return { agents: [], total: 0 };
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
        return { agents: [], total: 0 };
      }
    },
    refetchInterval: 30000,
  });
};

/**
 * Custom hook to extract metrics from family stats
 * Provides default values if stats are undefined
 */
export const useFamilyMetrics = (stats: FamilyStats | undefined) => {
  return {
    healthScore: stats?.healthScore || 0,
    total: stats?.total || 0,
    positive: stats?.positive || 0,
    negative: stats?.negative || 0,
  };
};
