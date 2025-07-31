import type { PluginInitializer } from "@elizaos/core";
import { countKeywords, KeywordCategory } from "family-nlp-utils";

interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "positive", words: ["love", "joy", "grateful", "forgive", "understand", "appreciate"] },
  { id: "negative", words: ["angry", "sad", "upset", "hate", "resent", "hurt", "conflict"] },
];

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-wisdom",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.familyMetrics) {
        runtime.meta.familyMetrics = { total: 0, positive: 0, negative: 0, positivity: 0 };
      }
      const metrics: FamilyMetrics = runtime.meta.familyMetrics;
      metrics.total += 1;
      const kw = countKeywords(message.content?.text ?? "", categories);
      metrics.positive += kw.positive;
      metrics.negative += kw.negative;
      metrics.positivity = (metrics.positive ?? 0) - (metrics.negative ?? 0);
      runtime.logger.debug(`[family-plugin-wisdom] received message: ${message.content?.text} (+${kw.positive}/-${kw.negative})`);
    },
  };
};

export default plugin;