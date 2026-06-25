import { useQuery } from '@tanstack/react-query';

interface BondScoreEntry {
  week: number;
  bondScore: number;
  trend: string;
  delta: number | null;
  timestamp: number;
}

interface BondScoreCurrent {
  bondScore: number;
  trend: string;
  delta: number | null;
  timestamp: number;
}

interface BondScoreSignals {
  generational: number;
  reciprocity: number;
  sentiment: number;
  challenges: number;
  presence: number;
  topology: number;
  consensus: number;
}

interface BondScoreResponse {
  familyId: string;
  current: BondScoreCurrent;
  history: BondScoreEntry[];
  signals: BondScoreSignals;
}

export function useBondScore(familyId = 'primary') {
  return useQuery<BondScoreResponse | null>({
    queryKey: ['bond-score', familyId],
    queryFn: async () => {
      const res = await fetch(`/api/families/${familyId}/bond-score`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30_000,
  });
}

export type { BondScoreResponse, BondScoreCurrent, BondScoreEntry, BondScoreSignals };

