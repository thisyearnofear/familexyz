import type {
  Plugin,
  IAgentRuntime,
  Memory,
  Action,
  Evaluator,
  Provider,
  HandlerCallback,
  State,
  Handler,
} from "@elizaos/core";
import {
  classifySentiment,
  detectInteractionType,
  calculateFamilyHealthScore,
  calculateTokenRewards,
  generateMessageHash,
  HederaMetricsLogger,
  type HederaFamilyMetrics,
  type SentimentAnalysis,
  type InteractionType,
  type FamilyHealthReward,
} from "@elizaos/family-nlp-utils";
import { HederaService } from "@elizaos/hedera-core";
import NodeCache from "node-cache";

// Plugin configuration for wisdom interactions
interface WisdomPluginConfig {
  familyId: string;
  enableHedera: boolean;
  enableRewards: boolean;
  privacyMode: boolean;
  baseRewardAmount: number;
  cacheTimeout: number;
}

// Default configuration optimized for family wisdom sharing
const DEFAULT_CONFIG: WisdomPluginConfig = {
  familyId: "default_family",
  enableHedera: true,
  enableRewards: false, // Disabled until user validation
  privacyMode: true, // Privacy-first approach
  baseRewardAmount: 10,
  cacheTimeout: 300, // 5 minutes
};

// Enhanced memory interface for wisdom interactions
interface WisdomMemory extends Memory {
  wisdomAnalysis?: {
    sentiment: SentimentAnalysis;
    healthScore: number;
    wisdomType: string;
    insights: string[];
    hederaLogged?: boolean;
  };
}

// Family wisdom plugin class
class FamilyWisdomPlugin {
  private cache: NodeCache;
  private hederaService: HederaService | null = null;
  private metricsLogger: HederaMetricsLogger | null = null;
  private config: WisdomPluginConfig;

  constructor(config: Partial<WisdomPluginConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new NodeCache({ stdTTL: this.config.cacheTimeout });
  }

  // Initialize Hedera services if enabled
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (!this.config.enableHedera) return;

    try {
      const hederaConfig = runtime.getSetting("HEDERA_CONFIG");
      if (hederaConfig) {
        this.hederaService = HederaService.getInstance(
          JSON.parse(hederaConfig),
        );
        await this.hederaService.initialize();
        this.metricsLogger = new HederaMetricsLogger(this.hederaService);
        console.log("✅ Hedera services initialized for wisdom plugin");
      }
    } catch (error) {
      console.warn(
        "⚠️ Hedera initialization failed, continuing without blockchain logging:",
        error,
      );
    }
  }

  // Main wisdom analysis action
  createWisdomAnalysisAction(): Action {
    const handler: Handler = async (
      runtime: IAgentRuntime,
      message: Memory,
      state?: State,
      options?: { [key: string]: unknown },
      callback?: HandlerCallback,
    ): Promise<boolean> => {
      try {
        await this.initialize(runtime);

        const content = message.content.text;
        if (!content || !this.isWisdomContent(content)) {
          return false;
        }

        // Enhanced sentiment analysis with privacy-first LLM
        const sentiment = await classifySentiment(content, runtime);

        // Detect if this is actually wisdom-related
        const interactionType = await detectInteractionType(content, runtime);
        if (
          interactionType.type !== "wisdom" &&
          interactionType.confidence < 0.6
        ) {
          return false; // Not wisdom-related enough
        }

        // Calculate family health score
        const healthScore = calculateFamilyHealthScore(
          sentiment,
          "wisdom",
          content.length,
        );

        // Generate insights about the wisdom sharing
        const insights = this.generateWisdomInsights(
          sentiment,
          healthScore,
          content,
        );

        // Cache the analysis for performance
        const cacheKey = `wisdom_${message.userId}_${Date.now()}`;
        this.cache.set(cacheKey, { sentiment, healthScore, insights });

        // Optional Hedera logging (privacy-first: only metadata)
        let hederaLogged = false;
        if (this.metricsLogger && this.config.enableHedera) {
          try {
            const messageHash = generateMessageHash(
              content,
              Date.now(),
              runtime.agentId,
            );
            await this.metricsLogger.logSentimentWithRewards(
              this.config.familyId,
              runtime.agentId,
              message.userId,
              content,
              runtime,
            );
            hederaLogged = true;
          } catch (error) {
            console.warn("Hedera logging failed (non-blocking):", error);
          }
        }

        // Enhanced memory with wisdom analysis
        const wisdomMemory: WisdomMemory = {
          ...message,
          wisdomAnalysis: {
            sentiment,
            healthScore,
            wisdomType: this.categorizeWisdom(content),
            insights,
            hederaLogged,
          },
        };

        // Generate natural response with insights
        if (callback) {
          const response = this.generateWisdomResponse(
            sentiment,
            healthScore,
            insights,
          );
          await callback({
            text: response,
            action: "WISDOM_ANALYSIS",
            source: message.content.source,
          });
        }

        return true;
      } catch (error) {
        console.error("Error in wisdom analysis:", error);
        return false;
      }
    };

    return {
      name: "WISDOM_ANALYSIS",
      similes: [
        "wisdom sharing",
        "advice giving",
        "life lessons",
        "learning from experience",
        "mentoring conversation",
        "guidance seeking",
      ],
      description:
        "Analyzes family wisdom sharing and provides emotional intelligence insights",
      validate: async (runtime: IAgentRuntime, message: Memory) => {
        return this.isWisdomContent(message.content.text);
      },
      handler,
      examples: [
        [
          {
            user: "user",
            content: {
              text: "Grandpa told me about how he started his business with just $50 and taught me that persistence is more valuable than talent.",
            },
          },
          {
            user: "assistant",
            content: {
              text: "What a beautiful wisdom-sharing moment! I can sense the deep respect and learning happening here. Your family connection strength is showing at 89/100 - this kind of intergenerational wisdom transfer is so valuable for family bonds. 🧠💝",
              action: "WISDOM_ANALYSIS",
            },
          },
        ],
      ],
    };
  }

  // Family health evaluator
  createFamilyHealthEvaluator(): Evaluator {
    return {
      name: "FAMILY_WISDOM_HEALTH",
      similes: ["family wisdom", "learning together", "teaching moments"],
      description: "Evaluates family health through wisdom sharing patterns",
      validate: async (runtime: IAgentRuntime, message: Memory) => {
        return this.isWisdomContent(message.content.text);
      },
      handler: async (runtime: IAgentRuntime, message: Memory) => {
        try {
          const cachedAnalysis = this.getCachedAnalysis(message.userId);
          if (!cachedAnalysis) return null;

          const { sentiment, healthScore } = cachedAnalysis;

          return {
            score: healthScore / 100, // Normalize to 0-1
            confidence: sentiment.confidence || 0.7,
            recommendation: this.generateHealthRecommendation(
              healthScore,
              sentiment,
            ),
            metadata: {
              wisdomType: this.categorizeWisdom(message.content.text),
              interactionType: "wisdom",
              familyHealthScore: healthScore,
            },
          };
        } catch (error) {
          console.error("Error in family health evaluation:", error);
          return null;
        }
      },
      examples: [
        {
          context: "Family sharing life lessons and advice",
          messages: [
            {
              user: "user",
              content: {
                text: "My mom always told me to treat others the way I want to be treated, and now I'm teaching that to my kids.",
              },
            },
          ],
          outcome:
            "High family wisdom score with strong intergenerational value transmission",
        },
      ],
    };
  }

  // Wisdom metrics provider
  createWisdomMetricsProvider(): Provider {
    return {
      get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
          const recentAnalyses = this.getRecentAnalyses();
          const averageHealth = this.calculateAverageHealth(recentAnalyses);

          return {
            familyId: this.config.familyId,
            wisdomMetrics: {
              averageHealthScore: averageHealth,
              totalAnalyses: recentAnalyses.length,
              wisdomTypes: this.getWisdomTypeDistribution(recentAnalyses),
              lastUpdated: Date.now(),
            },
            hederaStatus: {
              enabled: this.config.enableHedera,
              connected: this.hederaService?.isReady() || false,
              privacyMode: this.config.privacyMode,
            },
          };
        } catch (error) {
          console.error("Error in wisdom metrics provider:", error);
          return { error: "Failed to retrieve wisdom metrics" };
        }
      },
    };
  }

  // Helper methods
  private isWisdomContent(text: string): boolean {
    if (!text) return false;

    const wisdomKeywords = [
      "advice",
      "wisdom",
      "lesson",
      "taught",
      "learned",
      "experience",
      "guidance",
      "mentor",
      "elder",
      "grandpa",
      "grandma",
      "parent",
      "told me",
      "showed me",
      "taught me",
      "learned from",
      "wise",
    ];

    const lowerText = text.toLowerCase();
    return wisdomKeywords.some((keyword) => lowerText.includes(keyword));
  }

  private categorizeWisdom(text: string): string {
    const categories = {
      "life-advice": ["advice", "guidance", "should", "ought", "recommend"],
      "experience-sharing": ["when I", "back then", "years ago", "experience"],
      "value-teaching": ["important", "value", "principle", "believe"],
      "skill-transfer": ["how to", "technique", "method", "way to"],
    };

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return category;
      }
    }
    return "general-wisdom";
  }

  private generateWisdomInsights(
    sentiment: SentimentAnalysis,
    healthScore: number,
    content: string,
  ): string[] {
    const insights: string[] = [];

    if (sentiment.positive > 7) {
      insights.push("Strong positive wisdom exchange detected");
    }

    if (healthScore > 80) {
      insights.push("Excellent family connection through wisdom sharing");
    } else if (healthScore > 60) {
      insights.push(
        "Good family learning moment with room for deeper connection",
      );
    }

    if (content.includes("grandpa") || content.includes("grandma")) {
      insights.push("Beautiful intergenerational wisdom transfer");
    }

    return insights;
  }

  private generateWisdomResponse(
    sentiment: SentimentAnalysis,
    healthScore: number,
    insights: string[],
  ): string {
    const healthEmoji =
      healthScore >= 80 ? "💚" : healthScore >= 60 ? "💛" : "❤️";

    let response = `🧠 I sense beautiful wisdom sharing here! `;

    if (sentiment.dominantEmotion) {
      response += `The ${sentiment.dominantEmotion} energy is really meaningful. `;
    }

    response += `Family connection strength: ${healthScore.toFixed(0)}/100 ${healthEmoji}`;

    if (insights.length > 0) {
      response += `\n\n✨ ${insights[0]}`;
    }

    if (healthScore >= 80) {
      response += `\n\nThis kind of wisdom sharing strengthens family bonds beautifully! 🌟`;
    }

    return response;
  }

  private generateHealthRecommendation(
    healthScore: number,
    sentiment: SentimentAnalysis,
  ): string {
    if (healthScore >= 80) {
      return "Excellent wisdom sharing! Continue fostering these meaningful conversations.";
    } else if (healthScore >= 60) {
      return "Good family learning happening. Consider asking follow-up questions to deepen the connection.";
    } else {
      return "This wisdom moment could be enhanced with more active listening and engagement.";
    }
  }

  private getCachedAnalysis(userId: string): any {
    const keys = this.cache.keys();
    const userKey = keys.find((key) => key.includes(userId));
    return userKey ? this.cache.get(userKey) : null;
  }

  private getRecentAnalyses(): any[] {
    const keys = this.cache.keys();
    return keys.map((key) => this.cache.get(key)).filter(Boolean);
  }

  private calculateAverageHealth(analyses: any[]): number {
    if (analyses.length === 0) return 0;
    return (
      analyses.reduce((sum, analysis) => sum + analysis.healthScore, 0) /
      analyses.length
    );
  }

  private getWisdomTypeDistribution(analyses: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    analyses.forEach((analysis) => {
      const type = analysis.wisdomType || "unknown";
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }
}

// Create the plugin instance
const wisdomPlugin = new FamilyWisdomPlugin({
  familyId: "family-wisdom-plugin",
  enableHedera: true,
  enableRewards: false, // MVP: No tokens until user validation
  privacyMode: true, // Privacy-first approach
});

// Export the plugin using pure ElizaOS structure
const plugin: Plugin = {
  name: "family-plugin-wisdom",
  description:
    "Enhanced family wisdom analysis with emotional intelligence and optional blockchain logging",
  actions: [wisdomPlugin.createWisdomAnalysisAction()],
  evaluators: [wisdomPlugin.createFamilyHealthEvaluator()],
  providers: [wisdomPlugin.createWisdomMetricsProvider()],
  services: [], // No custom services needed - leverages ElizaOS infrastructure
};

export default plugin;
