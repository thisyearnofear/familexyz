/**
 * Usage Tracker Service
 * Tracks and enforces feature usage quotas per user/subscription
 */

import { v4 as uuidv4 } from 'uuid';
import type { IDatabaseAdapter } from '@elizaos/core';
import type {
    UsageRecord,
    UsageStats,
    UsageSummary,
    UsageFeature,
    Subscription,
    IUsageTracker,
    SubscriptionTier,
} from '../types.js';
import { UsageLimitError } from '../types.js';
import { getTierLimits } from '../tiers.js';

export class UsageTracker implements IUsageTracker {
    constructor(private db: IDatabaseAdapter) {}

    /**
     * Track usage for a feature
     */
    async track(userId: string, feature: UsageFeature, count: number = 1): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        const { periodStart, periodEnd } = this.getCurrentPeriod(feature);

        // Get or create usage record for current period
        const existing = await this.db.get(
            `SELECT * FROM usage_tracking
             WHERE user_id = ? AND feature = ?
             AND period_start = ? AND period_end = ?`,
            [userId, feature, periodStart, periodEnd]
        );

        if (existing) {
            // Update existing record
            await this.db.run(
                `UPDATE usage_tracking
                 SET count = count + ?, updated_at = ?
                 WHERE id = ?`,
                [count, now, existing.id]
            );
        } else {
            // Get subscription for this user
            const subscription = await this.getSubscription(userId);

            // Create new record
            const id = uuidv4();
            await this.db.run(
                `INSERT INTO usage_tracking (
                    id, user_id, family_id, subscription_id,
                    feature, count, period_start, period_end,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    userId,
                    subscription.familyId || null,
                    subscription.id,
                    feature,
                    count,
                    periodStart,
                    periodEnd,
                    now,
                    now,
                ]
            );
        }
    }

    /**
     * Get usage stats for a feature
     */
    async getUsage(userId: string, feature: UsageFeature): Promise<UsageStats> {
        const subscription = await this.getSubscription(userId);
        const limits = getTierLimits(subscription.tier);
        const { periodStart, periodEnd } = this.getCurrentPeriod(feature);

        // Get current usage
        const record = await this.db.get(
            `SELECT * FROM usage_tracking
             WHERE user_id = ? AND feature = ?
             AND period_start = ? AND period_end = ?`,
            [userId, feature, periodStart, periodEnd]
        );

        const used = record ? record.count : 0;
        const limit = this.getFeatureLimit(limits, feature);
        const percentage = limit === 'unlimited' ? 0 : (used / limit) * 100;

        return {
            feature,
            used,
            limit,
            percentage,
            resetAt: periodEnd,
        };
    }

    /**
     * Get usage summary for all features
     */
    async getUsageSummary(userId: string): Promise<UsageSummary> {
        const subscription = await this.getSubscription(userId);
        const features: UsageFeature[] = ['ai_messages', 'web_searches', 'advanced_models', 'api_calls'];

        const usage: UsageStats[] = await Promise.all(
            features.map(feature => this.getUsage(userId, feature))
        );

        const overLimitFeatures = usage
            .filter(stat => stat.limit !== 'unlimited' && stat.used >= stat.limit)
            .map(stat => stat.feature);

        return {
            subscription,
            usage,
            isOverLimit: overLimitFeatures.length > 0,
            overLimitFeatures,
        };
    }

    /**
     * Check if user is within limit for a feature
     */
    async checkLimit(userId: string, feature: UsageFeature): Promise<boolean> {
        const stats = await this.getUsage(userId, feature);

        if (stats.limit === 'unlimited') {
            return true;
        }

        return stats.used < stats.limit;
    }

    /**
     * Enforce usage limit (throws error if exceeded)
     */
    async enforceLimit(userId: string, feature: UsageFeature): Promise<void> {
        const subscription = await this.getSubscription(userId);
        const stats = await this.getUsage(userId, feature);

        if (stats.limit === 'unlimited') {
            return; // No limit to enforce
        }

        if (stats.used >= stats.limit) {
            const suggestedTier = this.getSuggestedTier(subscription.tier);

            throw new UsageLimitError(
                `You've reached your ${this.getFeatureName(feature)} limit of ${stats.limit} for this period. Upgrade to ${suggestedTier} for more.`,
                feature,
                stats.limit,
                stats.used,
                suggestedTier
            );
        }
    }

    /**
     * Reset usage for a user (or specific feature)
     */
    async resetUsage(userId: string, feature?: UsageFeature): Promise<void> {
        if (feature) {
            // Reset specific feature
            const { periodStart, periodEnd } = this.getCurrentPeriod(feature);
            await this.db.run(
                `DELETE FROM usage_tracking
                 WHERE user_id = ? AND feature = ?
                 AND period_start = ? AND period_end = ?`,
                [userId, feature, periodStart, periodEnd]
            );
        } else {
            // Reset all features for current period
            const now = Math.floor(Date.now() / 1000);
            await this.db.run(
                `DELETE FROM usage_tracking
                 WHERE user_id = ? AND period_end < ?`,
                [userId, now]
            );
        }
    }

    /**
     * Reset usage for all users (scheduled job)
     */
    async resetAllUsage(feature?: UsageFeature): Promise<number> {
        const now = Math.floor(Date.now() / 1000);

        if (feature) {
            const result = await this.db.run(
                `DELETE FROM usage_tracking
                 WHERE feature = ? AND period_end < ?`,
                [feature, now]
            );
            return result.changes || 0;
        } else {
            const result = await this.db.run(
                `DELETE FROM usage_tracking WHERE period_end < ?`,
                [now]
            );
            return result.changes || 0;
        }
    }

    /**
     * Get usage analytics for a period
     */
    async getUsageAnalytics(
        startDate: number,
        endDate: number
    ): Promise<{
        feature: UsageFeature;
        totalUsage: number;
        uniqueUsers: number;
        avgPerUser: number;
    }[]> {
        const rows = await this.db.all(
            `SELECT
                feature,
                SUM(count) as total_usage,
                COUNT(DISTINCT user_id) as unique_users
             FROM usage_tracking
             WHERE period_start >= ? AND period_end <= ?
             GROUP BY feature`,
            [startDate, endDate]
        );

        return rows.map(row => ({
            feature: row.feature as UsageFeature,
            totalUsage: row.total_usage,
            uniqueUsers: row.unique_users,
            avgPerUser: row.total_usage / row.unique_users,
        }));
    }

    /**
     * Get top users by feature usage
     */
    async getTopUsers(
        feature: UsageFeature,
        limit: number = 10
    ): Promise<{
        userId: string;
        totalUsage: number;
        tier: string;
    }[]> {
        const { periodStart, periodEnd } = this.getCurrentPeriod(feature);

        const rows = await this.db.all(
            `SELECT
                ut.user_id,
                SUM(ut.count) as total_usage,
                s.tier
             FROM usage_tracking ut
             JOIN subscriptions s ON ut.subscription_id = s.id
             WHERE ut.feature = ?
             AND ut.period_start = ? AND ut.period_end = ?
             GROUP BY ut.user_id
             ORDER BY total_usage DESC
             LIMIT ?`,
            [feature, periodStart, periodEnd, limit]
        );

        return rows.map(row => ({
            userId: row.user_id,
            totalUsage: row.total_usage,
            tier: row.tier,
        }));
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    /**
     * Get current period for a feature
     */
    private getCurrentPeriod(feature: UsageFeature): { periodStart: number; periodEnd: number } {
        const now = new Date();

        // Monthly reset for most features
        if (feature === 'ai_messages' || feature === 'web_searches') {
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            return {
                periodStart: Math.floor(periodStart.getTime() / 1000),
                periodEnd: Math.floor(periodEnd.getTime() / 1000),
            };
        }

        // Daily reset for API calls
        if (feature === 'api_calls') {
            const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            return {
                periodStart: Math.floor(periodStart.getTime() / 1000),
                periodEnd: Math.floor(periodEnd.getTime() / 1000),
            };
        }

        // Default to monthly
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return {
            periodStart: Math.floor(periodStart.getTime() / 1000),
            periodEnd: Math.floor(periodEnd.getTime() / 1000),
        };
    }

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
            tier: row.tier,
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
     * Get feature limit from tier limits
     */
    private getFeatureLimit(limits: any, feature: UsageFeature): number | 'unlimited' {
        switch (feature) {
            case 'ai_messages':
                return limits.features.messagesPerMonth;
            case 'web_searches':
                return limits.features.webSearchesPerMonth;
            case 'advanced_models':
                return limits.features.advancedModels ? 'unlimited' : 0;
            case 'api_calls':
                return limits.features.apiAccess ? 'unlimited' : 0;
            default:
                return 0;
        }
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
     * Get suggested tier for upgrade
     */
    private getSuggestedTier(currentTier: string): SubscriptionTier {
        const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
        const currentIndex = tierOrder.indexOf(currentTier as SubscriptionTier);

        if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
            return 'PREMIUM';
        }

        return tierOrder[currentIndex + 1];
    }
}
