import type { PluginInitializer } from "@elizaos/core";

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-wisdom",
    onMessage: async ({ message, runtime }) => {
      runtime.logger.debug(`[family-plugin-wisdom] received message: ${message.content?.text}`);
      // No-op stub for now
    },
  };
};

export default plugin;