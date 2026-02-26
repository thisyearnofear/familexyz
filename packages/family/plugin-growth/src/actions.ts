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
import { GROWTH_INTERACTIONS } from "./constants";
import {
  determineGrowthInteractionType,
  generateGrowthResponse,
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
      "growth",
      GROWTH_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const growthAction: Action = {
  name: "PROMOTE_FAMILY_GROWTH",
  similes: [
    "REFRAME_FIXED_MINDSET",
    "CELEBRATE_EFFORT",
    "SUGGEST_LEARNING_CHALLENGE",
    "BUILD_RESILIENCE",
    "ENCOURAGE_DEVELOPMENT",
  ],
  description:
    "Promote family growth mindset, celebrate effort, and suggest learning challenges, with Hedera consensus tracking and metrics",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    const growthKeywords = [
      "learn", "grow", "challenge", "effort", "practice",
      "improve", "progress", "mindset", "mistake", "fail",
      "difficult", "hard", "can't", "yet", "achieve",
      "skill", "development", "persistence", "resilience",
    ];

    return growthKeywords.some((keyword) => content.includes(keyword));
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
            "Develop a growth mindset",
            "Build family resilience",
            "Encourage lifelong learning",
          ],
        );
      }

      const interactionType = determineGrowthInteractionType(
        message.content.text,
      );

      const growthResponse = await generateGrowthResponse(
        runtime,
        message.content.text,
        interactionType,
        conversationContext,
      );

      const result = await hederaIntegration.processFamilyInteraction(
        growthResponse.content,
        interactionType,
        conversationContext,
      );

      const enhancedResponse: Content = {
        text: growthResponse.content,
        action: "PROMOTE_FAMILY_GROWTH",
        metadata: {
          interactionType,
          qualityScore: growthResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          growth: {
            growthImpact: growthResponse.growthImpact,
          },
        },
      };

      // Calculate and store metrics
      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "growth", words: ["learn", "improve", "practice", "progress", "challenge", "yet", "growth"] },
        { id: "fixed", words: ["can't", "impossible", "quit", "give up", "stupid", "bad at"] },
      ]);

      storeMetrics({
        pluginName: "family-growth",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1,
            qualityScore: growthResponse.qualityScore / 10,
          },
        },
      });

      // Sync metrics to runtime.meta
      const meta = (runtime as any).meta || {};

      meta.growthMetrics = {
        growth: (meta.growthMetrics?.growth || 0) + (metrics.categoryScores.growth || 0),
        fixed: (meta.growthMetrics?.fixed || 0) + (metrics.categoryScores.fixed || 0),
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

      await cacheFamilyInteraction("growth", message.roomId, {
        message: result.message,
        context: conversationContext,
        response: enhancedResponse,
      });

      console.log(`✅ Growth promoted with Hedera integration:`, {
        interactionType,
        rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact,
        qualityScore: growthResponse.qualityScore,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in growth action:", error);

      const fallbackContent: Content = {
        text: "I'm here to help your family develop a growth mindset. Every challenge is an opportunity to learn and grow stronger together. What's one thing you're working on improving today?",
        action: "PROMOTE_FAMILY_GROWTH",
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
          text: "I'm just not good at math. I'll never get this.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I hear that this feels difficult right now. Let's remember that our brains grow when we tackle hard things! You haven't mastered this *yet*, but with the right strategy and practice, you will improve. What's one small part of this math problem we can look at together?",
          action: "PROMOTE_FAMILY_GROWTH",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I worked really hard on my science project even though it was challenging.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "That is incredible effort! I'm so proud of how you persisted through the challenges. Celebrating these moments of hard work is how we build a family culture of growth. What was the most interesting thing you learned while working on it?",
          action: "PROMOTE_FAMILY_GROWTH",
        },
      },
    ],
  ] as ActionExample[][],
};
