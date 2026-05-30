/**
 * Family Rewards Agent
 * 
 * An agent that demonstrates real Hedera transactions by:
 * 1. Logging a family milestone to HCS
 * 2. Transferring FAM tokens as a reward
 * 3. Recording the payout to the audit trail
 * 
 * This agent fulfills the Week 2 Hedera AI Agent Bounty requirements:
 * - Uses ≥2 non-query tools from Hedera Agent Kit
 * - Completes a commercial transaction (token transfer)
 * 
 * Part of the FamilyXYZ Hedera Agent Kit plugin.
 */

import { Client } from "@hashgraph/sdk";
import {
  transferFamilyTokens,
  logFamilyMilestone,
  recordAgentPayout,
  type TransferFamilyTokensInput,
  type LogFamilyMilestoneInput,
  type RecordAgentPayoutInput,
  type TransferFamilyTokensResult,
  type ConsensusMessageResult,
  type PayoutRecordResult,
} from "../tools/index.js";

/**
 * Configuration for the Family Rewards Agent
 */
export interface FamilyRewardsAgentConfig {
  /** Hedera Consensus Service topic ID for family messages */
  hcsTopicId: string;
  /** Hedera Token Service FAM token ID */
  famTokenId: string;
  /** The agent ID (e.g., 'wisdom', 'intimacy', 'growth') */
  agentId: string;
  /** Default reward amount for milestones */
  defaultRewardAmount: number;
}

/**
 * Result of a complete reward workflow
 */
export interface RewardWorkflowResult {
  success: boolean;
  milestone: ConsensusMessageResult;
  payout: PayoutRecordResult;
  transfer?: TransferFamilyTokensResult;
  summary: string;
}

/**
 * Family Rewards Agent
 * 
 * Orchestrates the complete reward workflow:
 * 1. Log milestone to HCS (immutable record)
 * 2. Record payout to HCS (audit trail)
 * 3. Transfer FAM tokens (commercial transaction)
 */
export class FamilyRewardsAgent {
  private config: FamilyRewardsAgentConfig;

  constructor(config: FamilyRewardsAgentConfig) {
    this.config = {
      ...config,
      defaultRewardAmount: config.defaultRewardAmount ?? 100,
    };
  }

  /**
   * Execute a complete reward workflow
   * 
   * This demonstrates a real commercial transaction:
   * 1. Log the milestone to HCS for immutable verification
   * 2. Record the payout decision to HCS for audit
   * 3. Transfer FAM tokens to the recipient
   * 
   * @param client - Hedera client with operator configured
   * @param milestoneInput - Milestone details
   * @param recipientAccountId - Hedera account to receive tokens
   * @param payoutInput - Payout calculation details
   * @returns Complete workflow result
   */
  async executeRewardWorkflow(
    client: Client,
    milestoneInput: {
      familyId: string;
      milestoneType: string;
      description: string;
      participants: string[];
    },
    recipientAccountId: string,
    payoutInput: {
      weekNumber: number;
      scoreDelta: number;
      finalPayout: number;
      baseRate?: number;
      performanceMultiplier?: number;
      recencyWeight?: number;
    }
  ): Promise<RewardWorkflowResult> {
    const { familyId, milestoneType, description, participants } = milestoneInput;
    const { weekNumber, scoreDelta, finalPayout, baseRate, performanceMultiplier, recencyWeight } = payoutInput;

    // Step 1: Log milestone to HCS
    const milestoneResult = await this.logMilestone(client, {
      familyId,
      milestoneType,
      description,
      participants,
      rewardAmount: finalPayout,
      agentId: this.config.agentId,
    });

    if (!milestoneResult.success) {
      return {
        success: false,
        milestone: milestoneResult,
        payout: { success: false, transactionId: "", topicId: this.config.hcsTopicId, timestamp: "", recordId: "", message: "Skipped due to milestone failure" },
        summary: `Failed to log milestone: ${milestoneResult.message}`,
      };
    }

    // Step 2: Record payout to HCS audit trail
    const payoutResult = await this.recordPayout(client, {
      agentId: this.config.agentId,
      familyId,
      weekNumber,
      scoreDelta,
      finalPayout,
      baseRate,
      performanceMultiplier,
      recencyWeight,
    });

    if (!payoutResult.success) {
      return {
        success: false,
        milestone: milestoneResult,
        payout: payoutResult,
        summary: `Failed to record payout: ${payoutResult.message}`,
      };
    }

    // Step 3: Transfer FAM tokens (commercial transaction)
    const transferResult = await this.transferReward(client, {
      recipientAccountId,
      amount: finalPayout,
      reason: milestoneType,
      familyId,
      agentId: this.config.agentId,
    });

    return {
      success: transferResult.success,
      milestone: milestoneResult,
      payout: payoutResult,
      transfer: transferResult,
      summary: transferResult.success
        ? `Successfully rewarded ${finalPayout} FAM tokens to ${recipientAccountId} for ${milestoneType}`
        : `Transfer failed: ${transferResult.message}`,
    };
  }

  /**
   * Log a family milestone to Hedera Consensus Service
   */
  private async logMilestone(
    client: Client,
    input: LogFamilyMilestoneInput
  ): Promise<ConsensusMessageResult> {
    return logFamilyMilestone(client, this.config.hcsTopicId, input);
  }

  /**
   * Record payout decision to HCS audit trail
   */
  private async recordPayout(
    client: Client,
    input: RecordAgentPayoutInput
  ): Promise<PayoutRecordResult> {
    return recordAgentPayout(client, this.config.hcsTopicId, this.config.famTokenId, input);
  }

  /**
   * Transfer FAM tokens as reward
   */
  private async transferReward(
    client: Client,
    input: TransferFamilyTokensInput
  ): Promise<TransferFamilyTokensResult> {
    return transferFamilyTokens(client, this.config.famTokenId, input);
  }

  /**
   * Get the agent configuration
   */
  getConfig(): FamilyRewardsAgentConfig {
    return { ...this.config };
  }

  /**
   * Get tool definitions for agent runtime registration
   * 
   * Returns the three tools this agent uses:
   * 1. log_family_milestone - HCS message submission
   * 2. record_agent_payout - HCS payout recording
   * 3. transfer_family_tokens - HTS token transfer
   */
  getTools() {
    return [
      {
        name: "log_family_milestone",
        description: `Log a family milestone to Hedera Consensus Service. Use this when a family achieves a goal or completes a challenge. Topic ID: ${this.config.hcsTopicId}`,
        parameters: {
          type: "object",
          properties: {
            familyId: { type: "string" },
            milestoneType: { type: "string" },
            description: { type: "string" },
            participants: { type: "array", items: { type: "string" } },
            rewardAmount: { type: "number" },
            agentId: { type: "string" },
          },
          required: ["familyId", "milestoneType", "description", "participants", "agentId"],
        },
      },
      {
        name: "record_agent_payout",
        description: `Record an agent payout to HCS audit trail. Creates verifiable record of payout decisions. Topic ID: ${this.config.hcsTopicId}, Token ID: ${this.config.famTokenId}`,
        parameters: {
          type: "object",
          properties: {
            agentId: { type: "string" },
            familyId: { type: "string" },
            weekNumber: { type: "number" },
            scoreDelta: { type: "number" },
            finalPayout: { type: "number" },
            baseRate: { type: "number" },
            performanceMultiplier: { type: "number" },
            recencyWeight: { type: "number" },
          },
          required: ["agentId", "familyId", "weekNumber", "scoreDelta", "finalPayout"],
        },
      },
      {
        name: "transfer_family_tokens",
        description: `Transfer FAM tokens to a family member as reward. This is a real commercial transaction on Hedera. Token ID: ${this.config.famTokenId}`,
        parameters: {
          type: "object",
          properties: {
            recipientAccountId: { type: "string" },
            amount: { type: "number" },
            reason: { type: "string" },
            familyId: { type: "string" },
            agentId: { type: "string" },
          },
          required: ["recipientAccountId", "amount", "reason", "familyId"],
        },
      },
    ];
  }
}

/**
 * Create a configured Family Rewards Agent
 */
export function createFamilyRewardsAgent(config: FamilyRewardsAgentConfig): FamilyRewardsAgent {
  return new FamilyRewardsAgent(config);
}
