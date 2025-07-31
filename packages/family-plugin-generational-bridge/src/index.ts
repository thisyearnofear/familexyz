import type { PluginInitializer } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "family-nlp-utils";

interface GenerationalMetrics {
  total: number;
  bridge: number;
  gap: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "bridge", words: ["share", "story", "remember", "tradition", "together"] },
  { id: "gap", words: ["can’t", "don’t understand", "old", "young", "outdated"] },
];

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-generational-bridge",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.generationalMetrics) {
        runtime.meta.generationalMetrics = { total: 0, bridge: 0, gap: 0, positivity: 0 };
      }
      const metrics: GenerationalMetrics = runtime.meta.generationalMetrics;
      metrics.total += 1;
      const kw = await classifyByCategories(message.content?.text ?? "", categories, runtime);
      metrics.bridge += kw.bridge;
      metrics.gap += kw.gap;
      metrics.positivity = (metrics.bridge ?? 0) - (metrics.gap ?? 0);
      runtime.logger.debug(`[family-plugin-generational-bridge] received message: ${message.content?.text} (bridge: ${kw.bridge}, gap: ${kw.gap})`);
    },
  };
};

export default plugin;