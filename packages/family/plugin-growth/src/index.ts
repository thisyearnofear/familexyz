import type { Plugin } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "@elizaos/family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface GrowthMetrics {
  total: number;
  growth: number;
  fixed: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "growth", words: ["learn", "grow", "try", "challenge", "practice", "mistake"] },
  { id: "fixed", words: ["can't", "fail", "never", "impossible"] },
];

const plugin: Plugin = {
  name: "family-plugin-growth",
  description: "Tracks growth mindset vs fixed mindset metrics in family conversations",
  actions: [],
  evaluators: [],
  providers: [],
  services: []
};

export default plugin;