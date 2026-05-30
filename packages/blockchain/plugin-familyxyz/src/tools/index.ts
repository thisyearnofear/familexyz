/**
 * Tools Index - Export all FamilyXYZ Hedera Agent Kit tools
 * 
 * This module exports all tools for the FamilyXYZ plugin,
 * making them available for registration with the agent runtime.
 */

// Family Rewards Tool (HTS)
export {
  transferFamilyTokens,
  transferFamilyTokensSchema,
  createTransferFamilyTokensTool,
  type TransferFamilyTokensInput,
  type TransferFamilyTokensResult,
} from "./familyRewards.js";

// Family Consensus Tool (HCS)
export {
  logFamilyMilestone,
  logFamilyInteraction,
  logFamilyMilestoneSchema,
  logFamilyInteractionSchema,
  createLogFamilyMilestoneTool,
  createLogFamilyInteractionTool,
  type LogFamilyMilestoneInput,
  type LogFamilyInteractionInput,
  type ConsensusMessageResult,
} from "./familyConsensus.js";

// Family Payout Tool (HCS)
export {
  recordAgentPayout,
  recordAgentPayoutSchema,
  createRecordAgentPayoutTool,
  type RecordAgentPayoutInput,
  type PayoutRecordResult,
} from "./familyPayout.js";
