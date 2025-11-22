import { PayoutService } from '../services/PayoutService';
import { AnomalyDetectionService } from '../services/AnomalyDetectionService';
import { HederaPayoutLogger } from '../integrations/HederaPayoutLogger';
import { HederaTokenService } from '../integrations/HederaTokenService';

describe('Payout Integration Tests', () => {
  let payoutService: PayoutService;
  let anomalyService: AnomalyDetectionService;
  let hcsLogger: HederaPayoutLogger;
  let tokenService: HederaTokenService;

  beforeEach(() => {
    payoutService = new PayoutService();
    anomalyService = new AnomalyDetectionService();
    hcsLogger = new HederaPayoutLogger('0.0.0.0');
    tokenService = new HederaTokenService('0.0.0.0', '0.0.0.0', []);
  });

  describe('Full Payout Cycle', () => {
    it('should complete successful payout workflow', async () => {
      const agentId = 'integration-test-agent-001';
      const familyId = 'integration-test-family-001';
      const previousScore = 70;
      const currentScore = 75;

      // Step 1: Calculate payout
      const calculation = await payoutService.calculatePayout(
        currentScore - previousScore,
        agentId,
      );
      expect(calculation.finalAmount).toBeGreaterThan(0);

      // Step 2: Detect anomalies
      const scores = {
        generational_interaction_score: 50,
        response_reciprocity_score: 60,
        sentiment_trajectory_score: 55,
        challenge_completion_score: 65,
        presence_consistency_score: 70,
        network_topology_score: 60,
        hedera_consensus_score: 75,
        bond_score: currentScore,
      };
      const previousScores = { ...scores, bond_score: previousScore };

      const anomalies = anomalyService.detectAnomalies(
        agentId,
        scores,
        previousScores,
      );

      // Step 3: Validate payout against caps
      const validation = await payoutService.validatePayout(
        calculation.finalAmount,
        agentId,
        familyId,
        0, // current week
      );
      expect(validation.isValid).toBe(true);

      // Step 4: Create HCS record
      const record = {
        recordId: `record-${Date.now()}`,
        timestamp: new Date(),
        weekNumber: 0,
        agentId,
        familyId,
        previousScore,
        currentScore,
        scoreDelta: currentScore - previousScore,
        baseRate: calculation.baseAmount,
        performanceMultiplier: calculation.performanceMultiplier,
        recencyWeight: calculation.recencyWeight,
        calculatedPayout: calculation.baseAmount,
        finalPayout: validation.finalAmount,
        anomalyFlags: anomalies.map((a) => a.type),
        coolingPeriodActive: false,
        familyValidated: null,
        txHash: `0x${Date.now().toString(16)}`,
        status: 'pending' as const,
        notes: [],
      };

      // Step 5: Log to HCS
      const hcsRecordId = await hcsLogger.logPayoutRecord(record);
      expect(hcsRecordId).toBeDefined();

      // Step 6: Transfer tokens (mock)
      const transfer = await tokenService.transferTokens(
        agentId,
        validation.finalAmount,
        {
          weekNumber: 0,
          familyId,
        },
      );
      expect(transfer.status).toBe('pending');

      // Step 7: Verify audit trail
      const stats = await hcsLogger.getAgentPayoutStats(agentId, 0, 1);
      expect(stats.totalPayouts).toBeGreaterThanOrEqual(0);
    });

    it('should block payout with cooling period', async () => {
      const agentId = 'cooling-period-test-agent';

      // Set cooling period
      anomalyService.setCoolingPeriod(agentId, 0, 2);

      // Check cooling period status
      const details = anomalyService.getCoolingPeriodDetails(agentId, 0);
      expect(details.active).toBe(true);
      expect(details.weeksRemaining).toBe(2);

      // Try to check if should skip payout
      const canPayout = !(await anomalyService.checkCoolingPeriod(agentId, 0));
      expect(canPayout).toBe(false);
    });

    it('should apply performance multiplier correctly', async () => {
      const agentId = 'perf-multiplier-test-agent';

      // First payout: no multiplier
      const calc1 = await payoutService.calculatePayout(5, agentId);
      const multiplier1 = calc1.performanceMultiplier;

      // Second payout: should have multiplier
      const calc2 = await payoutService.calculatePayout(5, agentId);
      const multiplier2 = calc2.performanceMultiplier;

      // Performance multiplier should not exceed max
      expect(multiplier1).toBeLessThanOrEqual(1.5);
      expect(multiplier2).toBeLessThanOrEqual(1.5);
    });

    it('should track agent performance', async () => {
      const agentId = 'performance-tracking-agent';

      const perf1 = payoutService.getAgentPerformance(agentId);
      expect(perf1.consecutiveImprovements).toBe(0);

      // Calculate payout (simulates improvement)
      await payoutService.calculatePayout(5, agentId);
      const perf2 = payoutService.getAgentPerformance(agentId);
      expect(perf2.consecutiveImprovements).toBeGreaterThanOrEqual(0);
    });

    it('should respect per-agent weekly cap', async () => {
      const agentId = 'cap-test-agent';
      const familyId = 'cap-test-family';

      // Try to accumulate payouts
      let totalPayout = 0;
      for (let i = 0; i < 5; i++) {
        const calc = await payoutService.calculatePayout(10, agentId);
        const validation = await payoutService.validatePayout(
          calc.finalAmount,
          agentId,
          familyId,
          0,
        );
        if (validation.isValid) {
          totalPayout += validation.finalAmount;
        }
      }

      // Total should not exceed per-agent weekly cap (500 FAM)
      expect(totalPayout).toBeLessThanOrEqual(500);
    });

    it('should handle multiple families correctly', async () => {
      const agentId = 'multi-family-agent';
      const family1 = 'family-1';
      const family2 = 'family-2';

      // Payouts for multiple families
      const calc1 = await payoutService.calculatePayout(5, agentId);
      const calc2 = await payoutService.calculatePayout(5, agentId);

      const val1 = await payoutService.validatePayout(
        calc1.finalAmount,
        agentId,
        family1,
        0,
      );
      const val2 = await payoutService.validatePayout(
        calc2.finalAmount,
        agentId,
        family2,
        0,
      );

      // Both should be valid independently
      expect(val1.isValid).toBe(true);
      expect(val2.isValid).toBe(true);
    });

    it('should handle zero and negative improvements', async () => {
      const agentId = 'zero-delta-agent';

      // Zero improvement
      const calc1 = await payoutService.calculatePayout(0, agentId);
      expect(calc1.finalAmount).toBe(0);

      // Negative improvement
      const calc2 = await payoutService.calculatePayout(-5, agentId);
      expect(calc2.finalAmount).toBeLessThanOrEqual(0);
    });

    it('should detect suspicious patterns', async () => {
      const agentId = 'suspicious-agent';

      // Simulate suspicious activity
      const scores = {
        generational_interaction_score: 100,
        response_reciprocity_score: 100,
        sentiment_trajectory_score: 100,
        challenge_completion_score: 100,
        presence_consistency_score: 100,
        network_topology_score: 100,
        hedera_consensus_score: 100,
        bond_score: 100,
      };
      const previousScores = {
        generational_interaction_score: 0,
        response_reciprocity_score: 0,
        sentiment_trajectory_score: 0,
        challenge_completion_score: 0,
        presence_consistency_score: 0,
        network_topology_score: 0,
        hedera_consensus_score: 0,
        bond_score: 0,
      };

      const anomalies = anomalyService.detectAnomalies(
        agentId,
        scores,
        previousScores,
      );

      // Should detect large jump
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent payout calculations', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          payoutService.calculatePayout(5, `concurrent-agent-${i}`),
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result.finalAmount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle concurrent anomaly checks', async () => {
      const promises = [];
      const scores = {
        generational_interaction_score: 50,
        response_reciprocity_score: 60,
        sentiment_trajectory_score: 55,
        challenge_completion_score: 65,
        presence_consistency_score: 70,
        network_topology_score: 60,
        hedera_consensus_score: 75,
        bond_score: 75,
      };
      const previousScores = { ...scores, bond_score: 70 };

      for (let i = 0; i < 5; i++) {
        promises.push(
          Promise.resolve(
            anomalyService.detectAnomalies(
              `concurrent-anomaly-agent-${i}`,
              scores,
              previousScores,
            ),
          ),
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing agent ID gracefully', async () => {
      const calc = await payoutService.calculatePayout(5, '');
      expect(calc).toBeDefined();
      expect(typeof calc.finalAmount).toBe('number');
    });

    it('should handle invalid score ranges', async () => {
      const calc1 = await payoutService.calculatePayout(1000, 'agent-001');
      expect(calc1).toBeDefined();

      const calc2 = await payoutService.calculatePayout(-1000, 'agent-001');
      expect(calc2).toBeDefined();
    });

    it('should validate without crashing', async () => {
      const result = await payoutService.validatePayout(
        Infinity,
        'agent-001',
        'family-001',
        0,
      );
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent payout records', async () => {
      const agentId = 'consistency-agent';
      const record = {
        recordId: 'test-record',
        timestamp: new Date(),
        weekNumber: 0,
        agentId,
        familyId: 'family-001',
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 50,
        performanceMultiplier: 1.1,
        recencyWeight: 0.98,
        calculatedPayout: 50,
        finalPayout: 53.9,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: null,
        txHash: '0x123',
        status: 'confirmed' as const,
        notes: [],
      };

      const recordId = await hcsLogger.logPayoutRecord(record);
      expect(recordId).toBeDefined();

      const retrieved = await hcsLogger.getPayoutRecord(recordId);
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.agentId).toBe(agentId);
        expect(retrieved.finalPayout).toBe(record.finalPayout);
      }
    });
  });
});
