-- ============================================================================
-- MONETIZATION DATABASE SCHEMA
-- ============================================================================
-- This schema extends the existing FamilyXYZ database with monetization tables
-- for subscription management, usage tracking, and payment processing.
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores subscription information for users and families
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
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
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_family ON subscriptions(family_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- USAGE TRACKING TABLE
-- ============================================================================
-- Tracks feature usage per user/family for quota enforcement
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    family_id TEXT,
    subscription_id TEXT NOT NULL,
    feature TEXT NOT NULL CHECK(feature IN ('ai_messages', 'web_searches', 'advanced_models', 'api_calls')),
    count INTEGER DEFAULT 0,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_subscription ON usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Unique constraint to prevent duplicate usage records for same user/feature/period
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_unique
ON usage_tracking(user_id, feature, period_start, period_end);

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================================================
-- Records all payment transactions for audit and reconciliation
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL CHECK(payment_method IN ('hedera', 'stripe', 'free')),
    payment_id TEXT NOT NULL, -- External payment ID (Stripe/Hedera transaction ID)
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata TEXT, -- JSON string for additional payment data
    created_at INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- ============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================================================
-- Tracks subscription changes for analytics and customer support
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'expired')),
    from_tier TEXT CHECK(from_tier IN ('FREE', 'BASIC', 'PREMIUM', 'FAMILY')),
    to_tier TEXT CHECK(to_tier IN ('FREE', 'BASIC', 'PREMIUM', 'FAMILY')),
    reason TEXT,
    metadata TEXT, -- JSON string for additional context
    created_at INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- ============================================================================
-- FEATURE GATES TABLE
-- ============================================================================
-- Defines which features are available to which tiers
-- This allows for dynamic feature gating without code changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_gates (
    id TEXT PRIMARY KEY,
    feature_key TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    description TEXT,
    free_tier_enabled BOOLEAN DEFAULT FALSE,
    basic_tier_enabled BOOLEAN DEFAULT FALSE,
    premium_tier_enabled BOOLEAN DEFAULT TRUE,
    family_tier_enabled BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_feature_gates_key ON feature_gates(feature_key);

-- Insert default feature gates
INSERT OR IGNORE INTO feature_gates (id, feature_key, feature_name, description, free_tier_enabled, basic_tier_enabled, premium_tier_enabled, family_tier_enabled, created_at, updated_at)
VALUES
    ('fg_web_search', 'web_search', 'Web Search', 'Enable AI web search capabilities', 0, 1, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
    ('fg_advanced_models', 'advanced_models', 'Advanced AI Models', 'Access to advanced AI models', 0, 0, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
    ('fg_custom_personalities', 'custom_personalities', 'Custom Personalities', 'Create custom AI personalities', 0, 0, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
    ('fg_api_access', 'api_access', 'API Access', 'Programmatic API access', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
    ('fg_analytics', 'analytics', 'Analytics Dashboard', 'Family analytics and insights', 0, 0, 1, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================================================
-- PROMOTIONAL CODES TABLE
-- ============================================================================
-- Stores promotional codes for discounts and trials
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotional_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed_amount', 'trial_extension')),
    discount_value REAL NOT NULL,
    applicable_tiers TEXT, -- JSON array of tiers
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from INTEGER NOT NULL,
    valid_until INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_active ON promotional_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_codes_valid ON promotional_codes(valid_from, valid_until);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
-- Tracks referrals for growth and rewards
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_user_id TEXT NOT NULL,
    referred_user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'rewarded')),
    reward_type TEXT CHECK(reward_type IN ('credit', 'discount', 'free_month')),
    reward_value REAL,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (referrer_user_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Active subscriptions by tier
CREATE VIEW IF NOT EXISTS v_active_subscriptions_by_tier AS
SELECT
    tier,
    COUNT(*) as count,
    SUM(CASE
        WHEN tier = 'FREE' THEN 0
        WHEN tier = 'BASIC' THEN 9.99
        WHEN tier = 'PREMIUM' THEN 24.99
        WHEN tier = 'FAMILY' THEN 49.99
    END) as monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY tier;

-- Monthly revenue
CREATE VIEW IF NOT EXISTS v_monthly_revenue AS
SELECT
    strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
    SUM(amount) as revenue,
    COUNT(*) as transaction_count
FROM payment_transactions
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;

-- User subscription status
CREATE VIEW IF NOT EXISTS v_user_subscription_status AS
SELECT
    u.id as user_id,
    u.username,
    COALESCE(s.tier, 'FREE') as tier,
    COALESCE(s.status, 'none') as status,
    s.current_period_end,
    s.cancel_at_period_end
FROM accounts u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update subscription updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_subscription_timestamp
AFTER UPDATE ON subscriptions
BEGIN
    UPDATE subscriptions SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Update usage_tracking updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_usage_tracking_timestamp
AFTER UPDATE ON usage_tracking
BEGIN
    UPDATE usage_tracking SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Log subscription changes to history
CREATE TRIGGER IF NOT EXISTS log_subscription_changes
AFTER UPDATE ON subscriptions
WHEN OLD.tier != NEW.tier OR OLD.status != NEW.status
BEGIN
    INSERT INTO subscription_history (id, subscription_id, user_id, action, from_tier, to_tier, created_at)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.id,
        NEW.user_id,
        CASE
            WHEN OLD.tier != NEW.tier AND NEW.tier > OLD.tier THEN 'upgraded'
            WHEN OLD.tier != NEW.tier AND NEW.tier < OLD.tier THEN 'downgraded'
            WHEN OLD.status = 'active' AND NEW.status = 'cancelled' THEN 'cancelled'
            WHEN OLD.status != 'active' AND NEW.status = 'active' THEN 'renewed'
            WHEN NEW.status = 'expired' THEN 'expired'
            ELSE 'updated'
        END,
        OLD.tier,
        NEW.tier,
        strftime('%s', 'now')
    );
END;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- This section would be populated by the application on first run
-- or through a separate migration script

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All timestamps are stored as Unix timestamps (seconds since epoch)
-- 2. Foreign keys use CASCADE DELETE to maintain referential integrity
-- 3. Indexes are created for common query patterns
-- 4. Views provide convenient access to analytics data
-- 5. Triggers maintain data consistency and audit trails
-- ============================================================================
