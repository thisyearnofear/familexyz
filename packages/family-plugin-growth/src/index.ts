import type { PluginInitializer } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface GrowthMetrics {
  total: number;
  growth: number;
  fixed: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "growth", words: ["learn", "grow", "try", "challenge", "practice", "mistake"] },
  { id: "fixed", words: ["can’t", "fail", "never", "impossible"] },
];

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-growth",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.growthMetrics) {
        runtime.meta.growthMetrics = { total: 0, growth: 0, fixed: 0, positivity: 0 };
      }
      const metrics: GrowthMetrics = runtime.meta.growthMetrics;
      metrics.total += 1;
      const kw = await classifyByCategories(message.content?.text ?? "", categories, runtime);
      metrics.growth += kw.growth;
      metrics.fixed += kw.fixed;
      metrics.positivity = (metrics.growth ?? 0) - (metrics.fixed ?? 0);
      // Uniform health: positive=growth, negative=fixed
      const positive = metrics.growth ?? 0;
      const negative = metrics.fixed ?? 0;
      const health = ((positive + 1) / (positive + negative + 1)) * 100;
      const entry = { ts: Date.now(), health, growth: metrics.growth, fixed: metrics.fixed };
      storeMetrics(runtime, entry);
      runtime.logger.debug(`[family-plugin-growth] received message: ${message.content?.text} (growth: ${kw.growth}, fixed: ${kw.fixed})`);
    },
  };
};

export default plugin;