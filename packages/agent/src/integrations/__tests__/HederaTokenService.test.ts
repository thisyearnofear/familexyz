/**
 * HederaTokenService Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  HederaTokenService, 
  formatTokenTransfer,
  formatBatchResult 
} from "../HederaTokenService";

describe("HederaTokenService", () => {
  let service: HederaTokenService;
  const tokenId = "0.0.0.0.123456";
  const treasuryId = "0.0.0.0.999999";
  const signers = ["signer1", "signer2"];

  beforeEach(() => {
    service = new HederaTokenService(tokenId, treasuryId, signers);
  });

  describe("Basic operations", () => {
    it("should initialize correctly", () => {
      const treasury = service.getTreasuryAccount();
      expect(treasury.tokenId).toBe(tokenId);
      expect(treasury.accountId).toBe(treasuryId);
    });

    it("should get required signers", () => {
      const retrievedSigners = service.getRequiredSigners();
      expect(retrievedSigners).toEqual(signers);
    });

    it("should create token transfer", async () => {
      const transfer = await service.createTransfer(
        "0.0.0.0.111111",
        100,
        47,
        "agent-1"
      );

      expect(transfer.amount).toBe(100);
      expect(transfer.toAccount).toBe("0.0.0.0.111111");
      expect(transfer.status).toBe("pending");
      expect(transfer.memo).toContain("Week 47");
    });

    it("should transfer tokens", async () => {
      const txHash = await service.transferTokens(
        "0.0.0.0.111111",
        100,
        "Test transfer"
      );

      expect(txHash).toBeDefined();
      expect(txHash.length).toBeGreaterThan(0);
    });
  });

  describe("Agent account management", () => {
    it("should associate token with agent", async () => {
      const result = await service.associateTokenWithAgent(
        "agent-1",
        "0.0.0.0.111111"
      );

      expect(result).toBe(true);
    });

    it("should get agent account", async () => {
      await service.associateTokenWithAgent("agent-1", "0.0.0.0.111111");
      const account = await service.getAgentAccount("agent-1");

      expect(account).toBeDefined();
      expect(account?.agentId).toBe("agent-1");
      expect(account?.associatedToken).toBe(true);
    });

    it("should get agent balance", async () => {
      await service.associateTokenWithAgent("agent-1", "0.0.0.0.111111");
      await service.transferTokens("0.0.0.0.111111", 100, "Transfer");

      const balance = await service.getAgentBalance("agent-1");
      expect(balance).toBe(100);
    });

    it("should check token association", async () => {
      const notAssociated = await service.isTokenAssociated("0.0.0.0.111111");
      expect(notAssociated).toBe(false);

      await service.associateTokenWithAgent("agent-1", "0.0.0.0.111111");
      const associated = await service.isTokenAssociated("0.0.0.0.111111");
      expect(associated).toBe(true);
    });
  });

  describe("Batch execution", () => {
    it("should execute batch of payouts", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
        { agentId: "agent-2", toAccount: "0.0.0.0.222222", amount: 200 },
        { agentId: "agent-3", toAccount: "0.0.0.0.333333", amount: 150 },
      ];

      const batch = await service.executePendingPayouts(47, payouts);

      expect(batch.transfers.length).toBe(3);
      expect(batch.totalAmount).toBe(450);
      expect(batch.successCount).toBe(3);
      expect(batch.failureCount).toBe(0);
      expect(batch.status).toBe("completed");
    });

    it("should get batch result", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
      ];

      const batch = await service.executePendingPayouts(47, payouts);
      const retrieved = service.getBatchResult(batch.batchId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.totalAmount).toBe(100);
    });

    it("should get all batches", async () => {
      const payouts1 = [{ agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 }];
      const payouts2 = [{ agentId: "agent-2", toAccount: "0.0.0.0.222222", amount: 200 }];

      await service.executePendingPayouts(47, payouts1);
      await service.executePendingPayouts(48, payouts2);

      const batches = service.getAllBatches();
      expect(batches.length).toBe(2);
    });

    it("should get recent batches with limit", async () => {
      const payouts = [{ agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 }];

      for (let i = 0; i < 15; i++) {
        await service.executePendingPayouts(47 + i, payouts);
      }

      const recent = service.getRecentBatches(10);
      expect(recent.length).toBe(10);
    });
  });

  describe("Transfer management", () => {
    it("should get pending transfers", async () => {
      const transfer = await service.createTransfer(
        "0.0.0.0.111111",
        100,
        47,
        "agent-1"
      );

      const pending = service.getPendingTransfers();
      expect(pending.length).toBe(1);
      expect(pending[0].transferId).toBe(transfer.transferId);
    });

    it("should get transfer status", async () => {
      const transfer = await service.createTransfer(
        "0.0.0.0.111111",
        100,
        47,
        "agent-1"
      );

      const status = service.getTransferStatus(transfer.transferId);
      expect(status).toBeDefined();
      expect(status?.amount).toBe(100);
    });
  });

  describe("Statistics", () => {
    it("should calculate transfer statistics", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
        { agentId: "agent-2", toAccount: "0.0.0.0.222222", amount: 200 },
      ];

      await service.executePendingPayouts(47, payouts);

      const stats = service.getTransferStats();

      expect(stats.totalTransfers).toBe(2);
      expect(stats.confirmedTransfers).toBe(2);
      expect(stats.pendingTransfers).toBe(0);
      expect(stats.totalAmountTransferred).toBe(300);
    });

    it("should check token supply", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
      ];

      await service.executePendingPayouts(47, payouts);

      const supply = await service.checkTokenSupply();

      expect(supply.totalSupply).toBe(1000000);
      expect(supply.circulatingSupply).toBe(100);
      expect(supply.remaining).toBe(999900);
    });
  });

  describe("Configuration", () => {
    it("should update signers", () => {
      const newSigners = ["new-signer-1", "new-signer-2"];
      service.updateSigners(newSigners);

      const retrieved = service.getRequiredSigners();
      expect(retrieved).toEqual(newSigners);
    });
  });

  describe("Data management", () => {
    it("should clear all data", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
      ];

      await service.executePendingPayouts(47, payouts);
      
      service.clearData();

      const stats = service.getTransferStats();
      expect(stats.totalTransfers).toBe(0);
      expect(stats.confirmedTransfers).toBe(0);
    });
  });

  describe("Helper functions", () => {
    it("should format token transfer", async () => {
      const transfer = await service.createTransfer(
        "0.0.0.0.111111",
        100,
        47,
        "agent-1"
      );

      const formatted = formatTokenTransfer(transfer);
      expect(formatted).toContain("100");
      expect(formatted).toContain("0.0.0.0.111111");
      expect(formatted).toContain("pending");
    });

    it("should format batch result", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
        { agentId: "agent-2", toAccount: "0.0.0.0.222222", amount: 200 },
      ];

      const batch = await service.executePendingPayouts(47, payouts);
      const formatted = formatBatchResult(batch);

      expect(formatted).toContain("300");
      expect(formatted).toContain("2");
      expect(formatted).toContain("completed");
    });
  });

  describe("Scenario: Weekly agent payouts", () => {
    it("should process multiple agents in one week", async () => {
      // Associate agents first
      await service.associateTokenWithAgent("agent-1", "0.0.0.0.111111");
      await service.associateTokenWithAgent("agent-2", "0.0.0.0.222222");
      await service.associateTokenWithAgent("agent-3", "0.0.0.0.333333");

      // Process week 47 payouts
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
        { agentId: "agent-2", toAccount: "0.0.0.0.222222", amount: 200 },
        { agentId: "agent-3", toAccount: "0.0.0.0.333333", amount: 150 },
      ];

      const batch = await service.executePendingPayouts(47, payouts);

      // Verify batch
      expect(batch.successCount).toBe(3);
      expect(batch.totalAmount).toBe(450);

      // Verify agent balances
      expect(await service.getAgentBalance("agent-1")).toBe(100);
      expect(await service.getAgentBalance("agent-2")).toBe(200);
      expect(await service.getAgentBalance("agent-3")).toBe(150);

      // Verify cumulative
      const stats = service.getTransferStats();
      expect(stats.totalAmountTransferred).toBe(450);
    });

    it("should process multiple weeks for same agent", async () => {
      await service.associateTokenWithAgent("agent-1", "0.0.0.0.111111");

      // Week 47
      await service.executePendingPayouts(47, [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 100 },
      ]);

      // Week 48
      await service.executePendingPayouts(48, [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 150 },
      ]);

      // Week 49
      await service.executePendingPayouts(49, [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 120 },
      ]);

      const balance = await service.getAgentBalance("agent-1");
      expect(balance).toBe(370);

      const stats = service.getTransferStats();
      expect(stats.totalTransfers).toBe(3);
      expect(stats.totalAmountTransferred).toBe(370);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero amount transfers", async () => {
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: 0 },
      ];

      const batch = await service.executePendingPayouts(47, payouts);

      expect(batch.transfers.length).toBe(1);
      expect(batch.totalAmount).toBe(0);
    });

    it("should handle large transfer amounts", async () => {
      const largeAmount = 1000000;
      const payouts = [
        { agentId: "agent-1", toAccount: "0.0.0.0.111111", amount: largeAmount },
      ];

      const batch = await service.executePendingPayouts(47, payouts);

      expect(batch.totalAmount).toBe(largeAmount);
    });

    it("should handle many agents", async () => {
      const payouts = Array.from({ length: 100 }, (_, i) => ({
        agentId: `agent-${i}`,
        toAccount: `0.0.0.0.${100000 + i}`,
        amount: 10 * (i + 1),
      }));

      const batch = await service.executePendingPayouts(47, payouts);

      expect(batch.successCount).toBe(100);
    });
  });
});
