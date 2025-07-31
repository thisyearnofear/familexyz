import type { PluginInitializer } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "family-nlp-utils";

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
      runtime.logger.debug(`[family-plugin-growth] received message: ${message.content?.text} (growth: ${kw.growth}, fixed: ${kw.fixed})`);
    },
  };
};

export default plugin;