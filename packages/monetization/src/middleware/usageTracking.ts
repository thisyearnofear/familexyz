/**
 * Usage Tracking Middleware
 * Express middleware to automatically track feature usage
 */

import type { Request, Response, NextFunction } from 'express';
import type { UsageTracker } from '../services/UsageTracker.js';
import type { UsageFeature } from '../types.js';
import { elizaLogger } from '@elizaos/core';

export interface UsageTrackingOptions {
    feature: UsageFeature;
    getUserId: (req: Request) => string | undefined;
    count?: number | ((req: Request) => number);
    skipTracking?: (req: Request) => boolean;
}

/**
 * Create usage tracking middleware
 */
export function createUsageTrackingMiddleware(
    usageTracker: UsageTracker,
    options: UsageTrackingOptions
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get user ID
            const userId = options.getUserId(req);
            if (!userId) {
                elizaLogger.warn('Usage tracking: No user ID found in request');
                return next();
            }

            // Check if we should skip tracking
            if (options.skipTracking && options.skipTracking(req)) {
                return next();
            }

            // Get count
            const count = typeof options.count === 'function'
                ? options.count(req)
                : (options.count || 1);

            // Track usage after response is sent
            res.on('finish', async () => {
                try {
                    // Only track successful responses
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        await usageTracker.track(userId, options.feature, count);
                        elizaLogger.debug(
                            `Tracked ${count} ${options.feature} for user ${userId}`
                        );
                    }
                } catch (error) {
                    elizaLogger.error('Failed to track usage:', error);
                }
            });

            next();
        } catch (error) {
            elizaLogger.error('Usage tracking middleware error:', error);
            next(); // Don't block request on tracking errors
        }
    };
}

/**
 * Create quota enforcement middleware
 */
export function createQuotaEnforcementMiddleware(
    usageTracker: UsageTracker,
    options: {
        feature: UsageFeature;
        getUserId: (req: Request) => string | undefined;
        skipEnforcement?: (req: Request) => boolean;
    }
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

            // Check if we should skip enforcement
            if (options.skipEnforcement && options.skipEnforcement(req)) {
                return next();
            }

            // Check and enforce limit
            try {
                await usageTracker.enforceLimit(userId, options.feature);
                next();
            } catch (error: any) {
                if (error.name === 'UsageLimitError') {
                    return res.status(429).json({
                        error: error.message,
                        code: 'USAGE_LIMIT_EXCEEDED',
                        feature: error.feature,
                        limit: error.limit,
                        used: error.used,
                        suggestedTier: error.suggestedTier,
                        upgradeUrl: '/subscription/upgrade',
                    });
                }
                throw error;
            }
        } catch (error) {
            elizaLogger.error('Quota enforcement error:', error);
            return res.status(500).json({
                error: 'Failed to check usage quota',
                code: 'QUOTA_CHECK_FAILED',
            });
        }
    };
}

/**
 * Combined middleware: enforce quota then track usage
 */
export function createUsageMiddleware(
    usageTracker: UsageTracker,
    options: {
        feature: UsageFeature;
        getUserId: (req: Request) => string | undefined;
        count?: number | ((req: Request) => number);
        skipEnforcement?: (req: Request) => boolean;
        skipTracking?: (req: Request) => boolean;
    }
) {
    const enforcement = createQuotaEnforcementMiddleware(usageTracker, {
        feature: options.feature,
        getUserId: options.getUserId,
        skipEnforcement: options.skipEnforcement,
    });

    const tracking = createUsageTrackingMiddleware(usageTracker, {
        feature: options.feature,
        getUserId: options.getUserId,
        count: options.count,
        skipTracking: options.skipTracking,
    });

    return [enforcement, tracking];
}

/**
 * Helper to extract user ID from various request sources
 */
export const getUserIdExtractors = {
    /**
     * Extract from request body
     */
    fromBody: (field: string = 'userId') => (req: Request) => {
        return req.body?.[field];
    },

    /**
     * Extract from request params
     */
    fromParams: (field: string = 'userId') => (req: Request) => {
        return req.params?.[field];
    },

    /**
     * Extract from query string
     */
    fromQuery: (field: string = 'userId') => (req: Request) => {
        return req.query?.[field] as string;
    },

    /**
     * Extract from authenticated user (req.user)
     */
    fromAuth: (req: Request) => {
        return (req as any).user?.id || (req as any).user?.userId;
    },

    /**
     * Extract from custom header
     */
    fromHeader: (header: string = 'x-user-id') => (req: Request) => {
        return req.headers[header] as string;
    },

    /**
     * Try multiple sources in order
     */
    tryMultiple: (...extractors: ((req: Request) => string | undefined)[]) => (req: Request) => {
        for (const extractor of extractors) {
            const userId = extractor(req);
            if (userId) return userId;
        }
        return undefined;
    },
};

/**
 * Helper to create count extractors
 */
export const getCountExtractors = {
    /**
     * Fixed count
     */
    fixed: (count: number) => () => count,

    /**
     * Count from request body
     */
    fromBody: (field: string = 'count') => (req: Request) => {
        return parseInt(req.body?.[field] || '1', 10);
    },

    /**
     * Count array length from body
     */
    fromArrayLength: (field: string) => (req: Request) => {
        const arr = req.body?.[field];
        return Array.isArray(arr) ? arr.length : 1;
    },
};
