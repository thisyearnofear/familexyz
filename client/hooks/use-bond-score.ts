import { useQuery } from '@tanstack/react-query';

interface BondScore {
  score: number;
  trend: string;
  signals: Record<string, number>;
  weekNumber: number;
}

export function useBondScore(familyId = 'primary') {
  return useQuery<BondScore | null>({
    queryKey: ['bond-score', familyId],
    queryFn: async () => {
      const res = await fetch(`/api/families/${familyId}/bond-score`);
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
}
