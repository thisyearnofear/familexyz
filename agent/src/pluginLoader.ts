import { elizaLogger } from "@elizaos/core";
import type { Plugin } from "@elizaos/core";

export interface PluginConfig {
  name: string;
  path: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Get enabled plugins from environment configuration
 */
export function getEnabledPlugins(): PluginConfig[] {
  const plugins: PluginConfig[] = [];

  // Core plugins that are always enabled
  const corePlugins = ["@elizaos/plugin-node"];

  // Add core plugins
  for (const pluginPath of corePlugins) {
    plugins.push({
      name: pluginPath.replace("@elizaos/plugin-", ""),
      path: pluginPath,
      enabled: true,
    });
  }

  // Essential optional plugins for family wellness focus
  const optionalPlugins = [
    {
      name: "web-search",
      path: "@elizaos/plugin-web-search",
      enabled: process.env.ENABLE_PLUGIN_WEB_SEARCH === "true",
    },
    {
      name: "image-generation",
      path: "@elizaos/plugin-image-generation",
      enabled: process.env.ENABLE_PLUGIN_IMAGE_GEN === "true",
    },
  ];

  // Add enabled optional plugins
  for (const plugin of optionalPlugins) {
    if (plugin.enabled) {
      plugins.push(plugin);
    }
  }

  // Family plugins - always enabled for our use case
  const familyPlugins = [
    "@elizaos/family/plugin-wisdom",
    "@elizaos/family/plugin-intimacy",
    "@elizaos/family/plugin-generational-bridge",
    "@elizaos/family/plugin-presence",
    "@elizaos/family/plugin-growth",
    "@elizaos/family/plugin-savings",
  ];

  for (const pluginPath of familyPlugins) {
    plugins.push({
      name: pluginPath.replace("@elizaos/family/plugin-", ""),
      path: pluginPath,
      enabled: true,
    });
  }

  elizaLogger.info(
    `Enabled plugins: ${plugins
      .filter((p) => p.enabled)
      .map((p) => p.name)
      .join(", ")}`,
  );

  return plugins.filter((p) => p.enabled);
}

/**
 * Dynamically import and load a plugin
 */
export async function loadPlugin(pluginPath: string): Promise<Plugin | null> {
  try {
    elizaLogger.debug(`Loading plugin: ${pluginPath}`);

    const importedPlugin = await import(pluginPath);
    const plugin = importedPlugin.default || importedPlugin;

    if (!plugin) {
      elizaLogger.warn(`Plugin ${pluginPath} does not export a default plugin`);
      return null;
    }

    elizaLogger.info(`Successfully loaded plugin: ${pluginPath}`);
    return plugin;
  } catch (error) {
    elizaLogger.error(`Failed to load plugin ${pluginPath}:`, error);
    return null;
  }
}

/**
 * Load all enabled plugins
 */
export async function loadAllEnabledPlugins(): Promise<Plugin[]> {
  const enabledPlugins = getEnabledPlugins();
  const loadedPlugins: Plugin[] = [];

  elizaLogger.info(`Loading ${enabledPlugins.length} enabled plugins...`);

  for (const pluginConfig of enabledPlugins) {
    const plugin = await loadPlugin(pluginConfig.path);
    if (plugin) {
      loadedPlugins.push(plugin);
    }
  }

  elizaLogger.info(
    `Successfully loaded ${loadedPlugins.length}/${enabledPlugins.length} plugins`,
  );

  return loadedPlugins;
}

/**
 * Check if a specific plugin is enabled
 */
export function isPluginEnabled(pluginName: string): boolean {
  const enabledPlugins = getEnabledPlugins();
  return enabledPlugins.some(
    (p) => p.name === pluginName || p.path.includes(pluginName),
  );
}
