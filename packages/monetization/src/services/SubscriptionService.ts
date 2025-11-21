/**
 * Subscription Service
 * Handles CRUD operations for subscriptions
 */

import { v4 as uuidv4 } from 'uuid';
import type { IDatabaseAdapter } from '@elizaos/core';
import type {
    Subscription,
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionStatus,
    SubscriptionTier,
    ISubscriptionService,
} from '../types.js';
import { SubscriptionError } from '../types.js';

export class SubscriptionService implements ISubscriptionService {
    constructor(private db: IDatabaseAdapter) {}

    /**
     * Create a new subscription
     */
    async create(data: SubscriptionCreate): Promise<Subscription> {
        const now = Math.floor(Date.now() / 1000);
        const id = uuidv4();

        // Check if user already has an active subscription
        const existing = await this.getByUser(data.userId);
        if (existing && existing.status === 'active') {
            throw new SubscriptionError(
                'User already has an active subscription',
                'SUBSCRIPTION_EXISTS',
                409
            );
        }

        // Calculate period (30 days for monthly subscriptions)
        const periodStart = now;
        const periodEnd = now + (30 * 24 * 60 * 60); // 30 days

        const subscription: Subscription = {
            id,
            userId: data.userId,
            familyId: data.familyId,
            tier: data.tier,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            paymentMethod: data.paymentMethod,
            paymentId: data.paymentId,
            createdAt: now,
            updatedAt: now,
        };

        await this.db.run(
            `INSERT INTO subscriptions (
                id, user_id, family_id, tier, status,
                current_period_start, current_period_end,
                cancel_at_period_end, payment_method, payment_id,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                subscription.id,
                subscription.userId,
                subscription.familyId || null,
                subscription.tier,
                subscription.status,
                subscription.currentPeriodStart,
                subscription.currentPeriodEnd,
                subscription.cancelAtPeriodEnd ? 1 : 0,
                subscription.paymentMethod,
                subscription.paymentId || null,
                subscription.createdAt,
                subscription.updatedAt,
            ]
        );

        // Log creation to history
        await this.logHistory(subscription.id, subscription.userId, 'created', undefined, subscription.tier);

        return subscription;
    }

    /**
     * Get subscription by ID
     */
    async get(id: string): Promise<Subscription | null> {
        const row = await this.db.get(
            `SELECT * FROM subscriptions WHERE id = ?`,
            [id]
        );

        return row ? this.mapRowToSubscription(row) : null;
    }

    /**
     * Get active subscription for a user
     */
    async getByUser(userId: string): Promise<Subscription | null> {
        const row = await this.db.get(
            `SELECT * FROM subscriptions
             WHERE user_id = ? AND status = 'active'
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        return row ? this.mapRowToSubscription(row) : null;
    }

    /**
     * Update subscription
     */
    async update(id: string, data: SubscriptionUpdate): Promise<Subscription> {
        const existing = await this.get(id);
        if (!existing) {
            throw new SubscriptionError(
                'Subscription not found',
                'SUBSCRIPTION_NOT_FOUND',
                404
            );
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (data.tier !== undefined) {
            updates.push('tier = ?');
            values.push(data.tier);
        }

        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }

        if (data.cancelAtPeriodEnd !== undefined) {
            updates.push('cancel_at_period_end = ?');
            values.push(data.cancelAtPeriodEnd ? 1 : 0);
        }

        if (data.currentPeriodEnd !== undefined) {
            updates.push('current_period_end = ?');
            values.push(data.currentPeriodEnd);
        }

        if (updates.length === 0) {
            return existing;
        }

        values.push(id);

        await this.db.run(
            `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updated = await this.get(id);
        if (!updated) {
            throw new SubscriptionError(
                'Failed to update subscription',
                'UPDATE_FAILED',
                500
            );
        }

        // Log tier change to history
        if (data.tier && data.tier !== existing.tier) {
            const action = this.getTierChangeAction(existing.tier, data.tier);
            await this.logHistory(id, existing.userId, action, existing.tier, data.tier);
        }

        return updated;
    }

    /**
     * Cancel subscription
     */
    async cancel(id: string): Promise<Subscription> {
        const subscription = await this.get(id);
        if (!subscription) {
            throw new SubscriptionError(
                'Subscription not found',
                'SUBSCRIPTION_NOT_FOUND',
                404
            );
        }

        // Mark for cancellation at period end
        return this.update(id, {
            cancelAtPeriodEnd: true,
        });
    }

    /**
     * Renew subscription
     */
    async renew(id: string): Promise<Subscription> {
        const subscription = await this.get(id);
        if (!subscription) {
            throw new SubscriptionError(
                'Subscription not found',
                'SUBSCRIPTION_NOT_FOUND',
                404
            );
        }

        const now = Math.floor(Date.now() / 1000);
        const newPeriodEnd = now + (30 * 24 * 60 * 60); // 30 days

        return this.update(id, {
            status: 'active',
            currentPeriodEnd: newPeriodEnd,
            cancelAtPeriodEnd: false,
        });
    }

    /**
     * Check for expired subscriptions
     */
    async checkExpired(): Promise<Subscription[]> {
        const now = Math.floor(Date.now() / 1000);

        const rows = await this.db.all(
            `SELECT * FROM subscriptions
             WHERE status = 'active'
             AND current_period_end < ?`,
            [now]
        );

        const expired: Subscription[] = [];

        for (const row of rows) {
            const subscription = this.mapRowToSubscription(row);

            // Update status to expired
            await this.update(subscription.id, {
                status: 'expired',
            });

            expired.push(subscription);
        }

        return expired;
    }

    /**
     * Get or create FREE subscription for user
     */
    async getOrCreateFree(userId: string): Promise<Subscription> {
        let subscription = await this.getByUser(userId);

        if (!subscription) {
            subscription = await this.create({
                userId,
                tier: 'FREE',
                paymentMethod: 'free',
            });
        }

        return subscription;
    }

    /**
     * Upgrade subscription
     */
    async upgrade(userId: string, newTier: SubscriptionTier, paymentId: string, paymentMethod: 'hedera' | 'stripe'): Promise<Subscription> {
        const existing = await this.getByUser(userId);

        if (!existing) {
            // Create new subscription
            return this.create({
                userId,
                tier: newTier,
                paymentMethod,
                paymentId,
            });
        }

        // Update existing subscription
        return this.update(existing.id, {
            tier: newTier,
        });
    }

    /**
     * Downgrade subscription
     */
    async downgrade(userId: string, newTier: SubscriptionTier): Promise<Subscription> {
        const existing = await this.getByUser(userId);

        if (!existing) {
            throw new SubscriptionError(
                'No active subscription found',
                'SUBSCRIPTION_NOT_FOUND',
                404
            );
        }

        return this.update(existing.id, {
            tier: newTier,
        });
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    private mapRowToSubscription(row: any): Subscription {
        return {
            id: row.id,
            userId: row.user_id,
            familyId: row.family_id || undefined,
            tier: row.tier as SubscriptionTier,
            status: row.status as SubscriptionStatus,
            currentPeriodStart: row.current_period_start,
            currentPeriodEnd: row.current_period_end,
            cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
            paymentMethod: row.payment_method,
            paymentId: row.payment_id || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private getTierChangeAction(oldTier: SubscriptionTier, newTier: SubscriptionTier): 'upgraded' | 'downgraded' {
        const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
        const oldIndex = tierOrder.indexOf(oldTier);
        const newIndex = tierOrder.indexOf(newTier);
        return newIndex > oldIndex ? 'upgraded' : 'downgraded';
    }

    private async logHistory(
        subscriptionId: string,
        userId: string,
        action: string,
        fromTier?: SubscriptionTier,
        toTier?: SubscriptionTier
    ): Promise<void> {
        const id = uuidv4();
        const now = Math.floor(Date.now() / 1000);

        await this.db.run(
            `INSERT INTO subscription_history (
                id, subscription_id, user_id, action,
                from_tier, to_tier, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                subscriptionId,
                userId,
                action,
                fromTier || null,
                toTier || null,
                now,
            ]
        );
    }
}
