import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PayoutHistory } from '../components/PayoutHistory';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { PayoutCalculator } from '../components/PayoutCalculator';
import { AnomalyReview } from '../components/AnomalyReview';

// Mock fetch globally
global.fetch = jest.fn();

describe('Payout Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PayoutHistory', () => {
    it('should render with loading state', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {})
      );

      render(<PayoutHistory agentId="agent-001" weeks={12} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render payouts when data loads', async () => {
      const mockData = {
        agentId: 'agent-001',
        payouts: [
          {
            weekNumber: 0,
            amount: 50,
            scoreDelta: 5,
            multiplier: 1.1,
            timestamp: new Date().toISOString(),
          },
        ],
        stats: {
          totalPayouts: 1,
          totalAmount: 50,
          averageAmount: 50,
          weeksCovered: 12,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<PayoutHistory agentId="agent-001" weeks={12} />);

      await waitFor(() => {
        expect(screen.getByText(/50/)).toBeInTheDocument();
      });
    });

    it('should display error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Fetch failed')
      );

      render(<PayoutHistory agentId="agent-001" weeks={12} />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no payouts', async () => {
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

      render(<PayoutHistory agentId="agent-001" weeks={12} />);

      await waitFor(() => {
        expect(screen.getByText(/no payouts/i)).toBeInTheDocument();
      });
    });
  });

  describe('PerformanceMetrics', () => {
    it('should render performance score gauge', async () => {
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

      render(<PerformanceMetrics agentId="agent-001" />);

      await waitFor(() => {
        expect(screen.getByText(/75/)).toBeInTheDocument();
      });
    });

    it('should display metrics grid', async () => {
      const mockData = {
        agentId: 'agent-001',
        consecutiveImprovements: 5,
        lastImprovement: null,
        coolingPeriodActive: false,
        coolingPeriodWeeksRemaining: 0,
        averagePayoutPerWeek: 50,
        totalEarned: 500,
        performanceScore: 80,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<PerformanceMetrics agentId="agent-001" />);

      await waitFor(() => {
        expect(screen.getByText(/consecutive/i)).toBeInTheDocument();
        expect(screen.getByText(/500/)).toBeInTheDocument();
      });
    });

    it('should show cooling period alert when active', async () => {
      const mockData = {
        agentId: 'agent-001',
        consecutiveImprovements: 0,
        lastImprovement: null,
        coolingPeriodActive: true,
        coolingPeriodWeeksRemaining: 2,
        averagePayoutPerWeek: 50,
        totalEarned: 200,
        performanceScore: 50,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<PerformanceMetrics agentId="agent-001" />);

      await waitFor(() => {
        expect(screen.getByText(/cooling.*period/i)).toBeInTheDocument();
      });
    });
  });

  describe('PayoutCalculator', () => {
    it('should render input fields', () => {
      render(<PayoutCalculator agentId="agent-001" familyId="family-001" />);

      expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current/i)).toBeInTheDocument();
    });

    it('should calculate payout on submit', async () => {
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

      render(<PayoutCalculator agentId="agent-001" familyId="family-001" />);

      const previousInput = screen.getByLabelText(/previous/i) as HTMLInputElement;
      const currentInput = screen.getByLabelText(/current/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /calculate/i });

      fireEvent.change(previousInput, { target: { value: '70' } });
      fireEvent.change(currentInput, { target: { value: '75' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/53.9/)).toBeInTheDocument();
      });
    });

    it('should show anomaly detection results', async () => {
      const mockResult = {
        calculation: {
          scoreDelta: 100,
          baseAmount: 500,
          performanceMultiplier: 1.0,
          recencyWeight: 1.0,
          finalAmount: 500,
        },
        anomaliesDetected: true,
        recommendation: 'investigation',
        wouldExecute: false,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      render(<PayoutCalculator agentId="agent-001" familyId="family-001" />);

      const previousInput = screen.getByLabelText(/previous/i) as HTMLInputElement;
      const currentInput = screen.getByLabelText(/current/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /calculate/i });

      fireEvent.change(previousInput, { target: { value: '0' } });
      fireEvent.change(currentInput, { target: { value: '100' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/anomaly/i)).toBeInTheDocument();
      });
    });

    it('should validate input before calculation', () => {
      render(<PayoutCalculator agentId="agent-001" familyId="family-001" />);

      const submitButton = screen.getByRole('button', { name: /calculate/i });

      // Should not call fetch without valid inputs
      fireEvent.click(submitButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('AnomalyReview', () => {
    it('should render pending payouts list', async () => {
      const mockData = {
        pendingCount: 1,
        totalAmount: 100,
        payouts: [
          {
            agentId: 'agent-001',
            familyId: 'family-001',
            amount: 100,
            reason: 'Weekly payout',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<AnomalyReview />);

      await waitFor(() => {
        expect(screen.getByText(/agent-001/)).toBeInTheDocument();
      });
    });

    it('should display empty state when no pending payouts', async () => {
      const mockData = {
        pendingCount: 0,
        totalAmount: 0,
        payouts: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<AnomalyReview />);

      await waitFor(() => {
        expect(screen.getByText(/no pending/i)).toBeInTheDocument();
      });
    });

    it('should allow filing a dispute', async () => {
      const mockListData = {
        pendingCount: 1,
        totalAmount: 100,
        payouts: [
          {
            agentId: 'agent-001',
            familyId: 'family-001',
            amount: 100,
            reason: 'Weekly payout',
          },
        ],
      };

      const mockDisputeData = {
        success: true,
        disputeId: 'record-001',
        status: 'disputed',
        message: 'Dispute filed successfully',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockListData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDisputeData,
        });

      render(<AnomalyReview />);

      await waitFor(() => {
        expect(screen.getByText(/agent-001/)).toBeInTheDocument();
      });

      const disputeButton = screen.getByRole('button', { name: /file.*dispute/i });
      fireEvent.click(disputeButton);

      const reasonInput = screen.getByPlaceholderText(/reason/i) as HTMLInputElement;
      fireEvent.change(reasonInput, { target: { value: 'Suspicious activity' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });

    it('should show stats header with pending count', async () => {
      const mockData = {
        pendingCount: 3,
        totalAmount: 300,
        payouts: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<AnomalyReview />);

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
        expect(screen.getByText(/300/)).toBeInTheDocument();
      });
    });
  });
});
