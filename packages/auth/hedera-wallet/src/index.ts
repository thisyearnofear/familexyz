// ============================================================================
// HEDERA WALLET AUTHENTICATION PACKAGE
// Main exports for @elizaos/hedera-wallet
//
// This package provides Hedera-native authentication using WalletConnect v2
// and Blade Wallet for ElizaOS family platforms. It follows CLEAN architecture
// principles with clear separation of concerns.
// ============================================================================

// Core service exports
export { HederaAuthService } from "./services/HederaAuthService.js";

// Type exports
export type {
  // Core authentication types
  HederaWalletConfig,
  HederaWalletConnection,
  AuthState,
  AuthSession,
  AuthError,
  AuthErrorCode,
  HederaAuthConfig,

  // Wallet types
  WalletType,
  WalletInfo,
  WalletConnectionEvent,
  HederaNetwork,
  WalletMetadata,

  // Family authentication types
  FamilyAuth,
  FamilyMember,
  FamilyRole,
  FamilyPermission,
  FamilySettings,
  FamilyInvite,
  JoinFamilyRequest,
  JoinFamilyResponse,

  // Session management types
  AuthSession as Session,
  SessionMetadata,
  DeviceInfo,

  // Transaction signing types
  SigningRequest,
  SigningResponse,

  // Event types
  AuthEventMap,
  AuthEventType,
  AuthEventHandler,

  // Utility types
  AuthServiceResponse,
  Awaitable,
  CacheEntry,
  AuthCache,

  // Hedera-specific types
  HederaAccountInfo,
  TokenBalance,
} from "./types/index.js";

// Version info
export const VERSION = "0.1.0";
export const PACKAGE_NAME = "@elizaos/hedera-wallet";

// Default configuration
export const DEFAULT_CONFIG: Partial<any> = {
  session: {
    ttl: 24 * 60 * 60, // 24 hours
    refreshThreshold: 30 * 60, // 30 minutes
    maxConcurrentSessions: 5,
  },
  family: {
    inviteCodeLength: 8,
    inviteExpirationDays: 7,
    maxMembersPerFamily: 50,
  },
  cache: {
    ttl: 30 * 60, // 30 minutes
    maxEntries: 1000,
    cleanupInterval: 5 * 60, // 5 minutes
  },
  security: {
    requireSignature: true,
  },
};

// Utility functions
export { validateAccountId, formatAccountId } from "./utils/validators.js";
export { generateInviteCode, generateSessionId } from "./utils/generators.js";

// Error classes
export class HederaAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "HederaAuthError";
  }
}

export class WalletConnectionError extends HederaAuthError {
  constructor(message: string, details?: any) {
    super("CONNECTION_FAILED", message, details);
    this.name = "WalletConnectionError";
  }
}

export class FamilyAuthError extends HederaAuthError {
  constructor(
    code: "FAMILY_NOT_FOUND" | "INVALID_INVITE_CODE" | "PERMISSION_DENIED",
    message: string,
    details?: any,
  ) {
    super(code, message, details);
    this.name = "FamilyAuthError";
  }
}

export class SessionError extends HederaAuthError {
  constructor(message: string, details?: any) {
    super("SESSION_EXPIRED", message, details);
    this.name = "SessionError";
  }
}

// Re-export common Hedera SDK types for convenience
export type {
  AccountId,
  PrivateKey,
  PublicKey,
  Client,
  LedgerId,
} from "@hashgraph/sdk";
