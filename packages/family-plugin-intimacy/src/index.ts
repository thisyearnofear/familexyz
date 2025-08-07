import type { Plugin } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "@elizaos/family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface IntimacyMetrics {
  total: number;
  affection: number;
  tension: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "affection", words: ["love", "adore", "kiss", "hold", "romance", "intimate"] },
  { id: "tension", words: ["argument", "angry", "resent", "ignored", "distant"] },
];

const plugin: Plugin = {
  name: "family-plugin-intimacy",
  description: "Tracks intimacy metrics in family conversations",
  actions: [],
  evaluators: [],
  providers: [],
  services: []
};

export default plugin;