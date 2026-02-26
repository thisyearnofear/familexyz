import {
  Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback, Content,
} from "@elizaos/core";
import {
  FamilyHederaIntegration, getOrCreateFamilyHederaIntegration,
  cacheFamilyInteraction,
} from "@elizaos/family-nlp-utils";
import { calculateFamilyMetrics, storeMetrics } from "@elizaos/family-metrics";
import { GENERATIONAL_BRIDGE_INTERACTIONS } from "./constants";
import {
  determineGenerationalInteractionType, generateGenerationalResponse,
  extractParticipants, extractFamilyId,
} from "./utils";

let hederaIntegrationInstance: FamilyHederaIntegration | null = null;

async function getOrCreateHederaIntegration(
  runtime: IAgentRuntime,
): Promise<FamilyHederaIntegration> {
  if (!hederaIntegrationInstance) {
    hederaIntegrationInstance = await getOrCreateFamilyHederaIntegration(
      runtime,
      "generational",
      GENERATIONAL_BRIDGE_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const generationalBridgeAction: Action = {
  name: "BRIDGE_GENERATIONS",
  similes: [
    "COLLECT_FAMILY_STORY",
    "PRESERVE_TRADITION",
    "SHARE_GENERATIONAL_WISDOM",
    "CONNECT_ACROSS_AGES",
    "DOCUMENT_FAMILY_HISTORY",
  ],
  description:
    "Bridge generational gaps through family storytelling, tradition preservation, and intergenerational dialogue, with Hedera consensus tracking and metrics",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    const generationalKeywords = [
      "grandparent", "grandma", "grandpa", "grandmother", "grandfather",
      "generation", "tradition", "history", "story", "stories",
      "remember", "old days", "ancestor", "heritage", "recipe",
      "legacy", "family tree", "roots", "elder", "youth",
      "back then", "when i was young", "pass down", "heirloom",
    ];

    return generationalKeywords.some((keyword) => content.includes(keyword));
  },
  handler: async (
    runtime: IAgentRuntime, message: Memory, state?: State,
    options: any = {}, callback?: HandlerCallback,
  ) => {
    try {
      const hederaIntegration = await getOrCreateHederaIntegration(runtime);
      const participants = extractParticipants(message, state);
      const familyId = extractFamilyId(message) || "default_family";

      let conversationContext = await hederaIntegration.getEnhancedContext(message.roomId);
      if (!conversationContext) {
        conversationContext = await hederaIntegration.createConversationContext(
          familyId, participants, [
            "Preserve family history and traditions",
            "Bridge generational communication gaps",
            "Share wisdom across age groups",
          ],
        );
      }

      const interactionType = determineGenerationalInteractionType(message.content.text);

      const genResponse = await generateGenerationalResponse(
        runtime, message.content.text, interactionType, conversationContext,
      );

      const result = await hederaIntegration.processFamilyInteraction(
        genResponse.content, interactionType, conversationContext,
      );

      const enhancedResponse: Content = {
        text: genResponse.content,
        action: "BRIDGE_GENERATIONS",
        metadata: {
          interactionType,
          qualityScore: genResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          generational: {
            storytellingRichness: genResponse.storytellingRichness,
            traditionPreservation: genResponse.traditionPreservation,
            crossAgeEngagement: genResponse.crossAgeEngagement,
          },
        },
      };

      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "bridge", words: ["share", "story", "remember", "tradition", "together", "heritage", "roots", "ancestor"] },
        { id: "preservation", words: ["recipe", "ritual", "ceremony", "heirloom", "document", "preserve", "pass down"] },
        { id: "gap", words: ["don't understand", "outdated", "old-fashioned", "disconnect", "gap"] },
      ]);

      storeMetrics({
        pluginName: "family-generational-bridge",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1,
            qualityScore: genResponse.qualityScore / 10,
          },
        },
      });

      const meta = (runtime as any).meta || {};
      meta.generationalMetrics = {
        bridge: (meta.generationalMetrics?.bridge || 0) + (metrics.categoryScores.bridge || 0),
        preservation: (meta.generationalMetrics?.preservation || 0) + (metrics.categoryScores.preservation || 0),
        gap: (meta.generationalMetrics?.gap || 0) + (metrics.categoryScores.gap || 0),
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

      await cacheFamilyInteraction("generational", message.roomId, {
        message: result.message, context: conversationContext, response: enhancedResponse,
      });

      console.log(`✅ Generational bridge with Hedera integration:`, {
        interactionType, rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact, qualityScore: genResponse.qualityScore,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in generational bridge action:", error);
      callback?.({
        text: "I'd love to help your family bridge generations and preserve precious memories. What family story or tradition would you like to explore together?",
        action: "BRIDGE_GENERATIONS",
      });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "My grandma has this amazing recipe for Sunday dinner that she's never written down. I'm worried it will be lost." } },
      { user: "{{agentName}}", content: {
        text: "What a precious treasure — unwritten recipes carry so much more than ingredients; they carry the love and memories of every meal shared. Let's preserve it together. Could you ask your grandma to walk you through it one more time while you record it? I'll help you capture not just the steps, but the stories behind them — why she chose those ingredients, who taught her, what memories she has of making it. That context is what makes a family recipe irreplaceable.",
        action: "BRIDGE_GENERATIONS",
      }},
    ],
    [
      { user: "{{user1}}", content: { text: "My teenage daughter thinks her grandpa's stories are boring. How can I help them connect?" } },
      { user: "{{agentName}}", content: {
        text: "Here's the secret: teens don't find stories boring when they're relevant to their world. Ask grandpa to share a story about a time he broke the rules, faced peer pressure, or had a crush. Teens light up when they realize their grandparents were young once too! You could also try a 'then vs. now' game where grandpa describes how he did something (like communicating with friends) and your daughter shares the modern equivalent. The differences are hilarious and the similarities are touching.",
        action: "BRIDGE_GENERATIONS",
      }},
    ],
    [
      { user: "{{user1}}", content: { text: "Our family used to have a tradition of Sunday dinners but we stopped years ago. How do we bring it back?" } },
      { user: "{{agentName}}", content: {
        text: "Reviving a family tradition is one of the most meaningful things you can do. Start by asking everyone what they loved most about those Sunday dinners — was it the food, the conversation, or just being together? Then adapt it for today's reality. Maybe it's every other Sunday, or a potluck where everyone brings one dish. The key is making it feel like an invitation, not an obligation. Would you like me to help you plan the first comeback dinner?",
        action: "BRIDGE_GENERATIONS",
      }},
    ],
  ] as ActionExample[][],
};
