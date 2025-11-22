/**
 * Anomaly Detection Service
 * 
 * Prevents agent gaming and manipulation of family bond scores.
 * Detects suspicious patterns and applies cooling-off periods.
 */

import { CompositeBondScore } from "./BondScoreService";

/**
 * Anomaly flag with severity and details
 */
export interface AnomalyFlag {
  type: AnomalyType;
  severity: "low" | "medium" | "high";
  confidence: number; // 0-1
  details: string;
  recommendation: "none" | "review" | "cooling_period" | "investigation";
}

/**
 * Types of anomalies that can be detected
 */
export type AnomalyType =
  | "SINGLE_SIGNAL_JUMP"
  | "SIGNAL_UNIFORMITY"
  | "SCORE_CONTRADICTION"
  | "LARGE_JUMP"
  | "OSCILLATION"
  | "REVERSAL"
  | "SINGLE_FAMILY_BIAS"
  | "COORDINATED_GAINS"
  | "EXCESSIVE_PAYOUTS";

/**
 * Configuration for anomaly detection
 */
export interface AnomalyConfig {
  // Single signal thresholds
  singleSignalThreshold: number;           // % change to flag
  uniformityThreshold: number;             // Max std dev for suspicious uniformity
  
  // Score pattern detection
  largeJumpThreshold: number;              // % jump to flag
  oscillationThreshold: number;            // Number of reversals
  reversalThreshold: number;               // % drop after improvement
  
  // Agent behavior patterns
  singleFamilyBiasThreshold: number;       // % of payouts from single family
  coordinatedGainsThreshold: number;       // Number of agents benefiting same family
  
  // Cooling periods
  coolingAfterLargeGain: number;          // Weeks
  coolingAfterAnomaly: number;            // Weeks
}

/**
 * Default anomaly configuration
 */
const DEFAULT_CONFIG: AnomalyConfig = {
  singleSignalThreshold: 30,
  uniformityThreshold: 5,
  largeJumpThreshold: 20,
  oscillationThreshold: 3,
  reversalThreshold: 15,
  singleFamilyBiasThreshold: 80,
  coordinatedGainsThreshold: 3,
  coolingAfterLargeGain: 1,
  coolingAfterAnomaly: 2,
};

/**
 * AnomalyDetectionService - Gaming prevention
 */
export class AnomalyDetectionService {
  private config: AnomalyConfig;
  private coolingPeriods: Map<string, number>; // agentId -> cooling until week

  constructor(config?: Partial<AnomalyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.coolingPeriods = new Map();
  }

  /**
   * Detect anomalies in bond score change
   */
  async detectAnomalies(
    agentId: string,
    familyId: string,
    previousScores: CompositeBondScore | null,
    currentScores: CompositeBondScore,
    weekNumber: number
  ): Promise<AnomalyFlag[]> {
    const flags: AnomalyFlag[] = [];

    if (!previousScores) {
      // First week for this family, no anomalies possible
      return flags;
    }

    // 1. Check single-signal jumps
    flags.push(...this.checkSingleSignalJumps(previousScores, currentScores));

    // 2. Check signal uniformity
    flags.push(...this.checkSignalUniformity(previousScores, currentScores));

    // 3. Check score contradictions
    flags.push(...this.checkScoreContradictions(previousScores, currentScores));

    // 4. Check large jumps
    flags.push(...this.checkLargeJump(previousScores, currentScores));

    return flags;
  }

  /**
   * Detect if a single signal jumped suspiciously
   * 
   * Agents shouldn't be able to manipulate one dimension independently
   */
  private checkSingleSignalJumps(
    previous: CompositeBondScore,
    current: CompositeBondScore
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];
    const signalKeys = Object.keys(previous.scores) as Array<keyof typeof previous.scores>;

    for (const signal of signalKeys) {
      const prevScore = previous.scores[signal];
      const currScore = current.scores[signal];
      
      if (prevScore === 0) continue; // Skip division by zero
      
      const percentChange = Math.abs((currScore - prevScore) / prevScore * 100);
      
      if (percentChange > this.config.singleSignalThreshold) {
        flags.push({
          type: "SINGLE_SIGNAL_JUMP",
          severity: percentChange > 50 ? "high" : "medium",
          confidence: Math.min(1, percentChange / 100),
          details: `Signal '${signal}' jumped ${percentChange.toFixed(1)}% (${prevScore} → ${currScore})`,
          recommendation: "review",
        });
      }
    }

    return flags;
  }

  /**
   * Detect if all signals improved equally (suspicious pattern)
   * 
   * Real improvements are multi-dimensional but not perfectly uniform.
   * Perfect uniformity suggests artificial manipulation.
   */
  private checkSignalUniformity(
    previous: CompositeBondScore,
    current: CompositeBondScore
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];
    
    // Calculate deltas for all signals
    const signalKeys = Object.keys(previous.scores) as Array<keyof typeof previous.scores>;
    const deltas = signalKeys.map(key => current.scores[key] - previous.scores[key]);
    
    // Calculate standard deviation of deltas
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length;
    const stdDev = Math.sqrt(variance);

    // If std dev is very low, all signals moved together (suspicious)
    if (stdDev < this.config.uniformityThreshold && mean > 0) {
      flags.push({
        type: "SIGNAL_UNIFORMITY",
        severity: stdDev < 1 ? "high" : "medium",
        confidence: 1 - (stdDev / this.config.uniformityThreshold),
        details: `All signals improved uniformly (std dev: ${stdDev.toFixed(2)}). Expected natural variation.`,
        recommendation: "review",
      });
    }

    return flags;
  }

  /**
   * Detect contradictions between signals and overall score
   * 
   * If overall score improves but signals decline, something is wrong.
   */
  private checkScoreContradictions(
    previous: CompositeBondScore,
    current: CompositeBondScore
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];

    const compositeImproved = current.compositeScore > previous.compositeScore;
    
    // Count how many signals improved vs declined
    const signalKeys = Object.keys(previous.scores) as Array<keyof typeof previous.scores>;
    const improvedCount = signalKeys.filter(
      key => current.scores[key] > previous.scores[key]
    ).length;
    const declinedCount = signalKeys.length - improvedCount;

    // If composite improved but majority of signals declined, that's suspicious
    if (compositeImproved && declinedCount > improvedCount) {
      flags.push({
        type: "SCORE_CONTRADICTION",
        severity: "high",
        confidence: 0.9,
        details: `Composite score improved but ${declinedCount}/${signalKeys.length} signals declined. Possible manipulation.`,
        recommendation: "investigation",
      });
    }

    return flags;
  }

  /**
   * Detect unusually large jumps in composite score
   */
  private checkLargeJump(
    previous: CompositeBondScore,
    current: CompositeBondScore
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];
    
    if (previous.compositeScore === 0) return flags;

    const percentChange = Math.abs(
      (current.compositeScore - previous.compositeScore) / previous.compositeScore * 100
    );

    if (percentChange > this.config.largeJumpThreshold) {
      flags.push({
        type: "LARGE_JUMP",
        severity: percentChange > 50 ? "high" : "medium",
        confidence: Math.min(1, percentChange / 100),
        details: `Composite score jumped ${percentChange.toFixed(1)}% in single week (${previous.compositeScore} → ${current.compositeScore})`,
        recommendation: percentChange > 50 ? "investigation" : "review",
      });
    }

    return flags;
  }

  /**
   * Check if agent is in cooling-off period
   */
  async checkCoolingPeriod(agentId: string, currentWeek: number): Promise<boolean> {
    const coolingUntil = this.coolingPeriods.get(agentId);
    if (!coolingUntil) return false;
    
    const isActive = currentWeek < coolingUntil;
    if (!isActive) {
      // Cooling period has expired, clean up
      this.coolingPeriods.delete(agentId);
    }
    
    return isActive;
  }

  /**
   * Apply cooling-off period for agent
   */
  setCoolingPeriod(agentId: string, startWeek: number, durationWeeks: number): void {
    const coolingUntil = startWeek + durationWeeks;
    this.coolingPeriods.set(agentId, coolingUntil);
  }

  /**
   * Get cooling period details
   */
  getCoolingPeriodDetails(agentId: string, currentWeek: number): { active: boolean; weeksRemaining: number } {
    const coolingUntil = this.coolingPeriods.get(agentId);
    if (!coolingUntil) {
      return { active: false, weeksRemaining: 0 };
    }
    
    const weeksRemaining = Math.max(0, coolingUntil - currentWeek);
    return {
      active: weeksRemaining > 0,
      weeksRemaining,
    };
  }

  /**
   * Evaluate severity and recommendation from flags
   */
  evaluateFlags(flags: AnomalyFlag[]): {
    hasHighSeverity: boolean;
    recommendedAction: "none" | "review" | "cooling_period" | "investigation";
    totalConfidence: number;
  } {
    if (flags.length === 0) {
      return {
        hasHighSeverity: false,
        recommendedAction: "none",
        totalConfidence: 0,
      };
    }

    const highSeverityFlags = flags.filter(f => f.severity === "high");
    const recommendedAction = this.determineRecommendation(flags);
    
    // Average confidence across all flags
    const totalConfidence = flags.reduce((sum, f) => sum + f.confidence, 0) / flags.length;

    return {
      hasHighSeverity: highSeverityFlags.length > 0,
      recommendedAction,
      totalConfidence,
    };
  }

  /**
   * Determine recommended action based on flags
   */
  private determineRecommendation(
    flags: AnomalyFlag[]
  ): "none" | "review" | "cooling_period" | "investigation" {
    // If any flag recommends investigation, that takes priority
    if (flags.some(f => f.recommendation === "investigation")) {
      return "investigation";
    }
    
    // If multiple flags or high confidence, recommend cooling period
    if (flags.length > 1 || flags.some(f => f.confidence > 0.8)) {
      return "cooling_period";
    }
    
    // Default to review
    return "review";
  }

  /**
   * Get configuration
   */
  getConfig(): AnomalyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(update: Partial<AnomalyConfig>): void {
    this.config = { ...this.config, ...update };
  }
}

/**
 * Helper to format anomaly flags for display
 */
export function formatAnomalyFlags(flags: AnomalyFlag[]): string {
  if (flags.length === 0) return "No anomalies detected";
  
  return flags
    .map(f => `[${f.severity.toUpperCase()}] ${f.type}: ${f.details}`)
    .join("\n");
}
