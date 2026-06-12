import { useQuery } from '@tanstack/react-query';
import type { DailyTake } from '@/lib/agents';

export function useDailyTake() {
  return useQuery<DailyTake>({
    queryKey: ['daily-take'],
    queryFn: () => fetch('/api/today').then((r) => r.json()),
    staleTime: 3_600_000,
  });
}
