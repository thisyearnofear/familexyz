import { BondScoreService } from "../BondScoreService";

describe("BondScoreService", () => {
  describe("calculateGenerationalInteraction", () => {
    it("should calculate score from interaction frequency", () => {
      const result = BondScoreService.calculateGenerationalInteraction({
        interactions: {
          elder_adult: 10,
          adult_youth: 8,
          youth_child: 5,
        },
        initiationRate: {
          elder_initiated: 50,
          youth_initiated: 50,
        },
      });

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should apply balance bonus for equal initiation", () => {
      const balanced = BondScoreService.calculateGenerationalInteraction({
        interactions: {
          elder_adult: 10,
          adult_youth: 8,
          youth_child: 5,
        },
        initiationRate: {
          elder_initiated: 50,
          youth_initiated: 50,
        },
      });

      const unbalanced = BondScoreService.calculateGenerationalInteraction({
        interactions: {
          elder_adult: 10,
          adult_youth: 8,
          youth_child: 5,
        },
        initiationRate: {
          elder_initiated: 80,
          youth_initiated: 20,
        },
      });

      expect(balanced.score).toBeGreaterThan(unbalanced.score);
    });

    it("should track trend based on previous score", () => {
      const improving = BondScoreService.calculateGenerationalInteraction(
        {
          interactions: {
            elder_adult: 25,
            adult_youth: 20,
            youth_child: 15,
          },
          initiationRate: {
            elder_initiated: 50,
            youth_initiated: 50,
          },
        },
        50 // previous week score
      );

      expect(improving.trend).toBe("improving");
    });
  });

  describe("calculateResponseReciprocity", () => {
    it("should calculate score from response metrics", () => {
      const result = BondScoreService.calculateResponseReciprocity({
        avgResponseTime: 2, // hours
        responseRate: 85, // 85%
        avgConversationLength: 6, // messages
        multiTurnRatio: 75, // 75%
      });

      expect(result.score).toBeGreaterThan(80);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should penalize slow response times", () => {
      const fast = BondScoreService.calculateResponseReciprocity({
        avgResponseTime: 1,
        responseRate: 80,
        avgConversationLength: 5,
        multiTurnRatio: 70,
      });

      const slow = BondScoreService.calculateResponseReciprocity({
        avgResponseTime: 12,
        responseRate: 80,
        avgConversationLength: 5,
        multiTurnRatio: 70,
      });

      expect(fast.score).toBeGreaterThan(slow.score);
    });
  });

  describe("calculateSentimentTrajectory", () => {
    it("should calculate score from sentiment data", () => {
      const result = BondScoreService.calculateSentimentTrajectory({
        avgSentiment: 0.3, // slightly positive
        sentimentTrend: 0.05, // getting warmer
        positiveWords: 45,
        negativeWords: 8,
        vulnerabilityScore: 65,
      });

      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should reward positive sentiment trend", () => {
      const improving = BondScoreService.calculateSentimentTrajectory({
        avgSentiment: 0.2,
        sentimentTrend: 0.1, // positive trend
        positiveWords: 40,
        negativeWords: 5,
        vulnerabilityScore: 60,
      });

      const declining = BondScoreService.calculateSentimentTrajectory({
        avgSentiment: 0.2,
        sentimentTrend: -0.1, // negative trend
        positiveWords: 40,
        negativeWords: 5,
        vulnerabilityScore: 60,
      });

      expect(improving.score).toBeGreaterThan(declining.score);
    });
  });

  describe("calculateChallengeCompletion", () => {
    it("should calculate score from completion metrics", () => {
      const result = BondScoreService.calculateChallengeCompletion({
        challengesCreated: 4,
        challengesCompleted: 3,
        participantDiversity: 75,
      });

      expect(result.score).toBeGreaterThan(70);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.completionRate).toBe(75);
    });

    it("should apply diversity bonus", () => {
      const diverse = BondScoreService.calculateChallengeCompletion({
        challengesCreated: 4,
        challengesCompleted: 3,
        participantDiversity: 75, // > 60%
      });

      const narrow = BondScoreService.calculateChallengeCompletion({
        challengesCreated: 4,
        challengesCompleted: 3,
        participantDiversity: 30, // < 60%
      });

      expect(diverse.score).toBeGreaterThan(narrow.score);
    });
  });

  describe("calculatePresenceConsistency", () => {
    it("should calculate score from engagement patterns", () => {
      const result = BondScoreService.calculatePresenceConsistency({
        daysActive: 6,
        regularUsers: 4,
        totalActiveMembers: 6,
        longestActiveStreak: 6,
        memberStreaks: 4,
      });

      expect(result.score).toBeGreaterThan(60);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should handle empty family gracefully", () => {
      const result = BondScoreService.calculatePresenceConsistency({
        daysActive: 0,
        regularUsers: 0,
        totalActiveMembers: 0,
        longestActiveStreak: 0,
        memberStreaks: 0,
      });

      expect(result.score).toBe(0);
    });
  });

  describe("calculateNetworkTopology", () => {
    it("should calculate score from network metrics", () => {
      const result = BondScoreService.calculateNetworkTopology({
        density: 0.4,
        clustering: 0.6,
        newPairs: 2,
        previouslyInactive: 1,
        hubDiversification: 0.7,
      });

      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should reward new connections", () => {
      const newConnections = BondScoreService.calculateNetworkTopology({
        density: 0.3,
        clustering: 0.5,
        newPairs: 3,
        previouslyInactive: 2,
        hubDiversification: 0.5,
      });

      const stable = BondScoreService.calculateNetworkTopology({
        density: 0.3,
        clustering: 0.5,
        newPairs: 0,
        previouslyInactive: 0,
        hubDiversification: 0.5,
      });

      expect(newConnections.score).toBeGreaterThan(stable.score);
    });
  });

  describe("calculateHederaConsensus", () => {
    it("should calculate score from consensus metrics", () => {
      const result = BondScoreService.calculateHederaConsensus({
        decisionsLogged: 4,
        consensusReached: 3,
        timeToConsensus: 12,
        escalations: 0,
        resolutionRate: 100,
      });

      expect(result.score).toBeGreaterThan(70);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should reward fast resolution", () => {
      const fast = BondScoreService.calculateHederaConsensus({
        decisionsLogged: 5,
        consensusReached: 4,
        timeToConsensus: 8, // < 24 hours
        escalations: 0,
        resolutionRate: 80,
      });

      const slow = BondScoreService.calculateHederaConsensus({
        decisionsLogged: 5,
        consensusReached: 4,
        timeToConsensus: 48, // > 24 hours
        escalations: 0,
        resolutionRate: 80,
      });

      expect(fast.score).toBeGreaterThan(slow.score);
    });
  });

  describe("calculateBondScore", () => {
    it("should calculate weighted composite score", () => {
      const scores = {
        generationalInteraction: 80,
        responseReciprocity: 85,
        sentimentTrajectory: 75,
        challengeCompletion: 70,
        presenceConsistency: 80,
        networkTopology: 75,
        hederaConsensus: 70,
      };

      const result = BondScoreService.calculateBondScore(scores);

      expect(result.bondScore).toBeGreaterThan(70);
      expect(result.bondScore).toBeLessThanOrEqual(100);
    });

    it("should respect custom weights", () => {
      const scores = {
        generationalInteraction: 100,
        responseReciprocity: 0,
        sentimentTrajectory: 0,
        challengeCompletion: 0,
        presenceConsistency: 0,
        networkTopology: 0,
        hederaConsensus: 0,
      };

      const defaultWeights = BondScoreService.getDefaultWeights();
      const result = BondScoreService.calculateBondScore(
        scores,
        defaultWeights
      );

      // Should be 100 * generationalInteraction weight (0.20)
      expect(result.bondScore).toBeLessThan(30);
    });

    it("should calculate week-over-week delta", () => {
      const scores = {
        generationalInteraction: 80,
        responseReciprocity: 85,
        sentimentTrajectory: 75,
        challengeCompletion: 70,
        presenceConsistency: 80,
        networkTopology: 75,
        hederaConsensus: 70,
      };

      const result = BondScoreService.calculateBondScore(scores, undefined, 70);

      expect(result.weekOverWeekDelta).toBeGreaterThan(0);
      expect(result.trend).toBe("improving");
    });

    it("should detect declining trend", () => {
      const scores = {
        generationalInteraction: 50,
        responseReciprocity: 50,
        sentimentTrajectory: 50,
        challengeCompletion: 50,
        presenceConsistency: 50,
        networkTopology: 50,
        hederaConsensus: 50,
      };

      const result = BondScoreService.calculateBondScore(scores, undefined, 80);

      expect(result.weekOverWeekDelta).toBeLessThan(0);
      expect(result.trend).toBe("declining");
    });
  });

  describe("getDefaultWeights", () => {
    it("should return weights that sum to 1.0", () => {
      const weights = BondScoreService.getDefaultWeights();
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);

      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
    });
  });
});
