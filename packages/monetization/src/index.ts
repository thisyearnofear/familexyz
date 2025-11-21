/**
 * @elizaos/monetization
 * Monetization and subscription management for Eliza AI agents
 */

// Export core types
export * from './types.js';

// Export tier definitions and utilities
export * from './tiers.js';

// Export services
export { SubscriptionService } from './services/SubscriptionService.js';
export { UsageTracker } from './services/UsageTracker.js';
export { FeatureGate } from './services/FeatureGate.js';

// Export middleware
export {
    createUsageTrackingMiddleware,
    createQuotaEnforcementMiddleware,
    createUsageMiddleware,
    getUserIdExtractors,
    getCountExtractors,
} from './middleware/usageTracking.js';

export {
    createFeatureGateMiddleware,
    featureGates,
    requireTier,
    attachSubscription,
    hasRequiredTier,
    withFeatureGate,
} from './middleware/featureGate.js';

// Export jobs
export {
    registerUsageResetJobs,
    UsageResetJobRunner,
    createCronScheduler,
} from './jobs/usageReset.js';

// Re-export commonly used types for convenience (already exported via './types')
export type {
    Subscription,
    SubscriptionTier,
    SubscriptionStatus,
    TierLimits,
    UsageRecord,
    UsageStats,
    UsageSummary,
    UsageFeature,
    PaymentTransaction,
} from './types.js';
