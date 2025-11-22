/**
 * Bond Score Constants
 * Single source of truth for signal definitions, colors, and configurations
 */

export const SIGNAL_DEFINITIONS = {
  generational: {
    key: 'generational',
    label: 'Cross-Generational Interaction',
    description: 'Interactions between different age groups',
  },
  reciprocity: {
    key: 'reciprocity',
    label: 'Response Reciprocity',
    description: 'Mutual responses and engagement between family members',
  },
  sentiment: {
    key: 'sentiment',
    label: 'Sentiment Trajectory',
    description: 'Overall emotional trend in family interactions',
  },
  challenges: {
    key: 'challenges',
    label: 'Challenge Completion',
    description: 'Completion of family challenges and activities',
  },
  presence: {
    key: 'presence',
    label: 'Presence Consistency',
    description: 'Regular presence and participation in family',
  },
  topology: {
    key: 'topology',
    label: 'Network Topology',
    description: 'Strength of family network connections',
  },
  consensus: {
    key: 'consensus',
    label: 'Hedera Consensus',
    description: 'Blockchain consensus agreement on family events',
  },
} as const;

export const SIGNAL_ORDER = [
  'generational',
  'reciprocity',
  'sentiment',
  'challenges',
  'presence',
  'topology',
  'consensus',
] as const;

export const SCORE_TIERS = {
  EXCELLENT: { min: 80, max: 100, label: 'excellent', color: '#10b981' },
  GOOD: { min: 60, max: 79, label: 'good', color: '#3b82f6' },
  FAIR: { min: 40, max: 59, label: 'fair', color: '#f59e0b' },
  POOR: { min: 0, max: 39, label: 'poor', color: '#ef4444' },
} as const;

export const SCORE_DESCRIPTIONS: Record<string, string> = {
  excellent:
    'Excellent family bond strength with strong interactions and engagement across all members.',
  good: 'Good family bond with consistent interactions and solid engagement metrics.',
  fair: 'Fair family bond. Opportunities exist to increase engagement and interactions.',
  poor: 'Family bond could use improvement. Focus on increasing interactions and participation.',
};

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const CHART_HEIGHT = 200;
export const CHART_WIDTH = 600;
export const CHART_PADDING = 40;
export const MAX_SCORE = 100;
