import type { PluginInitializer } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "family-nlp-utils";

interface IntimacyMetrics {
  total: number;
  affection: number;
  tension: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "affection", words: ["love", "adore", "kiss", "hold", "romance", "intimate"] },
  { id: "tension", words: ["argument", "angry", "resent", "ignored", "distant"] },
];

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-intimacy",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.intimacyMetrics) {
        runtime.meta.intimacyMetrics = { total: 0, affection: 0, tension: 0, positivity: 0 };
      }
      const metrics: IntimacyMetrics = runtime.meta.intimacyMetrics;
      metrics.total += 1;
      const kw = await classifyByCategories(message.content?.text ?? "", categories, runtime);
      metrics.affection += kw.affection;
      metrics.tension += kw.tension;
      metrics.positivity = (metrics.affection ?? 0) - (metrics.tension ?? 0);
      runtime.logger.debug(`[family-plugin-intimacy] received message: ${message.content?.text} (affection: ${kw.affection}, tension: ${kw.tension})`);
    },
  };
};

export default plugin;