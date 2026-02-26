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
import { INTIMACY_INTERACTIONS } from "./constants";
import {
  determineIntimacyInteractionType,
  generateIntimacyResponse,
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
      "intimacy",
      INTIMACY_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const intimacyAction: Action = {
  name: "STRENGTHEN_FAMILY_INTIMACY",
  similes: [
    "DEEPEN_CONNECTION",
    "IMPROVE_COMMUNICATION",
    "PLAN_DATE_NIGHT",
    "STRENGTHEN_RELATIONSHIP",
    "BUILD_EMOTIONAL_BOND",
  ],
  description:
    "Strengthen couple and family intimacy through relationship coaching, communication improvement, and connection activities, with Hedera consensus tracking and metrics",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    const intimacyKeywords = [
      "love", "relationship", "partner", "spouse", "husband", "wife",
      "date night", "connection", "communication", "bonding",
      "affection", "romance", "quality time", "marriage", "together",
      "intimacy", "close", "distance", "lonely", "couple",
      "appreciation", "gratitude", "support",
    ];

    return intimacyKeywords.some((keyword) => content.includes(keyword));
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
            "Increase quality time together",
            "Improve communication in relationships",
            "Strengthen emotional bonds",
          ],
        );
      }

      const interactionType = determineIntimacyInteractionType(
        message.content.text,
      );

      const intimacyResponse = await generateIntimacyResponse(
        runtime,
        message.content.text,
        interactionType,
        conversationContext,
      );

      const result = await hederaIntegration.processFamilyInteraction(
        intimacyResponse.content,
        interactionType,
        conversationContext,
      );

      const enhancedResponse: Content = {
        text: intimacyResponse.content,
        action: "STRENGTHEN_FAMILY_INTIMACY",
        metadata: {
          interactionType,
          qualityScore: intimacyResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          intimacy: {
            connectionDepth: intimacyResponse.connectionDepth,
            communicationQuality: intimacyResponse.communicationQuality,
            emotionalVulnerability: intimacyResponse.emotionalVulnerability,
          },
        },
      };

      // Calculate and store metrics
      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "affection", words: ["love", "adore", "kiss", "hold", "romance", "intimate", "appreciate", "cherish"] },
        { id: "communication", words: ["talk", "listen", "express", "share", "communicate", "dialogue", "discuss"] },
        { id: "tension", words: ["argument", "angry", "resent", "ignored", "distant", "lonely", "disconnect"] },
      ]);

      storeMetrics({
        pluginName: "family-intimacy",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1,
            qualityScore: intimacyResponse.qualityScore / 10,
          },
        },
      });

      // Sync metrics to runtime.meta
      const meta = (runtime as any).meta || {};

      meta.intimacyMetrics = {
        affection: (meta.intimacyMetrics?.affection || 0) + (metrics.categoryScores.affection || 0),
        communication: (meta.intimacyMetrics?.communication || 0) + (metrics.categoryScores.communication || 0),
        tension: (meta.intimacyMetrics?.tension || 0) + (metrics.categoryScores.tension || 0),
      };

      meta.familyMetrics = {
        total: (meta.familyMetrics?.total || 0) + metrics.total,
        positive: (meta.familyMetrics?.positive || 0) + metrics.positive,
        negative: (meta.familyMetrics?.negative || 0) + metrics.negative,
      };

      if (result.rewards.transactionId) {
        (meta as any).latestTransactionId = result.rewards.transactionId;
      }

      (runtime as any).meta = meta;

      await cacheFamilyInteraction("intimacy", message.roomId, {
        message: result.message,
        context: conversationContext,
        response: enhancedResponse,
      });

      console.log(`✅ Intimacy strengthened with Hedera integration:`, {
        interactionType,
        rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact,
        qualityScore: intimacyResponse.qualityScore,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in intimacy action:", error);

      const fallbackContent: Content = {
        text: "I'm here to help you strengthen your family connections. Every relationship thrives with intentional attention — what area of your relationship would you like to nurture today?",
        action: "STRENGTHEN_FAMILY_INTIMACY",
      };

      callback?.(fallbackContent);
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "My partner and I never seem to have time for each other anymore. We're always busy with the kids and work.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "It's so common for couples to feel this way, especially with the demands of parenting and work. The fact that you're noticing this and wanting to change it shows real care. What if we started small — could you carve out even 15 minutes each evening after the kids are in bed, just to sit together without screens and check in with each other?",
          action: "STRENGTHEN_FAMILY_INTIMACY",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I feel like my spouse doesn't listen to me when I try to share my feelings.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Feeling unheard is one of the most painful experiences in a relationship. Sometimes what looks like not listening is actually being overwhelmed or unsure how to respond. Try the 'speaker-listener' technique: one person shares for 3 minutes while the other just listens, then reflects back what they heard before switching. Would you like to try this together?",
          action: "STRENGTHEN_FAMILY_INTIMACY",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "We want to plan a date night but can't think of anything to do.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Date nights don't need to be elaborate to be meaningful! Try the 'memory lane' date: each of you brings one photo from your early relationship and shares the story behind it over a simple dinner at home. It reconnects you with why you fell in love. Or if you want adventure, try learning something new together — even cooking a new recipe side by side creates wonderful bonding moments.",
          action: "STRENGTHEN_FAMILY_INTIMACY",
        },
      },
    ],
  ] as ActionExample[][],
};
