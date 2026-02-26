import {
  Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback, Content,
} from "@elizaos/core";
import {
  FamilyHederaIntegration, getOrCreateFamilyHederaIntegration,
  cacheFamilyInteraction,
} from "@elizaos/family-nlp-utils";
import { calculateFamilyMetrics, storeMetrics } from "@elizaos/family-metrics";
import { PRESENCE_INTERACTIONS } from "./constants";
import {
  determinePresenceInteractionType, generatePresenceResponse,
  extractParticipants, extractFamilyId,
} from "./utils";

let hederaIntegrationInstance: FamilyHederaIntegration | null = null;

async function getOrCreateHederaIntegration(
  runtime: IAgentRuntime,
): Promise<FamilyHederaIntegration> {
  if (!hederaIntegrationInstance) {
    hederaIntegrationInstance = await getOrCreateFamilyHederaIntegration(
      runtime,
      "presence",
      PRESENCE_INTERACTIONS,
    );
  }
  return hederaIntegrationInstance;
}

export const presenceAction: Action = {
  name: "GUIDE_FAMILY_PRESENCE",
  similes: [
    "PRACTICE_MINDFULNESS",
    "REDUCE_SCREEN_TIME",
    "BUILD_FAMILY_CALM",
    "DIGITAL_WELLNESS_GUIDE",
    "CULTIVATE_ATTENTION",
  ],
  description:
    "Guide families in mindfulness, digital wellness, and present-moment awareness, with Hedera consensus tracking and metrics",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();

    const presenceKeywords = [
      "mindful", "present", "screen time", "phone", "distracted",
      "meditation", "calm", "relax", "stress", "digital",
      "device", "attention", "focus", "breathe", "breathing",
      "anxiety", "overwhelm", "busy", "rush", "slow down",
      "unplug", "offline", "peace", "quiet",
    ];

    return presenceKeywords.some((keyword) => content.includes(keyword));
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
            "Practice mindfulness as a family",
            "Reduce screen time during family activities",
            "Create peaceful family environments",
          ],
        );
      }

      const interactionType = determinePresenceInteractionType(message.content.text);

      const presenceResponse = await generatePresenceResponse(
        runtime, message.content.text, interactionType, conversationContext,
      );

      const result = await hederaIntegration.processFamilyInteraction(
        presenceResponse.content, interactionType, conversationContext,
      );

      const enhancedResponse: Content = {
        text: presenceResponse.content,
        action: "GUIDE_FAMILY_PRESENCE",
        metadata: {
          interactionType,
          qualityScore: presenceResponse.qualityScore,
          hedera: {
            rewardAmount: result.rewards.amount,
            transactionId: result.rewards.transactionId,
            healthImpact: result.familyHealthImpact,
          },
          presence: {
            mindfulnessDepth: presenceResponse.mindfulnessDepth,
            practicalApplicability: presenceResponse.practicalApplicability,
            digitalWellnessImpact: presenceResponse.digitalWellnessImpact,
          },
        },
      };

      const metrics = calculateFamilyMetrics(message.content.text, [
        { id: "attention", words: ["listen", "focus", "present", "here", "now", "mindful", "aware", "notice"] },
        { id: "calm", words: ["breathe", "relax", "peace", "calm", "quiet", "still", "meditation", "gentle"] },
        { id: "distraction", words: ["phone", "scroll", "screen", "device", "online", "notification", "distracted"] },
      ]);

      storeMetrics({
        pluginName: "family-presence",
        metrics: {
          ...metrics,
          categoryScores: {
            ...metrics.categoryScores,
            interactionType: 1,
            qualityScore: presenceResponse.qualityScore / 10,
          },
        },
      });

      const meta = (runtime as any).meta || {};
      meta.presenceMetrics = {
        attention: (meta.presenceMetrics?.attention || 0) + (metrics.categoryScores.attention || 0),
        calm: (meta.presenceMetrics?.calm || 0) + (metrics.categoryScores.calm || 0),
        distraction: (meta.presenceMetrics?.distraction || 0) + (metrics.categoryScores.distraction || 0),
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
      
      await cacheFamilyInteraction("presence", message.roomId, {
        message: result.message, context: conversationContext, response: enhancedResponse,
      });

      console.log(`✅ Presence guided with Hedera integration:`, {
        interactionType, rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact, qualityScore: presenceResponse.qualityScore,
      });

      callback?.(enhancedResponse);
      return true;
    } catch (error) {
      console.error("❌ Error in presence action:", error);
      callback?.({
        text: "Let's take a gentle pause together. Presence is a gift we give our families — what would help you feel more grounded and connected right now?",
        action: "GUIDE_FAMILY_PRESENCE",
      });
      return false;
    }
  },
  examples: [
    [
      { user: "{{user1}}", content: { text: "Everyone in my family is glued to their phones at dinner. It's driving me crazy." } },
      { user: "{{agentName}}", content: {
        text: "You're noticing something really important. Rather than making it a rule (which often creates resistance), try making it an experiment: 'Let's try one dinner this week where we stack all our phones in the middle of the table, and whoever reaches for theirs first does the dishes.' Making it playful takes away the power struggle. You might be surprised — once people taste real conversation again, they often prefer it.",
        action: "GUIDE_FAMILY_PRESENCE",
      }},
    ],
    [
      { user: "{{user1}}", content: { text: "I feel so stressed and overwhelmed. I can never seem to slow down." } },
      { user: "{{agentName}}", content: {
        text: "That racing feeling is your body asking for a pause. Here's something you can do right now, in 60 seconds: put one hand on your chest and one on your belly. Breathe in for 4 counts, hold for 4, and breathe out for 6. Do this three times. That longer exhale activates your calm nervous system. You can teach this to your whole family — it's a beautiful reset to share before meals or at bedtime.",
        action: "GUIDE_FAMILY_PRESENCE",
      }},
    ],
    [
      { user: "{{user1}}", content: { text: "How can I help my kids be more focused and less distracted?" } },
      { user: "{{agentName}}", content: {
        text: "Kids learn presence by watching us, so start by modelling it yourself — put your own phone away when they're talking to you. Then try the 'notice game': on a walk or at a meal, each person names one thing they can see, hear, and feel right now. It builds the attention muscle in a fun way. For homework time, try the 'pomodoro for kids' method — 15 minutes of focused work, then a 5-minute movement break. Short bursts of focus grow into longer ones naturally.",
        action: "GUIDE_FAMILY_PRESENCE",
      }},
    ],
  ] as ActionExample[][],
};
