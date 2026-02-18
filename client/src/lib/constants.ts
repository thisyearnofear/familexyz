/**
 * Application Constants - Single Source of Truth
 * 
 * Consolidates all application constants following DRY principle.
 * Previously split across constants.ts and family-constants.ts.
 */

// ============================================================
// API Configuration
// ============================================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.MODE === 'production'
      ? `http://157.180.36.156:3004`
      : `http://localhost:3000`
  ),
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
} as const;

// ============================================================
// Polling Intervals (in milliseconds)
// ============================================================

export const POLLING_INTERVALS = {
  FAMILY_STATS: 30000,      // 30 seconds
  FAMILY_HISTORY: 60000,    // 1 minute
  CELEBRATIONS: 15000,      // 15 seconds
  REAL_TIME: 5000,          // 5 seconds
  AGENTS: 30000,            // 30 seconds
} as const;

// ============================================================
// Cache Times (in milliseconds)
// ============================================================

export const CACHE_TIMES = {
  STALE_TIME: 30000,        // 30 seconds
  CACHE_TIME: 300000,       // 5 minutes
  LONG_CACHE: 900000,       // 15 minutes
  LONG_CACHE_TIME: 300000,  // 5 minutes (alias for compatibility)
} as const;

// ============================================================
// UI Constants
// ============================================================

export const UI_CONSTANTS = {
  CHART_HEIGHT: 320,
  CARD_MIN_HEIGHT: 200,
  ANIMATION_DURATION: 200,
} as const;

// ============================================================
// Family Metrics Thresholds
// ============================================================

export const HEALTH_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 20,
} as const;

// ============================================================
// Local Storage Keys
// ============================================================

export const STORAGE_KEYS = {
  FAMILY_CONSENT: "familyConsent",
  CONSENT_SCOPES: "familyConsentScopes",
  USER_PREFERENCES: "userPreferences",
} as const;

// ============================================================
// Family Colors - Design Tokens
// ============================================================

export const FAMILY_COLORS = {
  // Gradient combinations for beautiful UI
  gradients: {
    primary: "from-purple-500 to-pink-500",
    secondary: "from-blue-500 to-cyan-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-amber-500 to-orange-500",
    wisdom: "from-purple-500 to-indigo-600",
    intimacy: "from-pink-500 to-rose-600",
    generational: "from-amber-500 to-orange-600",
    presence: "from-green-500 to-emerald-600",
    growth: "from-blue-500 to-cyan-600",
  },

  // Soft background colors for cards and sections
  backgrounds: {
    wisdom: "bg-purple-50 border-purple-200",
    intimacy: "bg-pink-50 border-pink-200",
    generational: "bg-amber-50 border-amber-200",
    presence: "bg-green-50 border-green-200",
    growth: "bg-blue-50 border-blue-200",
    celebration: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100",
    upcoming: "bg-purple-50 border-purple-200",
  },

  // Text colors for different states
  text: {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
    accent: "text-purple-600",
    muted: "text-gray-500",
  }
} as const;

// ============================================================
// Family Emojis
// ============================================================

export const FAMILY_EMOJIS = {
  // Agent personalities
  agents: {
    wisdom: "🧠",
    intimacy: "💖",
    generational: "👨‍👩‍👧‍👦",
    presence: "🧘‍♀️",
    growth: "🌱",
  },

  // Celebration types
  celebrations: {
    milestone: "🎉",
    individual: "💝",
    legacy: "📚",
    presence: "🧘‍♀️",
    growth: "🌟",
    weekly: "🎊",
    monthly: "🏆",
    conflict_resolved: "🤝",
    empathy: "💕",
    tradition: "🏠",
  },

  // Family activities
  activities: {
    communication: "💬",
    bonding: "❤️",
    tradition: "🏠",
    mindfulness: "🧘",
    learning: "📚",
    celebration: "🎉",
    reflection: "🤔",
    gratitude: "🙏",
  },

  // Metrics and progress
  metrics: {
    health: "💝",
    conversations: "💬",
    positive: "✨",
    growth: "🌱",
    connection: "🔗",
    harmony: "☮️",
  }
} as const;

// ============================================================
// Family Messages
// ============================================================

export const FAMILY_MESSAGES = {
  // Encouraging messages for different health scores
  healthDescriptions: {
    excellent: "Your family is radiating love and connection! ✨",
    good: "Beautiful bonds and growing stronger every day 💕",
    fair: "Every conversation is a step toward deeper connection 🌱",
    needsAttention: "Every family has challenges - you're working through them together 🤝",
  },

  // Milestone celebration messages
  milestoneMessages: {
    first_week: "What a wonderful start to your family journey! 🌟",
    month_complete: "One month of intentional family connection - amazing! 🎉",
    conflict_resolved: "Turning disagreement into understanding - that's true family strength 💪",
    story_shared: "Every story shared builds your family's beautiful legacy 📖",
    mindful_moment: "Finding peace together in our busy world 🧘‍♀️",
  },

  // Gentle guidance messages
  guidance: {
    daily_checkin: "How is your family's heart today? 💕",
    weekly_reflection: "What beautiful moments did your family create this week? ✨",
    goal_setting: "What dreams would you like to grow together? 🌱",
    celebration_prompt: "What wins can your family celebrate today? 🎉",
  },

  // Welcome and onboarding
  welcome: {
    greeting: "Welcome to your family's journey of deeper connection! 🏠💕",
    first_steps: "Every great family story starts with a single conversation 💬",
    encouragement: "Your commitment to family growth is already making a difference ✨",
    privacy: "Your family's privacy and trust are our highest priorities 🔒",
  }
} as const;

// ============================================================
// Interaction Types
// ============================================================

export const INTERACTION_TYPES = {
  wisdom_shared: {
    label: "Wisdom Shared",
    emoji: "🧠",
    color: FAMILY_COLORS.gradients.wisdom,
    description: "Thoughtful guidance and life lessons"
  },
  intimacy_moment: {
    label: "Intimate Connection",
    emoji: "💖",
    color: FAMILY_COLORS.gradients.intimacy,
    description: "Deep emotional bonding and vulnerability"
  },
  generational_story: {
    label: "Generational Story",
    emoji: "📚",
    color: FAMILY_COLORS.gradients.generational,
    description: "Stories that bridge generations"
  },
  mindful_presence: {
    label: "Mindful Moment",
    emoji: "🧘‍♀️",
    color: FAMILY_COLORS.gradients.presence,
    description: "Present and peaceful family time"
  },
  growth_milestone: {
    label: "Growth Achievement",
    emoji: "🌟",
    color: FAMILY_COLORS.gradients.growth,
    description: "Personal and family development wins"
  },
  conflict_resolved: {
    label: "Peaceful Resolution",
    emoji: "🤝",
    color: FAMILY_COLORS.gradients.success,
    description: "Turning conflict into connection"
  },
  tradition_preserved: {
    label: "Tradition Kept",
    emoji: "🏠",
    color: FAMILY_COLORS.gradients.warning,
    description: "Maintaining family customs and values"
  },
  empathy_expressed: {
    label: "Empathy Shared",
    emoji: "💕",
    color: FAMILY_COLORS.gradients.intimacy,
    description: "Understanding and compassion shown"
  }
} as const;

// ============================================================
// HBAR Rewards
// ============================================================

export const HBAR_REWARDS = {
  // Micro-reward amounts in HBAR (focusing on recognition, not monetary value)
  amounts: {
    daily_checkin: 0.001,          // ~$0.0001
    peaceful_dinner: 0.002,        // ~$0.0002
    story_shared: 0.003,           // ~$0.0003
    conflict_resolved: 0.005,      // ~$0.0005
    weekly_goal: 0.01,             // ~$0.001
    monthly_milestone: 0.05,       // ~$0.005
    special_achievement: 0.1,      // ~$0.01
  },

  // Beautiful descriptions for rewards
  descriptions: {
    daily_checkin: "Taking time to connect as a family",
    peaceful_dinner: "Enjoying device-free dinner conversation",
    story_shared: "Preserving precious family memories",
    conflict_resolved: "Choosing love over being right",
    weekly_goal: "Achieving your family's weekly intention",
    monthly_milestone: "Celebrating a month of intentional connection",
    special_achievement: "Extraordinary family growth moment",
  }
} as const;

// ============================================================
// Dashboard Settings
// ============================================================

export const DASHBOARD_SETTINGS = {
  // Animation and interaction settings
  animations: {
    cardHover: "hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
    buttonHover: "hover:shadow-lg transition-all duration-200",
    fadeIn: "animate-fade-in",
    bounce: "animate-bounce",
    pulse: "animate-pulse",
  },

  // Responsive breakpoints for family dashboard
  breakpoints: {
    mobile: "grid-cols-1",
    tablet: "md:grid-cols-2",
    desktop: "lg:grid-cols-3",
    wide: "xl:grid-cols-4",
  },

  // Spacing and layout
  spacing: {
    cardGap: "gap-6",
    sectionGap: "space-y-8",
    contentPadding: "p-6",
    containerPadding: "px-6",
  },

  // Typography scales
  typography: {
    hero: "text-4xl font-bold",
    title: "text-2xl font-semibold",
    subtitle: "text-lg font-medium",
    body: "text-sm",
    caption: "text-xs text-gray-500",
  }
} as const;

// ============================================================
// Family Goals
// ============================================================

export const FAMILY_GOALS = [
  {
    id: 'communication',
    label: 'Better Communication',
    emoji: '💬',
    description: 'Help family members express themselves and listen to each other',
    color: FAMILY_COLORS.gradients.primary
  },
  {
    id: 'bonding',
    label: 'Stronger Bonds',
    emoji: '❤️',
    description: 'Create more meaningful moments together as a family',
    color: FAMILY_COLORS.gradients.intimacy
  },
  {
    id: 'conflict',
    label: 'Peaceful Conflict Resolution',
    emoji: '🤝',
    description: 'Learn to navigate disagreements with love and understanding',
    color: FAMILY_COLORS.gradients.success
  },
  {
    id: 'traditions',
    label: 'Family Traditions',
    emoji: '🏠',
    description: 'Build and preserve meaningful family customs and memories',
    color: FAMILY_COLORS.gradients.generational
  },
  {
    id: 'growth',
    label: 'Personal Growth',
    emoji: '🌱',
    description: 'Support each family member in their individual journey',
    color: FAMILY_COLORS.gradients.growth
  },
  {
    id: 'mindfulness',
    label: 'Mindful Living',
    emoji: '🧘',
    description: 'Find balance and presence in our busy digital world',
    color: FAMILY_COLORS.gradients.presence
  }
] as const;

// ============================================================
// Sample Family Data (for development and demos)
// ============================================================

export const SAMPLE_FAMILY_DATA = {
  familyName: "The Johnson Family",
  members: [
    { name: "Sarah", relationship: "Mom", emoji: "👩" },
    { name: "Mike", relationship: "Dad", emoji: "👨" },
    { name: "Emma", relationship: "Teen", emoji: "👧" },
    { name: "Jake", relationship: "Child", emoji: "👦" },
  ],
  healthScore: 87,
  weeklyTrend: [78, 82, 85, 83, 87, 89, 87],
  recentMilestones: [
    "Seven days of peaceful dinners together 🍽️",
    "Emma shared her feelings about school stress 💕",
    "Family game night without devices 🎲",
    "Grandpa's story about his first job preserved 📚"
  ]
} as const;