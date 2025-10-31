// packages/family/metrics/src/index.ts

import type { Plugin } from "@elizaos/core";
import { createFamilyMetricsPlugin } from "./plugin";
import { calculateFamilyMetrics, storeMetrics, getMetrics, getLatestMetrics, clearMetrics } from "./metrics";
import type { FamilyMetrics, MetricEntry, KeywordCategory } from "./types";

export interface FamilyMetricsConfig {
  pluginName: string;
  categories: Array<{ id: string; words: string[] }>;
  description: string;
}

export const familyMetricsPlugin = (config: FamilyMetricsConfig): Plugin => {
  return createFamilyMetricsPlugin(config);
};

// Export core functionality
export {
  calculateFamilyMetrics,
  storeMetrics,
  getMetrics,
  getLatestMetrics,
  clearMetrics
};

// Export types
export type {
  FamilyMetrics,
  MetricEntry,
  KeywordCategory
};

// Export predefined configurations for different family metrics
export const FAMILY_METRICS_CONFIGS = {
  INTIMACY: {
    pluginName: "family-intimacy",
    description: "Tracks intimacy metrics in family conversations",
    categories: [
      { id: "affection", words: ["love", "adore", "kiss", "hold", "romance", "intimate"] },
      { id: "tension", words: ["argument", "angry", "resent", "ignored", "distant"] },
    ]
  },
  GENERATIONAL_BRIDGE: {
    pluginName: "family-generational-bridge", 
    description: "Tracks generational bridge and gap metrics in family conversations",
    categories: [
      { id: "bridge", words: ["share", "story", "remember", "tradition", "together"] },
      { id: "gap", words: ["can't", "don't understand", "old", "young", "outdated"] },
    ]
  },
  PRESENCE: {
    pluginName: "family-presence",
    description: "Tracks presence and attention metrics in family conversations", 
    categories: [
      { id: "attention", words: ["listen", "focus", "present", "here", "now"] },
      { id: "distraction", words: ["phone", "scroll", "screen", "device", "online"] },
    ]
  },
  GROWTH: {
    pluginName: "family-growth",
    description: "Tracks growth mindset vs fixed mindset metrics in family conversations",
    categories: [
      { id: "growth", words: ["learn", "grow", "try", "challenge", "practice", "mistake"] },
      { id: "fixed", words: ["can't", "fail", "never", "impossible"] },
    ]
  }
} as const;