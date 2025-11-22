import type { PayoutService } from "../services/PayoutService.js";
import type { AnomalyDetectionService } from "../services/AnomalyDetectionService.js";
import type { HederaPayoutLogger } from "../integrations/HederaPayoutLogger.js";
import type { HederaTokenService } from "../integrations/HederaTokenService.js";

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
 * Follows the PREVENT BLOAT principle: single-purpose, focused, <300 lines
 */
export class PayoutApiHandler {
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
        payouts: Array<{
            timestamp: number;
            amount: number;
            scoreDelta: number;
            multiplier: number;
            familyId: string;
        }>;
        stats: {
            totalPayouts: number;
            totalAmount: number;
            averageAmount: number;
            weeksCovered: number;
        };
    }> {
        const weeksToQuery = weeks || 12;
        const stats = await this.hcsLogger.getAgentPayoutStats(agentId, weeksToQuery);

        // Get payout audit trail
        const auditTrail = await this.hcsLogger.getPayoutAuditTrail(agentId, weeksToQuery);

        const payouts = auditTrail.map((record) => ({
            timestamp: record.timestamp,
            amount: record.payoutAmount,
            scoreDelta: record.scoreDelta,
            multiplier: record.performanceMultiplier * record.recencyWeight,
            familyId: record.familyId,
        }));

        return {
            agentId,
            payouts,
            stats: {
                totalPayouts: stats.totalPayouts,
                totalAmount: stats.totalAmount,
                averageAmount: stats.averageAmount,
                weeksCovered: weeksToQuery,
            },
        };
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
        coolingPeriodUntil: number | null;
        averagePayoutPerWeek: number;
        totalEarned: number;
        recentAnomalies: Array<{
            type: string;
            severity: string;
            timestamp: number;
            details: any;
        }>;
        performanceScore: number;
    }> {
        const performance = this.payoutService.getAgentPerformance(agentId);
        const stats = await this.hcsLogger.getAgentPayoutStats(agentId, 4);
        const coolingPeriod = this.anomalyService.getCoolingPeriod(agentId);

        // Get recent anomalies (last 4 weeks)
        const anomalies = await this.hcsLogger.getAnomalousPayouts(agentId, 4);

        // Calculate performance score (0-100)
        const improvementBonus = Math.min(performance.consecutiveImprovements * 10, 30);
        const payoutBonus = Math.min(stats.totalAmount / 50, 20); // 50 FAM per point
        const anomalyPenalty = anomalies.length > 0 ? Math.min(anomalies.length * 10, 30) : 0;
        const performanceScore = Math.max(0, 50 + improvementBonus + payoutBonus - anomalyPenalty);

        return {
            agentId,
            consecutiveImprovements: performance.consecutiveImprovements,
            lastImprovement: performance.lastImprovement || null,
            coolingPeriodActive: coolingPeriod !== null,
            coolingPeriodUntil: coolingPeriod,
            averagePayoutPerWeek: stats.totalPayouts > 0 ? stats.totalAmount / 4 : 0,
            totalEarned: stats.totalAmount,
            recentAnomalies: anomalies.map((a) => ({
                type: a.flags.map((f) => f.type).join(", "),
                severity: a.flags.length > 0 ? a.flags[0].severity : "low",
                timestamp: a.timestamp,
                details: a.flags,
            })),
            performanceScore,
        };
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
        const weeksToQuery = weeks || 12;
        const stats = await this.hcsLogger.getFamilyPayoutStats(familyId, weeksToQuery);
        const auditTrail = await this.hcsLogger.getFamilyPayoutAuditTrail(familyId, weeksToQuery);

        // Group by agent
        const byAgent: {
            [agentId: string]: { amount: number; count: number };
        } = {};

        for (const record of auditTrail) {
            if (!byAgent[record.agentId]) {
                byAgent[record.agentId] = { amount: 0, count: 0 };
            }
            byAgent[record.agentId].amount += record.payoutAmount;
            byAgent[record.agentId].count += 1;
        }

        const payoutsByAgent = Object.entries(byAgent).map(([agentId, data]) => ({
            agentId,
            amount: data.amount,
            payoutCount: data.count,
        }));

        return {
            familyId,
            payoutsByAgent,
            stats: {
                totalFamilyPayouts: stats.totalPayouts,
                totalAmount: stats.totalAmount,
                averagePerAgent: payoutsByAgent.length > 0 ? stats.totalAmount / payoutsByAgent.length : 0,
                agentCount: payoutsByAgent.length,
                weeksCovered: weeksToQuery,
            },
        };
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
        const pending = this.tokenService.getPendingTransfers();

        return {
            pendingCount: pending.length,
            totalAmount: pending.reduce((sum, p) => sum + p.amount, 0),
            payouts: pending.map((p) => ({
                agentId: p.toAccountId,
                familyId: p.metadata?.familyId || "unknown",
                amount: p.amount,
                reason: `Transfer for week ${p.metadata?.weekNumber || "?"}`,
            })),
        };
    }

    /**
     * POST /api/payouts/calculate
     * Manual payout calculation (dry-run, no persistence)
     * Request body:
     * {
     *   agentId: string
     *   familyId: string
     *   previousScore: number
     *   currentScore: number
     * }
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
        anomalies: Array<{
            type: string;
            severity: string;
            confidence: number;
        }>;
        anomaliesDetected: boolean;
        recommendation: string;
        wouldExecute: boolean;
    }> {
        const scoreDelta = currentScore - previousScore;

        // Calculate payout
        const calculation = this.payoutService.calculatePayout(
            scoreDelta,
            agentId,
        );

        // Detect anomalies
        const anomalyFlags = this.anomalyService.detectAnomalies(
            agentId,
            {
                generational_interaction_score: 0,
                response_reciprocity_score: 0,
                sentiment_trajectory_score: 0,
                challenge_completion_score: 0,
                presence_consistency_score: 0,
                network_topology_score: 0,
                hedera_consensus_score: 0,
                bond_score: currentScore,
            },
            {
                generational_interaction_score: 0,
                response_reciprocity_score: 0,
                sentiment_trajectory_score: 0,
                challenge_completion_score: 0,
                presence_consistency_score: 0,
                network_topology_score: 0,
                hedera_consensus_score: 0,
                bond_score: previousScore,
            },
        );

        const evaluation = this.anomalyService.evaluateAnomalies(
            agentId,
            anomalyFlags,
        );

        const wouldExecute =
            calculation.isValid &&
            evaluation.recommendation !== "cooling_period" &&
            evaluation.recommendation !== "investigation";

        return {
            calculation: {
                scoreDelta,
                baseAmount: calculation.baseAmount,
                performanceMultiplier: calculation.performanceMultiplier,
                recencyWeight: calculation.recencyWeight,
                finalAmount: calculation.finalAmount,
            },
            anomalies: anomalyFlags.map((flag) => ({
                type: flag.type,
                severity: flag.severity,
                confidence: flag.confidence,
            })),
            anomaliesDetected: anomalyFlags.length > 0,
            recommendation: evaluation.recommendation,
            wouldExecute,
        };
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
        anomalies: Array<{
            agentId: string;
            timestamp: number;
            flagCount: number;
            flagTypes: string[];
            severity: string;
            recommendation: string;
        }>;
    }> {
        // This would query all anomalies from HCS logger
        // For now, return structure
        return {
            total: 0,
            anomalies: [],
        };
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
            // Update payout record validation status
            await this.hcsLogger.updateFamilyValidation(payoutRecordId, {
                validationStatus: "disputed",
                validationNotes: reason,
                validationEvidence: evidence,
                validationTimestamp: Date.now(),
            });

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
