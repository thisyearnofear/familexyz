import type { PluginInitializer } from "@elizaos/core";

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-intimacy",
    onMessage: async ({ message, runtime }) => {
      runtime.logger.debug(`[family-plugin-intimacy] received message: ${message.content?.text}`);
      // No-op stub for now
    },
  };
};

export default plugin;