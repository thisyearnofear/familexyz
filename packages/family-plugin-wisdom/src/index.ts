import type { Plugin } from "@elizaos/core";
import { classifySentiment } from "@elizaos/family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
  positivity?: number;
}
interface MetricHistoryEntry {
  ts: number;
  positive: number;
  negative: number;
  health: number;
}

const plugin: Plugin = {
  name: "family-plugin-wisdom",
  description: "Tracks sentiment and wisdom metrics in family conversations",
  actions: [],
  evaluators: [],
  providers: [],
  services: []
};

export default plugin;