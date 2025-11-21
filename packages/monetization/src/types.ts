/**
 * Monetization Types
 * Type definitions for subscription management, usage tracking, and payments
 */

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'FAMILY';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export type PaymentMethod = 'hedera' | 'stripe' | 'free';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ============================================================================
// SUBSCRIPTION INTERFACES
// ============================================================================

export interface Subscription {
    id: string;
    userId: string;
    familyId?: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodStart: number; // Unix timestamp
    currentPeriodEnd: number; // Unix timestamp
    cancelAtPeriodEnd: boolean;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface SubscriptionCreate {
    userId: string;
    familyId?: string;
    tier: SubscriptionTier;
    paymentMethod: PaymentMethod;
    paymentId?: string;
}

export interface SubscriptionUpdate {
    tier?: SubscriptionTier;
    status?: SubscriptionStatus;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: number;
}

// ============================================================================
// TIER LIMITS
// ============================================================================

export interface TierLimits {
    tier: SubscriptionTier;
    price: number; // USD per month
    features: {
        messagesPerMonth: number | 'unlimited';
        webSearchesPerMonth: number | 'unlimited';
        familyProfiles: number | 'unlimited';
        messageHistoryDays: number | 'unlimited';
        advancedModels: boolean;
        prioritySupport: boolean;
        customPersonalities: boolean;
        apiAccess: boolean;
        analytics: boolean;
    };
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface UsageRecord {
    id: string;
    userId: string;
    familyId?: string;
    subscriptionId: string;
    feature: UsageFeature;
    count: number;
    periodStart: number; // Unix timestamp
    periodEnd: number; // Unix timestamp
    createdAt: number;
    updatedAt: number;
}

export type UsageFeature =
    | 'ai_messages'
    | 'web_searches'
    | 'advanced_models'
    | 'api_calls';

export interface UsageStats {
    feature: UsageFeature;
    used: number;
    limit: number | 'unlimited';
    percentage: number;
    resetAt: number; // Unix timestamp
}

export interface UsageSummary {
    subscription: Subscription;
    usage: UsageStats[];
    isOverLimit: boolean;
    overLimitFeatures: UsageFeature[];
}

// ============================================================================
// PAYMENT TRANSACTIONS
// ============================================================================

export interface PaymentTransaction {
    id: string;
    subscriptionId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentId: string; // External payment ID (Stripe/Hedera)
    status: PaymentStatus;
    metadata?: Record<string, any>;
    createdAt: number;
}

export interface PaymentCreate {
    subscriptionId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    metadata?: Record<string, any>;
}

// ============================================================================
// HEDERA PAYMENT
// ============================================================================

export interface HederaPaymentRequest {
    userId: string;
    tier: SubscriptionTier;
    amount: number;
    currency: string;
    accountId: string; // User's Hedera account ID
}

export interface HederaPaymentResponse {
    transactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
}

// ============================================================================
// STRIPE PAYMENT
// ============================================================================

export interface StripeCheckoutRequest {
    userId: string;
    tier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
}

export interface StripeCheckoutResponse {
    sessionId: string;
    url: string;
}

export interface StripeWebhookEvent {
    type: string;
    data: {
        object: any;
    };
}

// ============================================================================
// FEATURE GATING
// ============================================================================

export interface FeatureAccessCheck {
    userId: string;
    feature: UsageFeature;
    increment?: boolean; // Whether to increment usage counter
}

export interface FeatureAccessResult {
    allowed: boolean;
    reason?: string;
    subscription: Subscription;
    usage?: UsageStats;
    upgradeRequired?: boolean;
    suggestedTier?: SubscriptionTier;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface RevenueMetrics {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    arpu: number; // Average Revenue Per User
    totalRevenue: number;
    period: {
        start: number;
        end: number;
    };
}

export interface ConversionMetrics {
    freeUsers: number;
    paidUsers: number;
    conversionRate: number;
    trialUsers: number;
    churnRate: number;
    period: {
        start: number;
        end: number;
    };
}

export interface UsageMetrics {
    totalMessages: number;
    totalWebSearches: number;
    avgMessagesPerUser: number;
    avgWebSearchesPerUser: number;
    period: {
        start: number;
        end: number;
    };
}

export interface MonetizationAnalytics {
    revenue: RevenueMetrics;
    conversion: ConversionMetrics;
    usage: UsageMetrics;
    subscriptionBreakdown: {
        tier: SubscriptionTier;
        count: number;
        revenue: number;
    }[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class SubscriptionError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'SubscriptionError';
    }
}

export class UsageLimitError extends SubscriptionError {
    constructor(
        message: string,
        public feature: UsageFeature,
        public limit: number,
        public used: number,
        public suggestedTier?: SubscriptionTier
    ) {
        super(message, 'USAGE_LIMIT_EXCEEDED', 429);
        this.name = 'UsageLimitError';
    }
}

export class PaymentError extends Error {
    constructor(
        message: string,
        public code: string,
        public paymentMethod: PaymentMethod,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'PaymentError';
    }
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ISubscriptionService {
    create(data: SubscriptionCreate): Promise<Subscription>;
    get(id: string): Promise<Subscription | null>;
    getByUser(userId: string): Promise<Subscription | null>;
    update(id: string, data: SubscriptionUpdate): Promise<Subscription>;
    cancel(id: string): Promise<Subscription>;
    renew(id: string): Promise<Subscription>;
    checkExpired(): Promise<Subscription[]>;
}

export interface IUsageTracker {
    track(userId: string, feature: UsageFeature, count?: number): Promise<void>;
    getUsage(userId: string, feature: UsageFeature): Promise<UsageStats>;
    getUsageSummary(userId: string): Promise<UsageSummary>;
    resetUsage(userId: string, feature?: UsageFeature): Promise<void>;
    checkLimit(userId: string, feature: UsageFeature): Promise<boolean>;
}

export interface IPaymentService {
    createPayment(data: PaymentCreate): Promise<PaymentTransaction>;
    getPayment(id: string): Promise<PaymentTransaction | null>;
    updatePaymentStatus(id: string, status: PaymentStatus): Promise<PaymentTransaction>;
    getPaymentsBySubscription(subscriptionId: string): Promise<PaymentTransaction[]>;
}

export interface IFeatureGate {
    checkAccess(check: FeatureAccessCheck): Promise<FeatureAccessResult>;
    enforceLimit(userId: string, feature: UsageFeature): Promise<void>;
}
