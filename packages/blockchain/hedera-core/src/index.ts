// Main exports for @elizaos/hedera-core package
export * from "./types/index";
export * from "./services/index";
export * from "./utils/index";

// Re-export commonly used Hedera SDK types for convenience
export {
  Client,
  AccountId,
  PrivateKey,
  TopicId,
  TokenId,
  ContractId,
  TransactionResponse,
  TransactionReceipt,
  Status,
  Hbar,
} from "@hashgraph/sdk";

// Main service class for easy access
export { HederaService } from "./services/HederaService";

// Version info
export const VERSION = "0.1.0";
export const PACKAGE_NAME = "@elizaos/hedera-core";
