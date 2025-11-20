// packages/family/metrics/src/types.ts

export interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
  health: number;
  categoryScores: Record<string, number>;
  time: number;
}

export interface MetricEntry {
  pluginName: string;
  metrics: FamilyMetrics;
}

export interface KeywordCategory {
  id: string;
  words: readonly string[] | string[];
}