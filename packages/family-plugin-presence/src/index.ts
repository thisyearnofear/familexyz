import type { PluginInitializer } from "@elizaos/core";
import { countKeywords, KeywordCategory } from "family-nlp-utils";

interface PresenceMetrics {
  total: number;
  attention: number;
  distraction: number;
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
        runtime.meta.presenceMetrics = { total: 0, attention: 0, distraction: 0 };
      }
      const metrics: PresenceMetrics = runtime.meta.presenceMetrics;
      metrics.total += 1;
      const kw = countKeywords(message.content?.text ?? "", categories);
      metrics.attention += kw.attention;
      metrics.distraction += kw.distraction;
      runtime.logger.debug(`[family-plugin-presence] received message: ${message.content?.text} (attention: ${kw.attention}, distraction: ${kw.distraction})`);
    },
  };
};

export default plugin;