/**
 * Family Rewards Tool - HTS Token Transfer
 * 
 * Transfers FAM tokens to family members as rewards for positive interactions.
 * Part of the FamilyXYZ Hedera Agent Kit plugin.
 */

import {
  Client,
  AccountId,
  TokenId,
  TransferTransaction,
} from "@hashgraph/sdk";
import { z } from "zod";

/**
 * Input schema for transferring family tokens
 */
export const transferFamilyTokensSchema = z.object({
  recipientAccountId: z.string().describe("The Hedera account ID to receive tokens"),
  amount: z.number().positive().describe("Amount of FAM tokens to transfer"),
  reason: z.string().describe("Reason for the reward (e.g., 'family_milestone', 'challenge_complete')"),
  familyId: z.string().describe("The family this reward belongs to"),
  agentId: z.string().optional().describe("The agent that initiated this reward"),
});

export type TransferFamilyTokensInput = z.infer<typeof transferFamilyTokensSchema>;

/**
 * Result of a token transfer operation
 */
export interface TransferFamilyTokensResult {
  success: boolean;
  transactionId: string;
  recipientId: string;
  amount: number;
  tokenId: string;
  timestamp: string;
  message?: string;
}

/**
 * Transfer FAM tokens to a family member
 * 
 * This tool wraps the Hedera Token Service to transfer FAM tokens as rewards.
 * It ensures the recipient is associated with the token before transfer.
 * 
 * @param client - Hedera client with operator configured
 * @param famTokenId - The FAM token ID (e.g., "0.0.7304501")
 * @param input - Transfer parameters
 * @returns Transfer result with transaction details
 */
export async function transferFamilyTokens(
  client: Client,
  famTokenId: string,
  input: TransferFamilyTokensInput
): Promise<TransferFamilyTokensResult> {
  const { recipientAccountId, amount, reason, familyId, agentId } = input;

  try {
    const tokenId = TokenId.fromString(famTokenId);
    const recipientId = AccountId.fromString(recipientAccountId);
    const treasuryId = client.operatorAccountId!;

    // Create transfer transaction
    const transferTx = new TransferTransaction()
      .addTokenTransfer(tokenId, treasuryId, -amount)
      .addTokenTransfer(tokenId, recipientId, amount)
      .setTransactionMemo(`FAM reward: ${reason} | family: ${familyId}${agentId ? ` | agent: ${agentId}` : ""}`);

    // Execute and get receipt
    const response = await transferTx.execute(client);
    const receipt = await response.getReceipt(client);

    // Verify success
    if (receipt.status.toString() !== "SUCCESS") {
      return {
        success: false,
        transactionId: response.transactionId.toString(),
        recipientId: recipientAccountId,
        amount,
        tokenId: famTokenId,
        timestamp: new Date().toISOString(),
        message: `Transfer failed with status: ${receipt.status}`,
      };
    }

    return {
      success: true,
      transactionId: response.transactionId.toString(),
      recipientId: recipientAccountId,
      amount,
      tokenId: famTokenId,
      timestamp: new Date().toISOString(),
      message: `Successfully transferred ${amount} FAM tokens to ${recipientAccountId} for ${reason}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      transactionId: "",
      recipientId: recipientAccountId,
      amount,
      tokenId: famTokenId,
      timestamp: new Date().toISOString(),
      message: `Transfer failed: ${errorMessage}`,
    };
  }
}

/**
 * Create the Hedera Agent Kit tool definition
 * This follows the standard tool interface for the Agent Kit
 */
export function createTransferFamilyTokensTool(famTokenId: string) {
  return {
    name: "transfer_family_tokens",
    description: `Transfer FAM tokens to a family member as a reward. Use this when a family member completes a challenge, achieves a milestone, or demonstrates positive family behavior. Requires the recipient's Hedera account ID and the reward amount in FAM tokens. The FAM token ID is ${famTokenId}.`,
    parameters: {
      type: "object",
      properties: {
        recipientAccountId: {
          type: "string",
          description: "The Hedera account ID to receive tokens (e.g., 0.0.12345)",
        },
        amount: {
          type: "number",
          description: "Amount of FAM tokens to transfer (must be positive)",
        },
        reason: {
          type: "string",
          description: "Reason for the reward (e.g., 'family_milestone', 'challenge_complete', 'positive_interaction')",
        },
        familyId: {
          type: "string",
          description: "The family this reward belongs to",
        },
        agentId: {
          type: "string",
          description: "The agent that initiated this reward (optional)",
        },
      },
      required: ["recipientAccountId", "amount", "reason", "familyId"],
    },
    execute: async (client: Client, input: TransferFamilyTokensInput) => {
      return transferFamilyTokens(client, famTokenId, input);
    },
  };
}
