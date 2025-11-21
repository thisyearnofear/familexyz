# @elizaos/monetization

Monetization and subscription management package for Eliza AI agents.

## Features

- **Subscription Tiers**: FREE, BASIC, PREMIUM, and FAMILY tiers with configurable limits
- **Usage Tracking**: Track AI messages, web searches, and other feature usage
- **Quota Enforcement**: Server-side enforcement of usage limits
- **Payment Integration**: Support for Hedera and Stripe payments
- **Analytics**: Revenue, conversion, and usage metrics
- **Scheduled Jobs**: Automatic usage resets and subscription expiration checks

## Installation

```bash
pnpm add @elizaos/monetization
```

## Quick Start

### 1. Initialize Database Schema

Run the SQL schema to create necessary tables:

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const schema = readFileSync(
    join(__dirname, 'node_modules/@elizaos/monetization/dist/schema.sql'),
    'utf-8'
);

// Execute schema against your database
await db.exec(schema);
```

### 2. Create Services

```typescript
import { SubscriptionService, UsageTracker } from '@elizaos/monetization';

const subscriptionService = new SubscriptionService(databaseAdapter);
const usageTracker = new UsageTracker(databaseAdapter);
```

### 3. Add Usage Tracking Middleware

```typescript
import {
    createUsageMiddleware,
    getUserIdExtractors,
} from '@elizaos/monetization';

// Track AI message usage
app.post(
    '/api/:agentId/message',
    ...createUsageMiddleware(usageTracker, {
        feature: 'ai_messages',
        getUserId: getUserIdExtractors.fromBody('userId'),
    })
);
```

### 4. Register Scheduled Jobs

```typescript
import { registerUsageResetJobs } from '@elizaos/monetization';

registerUsageResetJobs(usageTracker, subscriptionService);
```

## Subscription Tiers

| Tier | Price | Messages | Web Search | Profiles |
|------|-------|----------|------------|----------|
| FREE | $0 | 50/month | ❌ | 1 |
| BASIC | $9.99 | 500/month | 50/month | 1 |
| PREMIUM | $24.99 | Unlimited | Unlimited | 3 |
| FAMILY | $49.99 | Unlimited | Unlimited | Unlimited |

## API Reference

### SubscriptionService

```typescript
// Create subscription
const subscription = await subscriptionService.create({
    userId: 'user-123',
    tier: 'PREMIUM',
    paymentMethod: 'stripe',
    paymentId: 'pi_123',
});

// Get user's subscription
const subscription = await subscriptionService.getByUser('user-123');

// Upgrade subscription
const upgraded = await subscriptionService.upgrade(
    'user-123',
    'FAMILY',
    'pi_456',
    'stripe'
);

// Cancel subscription
await subscriptionService.cancel(subscription.id);
```

### UsageTracker

```typescript
// Track usage
await usageTracker.track('user-123', 'ai_messages', 1);

// Get usage stats
const stats = await usageTracker.getUsage('user-123', 'ai_messages');
console.log(`Used: ${stats.used}/${stats.limit}`);

// Check if within limit
const allowed = await usageTracker.checkLimit('user-123', 'web_searches');

// Enforce limit (throws error if exceeded)
try {
    await usageTracker.enforceLimit('user-123', 'ai_messages');
} catch (error) {
    if (error.name === 'UsageLimitError') {
        console.log(`Upgrade to ${error.suggestedTier}`);
    }
}

// Get usage summary
const summary = await usageTracker.getUsageSummary('user-123');
```

### Middleware

```typescript
import {
    createUsageMiddleware,
    createQuotaEnforcementMiddleware,
    createUsageTrackingMiddleware,
    getUserIdExtractors,
} from '@elizaos/monetization';

// Combined: enforce quota then track usage
app.post(
    '/api/message',
    ...createUsageMiddleware(usageTracker, {
        feature: 'ai_messages',
        getUserId: getUserIdExtractors.fromAuth,
    })
);

// Quota enforcement only
app.post(
    '/api/search',
    createQuotaEnforcementMiddleware(usageTracker, {
        feature: 'web_searches',
        getUserId: getUserIdExtractors.fromBody('userId'),
    })
);

// Usage tracking only (no enforcement)
app.post(
    '/api/analytics',
    createUsageTrackingMiddleware(usageTracker, {
        feature: 'api_calls',
        getUserId: getUserIdExtractors.fromHeader('x-user-id'),
        count: 1,
    })
);
```

### Tier Utilities

```typescript
import {
    getTierLimits,
    tierHasFeature,
    compareTiers,
    getNextTier,
} from '@elizaos/monetization';

// Get tier limits
const limits = getTierLimits('PREMIUM');
console.log(limits.features.messagesPerMonth); // 'unlimited'

// Check if tier has feature
const hasWebSearch = tierHasFeature('BASIC', 'webSearchesPerMonth'); // true

// Compare tiers
const comparison = compareTiers('BASIC', 'PREMIUM');
console.log(comparison.newFeatures); // ['Advanced AI Models', ...]
console.log(comparison.priceDifference); // 15.00

// Get next tier
const next = getNextTier('BASIC'); // 'PREMIUM'
```

## Database Schema

The package includes a comprehensive SQLite schema with:

- **subscriptions** - User subscriptions
- **usage_tracking** - Feature usage tracking
- **payment_transactions** - Payment history
- **subscription_history** - Audit trail
- **feature_gates** - Dynamic feature configuration
- **promotional_codes** - Discount codes
- **referrals** - Referral tracking

See `schema.sql` for full details.

## Error Handling

```typescript
import { SubscriptionError, UsageLimitError } from '@elizaos/monetization';

try {
    await usageTracker.enforceLimit('user-123', 'ai_messages');
} catch (error) {
    if (error instanceof UsageLimitError) {
        // Handle quota exceeded
        res.status(429).json({
            error: error.message,
            feature: error.feature,
            limit: error.limit,
            used: error.used,
            suggestedTier: error.suggestedTier,
        });
    } else if (error instanceof SubscriptionError) {
        // Handle subscription error
        res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
        });
    }
}
```

## Scheduled Jobs

```typescript
import { registerUsageResetJobs, UsageResetJobRunner } from '@elizaos/monetization';

// Auto-register jobs (runs automatically)
registerUsageResetJobs(usageTracker, subscriptionService);

// Manual job runner (for testing)
const jobRunner = new UsageResetJobRunner(usageTracker, subscriptionService);
await jobRunner.runDailyReset();
await jobRunner.runMonthlyReset();
await jobRunner.checkExpired();
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
    Subscription,
    SubscriptionTier,
    UsageStats,
    UsageSummary,
    TierLimits,
    PaymentTransaction,
} from '@elizaos/monetization';
```

## License

MIT

## Contributing

Contributions welcome! Please see the main Eliza repository for contribution guidelines.
