import {
  Action,
  ActionExample,
  IAgentRuntime,
  Memory,
  State,
  Plugin,
  HandlerCallback,
  Content,
  ModelClass,
} from "@elizaos/core";
import {
  FamilyHederaIntegration,
  createFamilyHederaIntegration,
  FamilyAgentConfig,
  FamilyTokenomics,
  FamilyConversationContext,
  FamilyInteractionType,
  DEFAULT_AGENT_CONFIGS,
  DEFAULT_TOKENOMICS,
  HederaService,
} from "@elizaos/family-nlp-utils";
import NodeCache from "node-cache";

/**
 * Wisdom Agent - Philosophy & Emotional Intelligence
 * Enhanced with Hedera blockchain integration for Stage 2A
 */

// Wisdom-specific interaction types
const WISDOM_INTERACTIONS: FamilyInteractionType[] = [
  "wisdom_shared",
  "conflict_resolved",
  "empathy_expressed",
];

// Enhanced wisdom conversation prompts
const WISDOM_PROMPTS = {
  philosophical: `You are Sophia, a wise family counselor with deep expertise in emotional intelligence and philosophy.
Your role is to guide families through thoughtful questioning and wisdom sharing.

Key principles:
- Use Socratic questioning to help families discover their own wisdom
- Focus on emotional intelligence development
- Provide age-appropriate guidance
- Bridge generational perspectives
- Foster empathy and understanding

Current conversation context: {context}
Family goals: {goals}
Current challenges: {challenges}

Respond with wisdom that strengthens family bonds and emotional intelligence.`,

  conflictResolution: `You are an expert family mediator helping resolve conflicts with wisdom and empathy.

Conflict situation: {situation}
Participants: {participants}
Family dynamics: {dynamics}

Guide the family toward:
1. Understanding all perspectives
2. Identifying underlying needs
3. Finding mutually beneficial solutions
4. Strengthening relationships through resolution

Use gentle guidance and ask thoughtful questions.`,

  empathyBuilding: `You are guiding a family in developing deeper empathy and emotional connection.

Family context: {context}
Empathy opportunity: {opportunity}

Help them:
- See situations from different perspectives
- Express emotions constructively
- Practice active listening
- Build emotional vocabulary
- Strengthen emotional bonds

Focus on practical empathy-building exercises.`,
};

// Wisdom-specific action for Hedera-integrated responses
const wisdomAction: Action = {
  name: "SHARE_FAMILY_WISDOM",
  similes: [
    "GUIDE_FAMILY_WISDOM",
    "OFFER_PHILOSOPHICAL_INSIGHT",
    "RESOLVE_FAMILY_CONFLICT",
    "BUILD_EMPATHY",
    "SHARE_EMOTIONAL_INTELLIGENCE",
  ],
  description:
    "Share philosophical wisdom and emotional intelligence guidance for family growth, with Hedera consensus tracking",
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

      // Cache the interaction for follow-up
      await cacheWisdomInteraction(runtime, message.roomId, {
        message: result.message,
        context: conversationContext,
        response: enhancedResponse,
      });

      // Log success metrics
      console.log(`✅ Wisdom shared with Hedera integration:`, {
        interactionType,
        rewardAmount: result.rewards.amount,
        healthImpact: result.familyHealthImpact,
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

// Helper functions for wisdom processing
function determineWisdomInteractionType(
  content: string,
): FamilyInteractionType {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("conflict") ||
    lowerContent.includes("argument") ||
    lowerContent.includes("fight") ||
    lowerContent.includes("disagree")
  ) {
    return "conflict_resolved";
  }

  if (
    lowerContent.includes("empathy") ||
    lowerContent.includes("understand") ||
    lowerContent.includes("feelings") ||
    lowerContent.includes("perspective")
  ) {
    return "empathy_expressed";
  }

  return "wisdom_shared";
}

async function generateWisdomResponse(
  runtime: IAgentRuntime,
  content: string,
  interactionType: FamilyInteractionType,
  context: FamilyConversationContext,
): Promise<{
  content: string;
  qualityScore: number;
  philosophicalDepth: number;
  empathyLevel: number;
  practicalGuidance: number;
}> {
  // Select appropriate prompt template
  let prompt = WISDOM_PROMPTS.philosophical;
  if (interactionType === "conflict_resolved") {
    prompt = WISDOM_PROMPTS.conflictResolution;
  } else if (interactionType === "empathy_expressed") {
    prompt = WISDOM_PROMPTS.empathyBuilding;
  }

  // Contextualize the prompt
  const contextualizedPrompt = prompt
    .replace("{context}", JSON.stringify(context.conversationHistory.slice(-3)))
    .replace("{goals}", context.familyGoals.join(", "))
    .replace("{challenges}", context.currentChallenges.join(", "))
    .replace("{situation}", content)
    .replace("{participants}", context.participants.join(", "))
    .replace("{dynamics}", `${context.participants.length} family members`)
    .replace("{opportunity}", content);

  const response = await runtime.composeState(
    {
      content: { text: content },
      agentId: runtime.agentId,
      roomId: context.sessionId,
      userId: runtime.agentId,
    } as Memory,
    {
      wisdomContext: context,
      interactionType,
      agentPersonality: "wise, empathetic, thoughtful",
    },
  );

  const wisdomText = await runtime.generateText({
    context: contextualizedPrompt,
    modelClass: ModelClass.LARGE,
  });

  // Calculate quality metrics
  const qualityScore = calculateWisdomQuality(wisdomText, interactionType);
  const philosophicalDepth = assessPhilosophicalDepth(wisdomText);
  const empathyLevel = assessEmpathyLevel(wisdomText);
  const practicalGuidance = assessPracticalGuidance(wisdomText);

  return {
    content: wisdomText,
    qualityScore,
    philosophicalDepth,
    empathyLevel,
    practicalGuidance,
  };
}

function calculateWisdomQuality(
  text: string,
  interactionType: FamilyInteractionType,
): number {
  let score = 50; // Base score

  // Quality indicators
  const qualityIndicators = [
    "question",
    "perspective",
    "understand",
    "wisdom",
    "guidance",
    "empathy",
    "feeling",
    "experience",
    "learn",
    "grow",
  ];

  const lowerText = text.toLowerCase();
  qualityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) score += 5;
  });

  // Interaction type bonuses
  switch (interactionType) {
    case "conflict_resolved":
      if (lowerText.includes("both") || lowerText.includes("all")) score += 10;
      if (lowerText.includes("solution") || lowerText.includes("resolve"))
        score += 10;
      break;
    case "empathy_expressed":
      if (lowerText.includes("feel") || lowerText.includes("emotion"))
        score += 10;
      if (lowerText.includes("perspective") || lowerText.includes("viewpoint"))
        score += 10;
      break;
    case "wisdom_shared":
      if (lowerText.includes("wisdom") || lowerText.includes("insight"))
        score += 10;
      if (lowerText.includes("experience") || lowerText.includes("lesson"))
        score += 10;
      break;
  }

  // Length bonus for thoughtful responses
  if (text.length > 100) score += 5;
  if (text.length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

function assessPhilosophicalDepth(text: string): number {
  const deepThinkingWords = [
    "meaning",
    "purpose",
    "values",
    "principles",
    "wisdom",
    "truth",
    "existence",
    "nature",
    "essence",
    "fundamental",
    "deeper",
  ];

  let depth = 0;
  const lowerText = text.toLowerCase();
  deepThinkingWords.forEach((word) => {
    if (lowerText.includes(word)) depth += 10;
  });

  return Math.min(100, depth);
}

function assessEmpathyLevel(text: string): number {
  const empathyWords = [
    "feel",
    "emotion",
    "understand",
    "perspective",
    "heart",
    "compassion",
    "care",
    "support",
    "listen",
    "validate",
    "acknowledge",
  ];

  let empathy = 0;
  const lowerText = text.toLowerCase();
  empathyWords.forEach((word) => {
    if (lowerText.includes(word)) empathy += 8;
  });

  return Math.min(100, empathy);
}

function assessPracticalGuidance(text: string): number {
  const practicalWords = [
    "try",
    "practice",
    "action",
    "step",
    "approach",
    "method",
    "technique",
    "strategy",
    "tool",
    "exercise",
    "habit",
  ];

  let practical = 0;
  const lowerText = text.toLowerCase();
  practicalWords.forEach((word) => {
    if (lowerText.includes(word)) practical += 8;
  });

  return Math.min(100, practical);
}

// Utility functions
function extractParticipants(message: Memory, state?: State): string[] {
  // Extract participant IDs from message context
  const participants = [message.userId];

  // Add other family members if mentioned
  if (state?.recentMessages) {
    const recentUserIds = state.recentMessages
      .map((m: Memory) => m.userId)
      .filter(
        (id: string, index: number, arr: string[]) => arr.indexOf(id) === index,
      );
    participants.push(...recentUserIds);
  }

  return participants.filter(Boolean);
}

function extractFamilyId(message: Memory): string | null {
  // Extract family ID from room or user context
  return message.roomId || null;
}

// Cache management
const wisdomCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

async function cacheWisdomInteraction(
  runtime: IAgentRuntime,
  roomId: string,
  interaction: any,
): Promise<void> {
  const cacheKey = `wisdom_${roomId}_${Date.now()}`;
  wisdomCache.set(cacheKey, interaction);
}

// Hedera integration management
let hederaIntegrationInstance: FamilyHederaIntegration | null = null;

async function getOrCreateHederaIntegration(
  runtime: IAgentRuntime,
): Promise<FamilyHederaIntegration> {
  if (hederaIntegrationInstance) {
    return hederaIntegrationInstance;
  }

  // Get Hedera service from runtime
  const hederaService = (runtime as any).hederaService as HederaService;
  if (!hederaService) {
    throw new Error("Hedera service not available in runtime");
  }

  // Create wisdom agent configuration
  const wisdomConfig: FamilyAgentConfig = {
    agentType: "wisdom",
    consensusTopicId: process.env.HEDERA_WISDOM_TOPIC_ID || "0.0.123456",
    rewardTokenId: process.env.HEDERA_FAMILY_TOKEN_ID,
    specializations: WISDOM_INTERACTIONS,
    rewardMultiplier: 1.2, // 20% bonus for wisdom interactions
    enableTokenomics: process.env.HEDERA_ENABLE_TOKENOMICS === "true",
    enableConsensusLogging: process.env.HEDERA_ENABLE_CONSENSUS === "true",
  };

  // Create tokenomics configuration
  const tokenomics: FamilyTokenomics = {
    ...DEFAULT_TOKENOMICS,
    enabled: process.env.HEDERA_ENABLE_TOKENOMICS === "true",
    tokenId: process.env.HEDERA_FAMILY_TOKEN_ID,
    treasuryAccountId: process.env.HEDERA_TREASURY_ACCOUNT_ID,
  };

  hederaIntegrationInstance = createFamilyHederaIntegration(
    hederaService,
    wisdomConfig,
    tokenomics,
  );

  return hederaIntegrationInstance;
}

// Main plugin definition
export const wisdomPlugin: Plugin = {
  name: "familyWisdom",
  description:
    "Family wisdom and emotional intelligence guidance with Hedera blockchain integration",
  actions: [wisdomAction],
  evaluators: [],
  providers: [],
  services: [],
};

export default wisdomPlugin;
