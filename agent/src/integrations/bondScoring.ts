/**
 * Bond Scoring Signal Aggregators
 * 
 * Extracts behavioral metrics from SQLite memories table to calculate
 * objective family bond score signals. All signals are privacy-preserving:
 * no raw message content, only aggregated metrics.
 */

import { elizaLogger } from "@elizaos/core";
import type { IDatabaseAdapter } from "@elizaos/core";
import { BondScoreService } from "@familexyz/agent/services/BondScoreService.js";

export interface SignalAggregationContext {
  familyId: string;
  roomId: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  db: IDatabaseAdapter;
}

/**
 * Aggregates cross-generational interaction data from memories
 */
export class GenerationalInteractionAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      // Query all messages in the week
      const startTime = ctx.startDate.getTime();
      const endTime = ctx.endDate.getTime();

      const query = `
        SELECT 
          m.id,
          m.userId,
          m.createdAt,
          m.content,
          a.details
        FROM memories m
        LEFT JOIN accounts a ON m.userId = a.id
        WHERE m.roomId = ?
          AND m.type = 'message'
          AND datetime(m.createdAt) >= ?
          AND datetime(m.createdAt) <= ?
        ORDER BY m.createdAt ASC
      `;

      const messages = await ctx.db.query(query, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      // Parse age groups from account details
      const userAgeGroups: Map<string, string> = new Map();
      const interactions = {
        elder_adult: 0,
        adult_youth: 0,
        youth_child: 0,
      };
      let initiationCounts = {
        elder_initiated: 0,
        youth_initiated: 0,
      };

      // Build user age group map
      for (const msg of messages) {
        if (!msg.userId || userAgeGroups.has(msg.userId)) continue;

        let ageGroup = "unknown";
        if (msg.details) {
          try {
            const details = typeof msg.details === "string" ? JSON.parse(msg.details) : msg.details;
            ageGroup = details.ageGroup || "unknown";
          } catch (e) {
            // Keep as unknown
          }
        }
        userAgeGroups.set(msg.userId, ageGroup);
      }

      // Count interactions between different age groups
      for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];

        if (!current.userId || !previous.userId) continue;
        if (current.userId === previous.userId) continue; // Same person, not interaction

        const senderAge = userAgeGroups.get(current.userId) || "unknown";
        const receiverAge = userAgeGroups.get(previous.userId) || "unknown";

        // Count cross-generational interactions
        if (senderAge === "elder" && receiverAge === "adult") {
          interactions.elder_adult++;
          initiationCounts.elder_initiated++;
        } else if (senderAge === "adult" && receiverAge === "elder") {
          interactions.elder_adult++;
          initiationCounts.youth_initiated++;
        } else if (senderAge === "adult" && receiverAge === "youth") {
          interactions.adult_youth++;
          initiationCounts.elder_initiated++;
        } else if (senderAge === "youth" && receiverAge === "adult") {
          interactions.adult_youth++;
          initiationCounts.youth_initiated++;
        } else if (senderAge === "youth" && receiverAge === "child") {
          interactions.youth_child++;
          initiationCounts.elder_initiated++;
        } else if (senderAge === "child" && receiverAge === "youth") {
          interactions.youth_child++;
          initiationCounts.youth_initiated++;
        }
      }

      const totalInitiations = initiationCounts.elder_initiated + initiationCounts.youth_initiated;
      const initiationRate = {
        elder_initiated: totalInitiations > 0 ? (initiationCounts.elder_initiated / totalInitiations) * 100 : 50,
        youth_initiated: totalInitiations > 0 ? (initiationCounts.youth_initiated / totalInitiations) * 100 : 50,
      };

      return {
        interactions,
        initiationRate,
      };
    } catch (error) {
      elizaLogger.error("Error aggregating generational interactions:", error);
      return {
        interactions: { elder_adult: 0, adult_youth: 0, youth_child: 0 },
        initiationRate: { elder_initiated: 50, youth_initiated: 50 },
      };
    }
  }
}

/**
 * Aggregates response reciprocity metrics (time-to-response, engagement depth)
 */
export class ResponseReciprocityAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      const query = `
        SELECT 
          m.id,
          m.userId,
          m.createdAt,
          m.content
        FROM memories m
        WHERE m.roomId = ?
          AND m.type = 'message'
          AND datetime(m.createdAt) >= ?
          AND datetime(m.createdAt) <= ?
        ORDER BY m.createdAt ASC
      `;

      const messages = await ctx.db.query(query, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      if (messages.length === 0) {
        return {
          avgResponseTime: 0,
          responseRate: 0,
          avgConversationLength: 0,
          multiTurnRatio: 0,
        };
      }

      // Calculate response times and conversation threading
      let totalResponseTime = 0;
      let responseCount = 0;
      let conversationLengths: number[] = [];
      let currentConversationLength = 1;
      let lastUserId = messages[0].userId;

      for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];

        if (current.userId === lastUserId) {
          // Same user continued
          currentConversationLength++;
        } else {
          // Different user responded
          const responseTime = (new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) / (1000 * 60 * 60); // hours
          totalResponseTime += responseTime;
          responseCount++;
          lastUserId = current.userId;
          currentConversationLength++;

          // Track conversation length when switching users
          if (i > 1 && messages[i - 2].userId !== previous.userId) {
            conversationLengths.push(currentConversationLength);
            currentConversationLength = 1;
          }
        }
      }

      if (currentConversationLength > 1) {
        conversationLengths.push(currentConversationLength);
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const avgConversationLength = conversationLengths.length > 0 
        ? conversationLengths.reduce((a, b) => a + b, 0) / conversationLengths.length 
        : 0;
      
      const multiTurnRatio = conversationLengths.filter(l => l >= 3).length / (conversationLengths.length || 1) * 100;
      const responseRate = (responseCount / messages.length) * 100;

      return {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        responseRate: Math.round(responseRate),
        avgConversationLength: Math.round(avgConversationLength * 10) / 10,
        multiTurnRatio: Math.round(multiTurnRatio),
      };
    } catch (error) {
      elizaLogger.error("Error aggregating response reciprocity:", error);
      return {
        avgResponseTime: 0,
        responseRate: 0,
        avgConversationLength: 0,
        multiTurnRatio: 0,
      };
    }
  }
}

/**
 * Aggregates sentiment trajectory from message content
 * Uses basic sentiment heuristics (positive/negative words)
 */
export class SentimentTrajectoryAggregator {
  private static readonly POSITIVE_WORDS = [
    "love", "great", "wonderful", "amazing", "happy", "joy", "beautiful",
    "excellent", "fantastic", "grateful", "appreciate", "thank", "blessed",
    "proud", "laugh", "smile", "hug", "care", "support", "understand"
  ];

  private static readonly NEGATIVE_WORDS = [
    "hate", "terrible", "awful", "angry", "sad", "hurt", "upset",
    "frustrated", "disappointed", "worry", "anxiety", "conflict",
    "argue", "fight", "blame", "wrong", "fail", "mistake"
  ];

  static async aggregate(ctx: SignalAggregationContext) {
    try {
      const query = `
        SELECT 
          m.content,
          m.createdAt
        FROM memories m
        WHERE m.roomId = ?
          AND m.type = 'message'
          AND datetime(m.createdAt) >= ?
          AND datetime(m.createdAt) <= ?
        ORDER BY m.createdAt ASC
      `;

      const messages = await ctx.db.query(query, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      if (messages.length === 0) {
        return {
          avgSentiment: 0,
          sentimentTrend: 0,
          positiveWords: 0,
          negativeWords: 0,
          vulnerabilityScore: 0,
        };
      }

      let totalPositive = 0;
      let totalNegative = 0;
      let vulnerabilityCount = 0;

      // Split week into halves to detect trend
      const midpoint = Math.floor(messages.length / 2);
      let firstHalfSentiment = 0;
      let secondHalfSentiment = 0;

      for (let i = 0; i < messages.length; i++) {
        const text = (messages[i].content || "").toLowerCase();

        // Count positive and negative words
        const positiveCount = this.POSITIVE_WORDS.filter(word => text.includes(word)).length;
        const negativeCount = this.NEGATIVE_WORDS.filter(word => text.includes(word)).length;

        totalPositive += positiveCount;
        totalNegative += negativeCount;

        // Detect vulnerability (emotional disclosure)
        if (text.includes("feel") || text.includes("afraid") || text.includes("sorry") || text.includes("miss")) {
          vulnerabilityCount++;
        }

        // Calculate sentiment for trend
        const messageSentiment = positiveCount - negativeCount;
        if (i < midpoint) {
          firstHalfSentiment += messageSentiment;
        } else {
          secondHalfSentiment += messageSentiment;
        }
      }

      const avgSentiment = (totalPositive - totalNegative) / (totalPositive + totalNegative || 1);
      const sentimentTrend = secondHalfSentiment - firstHalfSentiment > 0 ? 0.1 : secondHalfSentiment - firstHalfSentiment < 0 ? -0.1 : 0;
      const vulnerabilityScore = (vulnerabilityCount / messages.length) * 100;

      return {
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        sentimentTrend: sentimentTrend,
        positiveWords: totalPositive,
        negativeWords: totalNegative,
        vulnerabilityScore: Math.round(vulnerabilityScore),
      };
    } catch (error) {
      elizaLogger.error("Error aggregating sentiment trajectory:", error);
      return {
        avgSentiment: 0,
        sentimentTrend: 0,
        positiveWords: 0,
        negativeWords: 0,
        vulnerabilityScore: 0,
      };
    }
  }
}

/**
 * Aggregates challenge completion metrics
 * Queries goals table for completion status
 */
export class ChallengeCompletionAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      const query = `
        SELECT 
          id,
          name,
          status,
          createdAt
        FROM goals
        WHERE roomId = ?
          AND datetime(createdAt) >= ?
          AND datetime(createdAt) <= ?
      `;

      const goals = await ctx.db.query(query, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      if (goals.length === 0) {
        return {
          challengesCreated: 0,
          challengesCompleted: 0,
          participantDiversity: 0,
        };
      }

      const challengesCreated = goals.length;
      const challengesCompleted = goals.filter((g: any) => g.status === "completed").length;

      // Query participants for diversity
      const participantsQuery = `
        SELECT COUNT(DISTINCT userId) as count
        FROM participants
        WHERE roomId = ?
      `;
      const participantResult = await ctx.db.query(participantsQuery, [ctx.roomId]);
      const totalParticipants = participantResult[0]?.count || 1;

      // Estimate participation diversity (would need enhanced schema in future)
      const participantDiversity = Math.min(100, (challengesCompleted / challengesCreated || 0) * 100);

      return {
        challengesCreated,
        challengesCompleted,
        participantDiversity: Math.round(participantDiversity),
      };
    } catch (error) {
      elizaLogger.error("Error aggregating challenge completion:", error);
      return {
        challengesCreated: 0,
        challengesCompleted: 0,
        participantDiversity: 0,
      };
    }
  }
}

/**
 * Aggregates presence consistency (who engages regularly)
 */
export class PresenceConsistencyAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      const query = `
        SELECT DISTINCT
          DATE(m.createdAt) as date,
          m.userId
        FROM memories m
        WHERE m.roomId = ?
          AND m.type = 'message'
          AND datetime(m.createdAt) >= ?
          AND datetime(m.createdAt) <= ?
      `;

      const activity = await ctx.db.query(query, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      if (activity.length === 0) {
        return {
          daysActive: 0,
          regularUsers: 0,
          totalActiveMembers: 0,
          longestActiveStreak: 0,
          memberStreaks: 0,
        };
      }

      // Count unique days
      const uniqueDays = new Set(activity.map((a: any) => a.date)).size;

      // Count users and their activity frequency
      const userDays: Map<string, number> = new Map();
      for (const record of activity) {
        const current = userDays.get(record.userId) || 0;
        userDays.set(record.userId, current + 1);
      }

      const regularUsers = Array.from(userDays.values()).filter(days => days >= 4).length;
      const totalActiveMembers = userDays.size;

      // Calculate longest streak (simplified)
      const longestActiveStreak = Math.min(7, uniqueDays);
      const memberStreaks = regularUsers;

      return {
        daysActive: Math.min(7, uniqueDays),
        regularUsers,
        totalActiveMembers,
        longestActiveStreak,
        memberStreaks,
      };
    } catch (error) {
      elizaLogger.error("Error aggregating presence consistency:", error);
      return {
        daysActive: 0,
        regularUsers: 0,
        totalActiveMembers: 0,
        longestActiveStreak: 0,
        memberStreaks: 0,
      };
    }
  }
}

/**
 * Aggregates network topology metrics
 */
export class NetworkTopologyAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      // Get all participants
      const participantsQuery = `
        SELECT DISTINCT userId
        FROM participants
        WHERE roomId = ?
      `;
      const participants = await ctx.db.query(participantsQuery, [ctx.roomId]);

      if (participants.length < 2) {
        return {
          density: 0,
          clustering: 0,
          newPairs: 0,
          previouslyInactive: 0,
          hubDiversification: 0,
        };
      }

      // Get message interactions
      const messagesQuery = `
        SELECT DISTINCT
          m1.userId as user1,
          m2.userId as user2
        FROM memories m1
        JOIN memories m2 ON m1.roomId = m2.roomId
          AND m1.userId != m2.userId
          AND datetime(m1.createdAt) <= datetime(m2.createdAt)
          AND datetime(m2.createdAt) - datetime(m1.createdAt) < '01:00:00'
        WHERE m1.roomId = ?
          AND m1.type = 'message'
          AND m2.type = 'message'
          AND datetime(m1.createdAt) >= ?
          AND datetime(m2.createdAt) <= ?
      `;

      const interactions = await ctx.db.query(messagesQuery, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      const possiblePairs = (participants.length * (participants.length - 1)) / 2;
      const actualPairs = new Set(
        interactions.map((i: any) => [i.user1, i.user2].sort().join("-"))
      ).size;

      const density = possiblePairs > 0 ? actualPairs / possiblePairs : 0;

      return {
        density: Math.round(density * 100) / 100,
        clustering: Math.min(1, actualPairs / possiblePairs),
        newPairs: actualPairs > 0 ? 1 : 0, // Simplified
        previouslyInactive: 0, // Would need previous period data
        hubDiversification: density > 0.3 ? 0.7 : 0.3,
      };
    } catch (error) {
      elizaLogger.error("Error aggregating network topology:", error);
      return {
        density: 0,
        clustering: 0,
        newPairs: 0,
        previouslyInactive: 0,
        hubDiversification: 0,
      };
    }
  }
}

/**
 * Aggregates Hedera consensus metrics
 * (Simplified for now - full implementation requires consensus logs)
 */
export class HederaConsensusAggregator {
  static async aggregate(ctx: SignalAggregationContext) {
    try {
      // Query decisions/goals logged this week
      const decisionQuery = `
        SELECT COUNT(*) as total
        FROM goals
        WHERE roomId = ?
          AND datetime(createdAt) >= ?
          AND datetime(createdAt) <= ?
      `;

      const decisions = await ctx.db.query(decisionQuery, [
        ctx.roomId,
        ctx.startDate.toISOString(),
        ctx.endDate.toISOString(),
      ]);

      const decisionsLogged = decisions[0]?.total || 0;

      return {
        decisionsLogged,
        consensusReached: Math.max(0, decisionsLogged - 1), // Simplified
        timeToConsensus: 12, // Average hours
        escalations: 0, // Would need dedicated escalation table
        resolutionRate: decisionsLogged > 0 ? 80 : 0,
      };
    } catch (error) {
      elizaLogger.error("Error aggregating Hedera consensus:", error);
      return {
        decisionsLogged: 0,
        consensusReached: 0,
        timeToConsensus: 0,
        escalations: 0,
        resolutionRate: 0,
      };
    }
  }
}

/**
 * Main aggregator orchestrator - runs all signal aggregators
 */
export async function aggregateAllSignals(ctx: SignalAggregationContext) {
  const signals = {
    generational: await GenerationalInteractionAggregator.aggregate(ctx),
    reciprocity: await ResponseReciprocityAggregator.aggregate(ctx),
    sentiment: await SentimentTrajectoryAggregator.aggregate(ctx),
    challenges: await ChallengeCompletionAggregator.aggregate(ctx),
    presence: await PresenceConsistencyAggregator.aggregate(ctx),
    topology: await NetworkTopologyAggregator.aggregate(ctx),
    consensus: await HederaConsensusAggregator.aggregate(ctx),
  };

  // Calculate scores using BondScoreService
  const scores = {
    generationalInteraction: BondScoreService.calculateGenerationalInteraction(signals.generational).score,
    responseReciprocity: BondScoreService.calculateResponseReciprocity(signals.reciprocity).score,
    sentimentTrajectory: BondScoreService.calculateSentimentTrajectory(signals.sentiment).score,
    challengeCompletion: BondScoreService.calculateChallengeCompletion(signals.challenges).score,
    presenceConsistency: BondScoreService.calculatePresenceConsistency(signals.presence).score,
    networkTopology: BondScoreService.calculateNetworkTopology(signals.topology).score,
    hederaConsensus: BondScoreService.calculateHederaConsensus(signals.consensus).score,
  };

  return { signals, scores };
}
