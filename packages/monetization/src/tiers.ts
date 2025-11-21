/**
 * Subscription Tier Definitions
 * Defines the features and limits for each subscription tier
 */

import type { SubscriptionTier, TierLimits } from './types.js';

// ============================================================================
// TIER CONFIGURATIONS
// ============================================================================

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
    FREE: {
        tier: 'FREE',
        price: 0,
        features: {
            messagesPerMonth: 50,
            webSearchesPerMonth: 0,
            familyProfiles: 1,
            messageHistoryDays: 30,
            advancedModels: false,
            prioritySupport: false,
            customPersonalities: false,
            apiAccess: false,
            analytics: false,
        },
    },
    BASIC: {
        tier: 'BASIC',
        price: 9.99,
        features: {
            messagesPerMonth: 500,
            webSearchesPerMonth: 50,
            familyProfiles: 1,
            messageHistoryDays: 90,
            advancedModels: false,
            prioritySupport: false,
            customPersonalities: false,
            apiAccess: false,
            analytics: false,
        },
    },
    PREMIUM: {
        tier: 'PREMIUM',
        price: 24.99,
        features: {
            messagesPerMonth: 'unlimited',
            webSearchesPerMonth: 'unlimited',
            familyProfiles: 3,
            messageHistoryDays: 'unlimited',
            advancedModels: true,
            prioritySupport: true,
            customPersonalities: true,
            apiAccess: false,
            analytics: true,
        },
    },
    FAMILY: {
        tier: 'FAMILY',
        price: 49.99,
        features: {
            messagesPerMonth: 'unlimited',
            webSearchesPerMonth: 'unlimited',
            familyProfiles: 'unlimited',
            messageHistoryDays: 'unlimited',
            advancedModels: true,
            prioritySupport: true,
            customPersonalities: true,
            apiAccess: true,
            analytics: true,
        },
    },
};

// ============================================================================
// TIER UTILITIES
// ============================================================================

/**
 * Get tier limits for a specific tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
    return TIER_LIMITS[tier];
}

/**
 * Check if a tier has a specific feature
 */
export function tierHasFeature(
    tier: SubscriptionTier,
    feature: keyof TierLimits['features']
): boolean {
    const limits = TIER_LIMITS[tier];
    const value = limits.features[feature];

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value > 0;
    }

    if (value === 'unlimited') {
        return true;
    }

    return false;
}

/**
 * Get the limit for a specific feature
 */
export function getTierFeatureLimit(
    tier: SubscriptionTier,
    feature: keyof TierLimits['features']
): number | 'unlimited' {
    const limits = TIER_LIMITS[tier];
    const value = limits.features[feature];

    if (typeof value === 'boolean') {
        return value ? 'unlimited' : 0;
    }

    return value;
}

/**
 * Check if tier A is higher than tier B
 */
export function isTierHigher(tierA: SubscriptionTier, tierB: SubscriptionTier): boolean {
    const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
    return tierOrder.indexOf(tierA) > tierOrder.indexOf(tierB);
}

/**
 * Get the next higher tier
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
    const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
        return null;
    }

    return tierOrder[currentIndex + 1];
}

/**
 * Get suggested tier for a feature
 */
export function getSuggestedTierForFeature(
    feature: keyof TierLimits['features']
): SubscriptionTier {
    // Check each tier from lowest to highest
    const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'FAMILY'];

    for (const tier of tierOrder) {
        if (tierHasFeature(tier, feature)) {
            return tier;
        }
    }

    // Default to PREMIUM if feature not found
    return 'PREMIUM';
}

/**
 * Calculate prorated amount for tier change
 */
export function calculateProratedAmount(
    currentTier: SubscriptionTier,
    newTier: SubscriptionTier,
    daysRemaining: number
): number {
    const currentPrice = TIER_LIMITS[currentTier].price;
    const newPrice = TIER_LIMITS[newTier].price;
    const priceDiff = newPrice - currentPrice;

    // Prorate based on days remaining in current period (assuming 30-day month)
    const proratedAmount = (priceDiff * daysRemaining) / 30;

    return Math.max(0, proratedAmount);
}

/**
 * Get tier comparison for upgrade prompts
 */
export function compareTiers(
    currentTier: SubscriptionTier,
    targetTier: SubscriptionTier
): {
    isUpgrade: boolean;
    priceDifference: number;
    newFeatures: string[];
    improvedLimits: string[];
} {
    const currentLimits = TIER_LIMITS[currentTier];
    const targetLimits = TIER_LIMITS[targetTier];
    const isUpgrade = isTierHigher(targetTier, currentTier);
    const priceDifference = targetLimits.price - currentLimits.price;

    const newFeatures: string[] = [];
    const improvedLimits: string[] = [];

    // Check for new boolean features
    if (!currentLimits.features.advancedModels && targetLimits.features.advancedModels) {
        newFeatures.push('Advanced AI Models');
    }
    if (!currentLimits.features.prioritySupport && targetLimits.features.prioritySupport) {
        newFeatures.push('Priority Support');
    }
    if (!currentLimits.features.customPersonalities && targetLimits.features.customPersonalities) {
        newFeatures.push('Custom AI Personalities');
    }
    if (!currentLimits.features.apiAccess && targetLimits.features.apiAccess) {
        newFeatures.push('API Access');
    }
    if (!currentLimits.features.analytics && targetLimits.features.analytics) {
        newFeatures.push('Family Analytics');
    }

    // Check for improved limits
    if (targetLimits.features.messagesPerMonth === 'unlimited' &&
        currentLimits.features.messagesPerMonth !== 'unlimited') {
        improvedLimits.push('Unlimited AI Messages');
    } else if (typeof targetLimits.features.messagesPerMonth === 'number' &&
               typeof currentLimits.features.messagesPerMonth === 'number' &&
               targetLimits.features.messagesPerMonth > currentLimits.features.messagesPerMonth) {
        improvedLimits.push(`${targetLimits.features.messagesPerMonth} messages/month`);
    }

    if (targetLimits.features.webSearchesPerMonth === 'unlimited' &&
        currentLimits.features.webSearchesPerMonth !== 'unlimited') {
        improvedLimits.push('Unlimited Web Searches');
    } else if (typeof targetLimits.features.webSearchesPerMonth === 'number' &&
               typeof currentLimits.features.webSearchesPerMonth === 'number' &&
               targetLimits.features.webSearchesPerMonth > currentLimits.features.webSearchesPerMonth) {
        improvedLimits.push(`${targetLimits.features.webSearchesPerMonth} web searches/month`);
    }

    if (targetLimits.features.familyProfiles === 'unlimited' &&
        currentLimits.features.familyProfiles !== 'unlimited') {
        improvedLimits.push('Unlimited Family Profiles');
    } else if (typeof targetLimits.features.familyProfiles === 'number' &&
               typeof currentLimits.features.familyProfiles === 'number' &&
               targetLimits.features.familyProfiles > currentLimits.features.familyProfiles) {
        improvedLimits.push(`${targetLimits.features.familyProfiles} family profiles`);
    }

    return {
        isUpgrade,
        priceDifference,
        newFeatures,
        improvedLimits,
    };
}

// ============================================================================
// TIER DISPLAY INFORMATION
// ============================================================================

export const TIER_DISPLAY_INFO: Record<SubscriptionTier, {
    name: string;
    description: string;
    badge?: string;
    color: string;
    popular?: boolean;
}> = {
    FREE: {
        name: 'Free',
        description: 'Get started with basic AI conversations',
        color: '#6B7280',
    },
    BASIC: {
        name: 'Basic',
        description: 'Enhanced AI with web search capabilities',
        color: '#3B82F6',
    },
    PREMIUM: {
        name: 'Premium',
        description: 'Unlimited AI power for individuals',
        badge: 'Most Popular',
        color: '#8B5CF6',
        popular: true,
    },
    FAMILY: {
        name: 'Family',
        description: 'Complete solution for families',
        badge: 'Best Value',
        color: '#EC4899',
    },
};
