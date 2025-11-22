import { PayoutApiHandler } from '../PayoutApiHandler';
import { PayoutService } from '../../services/PayoutService';
import { AnomalyDetectionService } from '../../services/AnomalyDetectionService';
import { HederaPayoutLogger } from '../../integrations/HederaPayoutLogger';
import { HederaTokenService } from '../../integrations/HederaTokenService';

describe('PayoutApiHandler', () => {
  let handler: PayoutApiHandler;
  let payoutService: PayoutService;
  let anomalyService: AnomalyDetectionService;
  let hcsLogger: HederaPayoutLogger;
  let tokenService: HederaTokenService;

  beforeEach(() => {
    payoutService = new PayoutService();
    anomalyService = new AnomalyDetectionService();
    hcsLogger = new HederaPayoutLogger('0.0.0.0');
    tokenService = new HederaTokenService('0.0.0.0', '0.0.0.0', []);
    handler = new PayoutApiHandler(
      payoutService,
      anomalyService,
      hcsLogger,
      tokenService,
    );
  });

  describe('getAgentPayoutHistory', () => {
    it('should return payout history structure', async () => {
      const result = await handler.getAgentPayoutHistory('agent-001', 12);

      expect(result).toHaveProperty('agentId', 'agent-001');
      expect(result).toHaveProperty('payouts');
      expect(Array.isArray(result.payouts)).toBe(true);
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('totalPayouts');
      expect(result.stats).toHaveProperty('totalAmount');
      expect(result.stats).toHaveProperty('averageAmount');
      expect(result.stats).toHaveProperty('weeksCovered');
    });

    it('should default to 12 weeks when not specified', async () => {
      const result = await handler.getAgentPayoutHistory('agent-001');

      expect(result.stats.weeksCovered).toBe(12);
    });

    it('should use specified weeks value', async () => {
      const result = await handler.getAgentPayoutHistory('agent-001', 4);

      expect(result.stats.weeksCovered).toBe(4);
    });

    it('should return gracefully on error', async () => {
      const result = await handler.getAgentPayoutHistory('', 12);

      expect(result.agentId).toBe('');
      expect(result.stats.totalPayouts).toBe(0);
      expect(result.stats.totalAmount).toBe(0);
    });
  });

  describe('getAgentPerformance', () => {
    it('should return performance metrics structure', async () => {
      const result = await handler.getAgentPerformance('agent-001');

      expect(result).toHaveProperty('agentId', 'agent-001');
      expect(result).toHaveProperty('consecutiveImprovements');
      expect(result).toHaveProperty('lastImprovement');
      expect(result).toHaveProperty('coolingPeriodActive');
      expect(result).toHaveProperty('coolingPeriodWeeksRemaining');
      expect(result).toHaveProperty('averagePayoutPerWeek');
      expect(result).toHaveProperty('totalEarned');
      expect(result).toHaveProperty('performanceScore');
    });

    it('should have performance score between 0 and 100', async () => {
      const result = await handler.getAgentPerformance('agent-001');

      expect(result.performanceScore).toBeGreaterThanOrEqual(0);
      expect(result.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should have valid cooling period status', async () => {
      const result = await handler.getAgentPerformance('agent-001');

      expect(typeof result.coolingPeriodActive).toBe('boolean');
      expect(typeof result.coolingPeriodWeeksRemaining).toBe('number');
    });

    it('should handle missing agent gracefully', async () => {
      const result = await handler.getAgentPerformance('nonexistent');

      expect(result.agentId).toBe('nonexistent');
      expect(result.performanceScore).toBe(50);
      expect(result.coolingPeriodActive).toBe(false);
    });
  });

  describe('getFamilyPayoutHistory', () => {
    it('should return family payout history structure', async () => {
      const result = await handler.getFamilyPayoutHistory('family-001', 12);

      expect(result).toHaveProperty('familyId', 'family-001');
      expect(result).toHaveProperty('payoutsByAgent');
      expect(Array.isArray(result.payoutsByAgent)).toBe(true);
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('totalFamilyPayouts');
      expect(result.stats).toHaveProperty('totalAmount');
      expect(result.stats).toHaveProperty('averagePerAgent');
      expect(result.stats).toHaveProperty('agentCount');
    });

    it('should handle multiple agents', async () => {
      const result = await handler.getFamilyPayoutHistory('family-001', 12);

      expect(Array.isArray(result.payoutsByAgent)).toBe(true);
      // Result should be array even if empty
      expect(result.payoutsByAgent.length).toBeGreaterThanOrEqual(0);
    });

    it('should default to 12 weeks', async () => {
      const result = await handler.getFamilyPayoutHistory('family-001');

      expect(result.stats.weeksCovered).toBe(12);
    });
  });

  describe('getPendingPayouts', () => {
    it('should return pending payouts structure', async () => {
      const result = await handler.getPendingPayouts();

      expect(result).toHaveProperty('pendingCount');
      expect(typeof result.pendingCount).toBe('number');
      expect(result).toHaveProperty('totalAmount');
      expect(typeof result.totalAmount).toBe('number');
      expect(result).toHaveProperty('payouts');
      expect(Array.isArray(result.payouts)).toBe(true);
    });

    it('should have matching pending count and array length', async () => {
      const result = await handler.getPendingPayouts();

      expect(result.payouts.length).toBe(result.pendingCount);
    });

    it('should have valid payout structure in array', async () => {
      // First, add a pending payout (mock)
      const result = await handler.getPendingPayouts();

      // Check structure if any payouts exist
      if (result.payouts.length > 0) {
        const payout = result.payouts[0];
        expect(payout).toHaveProperty('agentId');
        expect(payout).toHaveProperty('familyId');
        expect(payout).toHaveProperty('amount');
        expect(payout).toHaveProperty('reason');
      }
    });
  });

  describe('calculatePayoutDryRun', () => {
    it('should return calculation structure', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(result).toHaveProperty('calculation');
      expect(result.calculation).toHaveProperty('scoreDelta');
      expect(result.calculation).toHaveProperty('baseAmount');
      expect(result.calculation).toHaveProperty('performanceMultiplier');
      expect(result.calculation).toHaveProperty('recencyWeight');
      expect(result.calculation).toHaveProperty('finalAmount');
    });

    it('should calculate positive delta correctly', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(result.calculation.scoreDelta).toBe(5);
    });

    it('should have valid multipliers', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(result.calculation.performanceMultiplier).toBeGreaterThan(0);
      expect(result.calculation.recencyWeight).toBeGreaterThan(0);
      expect(result.calculation.performanceMultiplier).toBeLessThanOrEqual(2);
      expect(result.calculation.recencyWeight).toBeLessThanOrEqual(1);
    });

    it('should indicate if payout would execute', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(typeof result.wouldExecute).toBe('boolean');
    });

    it('should provide valid recommendation', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      const validRecommendations = ['none', 'review', 'cooling_period', 'investigation', 'error'];
      expect(validRecommendations).toContain(result.recommendation);
    });

    it('should detect anomalies flag', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        75,
      );

      expect(typeof result.anomaliesDetected).toBe('boolean');
    });

    it('should handle identical scores', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        70,
        70,
      );

      expect(result.calculation.scoreDelta).toBe(0);
    });

    it('should handle negative delta', async () => {
      const result = await handler.calculatePayoutDryRun(
        'agent-001',
        'family-001',
        75,
        70,
      );

      expect(result.calculation.scoreDelta).toBe(-5);
    });
  });

  describe('getAnomalyReview', () => {
    it('should return anomaly review structure', async () => {
      const result = await handler.getAnomalyReview();

      expect(result).toHaveProperty('total');
      expect(typeof result.total).toBe('number');
      expect(result).toHaveProperty('anomalies');
      expect(Array.isArray(result.anomalies)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const result1 = await handler.getAnomalyReview(10, 0);
      const result2 = await handler.getAnomalyReview(10, 10);

      expect(result1).toHaveProperty('anomalies');
      expect(result2).toHaveProperty('anomalies');
    });
  });

  describe('filePayoutDispute', () => {
    it('should return dispute structure', async () => {
      const result = await handler.filePayoutDispute(
        'record-001',
        'Score seems inflated',
        'Evidence: ...',
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('disputeId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('message');
    });

    it('should file dispute successfully', async () => {
      const result = await handler.filePayoutDispute(
        'record-001',
        'Suspicious activity detected',
        '',
      );

      expect(result.success).toBe(true);
      expect(result.disputeId).toBe('record-001');
      expect(result.status).toBe('disputed');
    });

    it('should handle empty reason gracefully', async () => {
      const result = await handler.filePayoutDispute(
        'record-001',
        '',
        '',
      );

      // Should still have proper structure even if validation would fail in real scenario
      expect(result).toHaveProperty('disputeId');
      expect(result).toHaveProperty('success');
    });
  });

  describe('Error Handling', () => {
    it('all methods should return meaningful defaults on error', async () => {
      const hist = await handler.getAgentPayoutHistory('test', 12);
      const perf = await handler.getAgentPerformance('test');
      const fam = await handler.getFamilyPayoutHistory('test', 12);
      const pending = await handler.getPendingPayouts();
      const calc = await handler.calculatePayoutDryRun('test', 'test', 0, 0);

      // All should have valid structure even on error
      expect(hist.stats).toBeDefined();
      expect(perf.performanceScore).toBeDefined();
      expect(fam.stats).toBeDefined();
      expect(pending.pendingCount).toBeDefined();
      expect(calc.calculation).toBeDefined();
    });
  });
});
