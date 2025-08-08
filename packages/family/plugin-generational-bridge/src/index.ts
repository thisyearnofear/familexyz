import type { Plugin } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "@elizaos/family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface GenerationalMetrics {
  total: number;
  bridge: number;
  gap: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "bridge", words: ["share", "story", "remember", "tradition", "together"] },
  { id: "gap", words: ["can't", "don't understand", "old", "young", "outdated"] },
];

const plugin: Plugin = {
  name: "family-plugin-generational-bridge",
  description: "Tracks generational bridge and gap metrics in family conversations",
  actions: [],
  evaluators: [],
  providers: [],
  services: []
};

export default plugin;