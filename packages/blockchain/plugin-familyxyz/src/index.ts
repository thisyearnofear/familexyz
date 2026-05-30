/**
 * FamilyXYZ Hedera Agent Kit Plugin
 * 
 * A plugin for the Hedera AI Agent Kit that provides:
 * - HTS token transfer tools for family rewards
 * - HCS message submission for consensus logging
 * - Agent payout recording for audit trails
 * 
 * This plugin fulfills the Week 2 Hedera AI Agent Bounty requirements:
 * - Implements ≥2 non-query tools (transferTokens, submitMessage)
 * - Completes real commercial transactions on Hedera
 * 
 * @example
 * ```typescript
 * import { Client } from "@hashgraph/sdk";
 * import { FamilyXYZPlugin, createFamilyRewardsAgent } from "@elizaos/familyxyz-hedera-plugin";
 * 
 * const client = Client.forTestnet();
 * client.setOperator(accountId, privateKey);
 * 
 * const agent = createFamilyRewardsAgent({
 *   hcsTopicId: "0.0.7304500",
 *   famTokenId: "0.0.7304501",
 *   agentId: "wisdom",
 *   defaultRewardAmount: 100,
 * });
 * 
 * const result = await agent.executeRewardWorkflow(client, {
 *   familyId: "family_xyz",
 *   milestoneType: "challenge_complete",
 *   description: "Completed weekly family communication challenge",
 *   participants: ["0.0.111", "0.0.222"],
 * }, "0.0.111", {
 *   weekNumber: 12,
 *   scoreDelta: 5,
 *   finalPayout: 325,
 * });
 * ```
 */

export * from "./tools/index.js";
export { FamilyRewardsAgent, createFamilyRewardsAgent, type FamilyRewardsAgentConfig, type RewardWorkflowResult } from "./agent/FamilyRewardsAgent.js";
import { createFamilyRewardsAgent } from "./agent/FamilyRewardsAgent.js";

// Plugin metadata
export const PLUGIN_NAME = "@elizaos/familyxyz-hedera-plugin";
export const PLUGIN_VERSION = "0.1.0";
export const PLUGIN_DESCRIPTION = "FamilyXYZ Hedera Agent Kit plugin for family rewards, consensus logging, and payout management";

// Default configuration for testnet deployment
export const DEFAULT_CONFIG = {
  hcsTopicId: "0.0.7304500",
  famTokenId: "0.0.7304501",
  agentId: "familyxyz",
  defaultRewardAmount: 100,
} as const;

/**
 * Create the plugin with default configuration
 */
function createFamilyXYZPlugin(config?: Partial<{
  hcsTopicId: string;
  famTokenId: string;
  agentId: string;
  defaultRewardAmount: number;
}>) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  return {
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    description: PLUGIN_DESCRIPTION,
    tools: [
      {
        name: "log_family_milestone",
        description: `Log a family milestone to Hedera Consensus Service for immutable verification. Topic ID: ${mergedConfig.hcsTopicId}`,
      },
      {
        name: "log_family_interaction",
        description: `Log a family interaction to HCS for audit trail. Topic ID: ${mergedConfig.hcsTopicId}`,
      },
      {
        name: "record_agent_payout",
        description: `Record an agent payout to HCS audit trail. Topic ID: ${mergedConfig.hcsTopicId}, Token ID: ${mergedConfig.famTokenId}`,
      },
      {
        name: "transfer_family_tokens",
        description: `Transfer FAM tokens to a family member as reward. Token ID: ${mergedConfig.famTokenId}`,
      },
    ],
    createAgent: () => createFamilyRewardsAgent(mergedConfig),
  };
}

// Default export
export default createFamilyXYZPlugin;
