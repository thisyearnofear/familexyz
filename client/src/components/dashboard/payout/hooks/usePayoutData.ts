import { useState, useEffect } from 'react';

interface PayoutStats {
  totalPayouts: number;
  totalAmount: number;
  averageAmount: number;
  weeksCovered: number;
}

interface Payout {
  timestamp: number;
  amount: number;
  scoreDelta: number;
  multiplier: number;
  familyId: string;
}

interface PayoutHistory {
  agentId: string;
  payouts: Payout[];
  stats: PayoutStats;
}

interface PayoutError {
  message: string;
  status?: number;
}

export const usePayoutData = (agentId: string, weeks?: number) => {
  const [data, setData] = useState<PayoutHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PayoutError | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    const fetchPayoutHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`/api/agents/${agentId}/payouts`, window.location.origin);
        if (weeks) {
          url.searchParams.append('weeks', weeks.toString());
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch payout data',
          status: err instanceof TypeError ? undefined : 500,
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutHistory();
  }, [agentId, weeks]);

  return { data, loading, error };
};

export const useAgentPerformance = (agentId: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PayoutError | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    const fetchPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/agents/${agentId}/performance`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch performance data',
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [agentId]);

  return { data, loading, error };
};

export const usePayoutCalculator = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PayoutError | null>(null);

  const calculate = async (
    agentId: string,
    familyId: string,
    previousScore: number,
    currentScore: number,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payouts/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          familyId,
          previousScore,
          currentScore,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorObj = {
        message: err instanceof Error ? err.message : 'Calculation failed',
      };
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, calculate };
};

export const usePendingPayouts = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PayoutError | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/payouts/pending');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to fetch pending payouts',
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  return { data, loading, error };
};
