/**
 * AnomalyDetectionService Unit Tests
 * 
 * Tests all anomaly detection and gaming prevention logic
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AnomalyDetectionService, formatAnomalyFlags } from "../AnomalyDetectionService";
import { CompositeBondScore } from "../BondScoreService";

// Helper to create a mock bond score
function createMockScore(
  overrides: Partial<CompositeBondScore> = {}
): CompositeBondScore {
  return {
    familyId: "family-1",
    weekNumber: 47,
    timestamp: new Date(),
    scores: {
      generationalInteraction: 70,
      responseReciprocity: 70,
      sentimentTrajectory: 70,
      challengeCompletion: 70,
      presenceConsistency: 70,
      networkTopology: 70,
      hederaConsensus: 70,
    },
    weights: {
      generationalInteraction: 0.15,
      responseReciprocity: 0.15,
      sentimentTrajectory: 0.15,
      challengeCompletion: 0.15,
      presenceConsistency: 0.15,
      networkTopology: 0.15,
      hederaConsensus: 0.1,
    },
    compositeScore: 70,
    trend: "stable",
    ...overrides,
  };
}

describe("AnomalyDetectionService", () => {
  let service: AnomalyDetectionService;

  beforeEach(() => {
    service = new AnomalyDetectionService();
  });

  describe("detectAnomalies", () => {
    it("should return empty array for null previous scores", async () => {
      const current = createMockScore();
      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        null,
        current,
        47
      );

      expect(flags).toEqual([]);
    });

    it("should detect single-signal jump", async () => {
      const previous = createMockScore();
      const current = createMockScore({
        scores: {
          ...previous.scores,
          generationalInteraction: 100, // +30 (42% jump)
        },
        compositeScore: 80,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags).toContainEqual(
        expect.objectContaining({
          type: "SINGLE_SIGNAL_JUMP",
          severity: "high",
        })
      );
    });

    it("should detect uniform signal changes", async () => {
      const previous = createMockScore();
      const current = createMockScore({
        scores: {
          generationalInteraction: 75,
          responseReciprocity: 75,
          sentimentTrajectory: 75,
          challengeCompletion: 75,
          presenceConsistency: 75,
          networkTopology: 75,
          hederaConsensus: 75,
        },
        compositeScore: 75,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags).toContainEqual(
        expect.objectContaining({
          type: "SIGNAL_UNIFORMITY",
        })
      );
    });

    it("should detect score contradiction", async () => {
      const previous = createMockScore();
      const current = createMockScore({
        scores: {
          generationalInteraction: 50,
          responseReciprocity: 50,
          sentimentTrajectory: 50,
          challengeCompletion: 50,
          presenceConsistency: 50,
          networkTopology: 50,
          hederaConsensus: 100, // Only one signal improved
        },
        compositeScore: 80, // But overall score improved (contradiction!)
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags).toContainEqual(
        expect.objectContaining({
          type: "SCORE_CONTRADICTION",
          severity: "high",
        })
      );
    });

    it("should detect large jumps in composite score", async () => {
      const previous = createMockScore({ compositeScore: 60 });
      const current = createMockScore({
        scores: {
          generationalInteraction: 85,
          responseReciprocity: 85,
          sentimentTrajectory: 85,
          challengeCompletion: 85,
          presenceConsistency: 85,
          networkTopology: 85,
          hederaConsensus: 85,
        },
        compositeScore: 85, // 41.7% jump
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags).toContainEqual(
        expect.objectContaining({
          type: "LARGE_JUMP",
          severity: "high",
        })
      );
    });

    it("should not flag realistic improvements", async () => {
      const previous = createMockScore({ compositeScore: 70 });
      const current = createMockScore({
        scores: {
          generationalInteraction: 75,
          responseReciprocity: 74,
          sentimentTrajectory: 76,
          challengeCompletion: 72,
          presenceConsistency: 75,
          networkTopology: 73,
          hederaConsensus: 74,
        },
        compositeScore: 74, // 5.7% jump - realistic
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags.length).toBe(0);
    });
  });

  describe("Cooling period management", () => {
    it("should start cooling period", () => {
      service.setCoolingPeriod("agent-1", 47, 2);

      const isActive = service.getCoolingPeriodDetails("agent-1", 47);
      expect(isActive.active).toBe(true);
      expect(isActive.weeksRemaining).toBe(2);
    });

    it("should check if cooling period is active", async () => {
      service.setCoolingPeriod("agent-1", 47, 2);

      const week47 = await service.checkCoolingPeriod("agent-1", 47);
      expect(week47).toBe(true);

      const week48 = await service.checkCoolingPeriod("agent-1", 48);
      expect(week48).toBe(true);

      const week49 = await service.checkCoolingPeriod("agent-1", 49);
      expect(week49).toBe(false);
    });

    it("should report weeks remaining", () => {
      service.setCoolingPeriod("agent-1", 47, 5);

      const details = service.getCoolingPeriodDetails("agent-1", 47);
      expect(details.weeksRemaining).toBe(5);

      const details2 = service.getCoolingPeriodDetails("agent-1", 50);
      expect(details2.weeksRemaining).toBe(2);
    });

    it("should expire cooling period", async () => {
      service.setCoolingPeriod("agent-1", 47, 2);

      const week49 = await service.checkCoolingPeriod("agent-1", 49);
      expect(week49).toBe(false);

      const details = service.getCoolingPeriodDetails("agent-1", 50);
      expect(details.active).toBe(false);
    });

    it("should handle multiple agents separately", () => {
      service.setCoolingPeriod("agent-1", 47, 2);
      service.setCoolingPeriod("agent-2", 47, 1);

      const details1 = service.getCoolingPeriodDetails("agent-1", 48);
      const details2 = service.getCoolingPeriodDetails("agent-2", 48);

      expect(details1.weeksRemaining).toBe(1);
      expect(details2.weeksRemaining).toBe(0);
    });
  });

  describe("evaluateFlags", () => {
    it("should return no action for empty flags", () => {
      const result = service.evaluateFlags([]);

      expect(result.hasHighSeverity).toBe(false);
      expect(result.recommendedAction).toBe("none");
      expect(result.totalConfidence).toBe(0);
    });

    it("should recommend investigation for high severity", () => {
      const flags = [
        {
          type: "SCORE_CONTRADICTION" as const,
          severity: "high" as const,
          confidence: 0.9,
          details: "Test",
          recommendation: "investigation" as const,
        },
      ];

      const result = service.evaluateFlags(flags);

      expect(result.hasHighSeverity).toBe(true);
      expect(result.recommendedAction).toBe("investigation");
    });

    it("should recommend cooling period for multiple flags", () => {
      const flags = [
        {
          type: "SINGLE_SIGNAL_JUMP" as const,
          severity: "medium" as const,
          confidence: 0.7,
          details: "Test 1",
          recommendation: "review" as const,
        },
        {
          type: "SIGNAL_UNIFORMITY" as const,
          severity: "medium" as const,
          confidence: 0.7,
          details: "Test 2",
          recommendation: "review" as const,
        },
      ];

      const result = service.evaluateFlags(flags);

      expect(result.recommendedAction).toBe("cooling_period");
    });

    it("should recommend cooling period for high confidence flag", () => {
      const flags = [
        {
          type: "LARGE_JUMP" as const,
          severity: "medium" as const,
          confidence: 0.95,
          details: "Test",
          recommendation: "review" as const,
        },
      ];

      const result = service.evaluateFlags(flags);

      expect(result.recommendedAction).toBe("cooling_period");
    });

    it("should calculate average confidence", () => {
      const flags = [
        {
          type: "SINGLE_SIGNAL_JUMP" as const,
          severity: "low" as const,
          confidence: 0.6,
          details: "Test 1",
          recommendation: "review" as const,
        },
        {
          type: "LARGE_JUMP" as const,
          severity: "low" as const,
          confidence: 0.8,
          details: "Test 2",
          recommendation: "review" as const,
        },
      ];

      const result = service.evaluateFlags(flags);

      expect(result.totalConfidence).toBeCloseTo(0.7);
    });
  });

  describe("Configuration", () => {
    it("should get default configuration", () => {
      const config = service.getConfig();

      expect(config.singleSignalThreshold).toBe(30);
      expect(config.largeJumpThreshold).toBe(20);
      expect(config.coolingAfterLargeGain).toBe(1);
    });

    it("should update configuration", () => {
      service.updateConfig({ singleSignalThreshold: 50 });
      const config = service.getConfig();

      expect(config.singleSignalThreshold).toBe(50);
    });

    it("should initialize with custom configuration", () => {
      const customService = new AnomalyDetectionService({
        largeJumpThreshold: 30,
      });
      const config = customService.getConfig();

      expect(config.largeJumpThreshold).toBe(30);
    });
  });

  describe("Helper functions", () => {
    it("formatAnomalyFlags should handle empty array", () => {
      const result = formatAnomalyFlags([]);
      expect(result).toBe("No anomalies detected");
    });

    it("formatAnomalyFlags should format single flag", () => {
      const flags = [
        {
          type: "SINGLE_SIGNAL_JUMP" as const,
          severity: "high" as const,
          confidence: 0.9,
          details: "Signal improved 50%",
          recommendation: "review" as const,
        },
      ];

      const result = formatAnomalyFlags(flags);
      expect(result).toContain("[HIGH]");
      expect(result).toContain("SINGLE_SIGNAL_JUMP");
      expect(result).toContain("Signal improved 50%");
    });

    it("formatAnomalyFlags should format multiple flags", () => {
      const flags = [
        {
          type: "SINGLE_SIGNAL_JUMP" as const,
          severity: "high" as const,
          confidence: 0.9,
          details: "Signal 1",
          recommendation: "review" as const,
        },
        {
          type: "LARGE_JUMP" as const,
          severity: "medium" as const,
          confidence: 0.8,
          details: "Signal 2",
          recommendation: "review" as const,
        },
      ];

      const result = formatAnomalyFlags(flags);
      expect(result).toContain("[HIGH]");
      expect(result).toContain("[MEDIUM]");
      expect(result).toContain("Signal 1");
      expect(result).toContain("Signal 2");
    });
  });

  describe("Edge cases", () => {
    it("should handle zero previous scores", async () => {
      const previous = createMockScore({ compositeScore: 0 });
      const current = createMockScore({ compositeScore: 50 });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      // Should not crash due to division by zero
      expect(Array.isArray(flags)).toBe(true);
    });

    it("should handle very high score changes", async () => {
      const previous = createMockScore({ compositeScore: 1 });
      const current = createMockScore({ compositeScore: 100 });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      // Should detect large jump
      expect(flags.some(f => f.type === "LARGE_JUMP")).toBe(true);
    });

    it("should handle mixed improvements and declines", async () => {
      const previous = createMockScore();
      const current = createMockScore({
        scores: {
          generationalInteraction: 80,
          responseReciprocity: 60,
          sentimentTrajectory: 80,
          challengeCompletion: 60,
          presenceConsistency: 80,
          networkTopology: 60,
          hederaConsensus: 80,
        },
        compositeScore: 72,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      // Mixed results don't necessarily trigger anomalies
      expect(Array.isArray(flags)).toBe(true);
    });
  });

  describe("Scenario: Gaming detection", () => {
    it("should catch single-signal manipulation", async () => {
      const previous = createMockScore();
      const current = createMockScore({
        scores: {
          ...previous.scores,
          generationalInteraction: 95, // Suspicious jump
        },
        compositeScore: 73,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      const evaluation = service.evaluateFlags(flags);
      expect(evaluation.hasHighSeverity || evaluation.recommendedAction !== "none").toBe(true);
    });

    it("should catch coordinated uniform improvements", async () => {
      const previous = createMockScore({ compositeScore: 70 });
      const current = createMockScore({
        scores: {
          generationalInteraction: 77,
          responseReciprocity: 77,
          sentimentTrajectory: 77,
          challengeCompletion: 77,
          presenceConsistency: 77,
          networkTopology: 77,
          hederaConsensus: 77,
        },
        compositeScore: 77,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      expect(flags.some(f => f.type === "SIGNAL_UNIFORMITY")).toBe(true);
    });

    it("should catch suspicious reversals", async () => {
      // Large jump, then immediate decline
      const previous = createMockScore({ compositeScore: 70 });
      const current = createMockScore({
        scores: {
          generationalInteraction: 100,
          responseReciprocity: 100,
          sentimentTrajectory: 100,
          challengeCompletion: 100,
          presenceConsistency: 100,
          networkTopology: 100,
          hederaConsensus: 100,
        },
        compositeScore: 100,
      });

      const flags = await service.detectAnomalies(
        "agent-1",
        "family-1",
        previous,
        current,
        48
      );

      // Should detect large jump and uniformity
      expect(flags.length > 0).toBe(true);
    });
  });
});
