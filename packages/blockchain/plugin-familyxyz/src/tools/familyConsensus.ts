/**
 * Family Consensus Tool - HCS Message Submission
 * 
 * Submits family milestone and interaction messages to Hedera Consensus Service.
 * Part of the FamilyXYZ Hedera Agent Kit plugin.
 */

import {
  Client,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { z } from "zod";

/**
 * Input schema for logging a family milestone
 */
export const logFamilyMilestoneSchema = z.object({
  familyId: z.string().describe("The family this milestone belongs to"),
  milestoneType: z.string().describe("Type of milestone (e.g., 'challenge_complete', 'bond_improved', 'story_shared')"),
  description: z.string().describe("Description of the milestone"),
  participants: z.array(z.string()).describe("Array of Hedera account IDs for participants"),
  rewardAmount: z.number().optional().describe("Optional reward amount in FAM tokens"),
  agentId: z.string().describe("The agent that recorded this milestone"),
  metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
});

export type LogFamilyMilestoneInput = z.infer<typeof logFamilyMilestoneSchema>;

/**
 * Input schema for logging a family interaction
 */
export const logFamilyInteractionSchema = z.object({
  familyId: z.string().describe("The family this interaction belongs to"),
  interactionType: z.string().describe("Type of interaction (e.g., 'wisdom', 'intimacy', 'presence')"),
  contentHash: z.string().optional().describe("SHA-256 hash of the interaction content (for privacy)"),
  participants: z.array(z.string()).describe("Array of Hedera account IDs for participants"),
  sentiment: z.object({
    polarity: z.number().min(-1).max(1),
    familyTone: z.string(),
    healthScore: z.number().min(0).max(100),
  }).optional().describe("Sentiment analysis results"),
  agentId: z.string().describe("The agent that facilitated this interaction"),
  sessionId: z.string().optional().describe("Session identifier"),
  durationSeconds: z.number().optional().describe("Duration of the interaction in seconds"),
});

export type LogFamilyInteractionInput = z.infer<typeof logFamilyInteractionSchema>;

/**
 * Result of a consensus message submission
 */
export interface ConsensusMessageResult {
  success: boolean;
  transactionId: string;
  topicId: string;
  sequenceNumber?: number;
  timestamp: string;
  messageType: string;
  messageId: string;
  message?: string;
}

/**
 * HCS-10 compliant message format for family milestones
 */
interface HCS10MilestoneMessage {
  standard: "HCS-10";
  version: "1.0";
  timestamp: number;
  messageId: string;
  sender: string;
  topicId: string;
  type: "family_milestone";
  payload: {
    familyId: string;
    agentType: string;
    milestoneType: string;
    description: string;
    participants: string[];
    rewardAmount?: number;
    metadata?: Record<string, unknown>;
  };
}

/**
 * HCS-10 compliant message format for family interactions
 */
interface HCS10InteractionMessage {
  standard: "HCS-10";
  version: "1.0";
  timestamp: number;
  messageId: string;
  sender: string;
  topicId: string;
  type: "family_interaction";
  payload: {
    familyId: string;
    agentType: string;
    interactionType: string;
    contentHash?: string;
    participants: string[];
    sentiment?: {
      polarity: number;
      familyTone: string;
      healthScore: number;
    };
    metadata?: {
      sessionId?: string;
      durationSeconds?: number;
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
 * Log a family milestone to Hedera Consensus Service
 * 
 * @param client - Hedera client with operator configured
 * @param topicId - The HCS topic ID to submit to
 * @param input - Milestone parameters
 * @returns Consensus message result
 */
export async function logFamilyMilestone(
  client: Client,
  topicId: string,
  input: LogFamilyMilestoneInput
): Promise<ConsensusMessageResult> {
  const { familyId, milestoneType, description, participants, rewardAmount, agentId, metadata } = input;

  try {
    const messageId = generateMessageId("milestone");
    
    const hcsMessage: HCS10MilestoneMessage = {
      standard: "HCS-10",
      version: "1.0",
      timestamp: Date.now(),
      messageId,
      sender: `${agentId}_v1.0`,
      topicId,
      type: "family_milestone",
      payload: {
        familyId,
        agentType: agentId,
        milestoneType,
        description,
        participants,
        rewardAmount,
        metadata,
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
      messageType: "family_milestone",
      messageId,
      message: `Milestone '${milestoneType}' logged for family ${familyId}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      transactionId: "",
      topicId,
      timestamp: new Date().toISOString(),
      messageType: "family_milestone",
      messageId: "",
      message: `Failed to log milestone: ${errorMessage}`,
    };
  }
}

/**
 * Log a family interaction to Hedera Consensus Service
 * 
 * @param client - Hedera client with operator configured
 * @param topicId - The HCS topic ID to submit to
 * @param input - Interaction parameters
 * @returns Consensus message result
 */
export async function logFamilyInteraction(
  client: Client,
  topicId: string,
  input: LogFamilyInteractionInput
): Promise<ConsensusMessageResult> {
  const { familyId, interactionType, contentHash, participants, sentiment, agentId, sessionId, durationSeconds } = input;

  try {
    const messageId = generateMessageId("interaction");
    
    const hcsMessage: HCS10InteractionMessage = {
      standard: "HCS-10",
      version: "1.0",
      timestamp: Date.now(),
      messageId,
      sender: `${agentId}_v1.0`,
      topicId,
      type: "family_interaction",
      payload: {
        familyId,
        agentType: agentId,
        interactionType,
        contentHash,
        participants,
        sentiment,
        metadata: {
          sessionId,
          durationSeconds,
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
      messageType: "family_interaction",
      messageId,
      message: `Interaction '${interactionType}' logged for family ${familyId}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      transactionId: "",
      topicId,
      timestamp: new Date().toISOString(),
      messageType: "family_interaction",
      messageId: "",
      message: `Failed to log interaction: ${errorMessage}`,
    };
  }
}

/**
 * Create the Hedera Agent Kit tool definition for logging milestones
 */
export function createLogFamilyMilestoneTool(topicId: string) {
  return {
    name: "log_family_milestone",
    description: `Log a family milestone to Hedera Consensus Service for immutable verification. Use this when a family achieves a goal, completes a challenge, or reaches a significant bonding moment. The topic ID is ${topicId}.`,
    parameters: {
      type: "object",
      properties: {
        familyId: {
          type: "string",
          description: "The family this milestone belongs to",
        },
        milestoneType: {
          type: "string",
          description: "Type of milestone (e.g., 'challenge_complete', 'bond_improved', 'story_shared', 'weekly_goal')",
        },
        description: {
          type: "string",
          description: "Description of what was achieved",
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Array of Hedera account IDs for family members involved",
        },
        rewardAmount: {
          type: "number",
          description: "Optional reward amount in FAM tokens",
        },
        agentId: {
          type: "string",
          description: "The agent that recorded this milestone",
        },
        metadata: {
          type: "object",
          description: "Additional metadata about the milestone",
        },
      },
      required: ["familyId", "milestoneType", "description", "participants", "agentId"],
    },
    execute: async (client: Client, input: LogFamilyMilestoneInput) => {
      return logFamilyMilestone(client, topicId, input);
    },
  };
}

/**
 * Create the Hedera Agent Kit tool definition for logging interactions
 */
export function createLogFamilyInteractionTool(topicId: string) {
  return {
    name: "log_family_interaction",
    description: `Log a family interaction to Hedera Consensus Service for audit trail. Use this to record agent-facilitated family conversations, coaching sessions, or relationship activities. The topic ID is ${topicId}.`,
    parameters: {
      type: "object",
      properties: {
        familyId: {
          type: "string",
          description: "The family this interaction belongs to",
        },
        interactionType: {
          type: "string",
          description: "Type of interaction (e.g., 'wisdom', 'intimacy', 'presence', 'growth', 'generational_bridge')",
        },
        contentHash: {
          type: "string",
          description: "SHA-256 hash of the interaction content for privacy preservation",
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Array of Hedera account IDs for family members involved",
        },
        sentiment: {
          type: "object",
          description: "Sentiment analysis results",
          properties: {
            polarity: { type: "number" },
            familyTone: { type: "string" },
            healthScore: { type: "number" },
          },
        },
        agentId: {
          type: "string",
          description: "The agent that facilitated this interaction",
        },
        sessionId: {
          type: "string",
          description: "Session identifier for grouping related interactions",
        },
        durationSeconds: {
          type: "number",
          description: "Duration of the interaction in seconds",
        },
      },
      required: ["familyId", "interactionType", "participants", "agentId"],
    },
    execute: async (client: Client, input: LogFamilyInteractionInput) => {
      return logFamilyInteraction(client, topicId, input);
    },
  };
}
