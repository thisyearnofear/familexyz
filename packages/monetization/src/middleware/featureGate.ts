/**
 * Feature Gate Middleware
 * Express middleware to enforce feature access based on subscription tier
 */

import type { Request, Response, NextFunction } from 'express';
import type { FeatureGate } from '../services/FeatureGate.js';
import type { UsageFeature } from '../types.js';
import { elizaLogger } from '@elizaos/core';

export interface FeatureGateOptions {
    feature: UsageFeature;
    getUserId: (req: Request) => string | undefined;
    increment?: boolean; // Whether to increment usage counter
    skipGate?: (req: Request) => boolean;
    onDenied?: (req: Request, res: Response, reason: string) => void;
}

/**
 * Create feature gate middleware
 */
export function createFeatureGateMiddleware(
    featureGate: FeatureGate,
    options: FeatureGateOptions
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get user ID
            const userId = options.getUserId(req);
            if (!userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'UNAUTHORIZED',
                });
            }

            // Check if we should skip gate
            if (options.skipGate && options.skipGate(req)) {
                return next();
            }

            // Check feature access
            const result = await featureGate.checkAccess({
                userId,
                feature: options.feature,
                increment: options.increment,
            });

            if (!result.allowed) {
                elizaLogger.warn(
                    `Feature access denied for user ${userId}: ${result.reason}`
                );

                // Call custom denied handler if provided
                if (options.onDenied) {
                    return options.onDenied(req, res, result.reason || 'Access denied');
                }

                // Default response
                return res.status(403).json({
                    error: result.reason || 'Feature not available on your plan',
                    code: 'FEATURE_ACCESS_DENIED',
                    feature: options.feature,
                    currentTier: result.subscription.tier,
                    upgradeRequired: result.upgradeRequired,
                    suggestedTier: result.suggestedTier,
                    upgradeUrl: '/subscription/upgrade',
                });
            }

            // Access granted
            elizaLogger.debug(
                `Feature access granted for user ${userId}: ${options.feature}`
            );

            // Attach subscription and usage info to request for later use
            (req as any).subscription = result.subscription;
            (req as any).usage = result.usage;

            next();
        } catch (error) {
            elizaLogger.error('Feature gate middleware error:', error);
            return res.status(500).json({
                error: 'Failed to check feature access',
                code: 'FEATURE_GATE_ERROR',
            });
        }
    };
}

/**
 * Create middleware for specific features
 */
export const featureGates = {
    /**
     * Web search feature gate
     */
    webSearch: (
        featureGate: FeatureGate,
        getUserId: (req: Request) => string | undefined
    ) => createFeatureGateMiddleware(featureGate, {
        feature: 'web_searches',
        getUserId,
        increment: true,
    }),

    /**
     * Advanced models feature gate
     */
    advancedModels: (
        featureGate: FeatureGate,
        getUserId: (req: Request) => string | undefined
    ) => createFeatureGateMiddleware(featureGate, {
        feature: 'advanced_models',
        getUserId,
        increment: false,
    }),

    /**
     * API access feature gate
     */
    apiAccess: (
        featureGate: FeatureGate,
        getUserId: (req: Request) => string | undefined
    ) => createFeatureGateMiddleware(featureGate, {
        feature: 'api_calls',
        getUserId,
        increment: true,
    }),

    /**
     * AI messages feature gate
     */
    aiMessages: (
        featureGate: FeatureGate,
        getUserId: (req: Request) => string | undefined
    ) => createFeatureGateMiddleware(featureGate, {
        feature: 'ai_messages',
        getUserId,
        increment: true,
    }),
};

/**
 * Require specific tier middleware
 */
export function requireTier(
    minimumTier: 'FREE' | 'BASIC' | 'PREMIUM' | 'FAMILY',
    getUserId: (req: Request) => string | undefined,
    db: any
) {
    const tierOrder = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
    const minimumIndex = tierOrder.indexOf(minimumTier);

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'UNAUTHORIZED',
                });
            }

            // Get user's subscription
            const row = await db.get(
                `SELECT * FROM subscriptions
                 WHERE user_id = ? AND status = 'active'
                 ORDER BY created_at DESC LIMIT 1`,
                [userId]
            );

            const userTier = row ? row.tier : 'FREE';
            const userIndex = tierOrder.indexOf(userTier);

            if (userIndex < minimumIndex) {
                return res.status(403).json({
                    error: `This feature requires ${minimumTier} tier or higher`,
                    code: 'TIER_REQUIRED',
                    currentTier: userTier,
                    requiredTier: minimumTier,
                    upgradeUrl: '/subscription/upgrade',
                });
            }

            next();
        } catch (error) {
            elizaLogger.error('Tier requirement middleware error:', error);
            return res.status(500).json({
                error: 'Failed to check tier requirement',
                code: 'TIER_CHECK_ERROR',
            });
        }
    };
}

/**
 * Attach subscription info to request
 */
export function attachSubscription(
    getUserId: (req: Request) => string | undefined,
    db: any
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = getUserId(req);
            if (!userId) {
                return next();
            }

            const row = await db.get(
                `SELECT * FROM subscriptions
                 WHERE user_id = ? AND status = 'active'
                 ORDER BY created_at DESC LIMIT 1`,
                [userId]
            );

            if (row) {
                (req as any).subscription = {
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
            } else {
                // Default FREE subscription
                (req as any).subscription = {
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

            next();
        } catch (error) {
            elizaLogger.error('Attach subscription middleware error:', error);
            next(); // Don't block request on error
        }
    };
}

/**
 * Helper to check if request has required tier
 */
export function hasRequiredTier(
    req: Request,
    minimumTier: 'FREE' | 'BASIC' | 'PREMIUM' | 'FAMILY'
): boolean {
    const subscription = (req as any).subscription;
    if (!subscription) return false;

    const tierOrder = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
    const userIndex = tierOrder.indexOf(subscription.tier);
    const minimumIndex = tierOrder.indexOf(minimumTier);

    return userIndex >= minimumIndex;
}

/**
 * Decorator-style feature gate for route handlers
 */
export function withFeatureGate(
    featureGate: FeatureGate,
    feature: UsageFeature,
    getUserId: (req: Request) => string | undefined
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
            const userId = getUserId(req);
            if (!userId) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'UNAUTHORIZED',
                });
            }

            const result = await featureGate.checkAccess({
                userId,
                feature,
                increment: true,
            });

            if (!result.allowed) {
                return res.status(403).json({
                    error: result.reason || 'Feature not available',
                    code: 'FEATURE_ACCESS_DENIED',
                    feature,
                    upgradeRequired: result.upgradeRequired,
                    suggestedTier: result.suggestedTier,
                });
            }

            return originalMethod.apply(this, [req, res, next]);
        };

        return descriptor;
    };
}
