import { createHash } from "crypto";

export interface KeywordCategory {
  id: string;
  words: string[];
}
export interface KeywordResult {
  [id: string]: number;
}

// Hedera-specific types for family metrics
export interface HederaFamilyMetrics {
  familyId: string;
  agentId: string;
  timestamp: number;
  sentiment: SentimentAnalysis;
  healthScore: number;
  messageHash: string;
  interactionType: InteractionType;
  consensusTimestamp?: string;
  transactionId?: string;
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral?: number;
  confidence?: number;
  dominantEmotion?: string;
}

export type InteractionType =
  | "wisdom"
  | "intimacy"
  | "generational-bridge"
  | "presence"
  | "growth";

export interface FamilyHealthReward {
  recipientId: string;
  amount: number;
  reason: string;
  healthScore: number;
  sentimentBonus: number;
}

// Enhanced keyword counting with weights
export function countKeywords(
  text: string,
  categories: KeywordCategory[],
): KeywordResult {
  const lower = text.toLowerCase();
  const res: KeywordResult = {};
  for (const cat of categories) {
    res[cat.id] = cat.words.reduce(
      (acc, w) => acc + (lower.includes(w) ? 1 : 0),
      0,
    );
  }
  return res;
}

// Weighted keyword counting for more nuanced analysis
export function countKeywordsWeighted(
  text: string,
  categories: Array<KeywordCategory & { weight?: number }>,
): KeywordResult {
  const lower = text.toLowerCase();
  const res: KeywordResult = {};
  for (const cat of categories) {
    const weight = cat.weight || 1;
    res[cat.id] = cat.words.reduce((acc, w) => {
      const matches = (lower.match(new RegExp(w, "g")) || []).length;
      return acc + matches * weight;
    }, 0);
  }
  return res;
}

// Semantic (embedding-based) score for a text against a seed word array
export async function semanticScore(
  text: string,
  seedWords: string[],
  runtime: any, // IAgentRuntime
): Promise<number> {
  try {
    const embed = runtime.embeddingProvider?.embed;
    if (!embed) return 0;
    const textVec = await embed(text);
    let score = 0;
    let count = 0;
    for (const word of seedWords) {
      const wordVec = await embed(word);
      // Cosine similarity
      const dot = textVec.reduce(
        (acc: number, x: number, i: number) => acc + x * wordVec[i],
        0,
      );
      const magA = Math.sqrt(
        textVec.reduce((acc: number, x: number) => acc + x * x, 0),
      );
      const magB = Math.sqrt(
        wordVec.reduce((acc: number, x: number) => acc + x * x, 0),
      );
      const cos = magA && magB ? dot / (magA * magB) : 0;
      if (cos > 0.5) score++;
      count++;
    }
    return count > 0 ? score : 0;
  } catch {
    return 0;
  }
}

// Enhanced sentiment analysis with confidence scoring
export async function classifySentiment(
  text: string,
  runtime: any, // IAgentRuntime type
): Promise<SentimentAnalysis> {
  const { generateObject } = runtime;
  try {
    const prompt = `Analyze the family-oriented sentiment in this text and respond with JSON:
{
  "positive": number (0-10),
  "negative": number (0-10),
  "neutral": number (0-10),
  "confidence": number (0-1),
  "dominantEmotion": string
}

Rate each sentiment dimension 0-10, confidence 0-1, and identify the dominant emotion.

TEXT: ${text}`;

    const result = await generateObject(
      {
        prompt,
        model: "SMALL",
      },
      {
        positive: 0,
        negative: 0,
        neutral: 0,
        confidence: 0,
        dominantEmotion: "neutral",
      },
    );

    if (
      typeof result === "object" &&
      typeof result.positive === "number" &&
      typeof result.negative === "number"
    ) {
      return {
        positive: result.positive || 0,
        negative: result.negative || 0,
        neutral: result.neutral || 0,
        confidence: result.confidence || 0,
        dominantEmotion: result.dominantEmotion || "neutral",
      };
    }
  } catch (err) {
    // fallback below
  }

  // Enhanced fallback: keyword analysis with confidence
  const categories: Array<KeywordCategory & { weight: number }> = [
    {
      id: "positive",
      words: [
        "love",
        "joy",
        "grateful",
        "forgive",
        "understand",
        "appreciate",
        "happy",
        "proud",
        "caring",
        "support",
      ],
      weight: 1.2,
    },
    {
      id: "negative",
      words: [
        "angry",
        "sad",
        "upset",
        "hate",
        "resent",
        "hurt",
        "conflict",
        "disappointed",
        "frustrated",
        "worried",
      ],
      weight: 1.0,
    },
    {
      id: "neutral",
      words: ["okay", "fine", "normal", "regular", "usual", "typical"],
      weight: 0.8,
    },
  ];

  const kw = countKeywordsWeighted(text, categories);
  const total = kw.positive + kw.negative + kw.neutral;
  const confidence = total > 0 ? Math.min(total / 10, 1) : 0;

  let dominantEmotion = "neutral";
  if (kw.positive > kw.negative && kw.positive > kw.neutral) {
    dominantEmotion = "positive";
  } else if (kw.negative > kw.positive && kw.negative > kw.neutral) {
    dominantEmotion = "negative";
  }

  return {
    positive: kw.positive,
    negative: kw.negative,
    neutral: kw.neutral,
    confidence,
    dominantEmotion,
  };
}

// LLM-based multi-category classification (fallback to countKeywords)
export async function classifyByCategories(
  text: string,
  categories: KeywordCategory[],
  runtime: any, // IAgentRuntime type
): Promise<KeywordResult> {
  const { generateObject } = runtime;
  try {
    // Build schema and prompt
    const schema = categories.map((cat) => `"${cat.id}": int`).join(", ");
    const wordsPrompt = categories
      .map((cat) => `${cat.id}: [${cat.words.join(", ")}]`)
      .join("; ");
    const prompt = `Answer with JSON {${schema}}. For each category, count how many words (as in ${wordsPrompt}) appear in <<<TEXT>>>. TEXT:\n${text}`;
    const fallback = Object.fromEntries(categories.map((cat) => [cat.id, 0]));
    const result = await generateObject(
      {
        prompt,
        model: "SMALL",
      },
      fallback,
    );
    if (
      typeof result === "object" &&
      categories.every((cat) => typeof result[cat.id] === "number")
    ) {
      return result;
    }
  } catch (err) {
    // fallback below
  }
  return countKeywords(text, categories);
}

// Calculate family health score based on sentiment and interaction patterns
export function calculateFamilyHealthScore(
  sentiment: SentimentAnalysis,
  interactionType: InteractionType,
  messageLength: number = 0,
): number {
  // Base score from sentiment (0-100)
  const sentimentScore = Math.max(
    0,
    Math.min(
      100,
      sentiment.positive * 10 -
        sentiment.negative * 5 +
        (sentiment.neutral || 0) * 2,
    ),
  );

  // Interaction type multipliers
  const typeMultipliers: Record<InteractionType, number> = {
    wisdom: 1.2,
    intimacy: 1.1,
    "generational-bridge": 1.15,
    presence: 1.05,
    growth: 1.1,
  };

  // Length bonus (meaningful conversations)
  const lengthBonus = Math.min(10, messageLength / 50);

  // Confidence penalty (lower confidence = more uncertainty)
  const confidencePenalty = sentiment.confidence
    ? (1 - sentiment.confidence) * 10
    : 5;

  const finalScore = Math.max(
    0,
    Math.min(
      100,
      sentimentScore * typeMultipliers[interactionType] +
        lengthBonus -
        confidencePenalty,
    ),
  );

  return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
}

// Calculate token rewards based on health score and sentiment
export function calculateTokenRewards(
  healthScore: number,
  sentiment: SentimentAnalysis,
  interactionType: InteractionType,
  baseReward: number = 10,
): FamilyHealthReward {
  // Health score multiplier (0.1x to 2x)
  const healthMultiplier = Math.max(0.1, Math.min(2, healthScore / 50));

  // Sentiment bonus for very positive interactions
  let sentimentBonus = 0;
  if (sentiment.positive >= 8 && sentiment.negative <= 2) {
    sentimentBonus = baseReward * 0.5; // 50% bonus for very positive
  } else if (sentiment.positive >= 5 && sentiment.negative <= 1) {
    sentimentBonus = baseReward * 0.25; // 25% bonus for positive
  }

  // Interaction type bonus
  const typeBonus: Record<InteractionType, number> = {
    wisdom: baseReward * 0.3,
    intimacy: baseReward * 0.2,
    "generational-bridge": baseReward * 0.35,
    presence: baseReward * 0.15,
    growth: baseReward * 0.25,
  };

  const totalAmount = Math.round(
    baseReward * healthMultiplier + sentimentBonus + typeBonus[interactionType],
  );

  return {
    recipientId: "", // To be filled by caller
    amount: Math.max(1, totalAmount), // Minimum 1 token
    reason: `Family interaction: ${interactionType} (health: ${healthScore})`,
    healthScore,
    sentimentBonus,
  };
}

// Generate message hash for consensus logging
export function generateMessageHash(
  content: string,
  timestamp: number,
  agentId: string,
): string {
  const hashInput = `${content}:${timestamp}:${agentId}`;
  return createHash("sha256").update(hashInput).digest("hex");
}

// Enhanced interaction type detection
export async function detectInteractionType(
  text: string,
  runtime: any,
): Promise<{ type: InteractionType; confidence: number }> {
  const { generateObject } = runtime;

  try {
    const prompt = `Analyze this family interaction and classify it into one of these types:
- wisdom: sharing knowledge, advice, life lessons
- intimacy: emotional bonding, personal sharing, vulnerability
- generational-bridge: connecting different ages/generations
- presence: being attentive, listening, showing up
- growth: learning, developing, personal improvement

Respond with JSON: {"type": "category", "confidence": 0.0-1.0}

TEXT: ${text}`;

    const result = await generateObject(
      {
        prompt,
        model: "SMALL",
      },
      { type: "presence", confidence: 0.5 },
    );

    if (
      result &&
      typeof result.type === "string" &&
      typeof result.confidence === "number"
    ) {
      const validTypes: InteractionType[] = [
        "wisdom",
        "intimacy",
        "generational-bridge",
        "presence",
        "growth",
      ];
      if (validTypes.includes(result.type as InteractionType)) {
        return {
          type: result.type as InteractionType,
          confidence: Math.max(0, Math.min(1, result.confidence)),
        };
      }
    }
  } catch (err) {
    // Fallback to keyword-based detection
  }

  // Fallback: keyword-based detection
  const typeKeywords: Record<InteractionType, string[]> = {
    wisdom: [
      "advice",
      "learn",
      "teach",
      "experience",
      "lesson",
      "guidance",
      "mentor",
    ],
    intimacy: [
      "feel",
      "love",
      "close",
      "personal",
      "share",
      "heart",
      "emotion",
      "trust",
    ],
    "generational-bridge": [
      "grandpa",
      "grandma",
      "generation",
      "tradition",
      "family history",
      "legacy",
    ],
    presence: [
      "listen",
      "here",
      "attention",
      "focus",
      "present",
      "available",
      "support",
    ],
    growth: [
      "improve",
      "develop",
      "progress",
      "goal",
      "change",
      "better",
      "grow",
      "skill",
    ],
  };

  let bestType: InteractionType = "presence";
  let maxMatches = 0;

  const lowerText = text.toLowerCase();
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    const matches = keywords.reduce(
      (count, keyword) => count + (lowerText.includes(keyword) ? 1 : 0),
      0,
    );
    if (matches > maxMatches) {
      maxMatches = matches;
      bestType = type as InteractionType;
    }
  }

  const confidence = Math.min(0.9, maxMatches / 10 + 0.3); // Base confidence + matches
  return { type: bestType, confidence };
}

// Hedera Metrics Logger class for logging family interactions to consensus
export class HederaMetricsLogger {
  private hederaService: any; // HederaService instance
  private metricsQueue: HederaFamilyMetrics[] = [];
  private batchSize: number;
  private flushInterval: number;
  private isProcessing: boolean = false;

  constructor(
    hederaService: any,
    batchSize: number = 10,
    flushInterval: number = 30000, // 30 seconds
  ) {
    this.hederaService = hederaService;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;

    // Auto-flush on interval
    setInterval(() => this.flushMetrics(), this.flushInterval);
  }

  async logSentimentWithRewards(
    familyId: string,
    agentId: string,
    userId: string,
    messageContent: string,
    runtime: any,
  ): Promise<{
    metrics: HederaFamilyMetrics;
    rewards: FamilyHealthReward;
    success: boolean;
    error?: string;
  }> {
    try {
      // Analyze sentiment and interaction type
      const [sentiment, interactionDetection] = await Promise.all([
        classifySentiment(messageContent, runtime),
        detectInteractionType(messageContent, runtime),
      ]);

      // Calculate health score and rewards
      const healthScore = calculateFamilyHealthScore(
        sentiment,
        interactionDetection.type,
        messageContent.length,
      );

      const rewards = calculateTokenRewards(
        healthScore,
        sentiment,
        interactionDetection.type,
      );
      rewards.recipientId = userId;

      // Create metrics object
      const timestamp = Date.now();
      const messageHash = generateMessageHash(
        messageContent,
        timestamp,
        agentId,
      );

      const metrics: HederaFamilyMetrics = {
        familyId,
        agentId,
        timestamp,
        sentiment,
        healthScore,
        messageHash,
        interactionType: interactionDetection.type,
      };

      // Queue for consensus logging
      this.metricsQueue.push(metrics);

      // Auto-flush if batch is full
      if (this.metricsQueue.length >= this.batchSize) {
        await this.flushMetrics();
      }

      // Distribute rewards if configured
      if (this.hederaService && rewards.amount > 0) {
        try {
          await this.distributeRewards(rewards);
        } catch (rewardError) {
          console.warn("Failed to distribute rewards:", rewardError);
          // Continue even if rewards fail
        }
      }

      return {
        metrics,
        rewards,
        success: true,
      };
    } catch (error) {
      console.error("Error logging sentiment with rewards:", error);
      return {
        metrics: {} as HederaFamilyMetrics,
        rewards: {} as FamilyHealthReward,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.isProcessing || this.metricsQueue.length === 0) return;

    this.isProcessing = true;
    const batch = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      // Send batch to Hedera consensus
      if (this.hederaService?.consensus) {
        const consensusMessage = JSON.stringify({
          type: "family_metrics_batch",
          timestamp: Date.now(),
          metrics: batch,
        });

        const result = await this.hederaService.consensus.submitMessage(
          this.hederaService.getConfig().familyTopicId,
          consensusMessage,
        );

        if (result.success) {
          console.log(`✅ Flushed ${batch.length} family metrics to consensus`);
        } else {
          console.error(
            "❌ Failed to flush metrics to consensus:",
            result.error,
          );
          // Re-queue failed metrics
          this.metricsQueue.unshift(...batch);
        }
      }
    } catch (error) {
      console.error("Error flushing metrics:", error);
      // Re-queue failed metrics
      this.metricsQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  private async distributeRewards(rewards: FamilyHealthReward): Promise<void> {
    if (!this.hederaService?.tokens) return;

    try {
      const result = await this.hederaService.tokens.transferTokens(
        this.hederaService.getConfig().familyHealthTokenId,
        rewards.recipientId,
        rewards.amount,
        rewards.reason,
      );

      if (result.success) {
        console.log(
          `✅ Distributed ${rewards.amount} health tokens to ${rewards.recipientId}`,
        );
      } else {
        console.error("❌ Failed to distribute tokens:", result.error);
      }
    } catch (error) {
      console.error("Error distributing rewards:", error);
      throw error;
    }
  }

  // Manual flush for immediate processing
  async forceFlush(): Promise<void> {
    await this.flushMetrics();
  }

  // Get current queue status
  getQueueStatus(): { queued: number; processing: boolean } {
    return {
      queued: this.metricsQueue.length,
      processing: this.isProcessing,
    };
  }

  // Cleanup resources
  async dispose(): Promise<void> {
    if (this.metricsQueue.length > 0) {
      await this.flushMetrics();
    }
  }
}
