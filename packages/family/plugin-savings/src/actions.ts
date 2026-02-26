import {
  Action,
  ActionExample,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
} from "@elizaos/core";
import {
  FamilyHederaIntegration,
  getOrCreateFamilyHederaIntegration,
  cacheFamilyInteraction,
} from "@elizaos/family-nlp-utils";
import { calculateFamilyMetrics, storeMetrics } from "@elizaos/family-metrics";
import { SAVINGS_INTERACTIONS } from "./constants";
import {
  determineSavingsInteractionType,
  generateSavingsResponse,
  extractParticipants,
  extractFamilyId,
} from "./utils";

// Hedera integration management
let hederaIntegrationInstance: FamilyHederaIntegration | null = null;

async function getOrCreateHederaIntegration(
  runtime: IAgentRuntime,
): Promise<FamilyHederaIntegration> {
  if (!hederaIntegrationInstance) {
    hederaIntegrationInstance = await getOrCreateFamilyHederaIntegration(
      runtime,
      "savings",
      SAVINGS_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const savingsAction: Action = {
  name: "MANAGE_FAMILY_SAVINGS",
  similes: [
    "DEPOSIT_TO_BONZO",
    "WITHDRAW_FROM_BONZO",
    "CHECK_SAVINGS_YIELD",
    "SET_FINANCIAL_GOAL",
    "VIEW_VAULT_STATUS",
  ],
  description:
    "Manage family savings through Bonzo Finance lending vaults, earn yield on FAM tokens, and track financial goals with Hedera consensus",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    const savingsKeywords = [
      "save", "deposit", "withdraw", "money", "funds",
      "yield", "interest", "bonzo", "vault", "lending",
      "finance", "goal", "budget", "pennies", "invest",
    ];

    return savingsKeywords.some((keyword) => content.includes(keyword));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      const hederaIntegration = await getOrCreateHederaIntegration(runtime);
      const participants = extractParticipants(message, state);
      const familyId = extractFamilyId(message) || "default_family";

      let conversationContext = await hederaIntegration.getEnhancedContext(
        message.roomId,
      );
      if (!conversationContext) {
        conversationContext = await hederaIntegration.createConversationContext(
          familyId,
          participants,
          [
            "Build long-term family wealth",
            "Optimize yield via Bonzo Finance",
            "Foster financial literacy in the family",
          ],
        );
      }

      const interactionType = determineSavingsInteractionType(
        message.content.text,
      );

      const savingsResponse = await generateSavingsResponse(
        runtime,
        message.content.text,
        interactionType,
        conversationContext,
      );

      // Simulate Bonzo Interaction for Hackathon
      const bonzoResult = {
        vaultAddress: process.env.BONZO_CONTRACT_ID || "0.0.bonzo_vault",
        currentApy: "4.5%",
        actionPerformed: interactionType,
      };

      const result = await hederaIntegration.processFamilyInteraction(
        savingsResponse.content,
        interactionType,
        conversationContext,
      );

      const enhancedResponse: Content = {
        text: savingsResponse.content,
        action: "MANAGE_FAMILY_SAVINGS",
        metadata: {
          interactionType,
          qualityScore: savingsResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          bonzo: bonzoResult,
        },
      };

      // Calculate metrics
      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "financial_discipline", words: ["save", "deposit", "budget", "goal", "invest"] },
        { id: "financial_stress", words: ["expensive", "broke", "debt", "cost", "worry"] },
      ]);

      storeMetrics({
        pluginName: "family-savings",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1,
            qualityScore: savingsResponse.qualityScore / 10,
          },
        },
      });

      await cacheFamilyInteraction("savings", message.roomId, {
        message: result.message,
        context: conversationContext,
        response: enhancedResponse,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in savings action:", error);
      callback?.({
        text: "I'm here to help you manage your family's financial future. We can set goals or put your FAM tokens to work in our Bonzo Finance vaults. What would you like to do?",
        action: "MANAGE_FAMILY_SAVINGS",
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to save 100 FAM tokens for our summer vacation.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "That's a great goal! I've initiated a deposit of 100 FAM into the Bonzo Finance lending vault. This will earn yield while you plan your trip. I've logged this as a new family savings goal.",
          action: "MANAGE_FAMILY_SAVINGS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "How much interest are we earning on our family savings?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Our family savings in the Bonzo Finance vault are currently earning 4.5% APY. Your discipline is paying off!",
          action: "MANAGE_FAMILY_SAVINGS",
        },
      },
    ],
  ] as ActionExample[][],
};
