import { Plugin } from "@elizaos/core";
import { wisdomAction } from "./actions";

/**
 * Wisdom Agent - Philosophy & Emotional Intelligence
 * Enhanced with Hedera blockchain integration and family metrics tracking
 * Integrated with A2A Protocol for agent-to-agent trading
 */

// Main plugin definition
export const wisdomPlugin: Plugin = {
  name: "familyWisdom",
  description:
    "Family wisdom and emotional intelligence guidance with Hedera blockchain integration, metrics tracking, and A2A agent trading",
  actions: [wisdomAction],
  evaluators: [],
  providers: [],
  services: [],
};

// A2A Protocol exports for tool licensing
export const wisdomTools = {
  name: "conflict_resolution",
  description: "Framework for resolving family conflicts",
  cost: 10,
  type: "tool" as const,
};

export const wisdomInsights = {
  name: "emotional_patterns",
  description: "Family emotional pattern analysis",
  cost: 15,
  type: "insight" as const,
};

export default wisdomPlugin;