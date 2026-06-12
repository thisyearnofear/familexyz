/**
 * ServiceRegistry — single source of truth for all runtime services.
 *
 * Replaces scattered module-level `let` variables and `global.*` assignments
 * with a typed singleton that every route handler reads from.
 */

import type { AgentRuntime, IDatabaseAdapter } from "@elizaos/core";
import type { DailyTake } from "../jobs/DailyTakeGenerator.js";
import type { SubscriptionService } from "@elizaos/monetization";
import type { UsageTracker } from "@elizaos/monetization";
import type { FeatureGate } from "@elizaos/monetization";

export interface PayoutApiHandler {
    getAgentPayoutHistory(agentId: string, weeks?: number): Promise<any>;
    getAgentPerformance(agentId: string): Promise<any>;
    getFamilyPayoutHistory(familyId: string, weeks?: number): Promise<any>;
    getPendingPayouts(): Promise<any>;
    calculatePayoutDryRun(agentId: string, familyId: string, previousScore: number, currentScore: number): Promise<any>;
    getAnomalyReview(limit: number, offset: number): Promise<any>;
    filePayoutDispute(payoutRecordId: string, reason: string, evidence: string): Promise<any>;
}

export interface ServiceRegistryState {
    primaryDb: IDatabaseAdapter | null;
    primaryRuntime: AgentRuntime | null;
    payoutHandler: PayoutApiHandler | null;
    dailyTakeCache: DailyTake | null;
    directClient: any | null;
    telegramClient: any | null;
    subscriptionService: SubscriptionService | null;
    usageTracker: UsageTracker | null;
    featureGate: FeatureGate | null;
}

const state: ServiceRegistryState = {
    primaryDb: null,
    primaryRuntime: null,
    payoutHandler: null,
    dailyTakeCache: null,
    directClient: null,
    telegramClient: null,
    subscriptionService: null,
    usageTracker: null,
    featureGate: null,
};

export const ServiceRegistry = {
    get<K extends keyof ServiceRegistryState>(key: K): ServiceRegistryState[K] {
        return state[key];
    },

    set<K extends keyof ServiceRegistryState>(key: K, value: ServiceRegistryState[K]) {
        state[key] = value;
    },

    /**
     * Initialize the payout API handler lazily (once).
     */
    async ensurePayoutHandler(): Promise<PayoutApiHandler | null> {
        if (state.payoutHandler) return state.payoutHandler;

        try {
            const { PayoutService: PSvc, AnomalyDetectionService: ADSvc, HederaPayoutLogger: HPL, HederaTokenService: HTS } = await import("@familexyz/agent-services");
            const { PayoutApiHandler } = await import("../api/index.js");

            const hcsTopicId = process.env.HEDERA_WISDOM_TOPIC_ID || "0.0.0";
            const famTokenId = process.env.HEDERA_FAMILY_TOKEN_ID || "0.0.0";
            const treasuryId = process.env.HEDERA_TREASURY_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID || "0.0.0";

            const payoutService = new PSvc();
            const anomalyService = new ADSvc();

            const dbAdapter = state.primaryDb && 'query' in state.primaryDb
                ? { query: (sql: string, params: any[]) => (state.primaryDb as any).query(sql, params) }
                : undefined;
            const hcsLogger = new HPL(hcsTopicId, dbAdapter);

            if (dbAdapter) {
                const loaded = await hcsLogger.loadFromDb();
                if (loaded > 0) {
                    // loaded records
                }
            }

            const tokenService = new HTS(famTokenId, treasuryId, []);

            state.payoutHandler = new PayoutApiHandler(payoutService, anomalyService, hcsLogger, tokenService);
            return state.payoutHandler;
        } catch {
            return null;
        }
    },

    /**
     * Snapshot for health checks.
     */
    getStatus() {
        return {
            hasDb: state.primaryDb !== null,
            hasRuntime: state.primaryRuntime !== null,
            hasPayoutHandler: state.payoutHandler !== null,
            hasDirectClient: state.directClient !== null,
            hasTelegram: state.telegramClient !== null,
            hasMonetization: state.subscriptionService !== null,
        };
    },

    /**
     * Initialize monetization services from the primary DB adapter.
     */
    async ensureMonetization(): Promise<{ subscriptionService: SubscriptionService; usageTracker: UsageTracker; featureGate: FeatureGate } | null> {
        if (state.subscriptionService && state.usageTracker && state.featureGate) {
            return {
                subscriptionService: state.subscriptionService,
                usageTracker: state.usageTracker,
                featureGate: state.featureGate,
            };
        }

        if (!state.primaryDb) return null;

        try {
            const { SubscriptionService: SS, UsageTracker: UT, FeatureGate: FG } = await import("@elizaos/monetization");
            const subSvc = new SS(state.primaryDb);
            const usageTracker = new UT(state.primaryDb);
            const featureGate = new FG(state.primaryDb, usageTracker);

            state.subscriptionService = subSvc;
            state.usageTracker = usageTracker;
            state.featureGate = featureGate;

            return { subscriptionService: subSvc, usageTracker, featureGate };
        } catch {
            return null;
        }
    },
};
