/**
 * Service Interface Contracts
 * 
 * Defines TypeScript interfaces for all major services.
 * Follows CLEAN principle: explicit dependencies with clear contracts.
 * 
 * These interfaces enable:
 * - Dependency injection
 * - Easy mocking for tests
 * - Clear API boundaries
 * - Better documentation
 */

import type { UUID } from "@elizaos/core";

// ============================================================
// Payout Service Interface
// ============================================================

export interface PayoutCalculation {
    scoreDelta: number;
    baseAmount: number;
    performanceMultiplier: number;
    recencyWeight: number;
    finalAmount: number;
    isValid: boolean;
}

export interface AgentPerformance {
    consecutiveImprovements: number;
    lastImprovementWeek: number | null;
    totalPayouts: number;
    averagePayout: number;
}

export interface IPayoutService {
    /**
     * Calculate payout amount based on score improvement
     */
    calculatePayout(scoreDelta: number, agentId: string): Promise<PayoutCalculation>;
    
    /**
     * Validate a payout before execution
     */
    validatePayout(
        amount: number,
        agentId: string,
        familyId: string,
        weekNumber: number
    ): Promise<{ valid: boolean; reason?: string }>;
    
    /**
     * Get agent performance metrics
     */
    getAgentPerformance(agentId: string): AgentPerformance;
    
    /**
     * Record a payout execution
     */
    recordPayout(
        agentId: string,
        familyId: string,
        weekNumber: number,
        amount: number
    ): Promise<void>;
}

// ============================================================
// Anomaly Detection Service Interface
// ============================================================

export interface AnomalyFlag {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: number;
}

export interface AnomalyEvaluation {
    hasAnomalies: boolean;
    flags: AnomalyFlag[];
    recommendedAction: 'approve' | 'review' | 'cooling_period' | 'investigation';
    confidence: number;
}

export interface CoolingPeriod {
    active: boolean;
    startedAt: number | null;
    duration: number;
    weeksRemaining: number;
    reason: string;
}

export interface IAnomalyDetectionService {
    /**
     * Detect anomalies in score changes
     */
    detectAnomalies(
        agentId: string,
        currentScores: Record<string, number>,
        previousScores: Record<string, number>
    ): AnomalyFlag[];
    
    /**
     * Evaluate anomaly flags and recommend action
     */
    evaluateFlags(flags: AnomalyFlag[]): AnomalyEvaluation;
    
    /**
     * Set a cooling period for an agent
     */
    setCoolingPeriod(
        agentId: string,
        weekNumber: number,
        duration: number,
        reason: string
    ): void;
    
    /**
     * Get cooling period details
     */
    getCoolingPeriodDetails(agentId: string, weekNumber: number): CoolingPeriod;
    
    /**
     * Check if agent is in cooling period
     */
    checkCoolingPeriod(agentId: string, weekNumber: number): boolean;
}

// ============================================================
// Hedera Payout Logger Interface
// ============================================================

export interface PayoutRecord {
    id: string;
    agentId: string;
    familyId: string;
    weekNumber: number;
    amount: number;
    transactionId?: string;
    hcsRecordId?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: number;
    executedAt?: number;
}

export interface PayoutStats {
    recordCount: number;
    totalPayouts: number;
    averagePayout: number;
    highestPayout: number;
    lowestPayout: number;
}

export interface IHederaPayoutLogger {
    /**
     * Log a payout record to HCS
     */
    logPayoutRecord(record: PayoutRecord): Promise<{ success: boolean; hcsRecordId?: string }>;
    
    /**
     * Retrieve a payout record
     */
    getPayoutRecord(recordId: string): Promise<PayoutRecord | null>;
    
    /**
     * Get payout stats for an agent
     */
    getAgentPayoutStats(
        agentId: string,
        startWeek: number,
        endWeek: number
    ): Promise<PayoutStats>;
    
    /**
     * Get payout stats for a family
     */
    getFamilyPayoutStats(
        familyId: string,
        startWeek: number,
        endWeek: number
    ): Promise<PayoutStats>;
}

// ============================================================
// Hedera Token Service Interface
// ============================================================

export interface TokenTransfer {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    tokenId: string;
    amount: number;
    metadata?: Record<string, any>;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
}

export interface TokenBalance {
    tokenId: string;
    accountId: string;
    balance: number;
    decimals: number;
}

export interface IHederaTokenService {
    /**
     * Transfer tokens between accounts
     */
    transferTokens(
        toAccountId: string,
        amount: number,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; transactionId?: string }>;
    
    /**
     * Get token balance for an account
     */
    getTokenBalance(accountId: string): Promise<TokenBalance>;
    
    /**
     * Validate a transfer before execution
     */
    validateTransfer(amount: number): { valid: boolean; reason?: string };
    
    /**
     * Get transaction status
     */
    getTransactionStatus(transactionId: string): Promise<string>;
    
    /**
     * Get pending transfers
     */
    getPendingTransfers(): TokenTransfer[];
}

// ============================================================
// Bond Score Service Interface
// ============================================================

export interface BondScoreSignals {
    generationalInteraction: number;
    responseReciprocity: number;
    sentimentTrajectory: number;
    challengeCompletion: number;
    presenceConsistency: number;
    networkTopology: number;
    hederaConsensus: number;
}

export interface BondScore {
    familyId: string;
    weekNumber: number;
    bondScore: number;
    trend: 'improving' | 'stable' | 'declining';
    weekOverWeekDelta: number;
    signals: BondScoreSignals;
    timestamp: number;
}

export interface IBondScoreService {
    /**
     * Calculate bond score from signals
     */
    calculateBondScore(signals: Partial<BondScoreSignals>): number;
    
    /**
     * Get bond score for a family
     */
    getBondScore(familyId: string, weekNumber: number): Promise<BondScore | null>;
    
    /**
     * Get bond score history
     */
    getBondScoreHistory(
        familyId: string,
        startWeek: number,
        endWeek: number
    ): Promise<BondScore[]>;
    
    /**
     * Store bond score
     */
    storeBondScore(bondScore: BondScore): Promise<void>;
}

// ============================================================
// GoodDollar Service Interface
// ============================================================

export interface GDBalance {
    address: string;
    balance: string;
    claimable: boolean;
}

export interface GDClaimStatus {
    address: string;
    hasClaimed: boolean;
    nextClaimTime: number | null;
    claimAmount: string;
}

export interface GDClaimResult {
    success: boolean;
    amount?: string;
    transactionHash?: string;
    error?: string;
}

export interface IGoodDollarService {
    /**
     * Whether GoodDollar integration is enabled
     */
    readonly enabled: boolean;
    
    /**
     * Get balance for an address
     */
    getBalance(address: string): Promise<GDBalance>;
    
    /**
     * Get claim status for an address
     */
    getClaimStatus(address: string): Promise<GDClaimStatus>;
    
    /**
     * Execute a claim for an address
     */
    claim(address: string): Promise<GDClaimResult>;
}

// ============================================================
// Hedera Service Interface
// ============================================================

export interface IHederaService {
    /**
     * Initialize the Hedera connection
     */
    initialize(): Promise<{ success: boolean; error?: string }>;
    
    /**
     * Check if service is ready
     */
    isReady(): boolean;
    
    /**
     * Perform health check
     */
    healthCheck(): Promise<{
        success: boolean;
        status?: string;
        latency?: number;
        error?: string;
    }>;
    
    /**
     * Close the service gracefully
     */
    close(): Promise<void>;
}