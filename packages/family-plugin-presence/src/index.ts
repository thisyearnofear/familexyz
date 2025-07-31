import type { PluginInitializer } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface PresenceMetrics {
  total: number;
  attention: number;
  distraction: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "attention", words: ["listen", "focus", "present", "here", "now"] },
  { id: "distraction", words: ["phone", "scroll", "screen", "device", "online"] },
];

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-presence",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.presenceMetrics) {
        runtime.meta.presenceMetrics = { total: 0, attention: 0, distraction: 0, positivity: 0 };
      }
      const metrics: PresenceMetrics = runtime.meta.presenceMetrics;
      metrics.total += 1;
      const kw = await classifyByCategories(message.content?.text ?? "", categories, runtime);
      metrics.attention += kw.attention;
      metrics.distraction += kw.distraction;
      metrics.positivity = (metrics.attention ?? 0) - (metrics.distraction ?? 0);
      // Uniform health: positive=attention, negative=distraction
      const positive = metrics.attention ?? 0;
      const negative = metrics.distraction ?? 0;
      const health = ((positive + 1) / (positive + negative + 1)) * 100;
      const entry = { ts: Date.now(), health, attention: metrics.attention, distraction: metrics.distraction };
      storeMetrics(runtime, entry);
      runtime.logger.debug(`[family-plugin-presence] received message: ${message.content?.text} (attention: ${kw.attention}, distraction: ${kw.distraction})`);
    },
  };
};

export default plugin;