// packages/family/metrics/src/plugin.ts

import type { Plugin, IAgentRuntime, Memory, State } from "@elizaos/core";
import type { KeywordCategory, FamilyMetrics } from "./types";
import { calculateFamilyMetrics, storeMetrics } from "./metrics";

export interface FamilyMetricsConfig {
  pluginName: string;
  categories: readonly KeywordCategory[] | KeywordCategory[];
  description: string;
}

export function createFamilyMetricsPlugin(config: FamilyMetricsConfig): Plugin {
  return {
    name: config.pluginName,
    description: config.description,
    actions: [],
    evaluators: [],
    providers: [
      {
        get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
          // Calculate metrics based on recent conversation
          const text = message.content?.text || "";
          const metrics: FamilyMetrics = calculateFamilyMetrics(text, config.categories);

          // Store the calculated metrics
          storeMetrics({
            pluginName: config.pluginName,
            metrics
          });

          return {
            [config.pluginName]: metrics
          };
        }
      }
    ],
    services: [],
  };
}