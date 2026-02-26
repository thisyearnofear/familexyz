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
import { WISDOM_INTERACTIONS } from "./constants";
import {
  determineWisdomInteractionType,
  generateWisdomResponse,
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
      "wisdom",
      WISDOM_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const wisdomAction: Action = {
  name: "SHARE_FAMILY_WISDOM",
  similes: [
    "GUIDE_FAMILY_WISDOM",
    "OFFER_PHILOSOPHICAL_INSIGHT",
    "RESOLVE_FAMILY_CONFLICT",
    "BUILD_EMPATHY",
    "SHARE_EMOTIONAL_INTELLIGENCE",
  ],
  description:
    "Share philosophical wisdom and emotional intelligence guidance for family growth, with Hedera consensus tracking and metrics",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    // Wisdom triggers
    const wisdomKeywords = [
      "advice",
      "wisdom",
      "guidance",
      "philosophy",
      "values",
      "conflict",
      "argument",
      "disagreement",
      "fight",
      "resolution",
      "empathy",
      "understand",
      "feelings",
      "emotions",
      "perspective",
      "family values",
      "right thing",
      "moral",
      "ethics",
      "principle",
    ];

    return wisdomKeywords.some((keyword) => content.includes(keyword));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      // Get or create Hedera integration
      const hederaIntegration = await getOrCreateHederaIntegration(runtime);

      // Extract conversation context
      const participants = extractParticipants(message, state);
      const familyId = extractFamilyId(message) || "default_family";

      // Create or get conversation context
      let conversationContext = await hederaIntegration.getEnhancedContext(
        message.roomId,
      );
      if (!conversationContext) {
        conversationContext = await hederaIntegration.createConversationContext(
          familyId,
          participants,
          [
            "Develop emotional intelligence",
            "Strengthen family bonds",
            "Resolve conflicts peacefully",
          ],
        );
      }

      // Determine interaction type based on content
      const interactionType = determineWisdomInteractionType(
        message.content.text,
      );

      // Generate contextual wisdom response
      const wisdomResponse = await generateWisdomResponse(
        runtime,
        message.content.text,
        interactionType,
        conversationContext,
      );

      // Process through Hedera integration
      const result = await hederaIntegration.processFamilyInteraction(
        wisdomResponse.content,
        interactionType,
        conversationContext,
      );

      // Enhanced response with Hedera metadata
      const enhancedResponse: Content = {
        text: wisdomResponse.content,
        action: "SHARE_FAMILY_WISDOM",
        metadata: {
          interactionType,
          qualityScore: wisdomResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          wisdom: {
            philosophicalDepth: wisdomResponse.philosophicalDepth,
            empathyLevel: wisdomResponse.empathyLevel,
            practicalGuidance: wisdomResponse.practicalGuidance,
          },
        },
      };

      // Calculate and store metrics for this wisdom interaction
      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "philosophical", words: ["wisdom", "philosophy", "meaning", "purpose", "values", "principles"] },
        { id: "empathy", words: ["understand", "empathy", "feel", "emotion", "perspective", "support"] },
        { id: "resolution", words: ["resolve", "solution", "peace", "together", "understanding"] }
      ]);

      storeMetrics({
        pluginName: "family-wisdom",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1, // Track the type of wisdom interaction
            qualityScore: wisdomResponse.qualityScore / 10 // Normalize to 0-10 scale
          }
        }
      });

      // Sync metrics to runtime.meta for API access
      const meta = (runtime as any).meta || {};

      // Update global family metrics
      meta.familyMetrics = {
        total: (meta.familyMetrics?.total || 0) + metrics.total,
        positive: (meta.familyMetrics?.positive || 0) + metrics.positive,
        negative: (meta.familyMetrics?.negative || 0) + metrics.negative,
      };

      // Update specific category metrics based on what we found
      // Wisdom plugin covers multiple areas, so we map them accordingly
      if (metrics.categoryScores.empathy > 0 || metrics.categoryScores.resolution > 0) {
         meta.intimacyMetrics = {
            affection: (meta.intimacyMetrics?.affection || 0) + (metrics.categoryScores.empathy || 0),
            tension: (meta.intimacyMetrics?.tension || 0) + (metrics.categoryScores.resolution ? 0 : 1) // If resolution is 0 but conflict present? Simplified logic.
         };
      }

      if (metrics.categoryScores.philosophical > 0) {
          meta.growthMetrics = {
              growth: (meta.growthMetrics?.growth || 0) + metrics.categoryScores.philosophical,
              fixed: (meta.growthMetrics?.fixed || 0)
          };
      }

      if (result.rewards.transactionId) {
          (meta as any).latestTransactionId = result.rewards.transactionId;
      }

      (runtime as any).meta = meta;

      // Cache the interaction for follow-up
      await cacheFamilyInteraction("wisdom", message.roomId, {
        message: result.message,
        context: conversationContext,
      });

      // Log success metrics
      console.log(`✅ Wisdom shared with Hedera integration:`, {
        interactionType,
        rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact,
        qualityScore: wisdomResponse.qualityScore,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in wisdom action:", error);

      // Fallback response
      const fallbackContent: Content = {
        text: "I'm here to offer wisdom and guidance for your family. Perhaps we could explore this together - what's most important to your family in this situation?",
        action: "SHARE_FAMILY_WISDOM",
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
          text: "My teenager and I keep arguing about everything. I don't know how to connect with them anymore.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "It sounds like you're both feeling disconnected, which is painful for any parent. Let's explore this together - when you think about your teenager's perspective, what do you imagine they might be feeling or needing right now that could be driving these arguments?",
          action: "SHARE_FAMILY_WISDOM",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Our family seems to have lost its way. We're all busy with our own things and barely talk anymore.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "This feeling of disconnection is actually a wisdom signal - your family's heart is calling for more togetherness. What would it look like if your family created one small, sacred tradition that brought everyone together regularly? Sometimes the simplest rituals create the deepest bonds.",
          action: "SHARE_FAMILY_WISDOM",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to teach my kids about empathy, but I'm not sure how to do it effectively.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Empathy grows best in the soil of curiosity. Try this: when someone in your family is upset, instead of rushing to fix it, ask 'What do you think they might be feeling?' This teaches children to pause and wonder about others' inner worlds - the foundation of true empathy.",
          action: "SHARE_FAMILY_WISDOM",
        },
      },
    ],
  ] as ActionExample[][],
};
