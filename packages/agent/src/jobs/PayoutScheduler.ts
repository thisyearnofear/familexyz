/**
 * Agent Payout Scheduler
 * 
 * Orchestrates the weekly payout cycle:
 * 1. Calculates payouts based on bond score improvements
 * 2. Validates against anti-gaming rules
 * 3. Logs to HCS for audit trail
 * 4. Executes token transfers
 * 5. Updates agent performance metrics
 */

import { PayoutService, PayoutCalculation, ValidationResult } from "../services/PayoutService";
import { AnomalyDetectionService, AnomalyFlag } from "../services/AnomalyDetectionService";
import { HederaPayoutLogger, PayoutRecord } from "../integrations/HederaPayoutLogger";
import { HederaTokenService } from "../integrations/HederaTokenService";
import { CompositeBondScore } from "../services/BondScoreService";

/**
 * Payout cycle configuration
 */
export interface PayoutCycleConfig {
  weekNumber: number;
  runAt: Date;
  triggerManually: boolean;
  dryRun: boolean;
  notifyOnCompletion: boolean;
}

/**
 * Payout cycle result
 */
export interface PayoutCycleResult {
  weekNumber: number;
  startTime: Date;
  completedAt: Date;
  status: "success" | "partial" | "failed";
  
  // Statistics
  familiesProcessed: number;
  agentsProcessed: number;
  payoutsCalculated: number;
  payoutsValidated: number;
  payoutsExecuted: number;
  anomaliesDetected: number;
  coolingPeriodsApplied: number;
  
  // Financial
  totalCalculated: number;
  totalValidated: number;
  totalExecuted: number;
  totalCapped: number;
  
  // Details
  payoutRecords: PayoutRecord[];
  failedPayouts: {
    agentId: string;
    familyId: string;
    reason: string;
  }[];
  
  notes: string[];
}

/**
 * PayoutScheduler - Weekly payout orchestration
 */
export class PayoutScheduler {
  private payoutService: PayoutService;
  private anomalyService: AnomalyDetectionService;
  private hcsLogger: HederaPayoutLogger;
  private tokenService: HederaTokenService;
  private cycleHistory: Map<number, PayoutCycleResult>;

  constructor(
    payoutService: PayoutService,
    anomalyService: AnomalyDetectionService,
    hcsLogger: HederaPayoutLogger,
    tokenService: HederaTokenService
  ) {
    this.payoutService = payoutService;
    this.anomalyService = anomalyService;
    this.hcsLogger = hcsLogger;
    this.tokenService = tokenService;
    this.cycleHistory = new Map();
  }

  /**
   * Run the weekly payout cycle
   * 
   * Called automatically on Sundays 01:00 UTC, after bond scores calculated.
   */
  async runWeeklyPayoutCycle(
    weekNumber: number,
    families: Array<{
      familyId: string;
      agents: Array<{
        agentId: string;
        accountId: string;
      }>;
      previousScores: CompositeBondScore | null;
      currentScores: CompositeBondScore;
    }>,
    options: {
      dryRun?: boolean;
      notifyOnCompletion?: boolean;
    } = {}
  ): Promise<PayoutCycleResult> {
    const startTime = new Date();
    const result: PayoutCycleResult = {
      weekNumber,
      startTime,
      completedAt: new Date(),
      status: "success",
      familiesProcessed: 0,
      agentsProcessed: 0,
      payoutsCalculated: 0,
      payoutsValidated: 0,
      payoutsExecuted: 0,
      anomaliesDetected: 0,
      coolingPeriodsApplied: 0,
      totalCalculated: 0,
      totalValidated: 0,
      totalExecuted: 0,
      totalCapped: 0,
      payoutRecords: [],
      failedPayouts: [],
      notes: [],
    };

    try {
      // Track weekly totals for caps
      const weeklyAgentTotals = new Map<string, number>();
      const weeklyFamilyTotals = new Map<string, number>();
      const monthlyAgentTotals = new Map<string, number>();
      const agentHistory = new Map<
        string,
        { consecutiveImprovements: number; weeksSinceLastImprovement: number }
      >();

      result.notes.push(`Starting payout cycle for week ${weekNumber}`);

      // Process each family
      for (const family of families) {
        result.familiesProcessed++;

        // Process each agent for this family
        for (const agent of family.agents) {
          result.agentsProcessed++;

          try {
            // Get agent's previous history
            const history = agentHistory.get(agent.agentId) || {
              consecutiveImprovements: 0,
              weeksSinceLastImprovement: 0,
            };

            // 1. Calculate payout
            const calculation = await this.payoutService.calculatePayout(
              agent.agentId,
              family.familyId,
              weekNumber,
              family.previousScores?.compositeScore || 0,
              family.currentScores.compositeScore,
              history
            );

            if (calculation.calculatedPayout === 0) {
              result.notes.push(
                `Agent ${agent.agentId} - family ${family.familyId}: No improvement`
              );
              continue;
            }

            result.payoutsCalculated++;
            result.totalCalculated += calculation.calculatedPayout;

            // 2. Detect anomalies
            const anomalyFlags = await this.anomalyService.detectAnomalies(
              agent.agentId,
              family.familyId,
              family.previousScores,
              family.currentScores,
              weekNumber
            );

            if (anomalyFlags.length > 0) {
              result.anomaliesDetected += anomalyFlags.length;
              result.notes.push(
                `Anomalies detected for ${agent.agentId}: ${anomalyFlags.map(f => f.type).join(", ")}`
              );
            }

            // 3. Check cooling period
            const inCoolingPeriod = await this.anomalyService.checkCoolingPeriod(
              agent.agentId,
              weekNumber
            );

            if (inCoolingPeriod) {
              result.coolingPeriodsApplied++;
              result.notes.push(
                `Agent ${agent.agentId} in cooling period - skipping payout`
              );
              continue;
            }

            // 4. Validate payout (apply caps)
            const agentWeekly = weeklyAgentTotals.get(agent.agentId) || 0;
            const familyWeekly = weeklyFamilyTotals.get(family.familyId) || 0;
            const agentMonthly = monthlyAgentTotals.get(agent.agentId) || 0;

            const validation = await this.payoutService.validatePayout(
              calculation,
              agentWeekly,
              familyWeekly,
              agentMonthly
            );

            result.payoutsValidated++;
            result.totalValidated += validation.finalPayout;

            if (validation.finalPayout < calculation.calculatedPayout) {
              result.totalCapped += calculation.calculatedPayout - validation.finalPayout;
            }

            // 5. Create HCS record
            const record = this.hcsLogger.createPayoutRecord(
              agent.agentId,
              family.familyId,
              weekNumber,
              family.previousScores?.compositeScore || 0,
              family.currentScores.compositeScore,
              calculation,
              {
                finalPayout: validation.finalPayout,
                anomalyFlags: validation.anomalyFlags,
                requiresFamilyValidation: validation.requiresFamilyValidation,
              }
            );

            // 6. Log to HCS (unless dry run)
            if (!options.dryRun) {
              const hcsRef = await this.hcsLogger.logPayoutRecord(record);
              record.txHash = hcsRef;
              result.payoutRecords.push(record);
            } else {
              result.notes.push(`[DRY RUN] Would log payout record for ${agent.agentId}`);
            }

            // 7. Update tracking
            weeklyAgentTotals.set(agent.agentId, agentWeekly + validation.finalPayout);
            weeklyFamilyTotals.set(family.familyId, familyWeekly + validation.finalPayout);
            monthlyAgentTotals.set(
              agent.agentId,
              agentMonthly + validation.finalPayout
            );

            if (calculation.calculatedPayout > 0) {
              history.consecutiveImprovements++;
              history.weeksSinceLastImprovement = 0;
            } else {
              history.weeksSinceLastImprovement++;
            }
            agentHistory.set(agent.agentId, history);

            result.payoutsExecuted++;
            result.totalExecuted += validation.finalPayout;
          } catch (error) {
            result.status = "partial";
            result.failedPayouts.push({
              agentId: agent.agentId,
              familyId: family.familyId,
              reason: String(error),
            });
            result.notes.push(
              `Error processing ${agent.agentId} - ${family.familyId}: ${error}`
            );
          }
        }
      }

      // 8. Execute token transfers (unless dry run)
      if (!options.dryRun && result.payoutRecords.length > 0) {
        try {
          const transfers = result.payoutRecords
            .filter(r => r.finalPayout > 0)
            .map(r => ({
              agentId: r.agentId,
              toAccount: "", // Would be looked up from agent registry
              amount: r.finalPayout,
            }));

          if (transfers.length > 0) {
            const batch = await this.tokenService.executePendingPayouts(weekNumber, transfers);
            result.notes.push(
              `Token batch executed: ${batch.successCount} successful, ${batch.failureCount} failed`
            );
          }
        } catch (error) {
          result.status = "partial";
          result.notes.push(`Token transfer error: ${error}`);
        }
      }

      // Store result
      this.cycleHistory.set(weekNumber, result);
      result.completedAt = new Date();

      result.notes.unshift(
        `Payout cycle ${weekNumber} complete: ${result.payoutsExecuted} payouts, ` +
        `${result.totalExecuted.toFixed(2)} FAM distributed`
      );

      return result;
    } catch (error) {
      result.status = "failed";
      result.completedAt = new Date();
      result.notes.push(`Fatal error: ${error}`);
      throw error;
    }
  }

  /**
   * Get cycle result
   */
  getCycleResult(weekNumber: number): PayoutCycleResult | null {
    return this.cycleHistory.get(weekNumber) || null;
  }

  /**
   * Get recent cycles
   */
  getRecentCycles(limit: number = 10): PayoutCycleResult[] {
    return Array.from(this.cycleHistory.values())
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, limit);
  }

  /**
   * Get cycle statistics
   */
  getCycleStats(startWeek: number, endWeek: number): {
    totalWeeks: number;
    successfulWeeks: number;
    partialWeeks: number;
    failedWeeks: number;
    totalPayoutsExecuted: number;
    totalFamDistributed: number;
    averagePayoutPerWeek: number;
    anomaliesDetected: number;
  } {
    const cycles = Array.from(this.cycleHistory.values()).filter(
      c => c.weekNumber >= startWeek && c.weekNumber <= endWeek
    );

    if (cycles.length === 0) {
      return {
        totalWeeks: 0,
        successfulWeeks: 0,
        partialWeeks: 0,
        failedWeeks: 0,
        totalPayoutsExecuted: 0,
        totalFamDistributed: 0,
        averagePayoutPerWeek: 0,
        anomaliesDetected: 0,
      };
    }

    return {
      totalWeeks: cycles.length,
      successfulWeeks: cycles.filter(c => c.status === "success").length,
      partialWeeks: cycles.filter(c => c.status === "partial").length,
      failedWeeks: cycles.filter(c => c.status === "failed").length,
      totalPayoutsExecuted: cycles.reduce((sum, c) => sum + c.payoutsExecuted, 0),
      totalFamDistributed: cycles.reduce((sum, c) => sum + c.totalExecuted, 0),
      averagePayoutPerWeek:
        cycles.reduce((sum, c) => sum + c.totalExecuted, 0) / cycles.length,
      anomaliesDetected: cycles.reduce((sum, c) => sum + c.anomaliesDetected, 0),
    };
  }

  /**
   * Format cycle result for display
   */
  formatCycleResult(result: PayoutCycleResult): string {
    const duration = result.completedAt.getTime() - result.startTime.getTime();
    const durationSeconds = Math.round(duration / 1000);

    return (
      `Payout Cycle Week ${result.weekNumber}\n` +
      `Status: ${result.status.toUpperCase()}\n` +
      `Duration: ${durationSeconds}s\n` +
      `\n` +
      `Payouts:\n` +
      `  Calculated: ${result.payoutsCalculated}\n` +
      `  Validated: ${result.payoutsValidated}\n` +
      `  Executed: ${result.payoutsExecuted}\n` +
      `\n` +
      `Financial:\n` +
      `  Calculated: ${result.totalCalculated.toFixed(2)} FAM\n` +
      `  Distributed: ${result.totalExecuted.toFixed(2)} FAM\n` +
      `  Capped: ${result.totalCapped.toFixed(2)} FAM\n` +
      `\n` +
      `Validation:\n` +
      `  Anomalies: ${result.anomaliesDetected}\n` +
      `  Cooling Periods: ${result.coolingPeriodsApplied}\n` +
      `  Failed: ${result.failedPayouts.length}\n`
    );
  }

  /**
   * Clear history (for testing)
   */
  clearHistory(): void {
    this.cycleHistory.clear();
  }
}

/**
 * Helper to format cycle result for logging
 */
export function formatPayoutCycle(result: PayoutCycleResult): string {
  return (
    `Week ${result.weekNumber}: ${result.payoutsExecuted} payouts, ` +
    `${result.totalExecuted.toFixed(2)} FAM distributed (${result.status})`
  );
}
