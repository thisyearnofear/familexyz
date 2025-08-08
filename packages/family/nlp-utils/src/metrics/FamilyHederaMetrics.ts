import { HederaService } from "@elizaos/hedera-core";
import { TopicMessageSubmitTransaction, TopicId, Hbar } from "@hashgraph/sdk";

/**
 * Family interaction types for tracking and tokenomics
 */
export type FamilyInteractionType =
  | "wisdom_shared"
  | "intimacy_moment"
  | "generational_story"
  | "mindful_presence"
  | "growth_milestone"
  | "conflict_resolved"
  | "tradition_preserved"
  | "empathy_expressed";

/**
 * Sentiment analysis results with family-specific context
 */
export interface FamilySentimentAnalysis {
  polarity: number; // -1 to 1 (negative to positive)
  subjectivity: number; // 0 to 1 (objective to subjective)
  emotion:
    | "joy"
    | "sadness"
    | "anger"
    | "fear"
    | "surprise"
    | "disgust"
    | "neutral";
  familyTone:
    | "supportive"
    | "challenging"
    | "nurturing"
    | "concerned"
    | "celebratory";
  healthScore: number; // 0 to 100 (family relationship health)
  context: {
    participants: string[];
    ageGroups: ("child" | "teen" | "adult" | "senior")[];
    relationshipDynamic:
      | "parent_child"
      | "siblings"
      | "grandparent_grandchild"
      | "couple"
      | "extended_family";
  };
}

/**
 * Hedera-tracked family metrics for tokenomics
 */
export interface HederaFamilyMetrics {
  sessionId: string;
  timestamp: number;
  interactionType: FamilyInteractionType;
  sentiment: FamilySentimentAnalysis;
  participants: number;
  duration: number; // in seconds
  qualityScore: number; // 0-100 based on multiple factors
  hederaReward: {
    amount: number; // in tinybars
    reason: string;
    distributed: boolean;
    transactionId?: string;
  };
  familyHealthImpact: {
    communicationImprovement: number;
    emotionalBonding: number;
    conflictResolution: number;
    traditionPreservation: number;
  };
}

/**
 * Batch metrics for efficient Hedera consensus submissions
 */
interface MetricsBatch {
  batchId: string;
  metrics: HederaFamilyMetrics[];
  aggregatedScore: number;
  totalRewards: number;
  submissionTimestamp: number;
}

/**
 * Configuration for family metrics and rewards
 */
export interface FamilyMetricsConfig {
  consensusTopicId: string;
  rewardTokenId?: string;
  batchSize: number;
  batchIntervalMs: number;
  rewardRates: Record<FamilyInteractionType, number>; // base rewards in tinybars
  qualityMultipliers: {
    excellent: number; // 90-100 quality score
    good: number; // 70-89 quality score
    average: number; // 50-69 quality score
    poor: number; // below 50 quality score
  };
  familySizeBonus: Record<number, number>; // bonus multiplier by participant count
}

/**
 * Enhanced family metrics logger with Hedera integration
 * Implements DRY principles and efficient batching
 */
export class FamilyHederaMetricsLogger {
  private metricsQueue: HederaFamilyMetrics[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private hederaService: HederaService;
  private config: FamilyMetricsConfig;

  constructor(hederaService: HederaService, config: FamilyMetricsConfig) {
    this.hederaService = hederaService;
    this.config = config;
    this.startBatchProcessor();
  }

  /**
   * Log a family interaction with automatic sentiment analysis and Hedera rewards
   */
  async logFamilyInteraction(
    content: string,
    interactionType: FamilyInteractionType,
    participants: string[],
    duration: number,
  ): Promise<HederaFamilyMetrics> {
    // Analyze sentiment and calculate quality scores
    const sentiment = await this.analyzeFamilySentiment(content, participants);
    const qualityScore = this.calculateQualityScore(
      sentiment,
      interactionType,
      duration,
    );

    // Calculate Hedera rewards
    const reward = this.calculateReward(
      interactionType,
      qualityScore,
      participants.length,
    );

    // Create metrics object
    const metrics: HederaFamilyMetrics = {
      sessionId: this.generateSessionId(),
      timestamp: Date.now(),
      interactionType,
      sentiment,
      participants: participants.length,
      duration,
      qualityScore,
      hederaReward: {
        amount: reward,
        reason: `${interactionType}_quality_${qualityScore}`,
        distributed: false,
      },
      familyHealthImpact: this.calculateHealthImpact(
        sentiment,
        interactionType,
      ),
    };

    // Add to queue for batch processing
    this.metricsQueue.push(metrics);

    // Trigger immediate processing if queue is full
    if (this.metricsQueue.length >= this.config.batchSize) {
      await this.processBatch();
    }

    return metrics;
  }

  /**
   * Advanced family-focused sentiment analysis
   */
  private async analyzeFamilySentiment(
    content: string,
    participants: string[],
  ): Promise<FamilySentimentAnalysis> {
    // Enhanced sentiment analysis with family context
    const polarity = this.calculatePolarity(content);
    const subjectivity = this.calculateSubjectivity(content);
    const emotion = this.detectEmotion(content);
    const familyTone = this.detectFamilyTone(content);
    const healthScore = this.calculateFamilyHealthScore(
      content,
      polarity,
      familyTone,
    );

    return {
      polarity,
      subjectivity,
      emotion,
      familyTone,
      healthScore,
      context: {
        participants,
        ageGroups: this.inferAgeGroups(participants),
        relationshipDynamic: this.inferRelationshipDynamic(participants),
      },
    };
  }

  /**
   * Calculate interaction quality score (0-100)
   */
  private calculateQualityScore(
    sentiment: FamilySentimentAnalysis,
    interactionType: FamilyInteractionType,
    duration: number,
  ): number {
    let score = sentiment.healthScore; // Base score from health analysis

    // Duration bonus (optimal interaction times)
    const durationBonus = this.getDurationBonus(duration, interactionType);
    score += durationBonus;

    // Sentiment positivity bonus
    if (sentiment.polarity > 0.3) score += 10;
    if (
      sentiment.familyTone === "supportive" ||
      sentiment.familyTone === "nurturing"
    )
      score += 15;

    // Interaction type specific bonuses
    switch (interactionType) {
      case "conflict_resolved":
        score += sentiment.polarity > 0 ? 20 : -10;
        break;
      case "empathy_expressed":
        score += sentiment.subjectivity > 0.5 ? 15 : 5;
        break;
      case "tradition_preserved":
        score += 10; // Always valuable
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate Hedera reward based on quality and configuration
   */
  private calculateReward(
    interactionType: FamilyInteractionType,
    qualityScore: number,
    participantCount: number,
  ): number {
    const baseReward = this.config.rewardRates[interactionType] || 100; // Default 100 tinybars

    // Quality multiplier
    let qualityMultiplier = this.config.qualityMultipliers.poor;
    if (qualityScore >= 90)
      qualityMultiplier = this.config.qualityMultipliers.excellent;
    else if (qualityScore >= 70)
      qualityMultiplier = this.config.qualityMultipliers.good;
    else if (qualityScore >= 50)
      qualityMultiplier = this.config.qualityMultipliers.average;

    // Family size bonus
    const sizeBonus = this.config.familySizeBonus[participantCount] || 1;

    return Math.floor(baseReward * qualityMultiplier * sizeBonus);
  }

  /**
   * Calculate family health impact metrics
   */
  private calculateHealthImpact(
    sentiment: FamilySentimentAnalysis,
    interactionType: FamilyInteractionType,
  ) {
    const baseImpact = {
      communicationImprovement: 0,
      emotionalBonding: 0,
      conflictResolution: 0,
      traditionPreservation: 0,
    };

    // Apply interaction type specific impacts
    switch (interactionType) {
      case "wisdom_shared":
        baseImpact.communicationImprovement = 15;
        baseImpact.traditionPreservation = 20;
        break;
      case "intimacy_moment":
        baseImpact.emotionalBonding = 25;
        break;
      case "conflict_resolved":
        baseImpact.conflictResolution = 30;
        baseImpact.communicationImprovement = 20;
        break;
      case "generational_story":
        baseImpact.traditionPreservation = 30;
        baseImpact.emotionalBonding = 15;
        break;
      case "empathy_expressed":
        baseImpact.emotionalBonding = 20;
        baseImpact.communicationImprovement = 10;
        break;
    }

    // Apply sentiment modifiers
    const sentimentModifier = sentiment.polarity * 0.5 + 0.5; // Convert -1,1 to 0,1
    Object.keys(baseImpact).forEach((key) => {
      baseImpact[key as keyof typeof baseImpact] *= sentimentModifier;
    });

    return baseImpact;
  }

  /**
   * Process batched metrics to Hedera consensus
   */
  private async processBatch(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const batch: MetricsBatch = {
      batchId: this.generateBatchId(),
      metrics: [...this.metricsQueue],
      aggregatedScore: this.calculateAggregatedScore(this.metricsQueue),
      totalRewards: this.metricsQueue.reduce(
        (sum, m) => sum + m.hederaReward.amount,
        0,
      ),
      submissionTimestamp: Date.now(),
    };

    try {
      // Submit to Hedera consensus topic
      const consensusResponse = await this.submitToConsensus(batch);

      if (consensusResponse.success) {
        // Mark rewards as distributed and update transaction IDs
        batch.metrics.forEach((metric) => {
          metric.hederaReward.distributed = true;
          metric.hederaReward.transactionId =
            consensusResponse.data?.transactionId;
        });

        console.log(
          `✅ Family metrics batch ${batch.batchId} submitted to Hedera consensus`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to submit metrics batch ${batch.batchId}:`,
        error,
      );
    } finally {
      // Clear the queue
      this.metricsQueue = [];
    }
  }

  /**
   * Submit metrics batch to Hedera consensus topic
   */
  private async submitToConsensus(batch: MetricsBatch) {
    const topicId = TopicId.fromString(this.config.consensusTopicId);
    const message = JSON.stringify({
      type: "family_metrics_batch",
      version: "1.0",
      batch: {
        id: batch.batchId,
        timestamp: batch.submissionTimestamp,
        metricsCount: batch.metrics.length,
        aggregatedScore: batch.aggregatedScore,
        totalRewards: batch.totalRewards,
        summary: this.createBatchSummary(batch.metrics),
      },
    });

    return await this.hederaService.consensus.submitMessage(topicId, message);
  }

  /**
   * Create batch summary for efficient consensus storage
   */
  private createBatchSummary(metrics: HederaFamilyMetrics[]) {
    const interactionCounts: Record<string, number> = {};
    let totalQuality = 0;
    let totalDuration = 0;

    metrics.forEach((metric) => {
      interactionCounts[metric.interactionType] =
        (interactionCounts[metric.interactionType] || 0) + 1;
      totalQuality += metric.qualityScore;
      totalDuration += metric.duration;
    });

    return {
      interactionTypes: interactionCounts,
      averageQuality: totalQuality / metrics.length,
      totalDuration,
      participantRange: {
        min: Math.min(...metrics.map((m) => m.participants)),
        max: Math.max(...metrics.map((m) => m.participants)),
      },
    };
  }

  /**
   * Start the batch processing timer
   */
  private startBatchProcessor(): void {
    this.batchTimer = setInterval(async () => {
      if (this.metricsQueue.length > 0) {
        await this.processBatch();
      }
    }, this.config.batchIntervalMs);
  }

  /**
   * Clean shutdown of the metrics logger
   */
  async dispose(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Process any remaining metrics
    if (this.metricsQueue.length > 0) {
      await this.processBatch();
    }
  }

  // Helper methods for sentiment analysis
  private calculatePolarity(content: string): number {
    // Simplified polarity calculation - in production, use advanced NLP
    const positiveWords = [
      "love",
      "happy",
      "joy",
      "grateful",
      "proud",
      "wonderful",
      "amazing",
    ];
    const negativeWords = [
      "hate",
      "sad",
      "angry",
      "frustrated",
      "disappointed",
      "terrible",
    ];

    const words = content.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return Math.max(-1, Math.min(1, (score / words.length) * 10));
  }

  private calculateSubjectivity(content: string): number {
    // Simplified subjectivity calculation
    const subjectiveWords = [
      "feel",
      "think",
      "believe",
      "love",
      "hate",
      "beautiful",
      "ugly",
    ];
    const words = content.toLowerCase().split(/\s+/);
    const subjectiveCount = words.filter((word) =>
      subjectiveWords.includes(word),
    ).length;

    return Math.min(1, (subjectiveCount / words.length) * 5);
  }

  private detectEmotion(content: string): FamilySentimentAnalysis["emotion"] {
    // Simplified emotion detection
    const emotionKeywords = {
      joy: ["happy", "excited", "joyful", "delighted", "cheerful"],
      sadness: ["sad", "crying", "depressed", "disappointed", "grief"],
      anger: ["angry", "furious", "mad", "irritated", "frustrated"],
      fear: ["scared", "afraid", "worried", "anxious", "nervous"],
      surprise: ["surprised", "shocked", "amazed", "astonished"],
      disgust: ["disgusted", "revolted", "appalled"],
    };

    const words = content.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      scores[emotion] = keywords.filter((keyword) =>
        words.includes(keyword),
      ).length;
    });

    const dominantEmotion = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b,
    )[0];

    return scores[dominantEmotion] > 0
      ? (dominantEmotion as FamilySentimentAnalysis["emotion"])
      : "neutral";
  }

  private detectFamilyTone(
    content: string,
  ): FamilySentimentAnalysis["familyTone"] {
    const toneKeywords = {
      supportive: [
        "support",
        "encourage",
        "help",
        "there for you",
        "proud of you",
      ],
      challenging: [
        "challenge",
        "grow",
        "improve",
        "try harder",
        "push yourself",
      ],
      nurturing: ["care", "love", "comfort", "gentle", "understanding"],
      concerned: ["worried", "concerned", "careful", "be safe", "watch out"],
      celebratory: [
        "celebrate",
        "congratulations",
        "achievement",
        "success",
        "well done",
      ],
    };

    const words = content.toLowerCase();
    const scores: Record<string, number> = {};

    Object.entries(toneKeywords).forEach(([tone, keywords]) => {
      scores[tone] = keywords.filter((keyword) =>
        words.includes(keyword),
      ).length;
    });

    const dominantTone = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b,
    )[0];

    return scores[dominantTone] > 0
      ? (dominantTone as FamilySentimentAnalysis["familyTone"])
      : "supportive";
  }

  private calculateFamilyHealthScore(
    content: string,
    polarity: number,
    familyTone: string,
  ): number {
    let healthScore = 50; // Base score

    // Polarity impact
    healthScore += polarity * 30;

    // Family tone impact
    const toneBonus = {
      supportive: 20,
      nurturing: 25,
      celebratory: 15,
      challenging: 10,
      concerned: 5,
    };
    healthScore += toneBonus[familyTone as keyof typeof toneBonus] || 0;

    // Communication quality indicators
    const qualityIndicators = [
      "listen",
      "understand",
      "respect",
      "share",
      "together",
    ];
    const qualityCount = qualityIndicators.filter((indicator) =>
      content.toLowerCase().includes(indicator),
    ).length;
    healthScore += qualityCount * 5;

    return Math.max(0, Math.min(100, healthScore));
  }

  private getDurationBonus(
    duration: number,
    interactionType: FamilyInteractionType,
  ): number {
    // Optimal interaction durations by type (in seconds)
    const optimalDurations = {
      wisdom_shared: 300, // 5 minutes
      intimacy_moment: 900, // 15 minutes
      generational_story: 1200, // 20 minutes
      mindful_presence: 600, // 10 minutes
      growth_milestone: 300, // 5 minutes
      conflict_resolved: 1800, // 30 minutes
      tradition_preserved: 900, // 15 minutes
      empathy_expressed: 180, // 3 minutes
    };

    const optimal = optimalDurations[interactionType];
    const ratio = Math.min(duration / optimal, optimal / duration);

    return Math.floor(ratio * 10); // 0-10 bonus points
  }

  private inferAgeGroups(
    participants: string[],
  ): ("child" | "teen" | "adult" | "senior")[] {
    // Simplified age group inference - in production, use user profiles
    return ["adult"]; // Default assumption
  }

  private inferRelationshipDynamic(
    participants: string[],
  ): FamilySentimentAnalysis["context"]["relationshipDynamic"] {
    // Simplified relationship inference - in production, use family graph
    return participants.length === 2 ? "couple" : "extended_family";
  }

  private calculateAggregatedScore(metrics: HederaFamilyMetrics[]): number {
    return metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length;
  }

  private generateSessionId(): string {
    return `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create configured family metrics logger
 */
export function createFamilyMetricsLogger(
  hederaService: HederaService,
  partialConfig: Partial<FamilyMetricsConfig>,
): FamilyHederaMetricsLogger {
  const defaultConfig: FamilyMetricsConfig = {
    consensusTopicId: "0.0.123456", // Default topic, should be overridden
    batchSize: 10,
    batchIntervalMs: 30000, // 30 seconds
    rewardRates: {
      wisdom_shared: 150,
      intimacy_moment: 200,
      generational_story: 175,
      mindful_presence: 100,
      growth_milestone: 250,
      conflict_resolved: 300,
      tradition_preserved: 200,
      empathy_expressed: 125,
    },
    qualityMultipliers: {
      excellent: 2.0,
      good: 1.5,
      average: 1.0,
      poor: 0.5,
    },
    familySizeBonus: {
      1: 1.0,
      2: 1.2,
      3: 1.4,
      4: 1.6,
      5: 1.8,
    },
  };

  const config = { ...defaultConfig, ...partialConfig };
  return new FamilyHederaMetricsLogger(hederaService, config);
}
