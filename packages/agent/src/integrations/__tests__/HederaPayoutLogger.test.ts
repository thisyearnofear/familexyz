/**
 * HederaPayoutLogger Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  HederaPayoutLogger, 
  generateHcsTopicId,
  formatPayoutRecord 
} from "../HederaPayoutLogger";

describe("HederaPayoutLogger", () => {
  let logger: HederaPayoutLogger;
  const topicId = generateHcsTopicId();

  beforeEach(() => {
    logger = new HederaPayoutLogger(topicId);
  });

  describe("Basic operations", () => {
    it("should initialize with topic ID", () => {
      expect(logger.getHcsTopicId()).toBe(topicId);
    });

    it("should start with empty storage", () => {
      expect(logger.getTotalRecords()).toBe(0);
    });

    it("should log payout record", async () => {
      const record = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.2,
        recencyWeight: 0.98,
        calculatedPayout: 50,
        finalPayout: 58.8,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "pending" as const,
        notes: [],
      };

      const hcsRef = await logger.logPayoutRecord(record);
      
      expect(hcsRef).toContain("HCS:");
      expect(logger.getTotalRecords()).toBe(1);
    });
  });

  describe("Audit trail retrieval", () => {
    it("should retrieve agent audit trail", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const record2 = {
        recordId: "rec-2",
        timestamp: new Date(),
        weekNumber: 46,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 68,
        currentScore: 70,
        scoreDelta: 2,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 20,
        finalPayout: 20,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x456def",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      await logger.logPayoutRecord(record2);

      const trail = await logger.getPayoutAuditTrail("agent-1");
      
      expect(trail.length).toBe(2);
      expect(trail[0].weekNumber).toBe(47); // Most recent first
      expect(trail[1].weekNumber).toBe(46);
    });

    it("should retrieve family audit trail", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const record2 = {
        recordId: "rec-2",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-2",
        familyId: "family-1",
        previousScore: 60,
        currentScore: 65,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x456def",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      await logger.logPayoutRecord(record2);

      const trail = await logger.getFamilyPayoutAuditTrail("family-1");
      
      expect(trail.length).toBe(2);
      expect(trail.every(r => r.familyId === "family-1")).toBe(true);
    });

    it("should get single record", async () => {
      const record = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record);
      const retrieved = await logger.getPayoutRecord("rec-1");

      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe("agent-1");
    });
  });

  describe("Statistics", () => {
    it("should calculate agent stats", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const record2 = {
        recordId: "rec-2",
        timestamp: new Date(),
        weekNumber: 48,
        agentId: "agent-1",
        familyId: "family-2",
        previousScore: 60,
        currentScore: 65,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 40,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x456def",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      await logger.logPayoutRecord(record2);

      const stats = await logger.getAgentPayoutStats("agent-1", 47, 48);

      expect(stats.recordCount).toBe(2);
      expect(stats.totalPayouts).toBe(90);
      expect(stats.averagePayout).toBe(45);
      expect(stats.maxPayout).toBe(50);
      expect(stats.minPayout).toBe(40);
      expect(stats.confirmedCount).toBe(2);
    });

    it("should calculate family stats", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const record2 = {
        recordId: "rec-2",
        timestamp: new Date(),
        weekNumber: 48,
        agentId: "agent-2",
        familyId: "family-1",
        previousScore: 60,
        currentScore: 65,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 60,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x456def",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      await logger.logPayoutRecord(record2);

      const stats = await logger.getFamilyPayoutStats("family-1", 47, 48);

      expect(stats.recordCount).toBe(2);
      expect(stats.totalPayouts).toBe(110);
      expect(stats.agentCount).toBe(2);
      expect(stats.confirmedCount).toBe(2);
    });
  });

  describe("Anomaly tracking", () => {
    it("should retrieve anomalous payouts", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: ["LARGE_JUMP"],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const record2 = {
        recordId: "rec-2",
        timestamp: new Date(),
        weekNumber: 48,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 75,
        currentScore: 80,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x456def",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      await logger.logPayoutRecord(record2);

      const anomalies = await logger.getAnomalousPayouts(47, 48);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].recordId).toBe("rec-1");
    });

    it("should detect disputed payouts", async () => {
      const record = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: false,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record);
      const anomalies = await logger.getAnomalousPayouts();

      expect(anomalies.length).toBe(1);
    });
  });

  describe("Validation", () => {
    it("should update family validation status", async () => {
      const record = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: null,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record);
      const updated = await logger.updateFamilyValidation("rec-1", true, "Family confirmed improvement");

      expect(updated).toBe(true);
      
      const retrieved = await logger.getPayoutRecord("rec-1");
      expect(retrieved?.familyValidated).toBe(true);
      expect(retrieved?.notes.length).toBeGreaterThan(0);
    });
  });

  describe("Export", () => {
    it("should export audit trail", async () => {
      const record1 = {
        recordId: "rec-1",
        timestamp: new Date(),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      await logger.logPayoutRecord(record1);
      const exported = await logger.exportAuditTrail();

      expect(exported.length).toBe(1);
      expect(exported[0].recordId).toBe("rec-1");
    });
  });

  describe("Helper functions", () => {
    it("should generate HCS topic ID", () => {
      const topicId = generateHcsTopicId();
      expect(topicId).toMatch(/^0\.0\.0\.0\.\d+$/);
    });

    it("should format payout record", () => {
      const record = {
        recordId: "rec-1",
        timestamp: new Date("2025-11-22"),
        weekNumber: 47,
        agentId: "agent-1",
        familyId: "family-1",
        previousScore: 70,
        currentScore: 75,
        scoreDelta: 5,
        baseRate: 1.0,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 50,
        finalPayout: 50,
        anomalyFlags: [],
        coolingPeriodActive: false,
        familyValidated: undefined,
        txHash: "0x123abc",
        status: "confirmed" as const,
        notes: [],
      };

      const formatted = formatPayoutRecord(record);
      expect(formatted).toContain("Agent agent-1");
      expect(formatted).toContain("Family family-1");
      expect(formatted).toContain("50.00 FAM");
      expect(formatted).toContain("confirmed");
    });
  });
});
