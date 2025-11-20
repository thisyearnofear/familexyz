// packages/family/metrics/src/metrics.ts

import type { FamilyMetrics, MetricEntry, KeywordCategory } from "./types";

function classifyByCategories(text: string, categories: readonly KeywordCategory[] | KeywordCategory[]): Record<string, number> {
  const results: Record<string, number> = {};
  const lowerText = text.toLowerCase();

  for (const category of categories) {
    let count = 0;
    for (const word of category.words) {
      if (lowerText.includes(word.toLowerCase())) {
        count++;
      }
    }
    results[category.id] = count;
  }
  return results;
}

// In-memory storage with configurable size limit
const metricsStore: MetricEntry[] = [];
const MAX_STORE_SIZE = 1000;

export function calculateFamilyMetrics(
  text: string,
  categories: readonly KeywordCategory[] | KeywordCategory[]
): FamilyMetrics {
  const categoryResults = classifyByCategories(text, categories);

  let positive = 0;
  let negative = 0;
  const categoryScores: Record<string, number> = {};

  for (const [categoryId, count] of Object.entries(categoryResults)) {
    categoryScores[categoryId] = count;
    if (count > 0) {
      // Define positive and negative categories based on the category ID
      if (categoryId.includes('positive') || categoryId.includes('growth') ||
          categoryId.includes('affection') || categoryId.includes('bridge') ||
          categoryId.includes('attention')) {
        positive += count;
      } else if (categoryId.includes('negative') || categoryId.includes('tension') ||
                 categoryId.includes('gap') || categoryId.includes('distraction') ||
                 categoryId.includes('fixed')) {
        negative += count;
      }
    }
  }

  return {
    total: positive + negative,
    positive,
    negative,
    health: Math.max(0, Math.min(100, (positive / Math.max(1, positive + negative)) * 100)),
    categoryScores,
    time: Date.now()
  };
}

export function storeMetrics(entry: MetricEntry): void {
  metricsStore.push(entry);

  // Keep only last MAX_STORE_SIZE entries to prevent memory issues
  if (metricsStore.length > MAX_STORE_SIZE) {
    metricsStore.splice(0, metricsStore.length - MAX_STORE_SIZE);
  }

  console.log(`[Metrics] Stored for ${entry.pluginName}: positive=${entry.metrics.positive}, negative=${entry.metrics.negative}, health=${entry.metrics.health}`);
}

export function getMetrics(pluginName?: string): MetricEntry[] {
  if (pluginName) {
    return metricsStore.filter(entry => entry.pluginName === pluginName);
  }
  return [...metricsStore];
}

export function getLatestMetrics(pluginName?: string): MetricEntry | null {
  const filteredMetrics = pluginName
    ? metricsStore.filter(entry => entry.pluginName === pluginName)
    : metricsStore;

  return filteredMetrics.length > 0
    ? filteredMetrics[filteredMetrics.length - 1]
    : null;
}

export function clearMetrics(): void {
  metricsStore.length = 0;
}