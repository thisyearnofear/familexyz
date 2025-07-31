import type { PluginInitializer } from "@elizaos/core";

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-generational-bridge",
    onMessage: async ({ message, runtime }) => {
      runtime.logger.debug(`[family-plugin-generational-bridge] received message: ${message.content?.text}`);
      // No-op stub for now
    },
  };
};

export default plugin;