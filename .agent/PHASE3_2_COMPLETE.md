# Phase 3.2 Complete: Usage Tracking System

## ✅ Status: COMPLETE

**Date**: 2025-11-21
**Phase**: 3.2 - Usage Tracking System

## Deliverables

### ✅ 1. Usage Tracker Service (`UsageTracker.ts`)

Complete usage tracking service with:

#### Core Operations
- **`track()`** - Track feature usage with automatic period management
- **`getUsage()`** - Get usage stats for a specific feature
- **`getUsageSummary()`** - Get comprehensive usage across all features
- **`checkLimit()`** - Check if user is within quota
- **`enforceLimit()`** - Enforce quota (throws error if exceeded)
- **`resetUsage()`** - Reset usage for user or feature

#### Advanced Features
- **Period Management**: Automatic monthly/daily period calculation
- **Default Subscriptions**: Auto-creates FREE subscription if none exists
- **Usage Analytics**: Get usage metrics and top users
- **Flexible Limits**: Supports numeric limits and 'unlimited'
- **Suggested Upgrades**: Recommends tier when limit exceeded

#### Usage Periods
- **AI Messages**: Monthly reset (1st of month)
- **Web Searches**: Monthly reset (1st of month)
- **API Calls**: Daily reset (midnight)
- **Advanced Models**: No reset (boolean feature)

### ✅ 2. Usage Tracking Middleware (`usageTracking.ts`)

Express middleware for automatic usage tracking:

#### Middleware Types
1. **`createUsageTrackingMiddleware()`** - Track usage after response
2. **`createQuotaEnforcementMiddleware()`** - Enforce limits before request
3. **`createUsageMiddleware()`** - Combined enforcement + tracking

#### Helper Utilities
- **`getUserIdExtractors`** - Extract user ID from various sources:
  - `fromBody()` - From request body
  - `fromParams()` - From URL params
  - `fromQuery()` - From query string
  - `fromAuth()` - From authenticated user
  - `fromHeader()` - From custom header
  - `tryMultiple()` - Try multiple sources

- **`getCountExtractors`** - Extract usage count:
  - `fixed()` - Fixed count
  - `fromBody()` - From request body field
  - `fromArrayLength()` - Count array items

#### Error Responses
- **429 Too Many Requests** - When quota exceeded
- **401 Unauthorized** - When user ID missing
- **500 Internal Server Error** - On quota check failure

### ✅ 3. Scheduled Jobs (`usageReset.ts`)

Automated jobs for usage management:

#### Registered Jobs
1. **Daily Reset** (Midnight)
   - Reset API call quotas

2. **Monthly Reset** (1st of month, Midnight)
   - Reset AI message quotas
   - Reset web search quotas

3. **Expiration Check** (Daily, 1 AM)
   - Find expired subscriptions
   - Update subscription status
   - Log expiration events

4. **Cleanup** (Monthly, 2 AM)
   - Remove old usage records (6+ months)

#### Scheduler Support
- **Simple Scheduler**: Built-in setTimeout/setInterval based
- **Cron Scheduler**: Support for node-cron or similar
- **Manual Runner**: `UsageResetJobRunner` for testing

### ✅ 4. Documentation (`README.md`)

Comprehensive package documentation with:
- Quick start guide
- API reference
- Usage examples
- Error handling
- TypeScript support
- Subscription tier comparison

## Files Created

```
packages/monetization/src/
├── services/
│   └── UsageTracker.ts                # 400+ lines - Usage tracking service
├── middleware/
│   └── usageTracking.ts               # 200+ lines - Express middleware
└── jobs/
    └── usageReset.ts                  # 200+ lines - Scheduled jobs

packages/monetization/
└── README.md                          # Package documentation
```

## Usage Examples

### Basic Usage Tracking

```typescript
import { UsageTracker } from '@elizaos/monetization';

const usageTracker = new UsageTracker(databaseAdapter);

// Track usage
await usageTracker.track('user-123', 'ai_messages', 1);

// Check quota
const stats = await usageTracker.getUsage('user-123', 'ai_messages');
console.log(`Used: ${stats.used}/${stats.limit}`);

// Enforce limit
try {
    await usageTracker.enforceLimit('user-123', 'ai_messages');
    // Proceed with request
} catch (error) {
    // Quota exceeded - show upgrade prompt
    console.log(`Upgrade to ${error.suggestedTier}`);
}
```

### Express Middleware

```typescript
import {
    createUsageMiddleware,
    getUserIdExtractors,
} from '@elizaos/monetization';

// Track AI messages
app.post(
    '/api/:agentId/message',
    ...createUsageMiddleware(usageTracker, {
        feature: 'ai_messages',
        getUserId: getUserIdExtractors.fromBody('userId'),
    }),
    async (req, res) => {
        // Handle message - quota already enforced
        const response = await processMessage(req.body);
        res.json(response);
    }
);
```

### Scheduled Jobs

```typescript
import { registerUsageResetJobs } from '@elizaos/monetization';

// Auto-register all jobs
registerUsageResetJobs(usageTracker, subscriptionService);

// Jobs will run automatically:
// - Daily at midnight: Reset API calls
// - Monthly on 1st: Reset messages & searches
// - Daily at 1 AM: Check expired subscriptions
```

## Key Features

### 1. Automatic Period Management
- Monthly periods for messages and searches
- Daily periods for API calls
- Automatic period calculation based on current date
- No manual period management required

### 2. Flexible Quota Enforcement
- Numeric limits (e.g., 50 messages/month)
- Unlimited access for premium tiers
- Boolean features (enabled/disabled)
- Graceful degradation on errors

### 3. Usage Analytics
- Total usage by feature
- Unique user counts
- Average usage per user
- Top users by feature

### 4. Error Handling
- Custom error types (`UsageLimitError`)
- Suggested upgrade tiers
- User-friendly error messages
- HTTP status codes (429, 401, 500)

### 5. Middleware Flexibility
- Multiple user ID extraction methods
- Custom count extractors
- Skip conditions for special cases
- Tracks only successful responses (2xx)

## Integration Points

### With DirectClient

```typescript
// In packages/clients/direct/src/index.ts

import { createUsageMiddleware, getUserIdExtractors } from '@elizaos/monetization';

// Add to message endpoint
router.post(
    '/:agentId/message',
    ...createUsageMiddleware(usageTracker, {
        feature: 'ai_messages',
        getUserId: getUserIdExtractors.fromBody('userId'),
    }),
    async (req, res) => {
        // Existing message handler
    }
);
```

### With Agent Server

```typescript
// In agent/src/index.ts

import { registerUsageResetJobs } from '@elizaos/monetization';

// Register jobs on server start
registerUsageResetJobs(usageTracker, subscriptionService);
```

## Database Queries

### Efficient Indexing
All queries use indexed columns:
- `user_id` - User lookups
- `feature` - Feature-specific queries
- `period_start`, `period_end` - Period-based queries
- `subscription_id` - Subscription joins

### Query Examples

```sql
-- Get current usage
SELECT * FROM usage_tracking
WHERE user_id = ? AND feature = ?
AND period_start = ? AND period_end = ?

-- Reset expired periods
DELETE FROM usage_tracking
WHERE period_end < ?

-- Get top users
SELECT user_id, SUM(count) as total_usage
FROM usage_tracking
WHERE feature = ? AND period_start = ? AND period_end = ?
GROUP BY user_id
ORDER BY total_usage DESC
LIMIT 10
```

## Testing Checklist

### Unit Tests (To Do)
- [ ] Track usage increments counter
- [ ] Get usage returns correct stats
- [ ] Check limit validates correctly
- [ ] Enforce limit throws on exceeded
- [ ] Period calculation is accurate
- [ ] Reset usage clears records

### Integration Tests (To Do)
- [ ] Middleware enforces quotas
- [ ] Middleware tracks usage
- [ ] Scheduled jobs run correctly
- [ ] Usage summary aggregates properly
- [ ] Analytics queries return correct data

### Manual Tests (To Do)
- [ ] Create user with FREE tier
- [ ] Send 50 messages (should succeed)
- [ ] Send 51st message (should fail with 429)
- [ ] Upgrade to BASIC tier
- [ ] Send more messages (should succeed)
- [ ] Check usage dashboard shows correct stats

## Performance Considerations

### Optimizations
1. **Indexed Queries**: All lookups use database indexes
2. **Batch Operations**: Reset jobs process in batches
3. **Async Tracking**: Usage tracked after response sent
4. **Cached Subscriptions**: Subscription lookups cached per request
5. **Efficient Periods**: Period calculations use Date objects

### Scalability
- **Concurrent Requests**: Thread-safe usage tracking
- **High Volume**: Efficient SQL queries with indexes
- **Large Datasets**: Automatic cleanup of old records
- **Multi-Tenant**: Isolated usage per user/family

## Error Handling

### UsageLimitError
```typescript
{
    name: 'UsageLimitError',
    message: 'You've reached your AI messages limit...',
    feature: 'ai_messages',
    limit: 50,
    used: 50,
    suggestedTier: 'BASIC',
    statusCode: 429
}
```

### HTTP Response
```json
{
    "error": "You've reached your AI messages limit of 50 for this period. Upgrade to BASIC for more.",
    "code": "USAGE_LIMIT_EXCEEDED",
    "feature": "ai_messages",
    "limit": 50,
    "used": 50,
    "suggestedTier": "BASIC",
    "upgradeUrl": "/subscription/upgrade"
}
```

## Next Steps

### ✅ Phase 3.2 Complete
- [x] UsageTracker service implemented
- [x] Usage middleware created
- [x] Scheduled jobs registered
- [x] Documentation written
- [x] Helper utilities built

### 🔜 Phase 3.3: Feature Gating
- [ ] Create `FeatureGate` service
- [ ] Implement feature access control
- [ ] Add feature-specific middleware
- [ ] Build feature toggle UI

### 🔜 Phase 3.4: Hedera Payment Integration
- [ ] Create `HederaPayment` service
- [ ] Implement purchase flow
- [ ] Add payment webhooks
- [ ] Handle subscription activation

### 🔜 Phase 3.5: Stripe Payment Integration
- [ ] Create `StripePayment` service
- [ ] Implement Stripe Checkout
- [ ] Add Stripe webhooks
- [ ] Handle subscription lifecycle

## Summary

**Phase 3.2 is COMPLETE** with a robust usage tracking system:

1. ✅ **UsageTracker Service** - Full-featured usage tracking
2. ✅ **Express Middleware** - Automatic quota enforcement
3. ✅ **Scheduled Jobs** - Automated usage resets
4. ✅ **Comprehensive Documentation** - API reference and examples
5. ✅ **Helper Utilities** - Flexible extractors and helpers

The system is ready for Phase 3.3: Feature Gating! 🚀

---

**Next**: Implement server-side feature gating to control access to premium features.
