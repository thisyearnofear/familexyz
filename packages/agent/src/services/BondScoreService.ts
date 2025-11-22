/**
 * Family Bond Scoring Service
 * 
 * Calculates objective family bond metrics based on behavioral signals.
 * All signals are privacy-preserving: no raw message content, only aggregated metrics.
 */

import { v4 as uuidv4 } from "uuid";

export interface FamilySignalData {
  familyId: string;
  weekNumber: number;
  timestamp: Date;
}

export interface GenerationalInteractionScore extends FamilySignalData {
  interactions: {
    elder_adult: number;
    adult_youth: number;
    youth_child: number;
  };
  initiationRate: {
    elder_initiated: number;
    youth_initiated: number;
  };
  score: number;
  trend: "improving" | "stable" | "declining";
}

export interface ResponseReciprocityScore extends FamilySignalData {
  avgResponseTime: number;
  responseRate: number;
  avgConversationLength: number;
  multiTurnRatio: number;
  score: number;
}

export interface SentimentTrajectoryScore extends FamilySignalData {
  avgSentiment: number; // -1 to +1
  sentimentTrend: number;
  positiveWords: number;
  negativeWords: number;
  vulnerabilityScore: number;
  score: number;
}

export interface ChallengeCompletionScore extends FamilySignalData {
  challengesCreated: number;
  challengesCompleted: number;
  completionRate: number;
  participantDiversity: number;
  score: number;
}

export interface PresenceConsistencyScore extends FamilySignalData {
  daysActive: number;
  regularUsers: number;
  totalActiveMembers: number;
  longestActiveStreak: number;
  memberStreaks: number;
  score: number;
}

export interface NetworkTopologyScore extends FamilySignalData {
  density: number;
  clustering: number;
  newPairs: number;
  previouslyInactive: number;
  hubDiversification: number;
  score: number;
}

export interface HederaConsensusScore extends FamilySignalData {
  decisionsLogged: number;
  consensusReached: number;
  timeToConsensus: number;
  escalations: number;
  resolutionRate: number;
  score: number;
}

export interface CompositeBondScore extends FamilySignalData {
  scores: {
    generationalInteraction: number;
    responseReciprocity: number;
    sentimentTrajectory: number;
    challengeCompletion: number;
    presenceConsistency: number;
    networkTopology: number;
    hederaConsensus: number;
  };
  weights: {
    generationalInteraction: number;
    responseReciprocity: number;
    sentimentTrajectory: number;
    challengeCompletion: number;
    presenceConsistency: number;
    networkTopology: number;
    hederaConsensus: number;
  };
  bondScore: number; // 0-100 weighted average
  trend: "improving" | "stable" | "declining";
  weekOverWeekDelta: number;
}

export class BondScoreService {
  /**
   * Default signal weights (sum to 1.0)
   * Adjustable per family preference
   */
  private static readonly DEFAULT_WEIGHTS = {
    generationalInteraction: 0.20,
    responseReciprocity: 0.20,
    sentimentTrajectory: 0.15,
    challengeCompletion: 0.15,
    presenceConsistency: 0.15,
    networkTopology: 0.10,
    hederaConsensus: 0.05,
  };

  /**
   * Calculate generational interaction signal
   * Measures cross-age-group interaction frequency and balance
   */
  static calculateGenerationalInteraction(
    data: {
      interactions: {
        elder_adult: number;
        adult_youth: number;
        youth_child: number;
      };
      initiationRate: {
        elder_initiated: number;
        youth_initiated: number;
      };
    },
    previousWeekScore?: number
  ): GenerationalInteractionScore {
    const totalInteractions =
      data.interactions.elder_adult +
      data.interactions.adult_youth +
      data.interactions.youth_child;

    // Normalize interactions (expect ~20 cross-generational per week)
    const frequencyScore = Math.min(100, (totalInteractions / 20) * 100);

    // Balance bonus (50/50 initiation is ideal)
    const initiationBalance = Math.abs(
      data.initiationRate.elder_initiated - 50
    );
    const balanceBonus = Math.max(0, 20 - initiationBalance / 5);

    let score = frequencyScore + balanceBonus;
    score = Math.min(100, score);

    const trend = previousWeekScore
      ? score > previousWeekScore * 1.05
        ? "improving"
        : score < previousWeekScore * 0.95
          ? "declining"
          : "stable"
      : "stable";

    return {
      familyId: "", // To be set by caller
      weekNumber: 0,
      timestamp: new Date(),
      interactions: data.interactions,
      initiationRate: data.initiationRate,
      score: Math.round(score),
      trend,
    };
  }

  /**
   * Calculate response reciprocity signal
   * Measures conversation engagement and responsiveness
   */
  static calculateResponseReciprocity(data: {
    avgResponseTime: number; // hours
    responseRate: number; // 0-100
    avgConversationLength: number; // message count
    multiTurnRatio: number; // 0-100
  }): ResponseReciprocityScore {
    // Fast response time < 4 hours: 30 points
    const responseTimeScore =
      data.avgResponseTime < 4 ? 30 : Math.max(0, 30 - data.avgResponseTime);

    // Response rate bonus: 30 points
    const responseRateScore = (data.responseRate / 100) * 30;

    // Conversation length bonus: 20 points (target 5+ messages)
    const lengthScore = Math.min(
      20,
      (data.avgConversationLength / 5) * 20
    );

    // Multi-turn ratio: 20 points
    const multiTurnScore = (data.multiTurnRatio / 100) * 20;

    const score = responseTimeScore + responseRateScore + lengthScore + multiTurnScore;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      avgResponseTime: data.avgResponseTime,
      responseRate: data.responseRate,
      avgConversationLength: data.avgConversationLength,
      multiTurnRatio: data.multiTurnRatio,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate sentiment trajectory signal
   * Measures emotional tone of communications trending positive
   */
  static calculateSentimentTrajectory(data: {
    avgSentiment: number; // -1 to +1
    sentimentTrend: number; // delta from previous week
    positiveWords: number;
    negativeWords: number;
    vulnerabilityScore: number; // 0-100
  }): SentimentTrajectoryScore {
    // Convert sentiment -1 to +1 into 0-100 scale
    const sentimentBaseScore = ((data.avgSentiment + 1) / 2) * 80; // Max 80

    // Trend bonus: +10 if trending positive
    const trendBonus = data.sentimentTrend > 0 ? 10 : 0;

    // Vulnerability bonus (emotional openness): 0-10
    const vulnerabilityBonus = (data.vulnerabilityScore / 100) * 10;

    const score = sentimentBaseScore + trendBonus + vulnerabilityBonus;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      avgSentiment: data.avgSentiment,
      sentimentTrend: data.sentimentTrend,
      positiveWords: data.positiveWords,
      negativeWords: data.negativeWords,
      vulnerabilityScore: data.vulnerabilityScore,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate challenge completion signal
   * Measures shared growth challenges completed together
   */
  static calculateChallengeCompletion(data: {
    challengesCreated: number;
    challengesCompleted: number;
    participantDiversity: number; // 0-100
  }): ChallengeCompletionScore {
    const completionRate =
      data.challengesCreated > 0
        ? (data.challengesCompleted / data.challengesCreated) * 100
        : 0;

    // Base score from completion rate (0-80)
    const baseScore = Math.min(80, completionRate);

    // Diversity bonus (20 points if >60% of family participated)
    const diversityBonus = data.participantDiversity > 60 ? 20 : 0;

    const score = baseScore + diversityBonus;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      challengesCreated: data.challengesCreated,
      challengesCompleted: data.challengesCompleted,
      completionRate,
      participantDiversity: data.participantDiversity,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate presence consistency signal
   * Measures regular, habitual family engagement
   */
  static calculatePresenceConsistency(data: {
    daysActive: number; // 1-7
    regularUsers: number;
    totalActiveMembers: number;
    longestActiveStreak: number;
    memberStreaks: number;
  }): PresenceConsistencyScore {
    // Days active score: 7 days = 40, 4 days = 20
    const daysScore = (data.daysActive / 7) * 40;

    // Regular users ratio: (regularUsers / totalActiveMembers) * 40
    const regularRatio = data.totalActiveMembers > 0 
      ? (data.regularUsers / data.totalActiveMembers) * 40
      : 0;

    // Streak bonus: +20 if >50% of members have 4+ day streaks
    const streakRatio = data.totalActiveMembers > 0
      ? data.memberStreaks / data.totalActiveMembers
      : 0;
    const streakBonus = streakRatio > 0.5 ? 20 : 0;

    const score = daysScore + regularRatio + streakBonus;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      daysActive: data.daysActive,
      regularUsers: data.regularUsers,
      totalActiveMembers: data.totalActiveMembers,
      longestActiveStreak: data.longestActiveStreak,
      memberStreaks: data.memberStreaks,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate network topology signal
   * Measures relationship strength and new connections
   */
  static calculateNetworkTopology(data: {
    density: number; // 0-1
    clustering: number; // 0-1
    newPairs: number;
    previouslyInactive: number;
    hubDiversification: number; // 0-1
  }): NetworkTopologyScore {
    // Density: 0.3 = 100, 0.1 = 50, scales nonlinearly
    const densityScore = Math.min(100, data.density * 333);

    // New pair bonus: +10 per new pair (capped at 20)
    const newPairBonus = Math.min(20, data.newPairs * 10);

    // Previously inactive member bonus: +15 if any
    const inactiveBonus = data.previouslyInactive > 0 ? 15 : 0;

    // Hub diversification bonus: +20 if > 0.6
    const diversificationBonus = data.hubDiversification > 0.6 ? 20 : 0;

    const score = densityScore + newPairBonus + inactiveBonus + diversificationBonus;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      density: data.density,
      clustering: data.clustering,
      newPairs: data.newPairs,
      previouslyInactive: data.previouslyInactive,
      hubDiversification: data.hubDiversification,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate Hedera consensus signal
   * Measures family reaching agreements and conflict resolution
   */
  static calculateHederaConsensus(data: {
    decisionsLogged: number;
    consensusReached: number;
    timeToConsensus: number; // hours
    escalations: number;
    resolutionRate: number; // 0-100
  }): HederaConsensusScore {
    // Consensus rate: (consensusReached / decisionsLogged) * 50
    const consensusRatio =
      data.decisionsLogged > 0
        ? (data.consensusReached / data.decisionsLogged) * 50
        : 0;

    // Fast resolution bonus: +25 if < 24 hours
    const resolutionBonus = data.timeToConsensus < 24 ? 25 : 0;

    // Low escalation score: +25
    const escalationScore = Math.max(0, 25 - data.escalations * 5);

    const score = consensusRatio + resolutionBonus + escalationScore;

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      decisionsLogged: data.decisionsLogged,
      consensusReached: data.consensusReached,
      timeToConsensus: data.timeToConsensus,
      escalations: data.escalations,
      resolutionRate: data.resolutionRate,
      score: Math.round(Math.min(100, score)),
    };
  }

  /**
   * Calculate composite bond score from all signals
   */
  static calculateBondScore(
    scores: {
      generationalInteraction: number;
      responseReciprocity: number;
      sentimentTrajectory: number;
      challengeCompletion: number;
      presenceConsistency: number;
      networkTopology: number;
      hederaConsensus: number;
    },
    weights = BondScoreService.DEFAULT_WEIGHTS,
    previousWeekScore?: number
  ): CompositeBondScore {
    const bondScore =
      scores.generationalInteraction * weights.generationalInteraction +
      scores.responseReciprocity * weights.responseReciprocity +
      scores.sentimentTrajectory * weights.sentimentTrajectory +
      scores.challengeCompletion * weights.challengeCompletion +
      scores.presenceConsistency * weights.presenceConsistency +
      scores.networkTopology * weights.networkTopology +
      scores.hederaConsensus * weights.hederaConsensus;

    const weekOverWeekDelta = previousWeekScore
      ? ((bondScore - previousWeekScore) / previousWeekScore) * 100
      : 0;

    const trend = weekOverWeekDelta > 2 
      ? "improving"
      : weekOverWeekDelta < -2
        ? "declining"
        : "stable";

    return {
      familyId: "",
      weekNumber: 0,
      timestamp: new Date(),
      scores,
      weights,
      bondScore: Math.round(bondScore),
      trend,
      weekOverWeekDelta: Math.round(weekOverWeekDelta * 10) / 10,
    };
  }

  /**
   * Get default weights
   */
  static getDefaultWeights() {
    return { ...BondScoreService.DEFAULT_WEIGHTS };
  }
}
