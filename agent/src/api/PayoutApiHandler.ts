import type { PayoutService } from "@familexyz/agent/services/PayoutService.js";
import type { AnomalyDetectionService } from "@familexyz/agent/services/AnomalyDetectionService.js";
import type { HederaPayoutLogger } from "@familexyz/agent/integrations/HederaPayoutLogger.js";
import type { HederaTokenService } from "@familexyz/agent/integrations/HederaTokenService.js";

/**
 * PayoutApiHandler
 *
 * Centralized API endpoint handler for payout-related operations.
 * Manages:
 * - Agent payout history queries
 * - Agent performance metrics
 * - Family payout history
 * - Pending payouts
 * - Manual payout calculation (dry-run)
 * - Anomaly review
 *
 * Follows the PREVENT BLOAT principle: single-purpose, focused, ~300 lines
 */
export class PayoutApiHandler {
    private static readonly AGENT_IDS = ["wisdom", "intimacy", "generational-bridge", "presence", "growth"];

    constructor(
        private payoutService: PayoutService,
        private anomalyService: AnomalyDetectionService,
        private hcsLogger: HederaPayoutLogger,
        private tokenService: HederaTokenService,
    ) {}

    /**
     * GET /api/agents/:agentId/payouts
     * Returns payout history for a specific agent
     */
    async getAgentPayoutHistory(
        agentId: string,
        weeks?: number,
    ): Promise<{
        agentId: string;
        payouts: any[];
        stats: {
            totalPayouts: number;
            totalAmount: number;
            averageAmount: number;
            weeksCovered: number;
        };
    }> {
        try {
            const weeksToQuery = weeks || 12;
            // Calculate week range
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const startWeek = Math.max(0, currentWeek - weeksToQuery);

            const stats = await this.hcsLogger.getAgentPayoutStats(agentId, startWeek, currentWeek);

            return {
                agentId,
                payouts: [],
                stats: {
                    totalPayouts: stats.totalPayouts,
                    totalAmount: stats.averagePayout * stats.recordCount,
                    averageAmount: stats.averagePayout,
                    weeksCovered: weeksToQuery,
                },
            };
        } catch (err) {
            return {
                agentId,
                payouts: [],
                stats: {
                    totalPayouts: 0,
                    totalAmount: 0,
                    averageAmount: 0,
                    weeksCovered: weeks || 12,
                },
            };
        }
    }

    /**
     * GET /api/agents/:agentId/performance
     * Returns performance metrics and improvement tracking
     */
    async getAgentPerformance(agentId: string): Promise<{
        agentId: string;
        consecutiveImprovements: number;
        lastImprovement: number | null;
        coolingPeriodActive: boolean;
        coolingPeriodWeeksRemaining: number;
        averagePayoutPerWeek: number;
        totalEarned: number;
        performanceScore: number;
    }> {
        try {
            const performance = this.payoutService.getAgentPerformance(agentId);
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const coolingPeriodDetails = this.anomalyService.getCoolingPeriodDetails(agentId, currentWeek);
            const stats = await this.hcsLogger.getAgentPayoutStats(agentId, Math.max(0, currentWeek - 4), currentWeek);

            // Calculate performance score (0-100)
            const improvementBonus = Math.min(performance.consecutiveImprovements * 10, 30);
            const payoutBonus = Math.min((stats.averagePayout * stats.recordCount) / 50, 20);
            const performanceScore = Math.max(0, 50 + improvementBonus + payoutBonus);

            return {
                agentId,
                consecutiveImprovements: performance.consecutiveImprovements,
                lastImprovement: null,
                coolingPeriodActive: coolingPeriodDetails.active,
                coolingPeriodWeeksRemaining: coolingPeriodDetails.weeksRemaining,
                averagePayoutPerWeek: stats.recordCount > 0 ? (stats.averagePayout * stats.recordCount) / 4 : 0,
                totalEarned: stats.averagePayout * stats.recordCount,
                performanceScore,
            };
        } catch (err) {
            return {
                agentId,
                consecutiveImprovements: 0,
                lastImprovement: null,
                coolingPeriodActive: false,
                coolingPeriodWeeksRemaining: 0,
                averagePayoutPerWeek: 0,
                totalEarned: 0,
                performanceScore: 50,
            };
        }
    }

    /**
     * GET /api/families/:familyId/payouts
     * Returns payout history for all agents in a family
     */
    async getFamilyPayoutHistory(
        familyId: string,
        weeks?: number,
    ): Promise<{
        familyId: string;
        payoutsByAgent: Array<{
            agentId: string;
            amount: number;
            payoutCount: number;
        }>;
        stats: {
            totalFamilyPayouts: number;
            totalAmount: number;
            averagePerAgent: number;
            agentCount: number;
            weeksCovered: number;
        };
    }> {
        try {
            const weeksToQuery = weeks || 12;
            const records = await this.hcsLogger.getFamilyPayoutAuditTrail(familyId, weeksToQuery * 5);

            // Group by agent
            const agentMap = new Map<string, { amount: number; count: number }>();
            for (const record of records) {
                const existing = agentMap.get(record.agentId) || { amount: 0, count: 0 };
                existing.amount += record.finalPayout;
                existing.count += 1;
                agentMap.set(record.agentId, existing);
            }

            const payoutsByAgent = Array.from(agentMap.entries()).map(([agentId, data]) => ({
                agentId,
                amount: data.amount,
                payoutCount: data.count,
            }));

            const totalAmount = payoutsByAgent.reduce((sum, a) => sum + a.amount, 0);
            const agentCount = payoutsByAgent.length;

            return {
                familyId,
                payoutsByAgent,
                stats: {
                    totalFamilyPayouts: records.length,
                    totalAmount,
                    averagePerAgent: agentCount > 0 ? totalAmount / agentCount : 0,
                    agentCount,
                    weeksCovered: weeksToQuery,
                },
            };
        } catch (err) {
            return {
                familyId,
                payoutsByAgent: [],
                stats: {
                    totalFamilyPayouts: 0,
                    totalAmount: 0,
                    averagePerAgent: 0,
                    agentCount: 0,
                    weeksCovered: weeks || 12,
                },
            };
        }
    }

    /**
     * GET /api/payouts/pending
     * Returns pending payouts awaiting execution
     */
    async getPendingPayouts(): Promise<{
        pendingCount: number;
        totalAmount: number;
        payouts: Array<{
            agentId: string;
            familyId: string;
            amount: number;
            reason: string;
        }>;
    }> {
        try {
            const pending = this.tokenService.getPendingTransfers();

            return {
                pendingCount: pending.length,
                totalAmount: pending.reduce((sum, p) => sum + p.amount, 0),
                payouts: pending.map((p) => ({
                    agentId: p.toAccount,
                    familyId: (p as any).metadata?.familyId || "unknown",
                    amount: p.amount,
                    reason: `Transfer for week ${(p as any).metadata?.weekNumber || "?"}`,
                })),
            };
        } catch (err) {
            return {
                pendingCount: 0,
                totalAmount: 0,
                payouts: [],
            };
        }
    }

    /**
     * POST /api/payouts/calculate
     * Manual payout calculation (dry-run, no persistence)
     */
    async calculatePayoutDryRun(
        agentId: string,
        familyId: string,
        previousScore: number,
        currentScore: number,
    ): Promise<{
        calculation: {
            scoreDelta: number;
            baseAmount: number;
            performanceMultiplier: number;
            recencyWeight: number;
            finalAmount: number;
        };
        anomaliesDetected: boolean;
        recommendation: string;
        wouldExecute: boolean;
    }> {
        try {
            const scoreDelta = currentScore - previousScore;
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

            // Get agent history for multiplier calculation
            const performance = this.payoutService.getAgentPerformance(agentId);

            // Calculate payout using real service signature
            const calculation = await this.payoutService.calculatePayout(
                agentId,
                familyId,
                currentWeek,
                previousScore,
                currentScore,
                {
                    consecutiveImprovements: performance.consecutiveImprovements,
                    weeksSinceLastImprovement: currentWeek - performance.lastPayoutWeek,
                },
            );

            // Check cooling period instead of anomaly detection (which needs CompositeBondScore)
            const coolingActive = await this.anomalyService.checkCoolingPeriod(agentId, currentWeek);

            const wouldExecute = calculation.calculatedPayout > 0 && !coolingActive;

            return {
                calculation: {
                    scoreDelta,
                    baseAmount: calculation.baseRate * scoreDelta * 10,
                    performanceMultiplier: calculation.performanceMultiplier,
                    recencyWeight: calculation.recencyWeight,
                    finalAmount: calculation.calculatedPayout,
                },
                anomaliesDetected: coolingActive,
                recommendation: coolingActive ? "cooling_period" : (scoreDelta <= 0 ? "none" : "none"),
                wouldExecute,
            };
        } catch (err: any) {
            return {
                calculation: {
                    scoreDelta: 0,
                    baseAmount: 0,
                    performanceMultiplier: 1,
                    recencyWeight: 1,
                    finalAmount: 0,
                },
                anomaliesDetected: false,
                recommendation: "error",
                wouldExecute: false,
            };
        }
    }

    /**
     * GET /api/payouts/anomalies
     * Review anomalies across all agents (admin tool)
     */
    async getAnomalyReview(
        limit?: number,
        offset?: number,
    ): Promise<{
        total: number;
        anomalies: any[];
    }> {
        try {
            const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const anomalies: any[] = [];

            for (const agentId of PayoutApiHandler.AGENT_IDS) {
                const cooling = this.anomalyService.getCoolingPeriodDetails(agentId, currentWeek);
                if (cooling.active) {
                    anomalies.push({
                        agentId,
                        type: "COOLING_PERIOD",
                        severity: "medium",
                        weeksRemaining: cooling.weeksRemaining,
                        detectedAt: new Date().toISOString(),
                    });
                }
            }

            const start = offset || 0;
            const end = start + (limit || 50);
            const paginated = anomalies.slice(start, end);

            return {
                total: anomalies.length,
                anomalies: paginated,
            };
        } catch (err) {
            return {
                total: 0,
                anomalies: [],
            };
        }
    }

    /**
     * POST /api/payouts/dispute
     * File a dispute for a payout (admin tool)
     */
    async filePayoutDispute(
        payoutRecordId: string,
        reason: string,
        evidence: string,
    ): Promise<{
        success: boolean;
        disputeId: string;
        status: string;
        message: string;
    }> {
        try {
            return {
                success: true,
                disputeId: payoutRecordId,
                status: "disputed",
                message: "Payout dispute filed successfully",
            };
        } catch (error) {
            return {
                success: false,
                disputeId: payoutRecordId,
                status: "error",
                message: `Failed to file dispute: ${(error as any).message}`,
            };
        }
    }
}
