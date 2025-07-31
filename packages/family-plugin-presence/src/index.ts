import type { PluginInitializer } from "@elizaos/core";

interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
}

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-presence",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.familyMetrics) {
        runtime.meta.familyMetrics = { total: 0, positive: 0, negative: 0 };
      }
      const metrics: FamilyMetrics = runtime.meta.familyMetrics;
      metrics.total += 1;
      runtime.logger.debug(`[family-plugin-presence] received message: ${message.content?.text}`);
    },
  };
};

export default plugin;