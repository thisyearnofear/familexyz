import { renderHook, waitFor } from '@testing-library/react';
import {
  usePayoutData,
  useAgentPerformance,
  usePayoutCalculator,
  usePendingPayouts,
} from '../hooks/usePayoutData';

// Mock fetch
global.fetch = jest.fn();

describe('Payout Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePayoutData', () => {
    it('should fetch payout history', async () => {
      const mockData = {
        agentId: 'agent-001',
        payouts: [],
        stats: {
          totalPayouts: 0,
          totalAmount: 0,
          averageAmount: 0,
          weeksCovered: 12,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => usePayoutData('agent-001', 12));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      const { result } = renderHook(() => usePayoutData('agent-001', 12));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Network error');
      expect(result.current.data).toBe(null);
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => usePayoutData('agent-001', 12));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBe(null);
    });

    it('should use default weeks when not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          agentId: 'agent-001',
          payouts: [],
          stats: { totalPayouts: 0, totalAmount: 0, averageAmount: 0, weeksCovered: 12 },
        }),
      });

      const { result } = renderHook(() => usePayoutData('agent-001'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.stats.weeksCovered).toBe(12);
    });

    it('should not fetch without agentId', () => {
      const { result } = renderHook(() => usePayoutData(''));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('useAgentPerformance', () => {
    it('should fetch agent performance', async () => {
      const mockData = {
        agentId: 'agent-001',
        consecutiveImprovements: 3,
        lastImprovement: null,
        coolingPeriodActive: false,
        coolingPeriodWeeksRemaining: 0,
        averagePayoutPerWeek: 50,
        totalEarned: 200,
        performanceScore: 75,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAgentPerformance('agent-001'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should have performance score in valid range', async () => {
      const mockData = {
        agentId: 'agent-001',
        consecutiveImprovements: 0,
        lastImprovement: null,
        coolingPeriodActive: false,
        coolingPeriodWeeksRemaining: 0,
        averagePayoutPerWeek: 0,
        totalEarned: 0,
        performanceScore: 50,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useAgentPerformance('agent-001'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.performanceScore).toBeGreaterThanOrEqual(0);
      expect(result.current.data?.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('usePayoutCalculator', () => {
    it('should calculate payout', async () => {
      const mockResult = {
        calculation: {
          scoreDelta: 5,
          baseAmount: 50,
          performanceMultiplier: 1.1,
          recencyWeight: 0.98,
          finalAmount: 53.9,
        },
        anomaliesDetected: false,
        recommendation: 'none',
        wouldExecute: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const { result } = renderHook(() => usePayoutCalculator());

      const response = await result.current.calculate(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(response).toEqual(mockResult);
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.error).toBe(null);
    });

    it('should calculate with POST method', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => usePayoutCalculator());

      await result.current.calculate(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect((global.fetch as jest.Mock).mock.calls[0][1]?.method).toBe('POST');
    });

    it('should send request body correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => usePayoutCalculator());

      await result.current.calculate(
        'agent-001',
        'family-001',
        70,
        75,
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body);

      expect(body.agentId).toBe('agent-001');
      expect(body.familyId).toBe('family-001');
      expect(body.previousScore).toBe(70);
      expect(body.currentScore).toBe(75);
    });

    it('should handle calculation errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Calculation failed'),
      );

      const { result } = renderHook(() => usePayoutCalculator());

      await expect(
        result.current.calculate('agent-001', 'family-001', 70, 75),
      ).rejects.toThrow();

      expect(result.current.error).toBeDefined();
    });
  });

  describe('usePendingPayouts', () => {
    it('should fetch pending payouts', async () => {
      const mockData = {
        pendingCount: 2,
        totalAmount: 100,
        payouts: [
          {
            agentId: 'agent-001',
            familyId: 'family-001',
            amount: 50,
            reason: 'Weekly payout',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => usePendingPayouts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should have matching pending count', async () => {
      const mockData = {
        pendingCount: 2,
        totalAmount: 100,
        payouts: [
          {
            agentId: 'agent-001',
            familyId: 'family-001',
            amount: 50,
            reason: 'Weekly payout',
          },
          {
            agentId: 'agent-002',
            familyId: 'family-002',
            amount: 50,
            reason: 'Weekly payout',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => usePendingPayouts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.payouts.length).toBe(
        result.current.data?.pendingCount,
      );
    });
  });

  describe('Shared Behavior', () => {
    it('all hooks should return loading initially', () => {
      const hook1 = renderHook(() => usePayoutData('agent-001'));
      const hook2 = renderHook(() => useAgentPerformance('agent-001'));
      const hook3 = renderHook(() => usePendingPayouts());

      expect(hook1.result.current.loading).toBe(true);
      expect(hook2.result.current.loading).toBe(true);
      expect(hook3.result.current.loading).toBe(true);
    });

    it('all hooks should have error property', () => {
      const hook1 = renderHook(() => usePayoutData('agent-001'));
      const hook2 = renderHook(() => useAgentPerformance('agent-001'));
      const hook3 = renderHook(() => usePendingPayouts());

      expect(hook1.result.current.error).toBe(null);
      expect(hook2.result.current.error).toBe(null);
      expect(hook3.result.current.error).toBe(null);
    });
  });
});
