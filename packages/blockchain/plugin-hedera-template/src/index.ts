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
  ServiceType,
  Content,
  UUID,
} from "@elizaos/core";
import { Service } from "@elizaos/core";
import { randomUUID } from "crypto";
import {
  HederaMetricsLogger,
  HederaFamilyMetrics,
  SentimentAnalysis,
  InteractionType,
  classifySentiment,
  detectInteractionType,
  calculateFamilyHealthScore,
  calculateTokenRewards,
  FamilyHealthReward,
} from "@elizaos/family-nlp-utils";
import { HederaService, HederaConfig } from "@elizaos/hedera-core";
import NodeCache from "node-cache";

// Plugin configuration interface
interface HederaFamilyPluginConfig {
  familyId: string;
  interactionType: InteractionType;
  enableRewards: boolean;
  enableConsensusLogging: boolean;
  baseRewardAmount: number;
  healthThreshold: number;
  cacheTtl: number;
}

// Default configuration
const DEFAULT_CONFIG: HederaFamilyPluginConfig = {
  familyId: "default_family",
  interactionType: "presence",
  enableRewards: true,
  enableConsensusLogging: true,
  baseRewardAmount: 10,
  healthThreshold: 70,
  cacheTtl: 300, // 5 minutes
};

// Memory interfaces for family interactions
interface FamilyInteractionMemory extends Memory {
  sentiment: SentimentAnalysis;
  healthScore: number;
  interactionType: InteractionType;
  rewards?: FamilyHealthReward;
  hederaMetrics?: HederaFamilyMetrics;
}

// State interface for family context
interface FamilyState {
  familyId: string;
  familyHealthScore: number;
  lastInteractionType: InteractionType;
  recentSentiments: SentimentAnalysis[];
  totalRewards: number;
}

// Custom service for Hedera family integration
class HederaFamilyService extends Service {
  static serviceType: ServiceType = "HEDERA_FAMILY" as ServiceType;
  private pluginTemplate: HederaFamilyPluginTemplate;

  constructor(pluginTemplate: HederaFamilyPluginTemplate) {
    super();
    this.pluginTemplate = pluginTemplate;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    await this.pluginTemplate.initialize(runtime);
  }

  getInstance(): HederaFamilyPluginTemplate {
    return this.pluginTemplate;
  }
}

// Enhanced Family Plugin Template with Hedera Integration
class HederaFamilyPluginTemplate {
  private config: HederaFamilyPluginConfig;
  private cache: NodeCache;
  private hederaService: HederaService | null = null;
  private metricsLogger: HederaMetricsLogger | null = null;
  private isInitialized = false;

  constructor(config: Partial<HederaFamilyPluginConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new NodeCache({ stdTTL: this.config.cacheTtl });
  }

  // Initialize Hedera services
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get Hedera config from runtime settings
      const hederaConfigString = runtime.getSetting("HEDERA_CONFIG");
      if (hederaConfigString && this.config.enableConsensusLogging) {
        const hederaConfig: HederaConfig = JSON.parse(hederaConfigString);
        this.hederaService = HederaService.getInstance(hederaConfig);
        await this.hederaService.initialize();

        // Initialize metrics logger
        this.metricsLogger = new HederaMetricsLogger(this.hederaService);
        console.log("✅ Hedera services initialized for family plugin");
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn("⚠️ Failed to initialize Hedera services:", error);
      // Continue without Hedera integration
    }
  }

  // Create the main action for processing family interactions
  createFamilyInteractionAction(): Action {
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
        const userId = message.userId;
        const agentId = runtime.agentId;

        if (!content || !userId || !agentId) {
          return false;
        }

        // Analyze sentiment and interaction type
        const sentiment = await classifySentiment(content, runtime);
        const interactionDetection = await detectInteractionType(
          content,
          runtime,
        );

        // Calculate health score
        const healthScore = calculateFamilyHealthScore(
          sentiment,
          this.config.interactionType,
          content.length,
        );

        // Calculate rewards
        const rewards = calculateTokenRewards(
          healthScore,
          sentiment,
          this.config.interactionType,
          this.config.baseRewardAmount,
        );
        rewards.recipientId = userId;

        // Log to Hedera if enabled
        let hederaMetrics: HederaFamilyMetrics | undefined;
        if (this.metricsLogger && this.config.enableConsensusLogging) {
          const result = await this.metricsLogger.logSentimentWithRewards(
            this.config.familyId,
            agentId,
            userId,
            content,
            runtime,
          );

          if (result.success) {
            hederaMetrics = result.metrics;
            console.log(
              `📊 Logged family metrics to Hedera consensus for ${this.config.interactionType}`,
            );
          }
        }

        // Create enhanced memory
        const familyMemory: FamilyInteractionMemory = {
          ...message,
          sentiment,
          healthScore,
          interactionType: this.config.interactionType,
          rewards: this.config.enableRewards ? rewards : undefined,
          hederaMetrics,
        };

        // Update family state
        await this.updateFamilyState(runtime, familyMemory, message);

        // Cache results for performance
        this.cacheInteractionResults(userId, {
          sentiment,
          healthScore,
          rewards,
          timestamp: Date.now(),
        });

        // Trigger callback with results
        if (callback) {
          const responseContent: Content = {
            text: this.generateResponseMessage(
              sentiment,
              healthScore,
              rewards,
              interactionDetection.type,
            ),
            action: `FAMILY_INTERACTION_${this.config.interactionType.toUpperCase()}`,
            source: message.content.source,
          };
          await callback(responseContent);
        }

        return true;
      } catch (error) {
        console.error(
          `❌ Error processing family interaction for ${this.config.interactionType}:`,
          error,
        );
        return false;
      }
    };

    return {
      name: `FAMILY_INTERACTION_${this.config.interactionType.toUpperCase()}`,
      similes: [
        "analyze family sentiment",
        "process family interaction",
        "track family health",
        "reward positive interaction",
        `handle ${this.config.interactionType} interaction`,
      ],
      description: `Analyzes family interactions for ${this.config.interactionType} type, tracks sentiment, calculates health scores, and distributes rewards via Hedera blockchain`,
      validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validate that this is a family interaction
        const isFamilyContext = this.isFamilyContext(message);
        const hasContent = message.content?.text?.length > 0;
        return isFamilyContext && hasContent;
      },
      handler,
      examples: [
        [
          {
            user: "user",
            content: {
              text: "I love spending time with my family and learning from grandpa's stories",
              source: "family_chat",
            },
          },
          {
            user: "assistant",
            content: {
              text: "That's wonderful! Family wisdom sharing creates such meaningful connections. Your positive interaction has earned you 15 health tokens for strengthening family bonds! 💝",
              action: `FAMILY_INTERACTION_${this.config.interactionType.toUpperCase()}`,
            },
          },
        ],
      ],
    };
  }

  // Create evaluator for family health monitoring
  createFamilyHealthEvaluator(): Evaluator {
    return {
      name: `FAMILY_HEALTH_${this.config.interactionType.toUpperCase()}`,
      similes: [
        "evaluate family health",
        "assess family sentiment",
        "monitor family wellbeing",
        `check ${this.config.interactionType} health`,
      ],
      description: `Evaluates family health metrics for ${this.config.interactionType} interactions and provides recommendations`,
      validate: async (runtime: IAgentRuntime, message: Memory) => {
        return this.isFamilyContext(message);
      },
      handler: async (runtime: IAgentRuntime, message: Memory) => {
        try {
          const familyState = await this.getFamilyState(runtime);
          const cachedMetrics = this.getCachedFamilyMetrics();

          // Calculate overall family health trend
          const healthTrend = this.calculateHealthTrend(cachedMetrics);
          const riskLevel = this.assessRiskLevel(familyState.familyHealthScore);

          return {
            score: familyState.familyHealthScore / 100, // Normalize to 0-1
            confidence: Math.min(1, cachedMetrics.length / 10), // More data = higher confidence
            recommendation: this.generateHealthRecommendation(
              healthTrend,
              riskLevel,
              familyState,
            ),
            metadata: {
              interactionType: this.config.interactionType,
              totalRewards: familyState.totalRewards,
              recentInteractions: cachedMetrics.length,
              riskLevel,
              healthTrend,
            },
          };
        } catch (error) {
          console.error("Error in family health evaluator:", error);
          return {
            score: 0.5,
            confidence: 0,
            recommendation: "Unable to assess family health at this time",
          };
        }
      },
      examples: [
        {
          context:
            "Family showing declining sentiment over recent interactions",
          messages: [
            {
              user: "user",
              content: {
                text: "I'm really frustrated with how things are going in our family lately",
              },
            },
          ],
          outcome: "Family health assessment indicates need for intervention",
        },
      ],
    };
  }

  // Create provider for family metrics
  createFamilyMetricsProvider(): Provider {
    return {
      get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
          const familyState = await this.getFamilyState(runtime, message);
          const cachedMetrics = this.getCachedFamilyMetrics();
          const hederaHealth = await this.getHederaHealthStatus();

          return {
            familyId: this.config.familyId,
            interactionType: this.config.interactionType,
            currentHealthScore: familyState.familyHealthScore,
            totalRewards: familyState.totalRewards,
            recentSentiments: familyState.recentSentiments.slice(-5), // Last 5
            hederaIntegration: {
              enabled: this.config.enableConsensusLogging,
              status: hederaHealth.status,
              consensusLogged: hederaHealth.messagesLogged,
            },
            cacheMetrics: {
              totalCached: cachedMetrics.length,
              averageHealth: this.calculateAverageHealth(cachedMetrics),
              lastUpdated: Math.max(
                ...cachedMetrics.map((m) => m.timestamp),
                0,
              ),
            },
          };
        } catch (error) {
          console.error("Error in family metrics provider:", error);
          return {
            error: "Failed to retrieve family metrics",
            interactionType: this.config.interactionType,
          };
        }
      },
    };
  }

  // Helper methods
  private isFamilyContext(message: Memory): boolean {
    const familyKeywords = [
      "family",
      "parent",
      "child",
      "sibling",
      "grandparent",
      "mom",
      "dad",
      "brother",
      "sister",
    ];
    const content = message.content?.text?.toLowerCase() || "";
    return familyKeywords.some((keyword) => content.includes(keyword));
  }

  private async updateFamilyState(
    runtime: IAgentRuntime,
    interaction: FamilyInteractionMemory,
    currentMemory?: Memory,
  ): Promise<void> {
    try {
      const familyState = await this.getFamilyState(runtime, currentMemory);

      // Update recent sentiments (keep last 10)
      const recentSentiments = [
        ...familyState.recentSentiments.slice(-9),
        interaction.sentiment,
      ];

      // Calculate new family health score (weighted average)
      const newHealthScore =
        familyState.familyHealthScore * 0.8 + interaction.healthScore * 0.2;

      // Update total rewards
      const totalRewards =
        familyState.totalRewards + (interaction.rewards?.amount || 0);

      const updatedState: FamilyState = {
        ...familyState,
        familyHealthScore: newHealthScore,
        lastInteractionType: interaction.interactionType,
        recentSentiments,
        totalRewards,
      };

      // Store updated state in runtime's state
      const runtimeState = await runtime.composeState(
        interaction,
        updatedState as unknown as { [key: string]: unknown },
      );
    } catch (error) {
      console.error("Error updating family state:", error);
    }
  }

  private async getFamilyState(
    runtime: IAgentRuntime,
    currentMemory?: Memory,
  ): Promise<FamilyState> {
    // Create a temporary memory if none provided
    const memory =
      currentMemory ||
      ({
        id: randomUUID() as UUID,
        userId: runtime.agentId,
        agentId: runtime.agentId,
        roomId: randomUUID() as UUID,
        content: { text: "" },
        createdAt: Date.now(),
      } as Memory);

    const state = await runtime.composeState(memory);
    return {
      familyId: this.config.familyId,
      familyHealthScore: (state as any).familyHealthScore || 50,
      lastInteractionType:
        (state as any).lastInteractionType || this.config.interactionType,
      recentSentiments: (state as any).recentSentiments || [],
      totalRewards: (state as any).totalRewards || 0,
    };
  }

  private cacheInteractionResults(
    userId: string,
    results: {
      sentiment: SentimentAnalysis;
      healthScore: number;
      rewards: FamilyHealthReward;
      timestamp: number;
    },
  ): void {
    const cacheKey = `family_interaction_${userId}`;
    const existing = this.cache.get<(typeof results)[]>(cacheKey) || [];
    existing.push(results);

    // Keep only last 50 interactions per user
    if (existing.length > 50) {
      existing.splice(0, existing.length - 50);
    }

    this.cache.set(cacheKey, existing);
  }

  private getCachedFamilyMetrics(): Array<{
    sentiment: SentimentAnalysis;
    healthScore: number;
    timestamp: number;
  }> {
    const allKeys = this.cache.keys();
    const familyKeys = allKeys.filter((key) =>
      key.startsWith("family_interaction_"),
    );

    const allMetrics: Array<{
      sentiment: SentimentAnalysis;
      healthScore: number;
      timestamp: number;
    }> = [];

    familyKeys.forEach((key) => {
      const userMetrics = this.cache.get<any[]>(key) || [];
      allMetrics.push(...userMetrics);
    });

    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  private calculateHealthTrend(
    metrics: Array<{ healthScore: number; timestamp: number }>,
  ): "improving" | "declining" | "stable" {
    if (metrics.length < 2) return "stable";

    const recent = metrics.slice(0, 5);
    const older = metrics.slice(5, 10);

    if (recent.length === 0 || older.length === 0) return "stable";

    const recentAvg =
      recent.reduce((sum, m) => sum + m.healthScore, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, m) => sum + m.healthScore, 0) / older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  }

  private assessRiskLevel(healthScore: number): "low" | "medium" | "high" {
    if (healthScore >= this.config.healthThreshold) return "low";
    if (healthScore >= 40) return "medium";
    return "high";
  }

  private calculateAverageHealth(
    metrics: Array<{ healthScore: number }>,
  ): number {
    if (metrics.length === 0) return 50;
    return metrics.reduce((sum, m) => sum + m.healthScore, 0) / metrics.length;
  }

  private generateHealthRecommendation(
    trend: "improving" | "declining" | "stable",
    risk: "low" | "medium" | "high",
    state: FamilyState,
  ): string {
    const recommendations = {
      high: {
        declining: `Family health needs immediate attention. Consider scheduling dedicated family time and addressing any conflicts. Focus on ${this.config.interactionType} activities.`,
        stable: `Family health is concerning but stable. Increase positive interactions and consider family counseling or structured activities.`,
        improving: `Good progress! Continue current positive efforts while addressing remaining concerns. Keep focusing on ${this.config.interactionType}.`,
      },
      medium: {
        declining: `Family health is declining. Consider more frequent check-ins and positive family activities focused on ${this.config.interactionType}.`,
        stable: `Family health is moderate. Look for opportunities to strengthen bonds through ${this.config.interactionType} interactions.`,
        improving: `Great improvement! Keep up the positive momentum with continued focus on family connections.`,
      },
      low: {
        declining: `Despite good overall health, there's a declining trend. Monitor closely and maintain current positive practices.`,
        stable: `Excellent family health! Continue current practices to maintain strong family bonds.`,
        improving: `Outstanding family health and improving! You're doing excellent work in maintaining family connections.`,
      },
    };

    return recommendations[risk][trend];
  }

  private generateResponseMessage(
    sentiment: SentimentAnalysis,
    healthScore: number,
    rewards: FamilyHealthReward,
    detectedType: InteractionType,
  ): string {
    const healthEmoji =
      healthScore >= 80 ? "💚" : healthScore >= 60 ? "💛" : "❤️";
    const typeEmoji = {
      wisdom: "🧠",
      intimacy: "💝",
      "generational-bridge": "🌉",
      presence: "🤗",
      growth: "🌱",
    }[detectedType];

    let message = `${typeEmoji} I sense ${sentiment.dominantEmotion} energy in your family interaction! `;

    if (healthScore >= 70) {
      message += `Your family health score is looking great at ${healthScore.toFixed(1)} ${healthEmoji}`;
    } else if (healthScore >= 50) {
      message += `Your family health score is ${healthScore.toFixed(1)} ${healthEmoji} - there's room for improvement`;
    } else {
      message += `Your family health score is ${healthScore.toFixed(1)} ${healthEmoji} - let's work on building stronger connections`;
    }

    if (this.config.enableRewards && rewards.amount > 0) {
      message += ` You've earned ${rewards.amount} health tokens for this positive interaction! 🪙`;
    }

    return message;
  }

  private async getHederaHealthStatus(): Promise<{
    status: string;
    messagesLogged: number;
  }> {
    try {
      if (!this.hederaService) {
        return { status: "disabled", messagesLogged: 0 };
      }

      const health = await this.hederaService.healthCheck();
      return {
        status: health.success ? "healthy" : "error",
        messagesLogged: this.metricsLogger?.getQueueStatus().queued || 0,
      };
    } catch (error) {
      return { status: "error", messagesLogged: 0 };
    }
  }

  // Cleanup method
  async dispose(): Promise<void> {
    if (this.metricsLogger) {
      await this.metricsLogger.dispose();
    }
    if (this.hederaService) {
      await this.hederaService.close();
    }
    this.cache.flushAll();
  }
}

// Plugin factory function
export function createHederaFamilyPlugin(
  config: Partial<HederaFamilyPluginConfig> = {},
): Plugin {
  const pluginTemplate = new HederaFamilyPluginTemplate(config);

  const plugin: Plugin = {
    name: `family-plugin-hedera-${config.interactionType || "template"}`,
    description: `Enhanced family plugin with Hedera integration for ${config.interactionType || "general"} interactions`,
    actions: [pluginTemplate.createFamilyInteractionAction()],
    evaluators: [pluginTemplate.createFamilyHealthEvaluator()],
    providers: [pluginTemplate.createFamilyMetricsProvider()],
    services: [new HederaFamilyService(pluginTemplate)],
  };

  return plugin;
}

// Default plugin export (can be customized)
const plugin: Plugin = createHederaFamilyPlugin({
  interactionType: "presence",
  enableRewards: true,
  enableConsensusLogging: true,
});

export default plugin;

// Export the factory function and template class for customization
export { HederaFamilyPluginTemplate, type HederaFamilyPluginConfig };
