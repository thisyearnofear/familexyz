# Phase 3: Monetization Implementation Plan

## Overview

Implement a comprehensive monetization system that enables tiered subscriptions, usage tracking, and feature gating for AI capabilities, with dual payment support (Hedera blockchain + Stripe).

## Architecture Principles

Following our core principles:
- **ENHANCEMENT FIRST**: Extend existing user/family profile system
- **DRY**: Single source of truth for subscription state
- **CLEAN**: Clear separation between billing, usage tracking, and feature enforcement
- **MODULAR**: Independent subscription, payment, and tracking modules
- **PERFORMANT**: Cached subscription checks, efficient usage tracking
- **ORGANIZED**: Domain-driven structure under `/packages/monetization`

## Implementation Phases

### Phase 3.1: Subscription Tiers & Data Model ✅ START HERE
**Goal**: Define subscription tiers and create database schema

**Tasks**:
1. Define subscription tier structure
2. Create database schema for subscriptions
3. Create TypeScript types and interfaces
4. Implement subscription service (CRUD operations)

**Files to Create**:
- `packages/monetization/src/types.ts` - Type definitions
- `packages/monetization/src/schema.sql` - Database schema
- `packages/monetization/src/services/SubscriptionService.ts` - Subscription management
- `packages/monetization/src/tiers.ts` - Tier definitions and limits

**Deliverables**:
- [ ] Subscription tiers defined (FREE, BASIC, PREMIUM, FAMILY)
- [ ] Database schema created
- [ ] Subscription service implemented
- [ ] Unit tests for subscription service

---

### Phase 3.2: Usage Tracking System
**Goal**: Track AI feature usage per user/family

**Tasks**:
1. Create usage tracking service
2. Implement usage counters (daily, monthly)
3. Add usage middleware to message handler
4. Create usage reset jobs (daily/monthly)

**Files to Create**:
- `packages/monetization/src/services/UsageTracker.ts` - Usage tracking
- `packages/monetization/src/middleware/trackUsage.ts` - Express middleware
- `packages/monetization/src/jobs/resetUsage.ts` - Scheduled jobs

**Deliverables**:
- [ ] Usage tracking service implemented
- [ ] Usage recorded on each AI request
- [ ] Daily/monthly usage limits enforced
- [ ] Usage reset jobs scheduled

---

### Phase 3.3: Feature Gating (Server-Side)
**Goal**: Enforce subscription limits and feature access

**Tasks**:
1. Create feature gate middleware
2. Implement subscription validation
3. Add quota checking before AI requests
4. Return user-friendly error messages

**Files to Create**:
- `packages/monetization/src/middleware/featureGate.ts` - Feature gating
- `packages/monetization/src/services/FeatureAccess.ts` - Access control
- `packages/monetization/src/errors.ts` - Custom error types

**Deliverables**:
- [ ] Feature gate middleware implemented
- [ ] Subscription validation on each request
- [ ] Quota limits enforced
- [ ] Graceful error handling with upgrade prompts

---

### Phase 3.4: Payment Integration (Hedera)
**Goal**: Accept cryptocurrency payments via Hedera

**Tasks**:
1. Create Hedera payment service
2. Implement subscription purchase flow
3. Add webhook for payment confirmation
4. Handle subscription activation

**Files to Create**:
- `packages/monetization/src/services/HederaPayment.ts` - Hedera integration
- `packages/monetization/src/webhooks/hederaWebhook.ts` - Payment webhooks
- `packages/clients/direct/src/routes/payments.ts` - Payment endpoints

**Deliverables**:
- [ ] Hedera payment service implemented
- [ ] Subscription purchase endpoint
- [ ] Payment webhook handler
- [ ] Subscription activation on payment

---

### Phase 3.5: Payment Integration (Stripe)
**Goal**: Accept traditional payments via Stripe

**Tasks**:
1. Create Stripe payment service
2. Implement Stripe Checkout integration
3. Add webhook for payment events
4. Handle subscription lifecycle (create, renew, cancel)

**Files to Create**:
- `packages/monetization/src/services/StripePayment.ts` - Stripe integration
- `packages/monetization/src/webhooks/stripeWebhook.ts` - Stripe webhooks

**Deliverables**:
- [ ] Stripe payment service implemented
- [ ] Stripe Checkout flow
- [ ] Webhook handling (payment success, renewal, cancellation)
- [ ] Subscription lifecycle management

---

### Phase 3.6: Frontend Integration
**Goal**: Add subscription UI to client

**Tasks**:
1. Create subscription management UI
2. Add payment flow components
3. Implement usage dashboard
4. Add upgrade prompts

**Files to Create/Modify**:
- `client/src/components/dashboard/tabs/SubscriptionTab.tsx` - Subscription UI
- `client/src/components/payments/PaymentModal.tsx` - Payment flow
- `client/src/components/dashboard/UsageDashboard.tsx` - Usage display
- `client/src/components/UpgradePrompt.tsx` - Upgrade prompts

**Deliverables**:
- [ ] Subscription management UI
- [ ] Payment flow (Hedera + Stripe)
- [ ] Usage dashboard
- [ ] Upgrade prompts on quota exceeded

---

### Phase 3.7: Analytics & Reporting
**Goal**: Track revenue, usage patterns, and conversions

**Tasks**:
1. Create analytics service
2. Implement revenue tracking
3. Add conversion tracking
4. Create admin dashboard

**Files to Create**:
- `packages/monetization/src/services/Analytics.ts` - Analytics
- `client/src/components/admin/MonetizationDashboard.tsx` - Admin UI

**Deliverables**:
- [ ] Analytics service implemented
- [ ] Revenue tracking
- [ ] Conversion funnel tracking
- [ ] Admin dashboard

---

## Subscription Tier Definitions

### FREE Tier
- **Price**: $0/month
- **Features**:
  - Basic AI conversations (50 messages/month)
  - Standard response time
  - Community support
  - 1 family profile
- **Limits**:
  - No web search
  - No advanced AI features
  - Limited message history (30 days)

### BASIC Tier
- **Price**: $9.99/month
- **Features**:
  - 500 AI messages/month
  - Web search enabled (50 searches/month)
  - Priority response time
  - Email support
  - 1 family profile
  - 90-day message history
- **Limits**:
  - Limited web searches
  - Standard AI models only

### PREMIUM Tier
- **Price**: $24.99/month
- **Features**:
  - Unlimited AI messages
  - Unlimited web search
  - Advanced AI models
  - Priority support
  - 3 family profiles
  - Unlimited message history
  - Custom AI personalities
- **Limits**:
  - None for individual use

### FAMILY Tier
- **Price**: $49.99/month
- **Features**:
  - Everything in PREMIUM
  - Unlimited family profiles
  - Family analytics dashboard
  - Multi-user collaboration
  - Dedicated support
  - Custom integrations
  - API access
- **Limits**:
  - None

---

## Database Schema

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    family_id TEXT,
    tier TEXT NOT NULL CHECK(tier IN ('FREE', 'BASIC', 'PREMIUM', 'FAMILY')),
    status TEXT NOT NULL CHECK(status IN ('active', 'cancelled', 'expired', 'trial')),
    current_period_start INTEGER NOT NULL,
    current_period_end INTEGER NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    payment_method TEXT CHECK(payment_method IN ('hedera', 'stripe', 'free')),
    payment_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES accounts(id),
    FOREIGN KEY (family_id) REFERENCES families(id)
);

-- Usage tracking table
CREATE TABLE usage_tracking (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    family_id TEXT,
    subscription_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES accounts(id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (user_id) REFERENCES accounts(id)
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_family ON subscriptions(family_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

---

## API Endpoints

### Subscription Management
- `GET /api/subscription` - Get current subscription
- `POST /api/subscription/upgrade` - Upgrade subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/usage` - Get usage stats

### Payment Endpoints
- `POST /api/payments/hedera/create` - Create Hedera payment
- `POST /api/payments/hedera/webhook` - Hedera payment webhook
- `POST /api/payments/stripe/create-checkout` - Create Stripe checkout
- `POST /api/payments/stripe/webhook` - Stripe webhook

### Admin Endpoints
- `GET /api/admin/subscriptions` - List all subscriptions
- `GET /api/admin/analytics` - Revenue and usage analytics
- `POST /api/admin/subscription/:id/override` - Override subscription

---

## Security Considerations

1. **Server-Side Validation**: All feature gates enforced server-side
2. **Payment Verification**: Verify all payments via webhooks
3. **Rate Limiting**: Prevent abuse with rate limits
4. **Audit Logging**: Log all subscription changes
5. **Encryption**: Encrypt payment data at rest
6. **PCI Compliance**: Use Stripe for card processing (no card data stored)

---

## Testing Strategy

### Unit Tests
- Subscription service CRUD operations
- Usage tracking calculations
- Feature gate logic
- Payment processing

### Integration Tests
- End-to-end subscription flow
- Payment webhooks
- Usage limit enforcement
- Subscription upgrades/downgrades

### Manual Tests
- Payment flows (Hedera + Stripe)
- Feature gating UI
- Usage dashboard
- Admin dashboard

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging
- Test all payment flows
- Verify feature gating
- Test usage tracking

### Phase 2: Beta Testing (Week 2)
- Invite 10-20 beta users
- Offer free PREMIUM tier
- Gather feedback
- Fix bugs

### Phase 3: Soft Launch (Week 3)
- Enable FREE tier for all users
- Enable paid tiers for early adopters
- Monitor metrics
- Iterate based on feedback

### Phase 4: Full Launch (Week 4)
- Public announcement
- Marketing campaign
- Full feature availability
- 24/7 support

---

## Success Metrics

### Revenue Metrics
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)
- Churn Rate

### Usage Metrics
- Free → Paid conversion rate
- Feature adoption rate
- Messages per user
- Web search usage

### Technical Metrics
- Payment success rate
- API response time
- Error rate
- Uptime

---

## Next Steps

1. **Start with Phase 3.1**: Define subscription tiers and create database schema
2. **Create package structure**: Set up `/packages/monetization`
3. **Implement subscription service**: CRUD operations for subscriptions
4. **Add database migrations**: Create tables and indexes

**Ready to begin implementation?** Let's start with Phase 3.1! 🚀
