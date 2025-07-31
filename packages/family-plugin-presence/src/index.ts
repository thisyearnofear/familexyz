import type { PluginInitializer } from "@elizaos/core";

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-presence",
    onMessage: async ({ message, runtime }) => {
      runtime.logger.debug(`[family-plugin-presence] received message: ${message.content?.text}`);
      // No-op stub for now
    },
  };
};

export default plugin;