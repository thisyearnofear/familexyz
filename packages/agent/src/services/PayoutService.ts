/**
 * Agent Payout Service
 * 
 * Handles autonomous reward distribution for agents based on verified family bond score improvements.
 * Implements payout formula, validates payouts, and manages agent compensation.
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Payout calculation result with all components
 */
export interface PayoutCalculation {
  recordId: string;
  agentId: string;
  familyId: string;
  weekNumber: number;
  
  // Score metrics
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  
  // Calculation components
  baseRate: number;
  performanceMultiplier: number;
  recencyWeight: number;
  calculatedPayout: number;
  
  // Metadata
  timestamp: Date;
  notes: string[];
}

/**
 * Payout validation result
 */
export interface ValidationResult {
  isValid: boolean;
  anomalyFlags: string[];
  coolingPeriodActive: boolean;
  requiresFamilyValidation: boolean;
  finalPayout: number;
  validationNotes: string[];
}

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  agentId: string;
  totalPayouts: number;
  consecutiveImprovements: number;
  recentAnomalies: number;
  familiesBenefited: number;
  lastPayoutWeek: number;
  coolingUntilWeek: number | null;
  totalFamEarned: number;
  lastUpdated: Date;
}

/**
 * Payout configuration
 */
export interface PayoutConfig {
  baseRate: number;              // FAM per 0.1 point improvement
  maxPerWeek: number;            // Max payout per agent per week
  maxPerFamily: number;          // Max payout per family per week
  maxCumulative: number;         // Max cumulative per agent per month
  minPayout: number;             // Minimum payout threshold
  maxMultiplier: number;         // Cap on performance bonus
  recencyDecayWeeks: number;     // Weeks before recency weight decays
}

/**
 * Default payout configuration
 */
const DEFAULT_CONFIG: PayoutConfig = {
  baseRate: 1.0,                 // 1.0 FAM per 0.1 point
  maxPerWeek: 500,
  maxPerFamily: 1000,
  maxCumulative: 50000,
  minPayout: 0.1,
  maxMultiplier: 1.5,
  recencyDecayWeeks: 4,
};

/**
 * PayoutService - Autonomous reward distribution engine
 */
export class PayoutService {
  private config: PayoutConfig;
  private performanceCache: Map<string, AgentPerformance>;

  constructor(config?: Partial<PayoutConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.performanceCache = new Map();
  }

  /**
   * Calculate payout for an agent improving a family's bond score
   * 
   * Formula: Payout = Base Rate × Score Delta × Performance Multiplier × Recency Weight
   */
  async calculatePayout(
    agentId: string,
    familyId: string,
    weekNumber: number,
    previousScore: number,
    currentScore: number,
    agentHistory?: { consecutiveImprovements: number; weeksSinceLastImprovement: number }
  ): Promise<PayoutCalculation> {
    const recordId = uuidv4();
    const notes: string[] = [];

    // 1. Calculate score delta (0-100 scale)
    const scoreDelta = currentScore - previousScore;
    notes.push(`Score delta: ${previousScore} → ${currentScore} (+${scoreDelta.toFixed(2)})`);

    // 2. If no improvement, return zero payout
    if (scoreDelta <= 0) {
      return {
        recordId,
        agentId,
        familyId,
        weekNumber,
        previousScore,
        currentScore,
        scoreDelta,
        baseRate: this.config.baseRate,
        performanceMultiplier: 1.0,
        recencyWeight: 1.0,
        calculatedPayout: 0,
        timestamp: new Date(),
        notes: [...notes, "No score improvement, payout = 0"],
      };
    }

    // 3. Calculate base payout
    // Convert delta to tenths (0-100 scale → 0-1000 tenths)
    const scoreInTenths = scoreDelta * 10;
    const basePayout = scoreInTenths * this.config.baseRate;
    notes.push(`Base: ${scoreInTenths} tenths × ${this.config.baseRate} = ${basePayout.toFixed(2)} FAM`);

    // 4. Calculate performance multiplier (1.0 - 1.5x)
    const performanceMultiplier = this.calculatePerformanceMultiplier(
      agentHistory?.consecutiveImprovements || 0
    );
    notes.push(`Performance multiplier: ${performanceMultiplier.toFixed(2)}x`);

    // 5. Calculate recency weight (1.0 - decay)
    const recencyWeight = this.calculateRecencyWeight(
      agentHistory?.weeksSinceLastImprovement || 0
    );
    notes.push(`Recency weight: ${recencyWeight.toFixed(2)}x`);

    // 6. Apply all multipliers
    const calculatedPayout = basePayout * performanceMultiplier * recencyWeight;
    notes.push(`Calculated: ${basePayout.toFixed(2)} × ${performanceMultiplier.toFixed(2)} × ${recencyWeight.toFixed(2)} = ${calculatedPayout.toFixed(2)} FAM`);

    // 7. Check minimum payout threshold
    if (calculatedPayout < this.config.minPayout) {
      notes.push(`Below minimum threshold (${this.config.minPayout}), returning 0`);
      return {
        recordId,
        agentId,
        familyId,
        weekNumber,
        previousScore,
        currentScore,
        scoreDelta,
        baseRate: this.config.baseRate,
        performanceMultiplier,
        recencyWeight,
        calculatedPayout: 0,
        timestamp: new Date(),
        notes,
      };
    }

    return {
      recordId,
      agentId,
      familyId,
      weekNumber,
      previousScore,
      currentScore,
      scoreDelta,
      baseRate: this.config.baseRate,
      performanceMultiplier,
      recencyWeight,
      calculatedPayout,
      timestamp: new Date(),
      notes,
    };
  }

  /**
   * Validate a payout calculation against caps and limits
   */
  async validatePayout(
    calculation: PayoutCalculation,
    currentWeekPayoutsForAgent: number = 0,
    currentWeekPayoutsForFamily: number = 0,
    monthlyPayoutsForAgent: number = 0
  ): Promise<ValidationResult> {
    const anomalyFlags: string[] = [];
    const validationNotes: string[] = [];
    let finalPayout = calculation.calculatedPayout;

    // Check per-week limit for agent
    if (currentWeekPayoutsForAgent + finalPayout > this.config.maxPerWeek) {
      const overflow = currentWeekPayoutsForAgent + finalPayout - this.config.maxPerWeek;
      finalPayout = Math.max(0, finalPayout - overflow);
      anomalyFlags.push(`AGENT_WEEKLY_LIMIT_HIT`);
      validationNotes.push(
        `Agent weekly cap hit. Current: ${currentWeekPayoutsForAgent.toFixed(2)}, ` +
        `Max: ${this.config.maxPerWeek}, Capped to: ${finalPayout.toFixed(2)}`
      );
    }

    // Check per-week limit for family
    if (currentWeekPayoutsForFamily + finalPayout > this.config.maxPerFamily) {
      const overflow = currentWeekPayoutsForFamily + finalPayout - this.config.maxPerFamily;
      finalPayout = Math.max(0, finalPayout - overflow);
      anomalyFlags.push(`FAMILY_WEEKLY_LIMIT_HIT`);
      validationNotes.push(
        `Family weekly cap hit. Current: ${currentWeekPayoutsForFamily.toFixed(2)}, ` +
        `Max: ${this.config.maxPerFamily}, Capped to: ${finalPayout.toFixed(2)}`
      );
    }

    // Check monthly cumulative limit
    if (monthlyPayoutsForAgent + finalPayout > this.config.maxCumulative) {
      const overflow = monthlyPayoutsForAgent + finalPayout - this.config.maxCumulative;
      finalPayout = Math.max(0, finalPayout - overflow);
      anomalyFlags.push(`MONTHLY_CUMULATIVE_LIMIT_HIT`);
      validationNotes.push(
        `Monthly cumulative cap hit. Current: ${monthlyPayoutsForAgent.toFixed(2)}, ` +
        `Max: ${this.config.maxCumulative}, Capped to: ${finalPayout.toFixed(2)}`
      );
    }

    // Flag for family validation if payout is large (>100 FAM)
    const requiresFamilyValidation = finalPayout > 100;
    if (requiresFamilyValidation) {
      validationNotes.push(
        `Large payout (${finalPayout.toFixed(2)} FAM > 100). Flagged for family validation.`
      );
    }

    return {
      isValid: finalPayout > 0,
      anomalyFlags,
      coolingPeriodActive: false, // Set by AnomalyDetectionService
      requiresFamilyValidation,
      finalPayout,
      validationNotes,
    };
  }

  /**
   * Calculate performance multiplier based on consecutive improvements
   * 
   * Rewards consistent performance:
   * - 1x: First improvement
   * - 1.1x: 2 consecutive improvements
   * - 1.2x: 3 consecutive improvements
   * - 1.3x: 4 consecutive improvements
   * - 1.5x: 5+ consecutive improvements (capped at maxMultiplier)
   */
  private calculatePerformanceMultiplier(consecutiveImprovements: number): number {
    if (consecutiveImprovements <= 0) return 1.0;
    if (consecutiveImprovements === 1) return 1.0;
    if (consecutiveImprovements === 2) return 1.1;
    if (consecutiveImprovements === 3) return 1.2;
    if (consecutiveImprovements === 4) return 1.3;
    
    // 5+ improvements: 1.5x (capped)
    return Math.min(1.5, 1.0 + (consecutiveImprovements * 0.1));
  }

  /**
   * Calculate recency weight for improvements
   * 
   * Recent improvements are weighted higher:
   * - Week 1: 1.0x
   * - Week 2: 0.98x
   * - Week 3: 0.95x
   * - Week 4: 0.90x
   * - Week 5+: Linear decay to 0.5x
   */
  private calculateRecencyWeight(weeksSinceLastImprovement: number): number {
    if (weeksSinceLastImprovement === 0) return 1.0;
    if (weeksSinceLastImprovement === 1) return 0.98;
    if (weeksSinceLastImprovement === 2) return 0.95;
    if (weeksSinceLastImprovement === 3) return 0.90;
    
    // Weeks 4+: decay from 0.85 to 0.5
    const decayFactor = Math.max(0.5, 1.0 - (weeksSinceLastImprovement * 0.1));
    return decayFactor;
  }

  /**
   * Get or create agent performance cache entry
   */
  getAgentPerformance(agentId: string): AgentPerformance {
    if (!this.performanceCache.has(agentId)) {
      this.performanceCache.set(agentId, {
        agentId,
        totalPayouts: 0,
        consecutiveImprovements: 0,
        recentAnomalies: 0,
        familiesBenefited: 0,
        lastPayoutWeek: 0,
        coolingUntilWeek: null,
        totalFamEarned: 0,
        lastUpdated: new Date(),
      });
    }
    return this.performanceCache.get(agentId)!;
  }

  /**
   * Update agent performance after successful payout
   */
  updateAgentPerformance(agentId: string, update: Partial<AgentPerformance>): void {
    const current = this.getAgentPerformance(agentId);
    this.performanceCache.set(agentId, {
      ...current,
      ...update,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get configuration
   */
  getConfig(): PayoutConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(update: Partial<PayoutConfig>): void {
    this.config = { ...this.config, ...update };
  }
}

/**
 * Helper to format payout for display
 */
export function formatPayout(amount: number, decimals: number = 2): string {
  return `${amount.toFixed(decimals)} FAM`;
}

/**
 * Helper to format score delta for display
 */
export function formatScoreDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)} pt`;
}
