/**
 * Feature Gate Service
 * Controls access to premium features based on subscription tier
 */

import type { IDatabaseAdapter } from '@elizaos/core';
import type {
    FeatureAccessCheck,
    FeatureAccessResult,
    Subscription,
    UsageFeature,
    SubscriptionTier,
    IFeatureGate,
} from '../types.js';
import { UsageLimitError } from '../types.js';
import { getTierLimits, tierHasFeature, getNextTier } from '../tiers.js';
import { UsageTracker } from './UsageTracker.js';

export class FeatureGate implements IFeatureGate {
    constructor(
        private db: IDatabaseAdapter,
        private usageTracker: UsageTracker
    ) {}

    /**
     * Check if user has access to a feature
     */
    async checkAccess(check: FeatureAccessCheck): Promise<FeatureAccessResult> {
        const subscription = await this.getSubscription(check.userId);
        const limits = getTierLimits(subscription.tier);

        // Check if feature is available for this tier
        const hasFeature = this.checkFeatureAvailability(subscription.tier, check.feature);

        if (!hasFeature) {
            const suggestedTier = this.getSuggestedTier(subscription.tier, check.feature);
            return {
                allowed: false,
                reason: `This feature is not available on your ${subscription.tier} plan`,
                subscription,
                upgradeRequired: true,
                suggestedTier,
            };
        }

        // Check usage quota if applicable
        if (check.feature === 'ai_messages' || check.feature === 'web_searches') {
            const usage = await this.usageTracker.getUsage(check.userId, check.feature);

            if (usage.limit !== 'unlimited' && usage.used >= usage.limit) {
                const suggestedTier = getNextTier(subscription.tier) || 'PREMIUM';
                return {
                    allowed: false,
                    reason: `You've reached your ${this.getFeatureName(check.feature)} limit of ${usage.limit}`,
                    subscription,
                    usage,
                    upgradeRequired: true,
                    suggestedTier,
                };
            }

            // Increment usage if requested
            if (check.increment) {
                await this.usageTracker.track(check.userId, check.feature, 1);
            }

            return {
                allowed: true,
                subscription,
                usage,
            };
        }

        // Boolean features (advanced_models, api_calls)
        return {
            allowed: true,
            subscription,
        };
    }

    /**
     * Enforce feature access (throws error if denied)
     */
    async enforceAccess(check: FeatureAccessCheck): Promise<void> {
        const result = await this.checkAccess(check);

        if (!result.allowed) {
            if (result.usage) {
                throw new UsageLimitError(
                    result.reason || 'Usage limit exceeded',
                    check.feature,
                    result.usage.limit as number,
                    result.usage.used,
                    result.suggestedTier
                );
            }

            throw new Error(result.reason || 'Feature access denied');
        }
    }

    /**
     * Check if feature is enabled in feature_gates table
     */
    async isFeatureEnabled(featureKey: string, tier: SubscriptionTier): Promise<boolean> {
        const row = await this.db.get(
            `SELECT * FROM feature_gates WHERE feature_key = ?`,
            [featureKey]
        );

        if (!row) {
            // Feature not in gates table, use tier defaults
            return true;
        }

        // Check tier-specific column
        const columnMap: Record<SubscriptionTier, string> = {
            FREE: 'free_tier_enabled',
            BASIC: 'basic_tier_enabled',
            PREMIUM: 'premium_tier_enabled',
            FAMILY: 'family_tier_enabled',
        };

        const column = columnMap[tier];
        return Boolean(row[column]);
    }

    /**
     * Enable/disable feature for a tier (admin function)
     */
    async setFeatureEnabled(
        featureKey: string,
        tier: SubscriptionTier,
        enabled: boolean
    ): Promise<void> {
        const columnMap: Record<SubscriptionTier, string> = {
            FREE: 'free_tier_enabled',
            BASIC: 'basic_tier_enabled',
            PREMIUM: 'premium_tier_enabled',
            FAMILY: 'family_tier_enabled',
        };

        const column = columnMap[tier];
        const now = Math.floor(Date.now() / 1000);

        await this.db.run(
            `UPDATE feature_gates
             SET ${column} = ?, updated_at = ?
             WHERE feature_key = ?`,
            [enabled ? 1 : 0, now, featureKey]
        );
    }

    /**
     * Get all feature gates
     */
    async getAllFeatureGates(): Promise<{
        featureKey: string;
        featureName: string;
        description: string;
        tiers: Record<SubscriptionTier, boolean>;
    }[]> {
        const rows = await this.db.all(
            `SELECT * FROM feature_gates ORDER BY feature_name`
        );

        return rows.map((row: any) => ({
            featureKey: row.feature_key,
            featureName: row.feature_name,
            description: row.description,
            tiers: {
                FREE: Boolean(row.free_tier_enabled),
                BASIC: Boolean(row.basic_tier_enabled),
                PREMIUM: Boolean(row.premium_tier_enabled),
                FAMILY: Boolean(row.family_tier_enabled),
            },
        }));
    }

    /**
     * Get features available to a user
     */
    async getUserFeatures(userId: string): Promise<{
        feature: string;
        enabled: boolean;
        reason?: string;
    }[]> {
        const subscription = await this.getSubscription(userId);
        const gates = await this.getAllFeatureGates();

        return gates.map(gate => {
            const enabled = gate.tiers[subscription.tier];
            return {
                feature: gate.featureKey,
                enabled,
                reason: enabled ? undefined : `Requires ${this.getMinimumTier(gate.tiers)} tier or higher`,
            };
        });
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    /**
     * Get subscription for user
     */
    private async getSubscription(userId: string): Promise<Subscription> {
        const row = await this.db.get(
            `SELECT * FROM subscriptions
             WHERE user_id = ? AND status = 'active'
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        if (!row) {
            // Return default FREE subscription
            return {
                id: 'free-default',
                userId,
                tier: 'FREE',
                status: 'active',
                currentPeriodStart: Math.floor(Date.now() / 1000),
                currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                cancelAtPeriodEnd: false,
                paymentMethod: 'free',
                createdAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
            };
        }

        return {
            id: row.id,
            userId: row.user_id,
            familyId: row.family_id,
            tier: row.tier as SubscriptionTier,
            status: row.status,
            currentPeriodStart: row.current_period_start,
            currentPeriodEnd: row.current_period_end,
            cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
            paymentMethod: row.payment_method,
            paymentId: row.payment_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    /**
     * Check if tier has access to feature
     */
    private checkFeatureAvailability(tier: SubscriptionTier, feature: UsageFeature): boolean {
        const limits = getTierLimits(tier);

        switch (feature) {
            case 'ai_messages':
                return limits.features.messagesPerMonth !== 0;
            case 'web_searches':
                return limits.features.webSearchesPerMonth !== 0;
            case 'advanced_models':
                return limits.features.advancedModels;
            case 'api_calls':
                return limits.features.apiAccess;
            default:
                return false;
        }
    }

    /**
     * Get suggested tier for a feature
     */
    private getSuggestedTier(currentTier: SubscriptionTier, feature: UsageFeature): SubscriptionTier {
        const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];

        for (const tier of tierOrder) {
            if (this.checkFeatureAvailability(tier, feature)) {
                // If current tier is lower, suggest this tier
                const currentIndex = tierOrder.indexOf(currentTier);
                const suggestedIndex = tierOrder.indexOf(tier);

                if (suggestedIndex > currentIndex) {
                    return tier;
                }
            }
        }

        return 'PREMIUM';
    }

    /**
     * Get minimum tier that has a feature enabled
     */
    private getMinimumTier(tiers: Record<SubscriptionTier, boolean>): SubscriptionTier {
        const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];

        for (const tier of tierOrder) {
            if (tiers[tier]) {
                return tier;
            }
        }

        return 'PREMIUM';
    }

    /**
     * Get human-readable feature name
     */
    private getFeatureName(feature: UsageFeature): string {
        const names: Record<UsageFeature, string> = {
            ai_messages: 'AI messages',
            web_searches: 'web searches',
            advanced_models: 'advanced model usage',
            api_calls: 'API calls',
        };
        return names[feature] || feature;
    }

    /**
     * Enforce usage limit for a feature (throws error if exceeded)
     */
    async enforceLimit(userId: string, feature: UsageFeature): Promise<void> {
        const result = await this.checkAccess({
            userId,
            feature,
            increment: false, // Don't increment, just check
        });

        if (!result.allowed && result.upgradeRequired) {
            const suggestedTier = result.suggestedTier || this.getSuggestedTier(result.subscription.tier, feature);
            
            throw new UsageLimitError(
                result.reason || `Feature access denied for ${this.getFeatureName(feature)}`,
                feature,
                typeof result.usage?.limit === 'number' ? result.usage.limit : 0,
                result.usage?.used || 0,
                suggestedTier
            );
        }
    }
}
