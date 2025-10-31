import type { Plugin } from "@elizaos/core";
import { familyMetricsPlugin, FAMILY_METRICS_CONFIGS } from "@elizaos/family-metrics";

const plugin = familyMetricsPlugin(FAMILY_METRICS_CONFIGS.INTIMACY);

export default plugin;