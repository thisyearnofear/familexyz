// Family NLP Utils - Main exports
// Enhanced with Hedera integration for Stage 2A

// Core metrics and sentiment analysis
export * from "./metrics/FamilyHederaMetrics.js";

// Hedera integration layer
export * from "./integration/FamilyHederaIntegration.js";

// Re-export Hedera core types for convenience
export {
  HederaService,
  type HederaConfig,
  type HederaServiceResponse,
  type HederaError,
} from "@elizaos/hedera-core";

// Version info
export const VERSION = "0.0.1";
export const PACKAGE_NAME = "@elizaos/family-nlp-utils";

// Default configurations for quick setup
export {
  DEFAULT_AGENT_CONFIGS,
  DEFAULT_TOKENOMICS,
} from "./integration/FamilyHederaIntegration.js";

// Factory functions for easy initialization
export { createFamilyMetricsLogger } from "./metrics/FamilyHederaMetrics.js";

export {
  createFamilyHederaIntegration,
  getOrCreateFamilyHederaIntegration,
  cacheFamilyInteraction,
  extractFamilyId,
  extractParticipants,
} from "./integration/FamilyHederaIntegration.js";

// Type exports for external consumption
export type {
  FamilyInteractionType,
  FamilySentimentAnalysis,
  HederaFamilyMetrics,
  FamilyMetricsConfig,
} from "./metrics/FamilyHederaMetrics.js";

export type {
  FamilyAgentConfig,
  FamilyConversationContext,
  FamilyMessage,
  FamilyTokenomics,
} from "./integration/FamilyHederaIntegration.js";
