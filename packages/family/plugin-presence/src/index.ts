import type { Plugin } from "@elizaos/core";
import { classifyByCategories, KeywordCategory } from "@elizaos/family-nlp-utils";
import { storeMetrics } from "../../../agent/src/storeMetrics";

interface PresenceMetrics {
  total: number;
  attention: number;
  distraction: number;
  positivity?: number;
}

const categories: KeywordCategory[] = [
  { id: "attention", words: ["listen", "focus", "present", "here", "now"] },
  { id: "distraction", words: ["phone", "scroll", "screen", "device", "online"] },
];

const plugin: Plugin = {
  name: "family-plugin-presence",
  description: "Tracks presence and attention metrics in family conversations",
  actions: [],
  evaluators: [],
  providers: [],
  services: []
};

export default plugin;