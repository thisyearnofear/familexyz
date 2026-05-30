/**
 * Family Payout Tool - Agent Payout Recording
 * 
 * Records agent payout decisions to Hedera Consensus Service for audit.
 * Part of the FamilyXYZ Hedera Agent Kit plugin.
 */

import {
  Client,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { z } from "zod";

/**
 * Input schema for recording an agent payout
 */
export const recordAgentPayoutSchema = z.object({
  agentId: z.string().describe("The agent that earned this payout"),
  familyId: z.string().describe("The family this payout is for"),
  weekNumber: z.number().describe("The week number this payout corresponds to"),
  scoreDelta: z.number().describe("The change in family bond score"),
  finalPayout: z.number().describe("The final payout amount in FAM tokens"),
  baseRate: z.number().optional().describe("The base rate used in calculation"),
  performanceMultiplier: z.number().optional().describe("The performance multiplier applied"),
  recencyWeight: z.number().optional().describe("The recency weight applied"),
  anomalyFlags: z.array(z.string()).optional().describe("Any anomaly flags detected"),
  familyValidated: z.boolean().optional().describe("Whether family has validated this payout"),
});

export type RecordAgentPayoutInput = z.infer<typeof recordAgentPayoutSchema>;

/**
 * Result of a payout record submission
 */
export interface PayoutRecordResult {
  success: boolean;
  transactionId: string;
  topicId: string;
  sequenceNumber?: number;
  timestamp: string;
  recordId: string;
  message?: string;
}

/**
 * HCS-10 compliant message format for agent payouts
 */
interface HCS10PayoutMessage {
  standard: "HCS-10";
  version: "1.0";
  timestamp: number;
  messageId: string;
  sender: string;
  topicId: string;
  type: "family_reward";
  payload: {
    familyId: string;
    agentType: string;
    recipient: string;
    amount: number;
    tokenId: string;
    reason: string;
    transactionId: string;
    metadata: {
      weekNumber: number;
      scoreDelta: number;
      baseRate?: number;
      performanceMultiplier?: number;
      recencyWeight?: number;
      anomalyFlags?: string[];
      familyValidated?: boolean;
    };
  };
}

/**
 * Generate a unique message ID
 */
function generateMessageId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Record an agent payout decision to Hedera Consensus Service
 * 
 * This creates an immutable, verifiable record of every payout decision,
 * enabling transparent audit trails and preventing disputes.
 * 
 * @param client - Hedera client with operator configured
 * @param topicId - The HCS topic ID to submit to
 * @param famTokenId - The FAM token ID for the payout
 * @param input - Payout parameters
 * @returns Payout record result
 */
export async function recordAgentPayout(
  client: Client,
  topicId: string,
  famTokenId: string,
  input: RecordAgentPayoutInput
): Promise<PayoutRecordResult> {
  const {
    agentId,
    familyId,
    weekNumber,
    scoreDelta,
    finalPayout,
    baseRate,
    performanceMultiplier,
    recencyWeight,
    anomalyFlags,
    familyValidated,
  } = input;

  try {
    const messageId = generateMessageId("reward");
    const transactionId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const hcsMessage: HCS10PayoutMessage = {
      standard: "HCS-10",
      version: "1.0",
      timestamp: Date.now(),
      messageId,
      sender: "tokenomics_engine_v1.0",
      topicId,
      type: "family_reward",
      payload: {
        familyId,
        agentType: agentId,
        recipient: client.operatorAccountId?.toString() || "",
        amount: finalPayout,
        tokenId: famTokenId,
        reason: "agent_payout",
        transactionId,
        metadata: {
          weekNumber,
          scoreDelta,
          baseRate,
          performanceMultiplier,
          recencyWeight,
          anomalyFlags,
          familyValidated,
        },
      },
    };

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(JSON.stringify(hcsMessage));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      success: true,
      transactionId: response.transactionId.toString(),
      topicId,
      sequenceNumber: receipt.topicSequenceNumber?.toNumber(),
      timestamp: new Date().toISOString(),
      recordId: messageId,
      message: `Agent ${agentId} payout of ${finalPayout} FAM recorded for family ${familyId} (week ${weekNumber})`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      transactionId: "",
      topicId,
      timestamp: new Date().toISOString(),
      recordId: "",
      message: `Failed to record payout: ${errorMessage}`,
    };
  }
}

/**
 * Create the Hedera Agent Kit tool definition for recording payouts
 */
export function createRecordAgentPayoutTool(topicId: string, famTokenId: string) {
  return {
    name: "record_agent_payout",
    description: `Record an agent payout decision to Hedera Consensus Service for immutable audit trail. Use this after calculating an agent's payout to create a transparent, verifiable record. The topic ID is ${topicId} and FAM token ID is ${famTokenId}.`,
    parameters: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "The agent that earned this payout (e.g., 'wisdom', 'intimacy', 'growth')",
        },
        familyId: {
          type: "string",
          description: "The family this payout is for",
        },
        weekNumber: {
          type: "number",
          description: "The week number this payout corresponds to",
        },
        scoreDelta: {
          type: "number",
          description: "The change in family bond score that triggered this payout",
        },
        finalPayout: {
          type: "number",
          description: "The final payout amount in FAM tokens",
        },
        baseRate: {
          type: "number",
          description: "The base rate used in calculation (optional)",
        },
        performanceMultiplier: {
          type: "number",
          description: "The performance multiplier applied (optional, typically 1.0-1.5)",
        },
        recencyWeight: {
          type: "number",
          description: "The recency weight applied (optional, typically 0.8-1.0)",
        },
        anomalyFlags: {
          type: "array",
          items: { type: "string" },
          description: "Any anomaly flags detected during validation (optional)",
        },
        familyValidated: {
          type: "boolean",
          description: "Whether family has validated this payout (optional)",
        },
      },
      required: ["agentId", "familyId", "weekNumber", "scoreDelta", "finalPayout"],
    },
    execute: async (client: Client, input: RecordAgentPayoutInput) => {
      return recordAgentPayout(client, topicId, famTokenId, input);
    },
  };
}
