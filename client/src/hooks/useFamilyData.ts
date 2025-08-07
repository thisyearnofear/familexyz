import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { POLLING_INTERVALS, CACHE_TIMES } from "@/lib/constants";
import type { FamilyStats, FamilyHistory } from "@/types/family";

// Custom hook for family statistics - DRY principle
export const useFamilyStats = (refetchInterval: number = POLLING_INTERVALS.FAMILY_STATS) => {
  return useQuery({
    queryKey: ["familyStats"],
    queryFn: apiClient.getFamilyStats,
    refetchInterval,
    staleTime: CACHE_TIMES.STALE_TIME,
    cacheTime: CACHE_TIMES.CACHE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Custom hook for family history - DRY principle
export const useFamilyHistory = (
  endpoint: string = "/family/stats/history/db",
  refetchInterval: number = POLLING_INTERVALS.FAMILY_HISTORY
) => {
  return useQuery({
    queryKey: ["familyStatsHistory", endpoint],
    queryFn: () => apiClient.getFamilyHistory(endpoint),
    refetchInterval,
    staleTime: CACHE_TIMES.STALE_TIME * 5,
    cacheTime: CACHE_TIMES.CACHE_TIME * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Computed values hook - CLEAN principle
export const useFamilyMetrics = (data: FamilyStats | undefined) => {
  const healthScore = data ? Math.round(data.healthScore) : 80;
  const total = data?.total ?? 0;
  const positive = data?.positive ?? 0;
  const negative = data?.negative ?? 0;
  
  const intimacy = {
    affection: data?.intimacy?.affection ?? 0,
    tension: data?.intimacy?.tension ?? 0,
  };
  
  const presence = {
    attention: data?.presence?.attention ?? 0,
    distraction: data?.presence?.distraction ?? 0,
  };
  
  const generational = {
    bridge: data?.generational?.bridge ?? 0,
    gap: data?.generational?.gap ?? 0,
  };
  
  const growth = {
    growth: data?.growth?.growth ?? 0,
    fixed: data?.growth?.fixed ?? 0,
  };

  return {
    healthScore,
    total,
    positive,
    negative,
    intimacy,
    presence,
    generational,
    growth,
  };
};