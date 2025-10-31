// Application constants - ORGANISED principle

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.MODE === 'production'
      ? `http://157.180.36.156:3004`
      : `http://localhost:3000`
  ),
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
} as const;

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  FAMILY_STATS: 5000,
  FAMILY_HISTORY: 10000,
  AGENTS: 30000,
} as const;

// Cache times (in milliseconds)
export const CACHE_TIMES = {
  STALE_TIME: 1000,
  CACHE_TIME: 30000,
  LONG_CACHE_TIME: 300000,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  CHART_HEIGHT: 320,
  CARD_MIN_HEIGHT: 200,
  ANIMATION_DURATION: 200,
} as const;

// Family metrics thresholds
export const HEALTH_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 20,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  FAMILY_CONSENT: "familyConsent",
  CONSENT_SCOPES: "familyConsentScopes",
  USER_PREFERENCES: "userPreferences",
} as const;