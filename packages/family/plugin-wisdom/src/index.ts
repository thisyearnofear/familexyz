import { Plugin } from "@elizaos/core";
import { wisdomAction } from "./actions";

/**
 * Wisdom Agent - Philosophy & Emotional Intelligence
 * Enhanced with Hedera blockchain integration and family metrics tracking
 */

// Main plugin definition
export const wisdomPlugin: Plugin = {
  name: "familyWisdom",
  description:
    "Family wisdom and emotional intelligence guidance with Hedera blockchain integration and metrics tracking",
  actions: [wisdomAction],
  evaluators: [],
  providers: [],
  services: [],
};

export default wisdomPlugin;