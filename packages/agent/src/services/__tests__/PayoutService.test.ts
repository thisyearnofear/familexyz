/**
 * PayoutService Unit Tests
 * 
 * Tests all payout calculations, multipliers, and validation logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PayoutService, formatPayout, formatScoreDelta } from "../PayoutService";

describe("PayoutService", () => {
  let service: PayoutService;

  beforeEach(() => {
    service = new PayoutService();
  });

  describe("calculatePayout", () => {
    it("should return 0 payout for no score improvement", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        75,
        75 // Same score
      );

      expect(result.calculatedPayout).toBe(0);
      expect(result.scoreDelta).toBe(0);
    });

    it("should return 0 payout for negative score delta", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        75,
        70 // Score declined
      );

      expect(result.calculatedPayout).toBe(0);
      expect(result.scoreDelta).toBe(-5);
    });

    it("should calculate correct base payout for score improvement", async () => {
      // 5 point improvement × 10 tenths × 1.0 base rate = 50 FAM
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75 // +5 points
      );

      expect(result.scoreDelta).toBe(5);
      expect(result.calculatedPayout).toBe(50);
      expect(result.baseRate).toBe(1.0);
      expect(result.performanceMultiplier).toBe(1.0);
      expect(result.recencyWeight).toBe(1.0);
    });

    it("should apply performance multiplier for consecutive improvements", async () => {
      // 5 point improvement with 3 consecutive improvements should have 1.2x multiplier
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 3, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBeCloseTo(1.2);
      expect(result.calculatedPayout).toBeCloseTo(60); // 50 × 1.2
    });

    it("should apply recency weight for recent improvements", async () => {
      // 5 point improvement with 2 weeks since last = 0.95x weight
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 2 }
      );

      expect(result.recencyWeight).toBeCloseTo(0.95);
      expect(result.calculatedPayout).toBeCloseTo(47.5); // 50 × 0.95
    });

    it("should apply both multipliers together", async () => {
      // 5 points + 3 consecutive + 1 week since last = 50 × 1.2 × 0.98 = 58.8
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 3, weeksSinceLastImprovement: 1 }
      );

      expect(result.performanceMultiplier).toBeCloseTo(1.2);
      expect(result.recencyWeight).toBeCloseTo(0.98);
      expect(result.calculatedPayout).toBeCloseTo(58.8);
    });

    it("should handle small score improvements (below minimum)", async () => {
      // 0.05 point improvement below minimum threshold should return 0
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        75,
        75.05 // +0.05 points
      );

      expect(result.calculatedPayout).toBe(0);
      expect(result.scoreDelta).toBe(0.05);
    });

    it("should handle maximum score improvement", async () => {
      // 30 point improvement = 300 tenths × 1.0 = 300 FAM
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        40,
        70 // +30 points
      );

      expect(result.scoreDelta).toBe(30);
      expect(result.calculatedPayout).toBe(300);
    });

    it("should set correct timestamp", async () => {
      const beforeTime = new Date();
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75
      );
      const afterTime = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe("validatePayout", () => {
    it("should validate payout with no constraints violated", async () => {
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75 // 50 FAM payout
      );

      const result = await service.validatePayout(calculation, 100, 200, 5000);

      expect(result.isValid).toBe(true);
      expect(result.finalPayout).toBe(50);
      expect(result.anomalyFlags).toEqual([]);
    });

    it("should cap payout against weekly agent limit", async () => {
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75 // 50 FAM
      );

      // Agent already has 480 FAM this week, max is 500
      const result = await service.validatePayout(calculation, 480, 0, 0);

      expect(result.finalPayout).toBeLessThanOrEqual(20); // Only room for 20 more
      expect(result.anomalyFlags).toContain("AGENT_WEEKLY_LIMIT_HIT");
    });

    it("should cap payout against weekly family limit", async () => {
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75 // 50 FAM
      );

      // Family already has 980 FAM this week, max is 1000
      const result = await service.validatePayout(calculation, 0, 980, 0);

      expect(result.finalPayout).toBeLessThanOrEqual(20); // Only room for 20 more
      expect(result.anomalyFlags).toContain("FAMILY_WEEKLY_LIMIT_HIT");
    });

    it("should cap payout against monthly cumulative limit", async () => {
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75 // 50 FAM
      );

      // Agent already has 49980 FAM this month, max is 50000
      const result = await service.validatePayout(calculation, 0, 0, 49980);

      expect(result.finalPayout).toBeLessThanOrEqual(20); // Only room for 20 more
      expect(result.anomalyFlags).toContain("MONTHLY_CUMULATIVE_LIMIT_HIT");
    });

    it("should flag large payouts for family validation", async () => {
      // Create a large improvement
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        20,
        30 // 100 FAM base payout
      );

      const result = await service.validatePayout(calculation, 0, 0, 0);

      expect(result.requiresFamilyValidation).toBe(true);
    });

    it("should set isValid to false if payout is zero", async () => {
      const calculation = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        75,
        75 // 0 payout
      );

      const result = await service.validatePayout(calculation, 0, 0, 0);

      expect(result.isValid).toBe(false);
      expect(result.finalPayout).toBe(0);
    });
  });

  describe("Performance multiplier calculation", () => {
    it("should return 1.0x for first improvement", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 1, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBe(1.0);
    });

    it("should return 1.1x for 2 consecutive improvements", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 2, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBe(1.1);
    });

    it("should return 1.2x for 3 consecutive improvements", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 3, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBeCloseTo(1.2);
    });

    it("should return 1.3x for 4 consecutive improvements", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 4, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBeCloseTo(1.3);
    });

    it("should cap multiplier at 1.5x for 5+ consecutive improvements", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 10, weeksSinceLastImprovement: 0 }
      );

      expect(result.performanceMultiplier).toBeLessThanOrEqual(1.5);
    });
  });

  describe("Recency weight calculation", () => {
    it("should return 1.0x for current week", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 0 }
      );

      expect(result.recencyWeight).toBe(1.0);
    });

    it("should return 0.98x for 1 week old", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 1 }
      );

      expect(result.recencyWeight).toBeCloseTo(0.98);
    });

    it("should return 0.95x for 2 weeks old", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 2 }
      );

      expect(result.recencyWeight).toBeCloseTo(0.95);
    });

    it("should return 0.90x for 3 weeks old", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 3 }
      );

      expect(result.recencyWeight).toBeCloseTo(0.90);
    });

    it("should decay to minimum 0.5x for very old improvements", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 20 }
      );

      expect(result.recencyWeight).toBeGreaterThanOrEqual(0.5);
      expect(result.recencyWeight).toBeLessThan(1.0);
    });
  });

  describe("Agent performance tracking", () => {
    it("should initialize agent performance cache", () => {
      const perf = service.getAgentPerformance("agent-1");

      expect(perf.agentId).toBe("agent-1");
      expect(perf.totalPayouts).toBe(0);
      expect(perf.consecutiveImprovements).toBe(0);
    });

    it("should update agent performance", () => {
      service.getAgentPerformance("agent-1");
      service.updateAgentPerformance("agent-1", {
        totalPayouts: 5,
        totalFamEarned: 250,
      });

      const perf = service.getAgentPerformance("agent-1");
      expect(perf.totalPayouts).toBe(5);
      expect(perf.totalFamEarned).toBe(250);
    });

    it("should track multiple agents separately", () => {
      const perf1 = service.getAgentPerformance("agent-1");
      const perf2 = service.getAgentPerformance("agent-2");

      service.updateAgentPerformance("agent-1", { totalPayouts: 10 });
      service.updateAgentPerformance("agent-2", { totalPayouts: 5 });

      expect(service.getAgentPerformance("agent-1").totalPayouts).toBe(10);
      expect(service.getAgentPerformance("agent-2").totalPayouts).toBe(5);
    });
  });

  describe("Configuration", () => {
    it("should get default configuration", () => {
      const config = service.getConfig();

      expect(config.baseRate).toBe(1.0);
      expect(config.maxPerWeek).toBe(500);
      expect(config.maxPerFamily).toBe(1000);
      expect(config.minPayout).toBe(0.1);
    });

    it("should update configuration", () => {
      service.updateConfig({ baseRate: 2.0 });
      const config = service.getConfig();

      expect(config.baseRate).toBe(2.0);
    });

    it("should initialize with custom configuration", () => {
      const customService = new PayoutService({ baseRate: 0.5 });
      const config = customService.getConfig();

      expect(config.baseRate).toBe(0.5);
    });
  });

  describe("Helper functions", () => {
    it("formatPayout should format numbers correctly", () => {
      expect(formatPayout(100)).toBe("100.00 FAM");
      expect(formatPayout(100.5)).toBe("100.50 FAM");
      expect(formatPayout(100, 0)).toBe("100 FAM");
    });

    it("formatScoreDelta should format positive deltas", () => {
      expect(formatScoreDelta(5)).toBe("+5.00 pt");
      expect(formatScoreDelta(5.5)).toBe("+5.50 pt");
    });

    it("formatScoreDelta should format negative deltas", () => {
      expect(formatScoreDelta(-3)).toBe("-3.00 pt");
      expect(formatScoreDelta(-3.5)).toBe("-3.50 pt");
    });

    it("formatScoreDelta should handle zero", () => {
      expect(formatScoreDelta(0)).toBe("+0.00 pt");
    });
  });

  describe("Scenario: Consistent improvement", () => {
    it("should calculate correct payout for improving agent", async () => {
      // Week 47: 70 → 75 (+5, first improvement)
      // Week 48: 75 → 78 (+3, second improvement)
      // Week 49: 78 → 82 (+4, third improvement)
      
      const week47 = await service.calculatePayout(
        "agent-1",
        "family-1",
        47,
        70,
        75,
        { consecutiveImprovements: 1, weeksSinceLastImprovement: 0 }
      );
      expect(week47.calculatedPayout).toBe(50);

      const week48 = await service.calculatePayout(
        "agent-1",
        "family-1",
        48,
        75,
        78,
        { consecutiveImprovements: 2, weeksSinceLastImprovement: 0 }
      );
      expect(week48.calculatedPayout).toBeCloseTo(33); // 30 × 1.1

      const week49 = await service.calculatePayout(
        "agent-1",
        "family-1",
        49,
        78,
        82,
        { consecutiveImprovements: 3, weeksSinceLastImprovement: 0 }
      );
      expect(week49.calculatedPayout).toBeCloseTo(48); // 40 × 1.2
    });
  });

  describe("Scenario: Declining improvement", () => {
    it("should calculate lower payout for declining agent", async () => {
      const result = await service.calculatePayout(
        "agent-1",
        "family-1",
        50,
        75,
        76,
        { consecutiveImprovements: 0, weeksSinceLastImprovement: 5 }
      );

      // 1 point improvement × 10 × 1.0 base × <1.0 recency weight
      expect(result.calculatedPayout).toBeLessThan(10);
      expect(result.performanceMultiplier).toBe(1.0);
      expect(result.recencyWeight).toBeLessThan(1.0);
    });
  });
});
