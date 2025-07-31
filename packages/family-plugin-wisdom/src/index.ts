import type { PluginInitializer } from "@elizaos/core";
import { classifySentiment } from "family-nlp-utils";

interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
  positivity?: number;
}
interface MetricHistoryEntry {
  ts: number;
  positive: number;
  negative: number;
  health: number;
}

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

      // LLM-based sentiment
      const sentiment = await classifySentiment(message.content?.text ?? "", runtime);
      metrics.positive += sentiment.positive;
      metrics.negative += sentiment.negative;
      metrics.positivity = (metrics.positive ?? 0) - (metrics.negative ?? 0);

      // Metric history
      if (!runtime.meta.metricHistory) runtime.meta.metricHistory = [];
      const { positive, negative } = metrics;
      const health = ((positive + 1) / (positive + negative + 1)) * 100;
      runtime.meta.metricHistory.push({
        ts: Date.now(),
        positive,
        negative,
        health,
      });
      // Cap to last 120 entries
      if (runtime.meta.metricHistory.length > 120) {
        runtime.meta.metricHistory = runtime.meta.metricHistory.slice(-120);
      }

      runtime.logger.debug(
        `[family-plugin-wisdom] received message: ${message.content?.text} (+${sentiment.positive}/-${sentiment.negative})`
      );
    },
  };
};

export default plugin;