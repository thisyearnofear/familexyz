# AI Settings & Monetization Architecture

## Overview
This document outlines the architecture for user-controlled AI settings with future monetization capabilities, designed according to our core principles: ENHANCEMENT FIRST, DRY, CLEAN, MODULAR, and PERFORMANT.

## Current Implementation Status ✅

### 1. **Core Type Definitions** (`packages/core/src/types.ts`)
```typescript
veniceParameters?: {
    include_venice_system_prompt?: boolean;
    enable_web_search?: "auto" | "on" | "off";
}
```

### 2. **Backend Integration** (`packages/core/src/generation.ts`)
- Venice API calls now inject `venice_parameters` from character settings
- Custom fetch function intercepts requests and adds parameters to request body

### 3. **Frontend Settings UI** (`client/src/components/dashboard/tabs/SettingsTab.tsx`)
- Added "AI Capabilities" section with "Enable Web Search" toggle
- Marked as "Premium" feature for future monetization
- Settings persist to localStorage under `familyProfile.preferences.enableWebSearch`

### 4. **Runtime Integration** (`client/src/components/ChatInterface.tsx`)
- Chat interface reads settings from localStorage
- Passes Venice parameters to backend via API client

### 5. **API Layer** (`client/src/lib/api.ts`)
- Updated `sendMessage` to accept optional settings parameter
- Settings serialized and sent as `veniceParameters` in FormData

## Architecture Principles Applied

### ✅ ENHANCEMENT FIRST
- Extended existing `SettingsTab` component rather than creating new settings UI
- Enhanced existing `Character.settings` type rather than creating parallel config
- Augmented existing API client rather than creating new endpoints

### ✅ DRY (Single Source of Truth)
- Settings stored once in localStorage (`familyProfile.preferences`)
- Type definitions centralized in `packages/core/src/types.ts`
- Venice parameter injection happens in one place (`generation.ts`)

### ✅ CLEAN (Separation of Concerns)
```
Frontend (UI)          → Settings UI controls
├─ SettingsTab.tsx     → User toggles/preferences
└─ ChatInterface.tsx   → Reads settings, passes to API

API Layer              → Data transport
└─ api.ts              → Serializes settings to backend

Backend (Logic)        → Feature execution
├─ types.ts            → Type definitions
└─ generation.ts       → Venice API integration
```

### ✅ MODULAR
- Settings can be extended without modifying core chat logic
- New AI capabilities can be added by:
  1. Adding type to `veniceParameters`
  2. Adding UI toggle to `SettingsTab`
  3. Reading in `ChatInterface`
- No tight coupling between components

### ✅ PERFORMANT
- Settings read from localStorage (fast, synchronous)
- No API calls to fetch settings (reduces latency)
- Settings only sent when they differ from defaults (bandwidth optimization)

## Future Monetization Architecture

### Tier Structure (Scaffolded, Not Implemented)

```typescript
// Future: packages/core/src/types.ts
enum FeatureTier {
    FREE = "free",
    BASIC = "basic",      // $9.99/month
    PREMIUM = "premium",  // $19.99/month
    FAMILY = "family"     // $29.99/month
}

interface AICapability {
    id: string;
    name: string;
    description: string;
    tier: FeatureTier;
    enabled: boolean;
    costPerUse?: number;  // in HBAR or USD cents
}

interface UserSubscription {
    tier: FeatureTier;
    expiresAt: Date;
    capabilities: AICapability[];
    usage: {
        [capabilityId: string]: {
            count: number;
            lastUsed: Date;
            costAccrued: number;
        }
    }
}
```

### Proposed Feature Tiers

#### **FREE Tier**
- Basic chat with agents
- Standard response quality
- No web search
- Community support

#### **BASIC Tier** ($9.99/month)
- ✅ Web Search enabled
- Higher rate limits
- Priority response times
- Email support

#### **PREMIUM Tier** ($19.99/month)
- All BASIC features
- Advanced model selection (GPT-4, Claude Opus)
- Image generation
- Voice synthesis
- Custom agent personalities
- API access

#### **FAMILY Tier** ($29.99/month)
- All PREMIUM features
- Multi-family support (up to 5 families)
- Advanced analytics
- Custom integrations
- Priority support
- Blockchain rewards multiplier (2x)

### Implementation Roadmap

#### Phase 1: Settings Infrastructure ✅ (COMPLETE)
- [x] Add veniceParameters to type system
- [x] Implement backend parameter injection
- [x] Create frontend settings UI
- [x] Wire up ChatInterface to read settings
- [x] Update API layer for settings transport

#### Phase 2: Usage Tracking (Next)
```typescript
// Future: packages/core/src/usage.ts
interface UsageEvent {
    userId: string;
    capability: string;
    timestamp: Date;
    cost: number;
    metadata?: Record<string, any>;
}

class UsageTracker {
    async track(event: UsageEvent): Promise<void>;
    async getUsage(userId: string, period: DateRange): Promise<UsageEvent[]>;
    async calculateCost(userId: string, period: DateRange): Promise<number>;
}
```

#### Phase 3: Subscription Management
```typescript
// Future: packages/core/src/subscription.ts
class SubscriptionManager {
    async getSubscription(userId: string): Promise<UserSubscription>;
    async updateSubscription(userId: string, tier: FeatureTier): Promise<void>;
    async checkCapability(userId: string, capabilityId: string): Promise<boolean>;
}
```

#### Phase 4: Payment Integration
- Hedera HBAR payments (already scaffolded in SettingsTab)
- Stripe for fiat payments
- Subscription billing automation

#### Phase 5: Feature Gating
```typescript
// Future: Middleware in generation.ts
async function checkFeatureAccess(
    userId: string,
    capability: string
): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await subscriptionManager.getSubscription(userId);
    const feature = subscription.capabilities.find(c => c.id === capability);

    if (!feature) {
        return { allowed: false, reason: "Feature not available in your plan" };
    }

    if (!feature.enabled) {
        return { allowed: false, reason: "Feature disabled" };
    }

    // Check usage limits
    const usage = subscription.usage[capability];
    if (usage && feature.usageLimit && usage.count >= feature.usageLimit) {
        return { allowed: false, reason: "Usage limit exceeded" };
    }

    return { allowed: true };
}
```

## Data Flow

### Current Flow (Settings)
```
User toggles "Enable Web Search" in SettingsTab
    ↓
Saved to localStorage: familyProfile.preferences.enableWebSearch = true
    ↓
ChatInterface reads setting on message send
    ↓
API client serializes: { enable_web_search: "auto" }
    ↓
Backend receives veniceParameters in FormData
    ↓
generation.ts injects into Venice API request body
    ↓
Venice API uses web search to enhance response
```

### Future Flow (with Monetization)
```
User toggles "Enable Web Search" in SettingsTab
    ↓
Frontend checks: subscriptionManager.checkCapability(userId, "web_search")
    ↓
If allowed: Save to localStorage + Update backend preference
If denied: Show upgrade modal with tier comparison
    ↓
On message send: Backend validates capability again
    ↓
Track usage: usageTracker.track({ capability: "web_search", cost: 0.01 })
    ↓
Execute feature: Venice API with web search
    ↓
Update usage counters for billing
```

## Database Schema (Future)

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    hedera_account_id VARCHAR(100)
);
```

### Capabilities Table
```sql
CREATE TABLE capabilities (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    tier VARCHAR(50),
    cost_per_use DECIMAL(10, 6),
    usage_limit INTEGER
);
```

### Usage Events Table
```sql
CREATE TABLE usage_events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    capability_id VARCHAR(100) REFERENCES capabilities(id),
    timestamp TIMESTAMP,
    cost DECIMAL(10, 6),
    metadata JSONB
);

CREATE INDEX idx_usage_user_time ON usage_events(user_id, timestamp DESC);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    tier VARCHAR(50),
    status VARCHAR(50), -- active, cancelled, expired
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    payment_method VARCHAR(50), -- hbar, stripe
    payment_id VARCHAR(255)
);
```

## Security Considerations

### 1. **Client-Side Validation**
- UI prevents toggling premium features without subscription
- Visual indicators (badges) show feature tier requirements

### 2. **Server-Side Enforcement**
- All capability checks happen server-side
- Client settings are advisory only
- Backend validates subscription status before executing features

### 3. **Rate Limiting**
```typescript
// Future: Rate limiting per tier
const RATE_LIMITS = {
    [FeatureTier.FREE]: { requests: 100, window: '1h' },
    [FeatureTier.BASIC]: { requests: 500, window: '1h' },
    [FeatureTier.PREMIUM]: { requests: 2000, window: '1h' },
    [FeatureTier.FAMILY]: { requests: 5000, window: '1h' },
};
```

### 4. **Audit Logging**
- All capability usage logged with timestamps
- Billing calculations auditable
- Fraud detection via usage pattern analysis

## Cost Optimization

### 1. **Caching Strategy**
```typescript
// Cache web search results to reduce API costs
interface CachedSearchResult {
    query: string;
    results: any;
    timestamp: Date;
    ttl: number; // seconds
}

// Cache common queries for 1 hour
const SEARCH_CACHE_TTL = 3600;
```

### 2. **Smart Feature Usage**
```typescript
// Only enable web search when query indicates need
function shouldUseWebSearch(query: string): boolean {
    const webSearchIndicators = [
        'latest', 'recent', 'current', 'today',
        'news', 'weather', 'price', 'stock'
    ];
    return webSearchIndicators.some(indicator =>
        query.toLowerCase().includes(indicator)
    );
}
```

### 3. **Batch Processing**
- Aggregate multiple requests where possible
- Use cheaper models for simple queries
- Reserve premium models for complex tasks

## Migration Path

### Step 1: Add Subscription Backend (Week 1-2)
- Implement `SubscriptionManager`
- Add database tables
- Create admin panel for subscription management

### Step 2: Integrate Payment Processing (Week 3-4)
- Hedera HBAR payment flow
- Stripe integration for credit cards
- Webhook handlers for payment events

### Step 3: Feature Gating (Week 5-6)
- Add middleware to check capabilities
- Update UI to show tier badges
- Implement upgrade flows

### Step 4: Usage Tracking & Billing (Week 7-8)
- Implement `UsageTracker`
- Create billing calculation engine
- Build usage dashboard for users

### Step 5: Analytics & Optimization (Week 9-10)
- Add analytics for feature usage
- Optimize costs based on usage patterns
- A/B test pricing tiers

## Monitoring & Metrics

### Key Metrics to Track
1. **Feature Adoption**: % of users enabling each capability
2. **Conversion Rate**: Free → Paid tier conversion
3. **Churn Rate**: Subscription cancellations
4. **Cost per Feature**: Actual API costs vs. revenue
5. **Usage Patterns**: Peak times, popular features
6. **Revenue Metrics**: MRR, ARR, LTV

### Alerting
- Cost overruns (API costs > revenue)
- Unusual usage patterns (potential abuse)
- Payment failures
- Subscription expirations

## Testing Strategy

### Unit Tests
```typescript
describe('SubscriptionManager', () => {
    it('should check capability access correctly', async () => {
        const allowed = await subscriptionManager.checkCapability(
            'user-123',
            'web_search'
        );
        expect(allowed).toBe(true);
    });
});
```

### Integration Tests
```typescript
describe('Feature Gating', () => {
    it('should block premium features for free users', async () => {
        const response = await sendMessageWithWebSearch(freeUserId);
        expect(response.error).toBe('Upgrade required');
    });
});
```

### Load Tests
- Simulate 1000 concurrent users
- Test rate limiting effectiveness
- Verify billing calculations under load

## Conclusion

This architecture provides a **cohesive, performant, and scalable** foundation for user-controlled AI settings with built-in monetization capabilities. The implementation follows all core principles:

- ✅ **ENHANCEMENT FIRST**: Extended existing components
- ✅ **DRY**: Single source of truth for settings
- ✅ **CLEAN**: Clear separation of concerns
- ✅ **MODULAR**: Easy to extend with new capabilities
- ✅ **PERFORMANT**: Optimized data flow and caching
- ✅ **ORGANIZED**: Predictable structure with domain-driven design

The current implementation is **production-ready** for the settings infrastructure, and the monetization layer can be added incrementally without disrupting existing functionality.
