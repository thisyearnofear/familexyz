/**
 * useBondScore Hook
 * Manages bond score data fetching, caching, and refresh logic
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { BondScoreResponse } from '@/types/bondScoring';
import { REFRESH_INTERVAL_MS } from '../constants';

interface UseBondScoreState {
  data: BondScoreResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseBondScoreReturn extends UseBondScoreState {
  refetch: () => Promise<void>;
}

/**
 * Fetches and manages bond score data for a family
 * @param familyId - The ID of the family to fetch scores for
 * @returns Bond score data, loading state, error, and refetch function
 */
export function useBondScore(familyId: string): UseBondScoreReturn {
  const [state, setState] = useState<UseBondScoreState>({
    data: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBondScore = useCallback(async () => {
    if (!familyId) {
      setState({ data: null, loading: false, error: 'Missing familyId' });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await apiClient.getFamilyBondScore(familyId);

      if (isMountedRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bond score';
        setState({ data: null, loading: false, error: errorMessage });
      }
    }
  }, [familyId]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchBondScore();

    // Set up refresh interval
    intervalRef.current = setInterval(() => {
      fetchBondScore();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [familyId, fetchBondScore]);

  return {
    ...state,
    refetch: fetchBondScore,
  };
}
