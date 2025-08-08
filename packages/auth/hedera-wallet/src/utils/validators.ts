import { AccountId } from "@hashgraph/sdk";
import type { AuthErrorCode } from "../types/index.js";

// ============================================================================
// ACCOUNT ID VALIDATION
// ============================================================================

/**
 * Validates a Hedera account ID format
 */
export function validateAccountId(accountId: string): boolean {
  try {
    AccountId.fromString(accountId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats an account ID consistently
 */
export function formatAccountId(accountId: string): string {
  try {
    return AccountId.fromString(accountId).toString();
  } catch {
    throw new Error(`Invalid account ID: ${accountId}`);
  }
}

/**
 * Validates account ID and throws descriptive error
 */
export function requireValidAccountId(accountId: string): void {
  if (!validateAccountId(accountId)) {
    throw new Error(
      `Invalid Hedera account ID format: ${accountId}. Expected format: 0.0.xxxxx`,
    );
  }
}

// ============================================================================
// INVITE CODE VALIDATION
// ============================================================================

/**
 * Validates invite code format
 */
export function validateInviteCode(inviteCode: string): boolean {
  // Basic validation: 6-12 alphanumeric characters
  const regex = /^[A-Z0-9]{6,12}$/;
  return regex.test(inviteCode);
}

/**
 * Validates family name
 */
export function validateFamilyName(name: string): boolean {
  // 3-50 characters, letters, numbers, spaces, hyphens
  const regex = /^[a-zA-Z0-9\s\-]{3,50}$/;
  return regex.test(name.trim());
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validates session ID format
 */
export function validateSessionId(sessionId: string): boolean {
  // session_timestamp_randomstring format
  const regex = /^session_\d+_[a-z0-9]{16}$/;
  return regex.test(sessionId);
}

/**
 * Checks if session is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

/**
 * Checks if session needs refresh
 */
export function shouldRefreshSession(
  expiresAt: Date,
  refreshThreshold: number,
): boolean {
  const timeUntilExpiry = expiresAt.getTime() - Date.now();
  return timeUntilExpiry < refreshThreshold * 1000;
}

// ============================================================================
// WALLET ADDRESS VALIDATION
// ============================================================================

/**
 * Validates Hedera public key format
 */
export function validatePublicKey(publicKey: string): boolean {
  try {
    // Basic hex validation for public key
    const regex = /^[0-9a-fA-F]{64}$/;
    return regex.test(publicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// PERMISSION VALIDATION
// ============================================================================

/**
 * Validates permission string
 */
export function validatePermission(permission: string): boolean {
  const validPermissions = [
    "manage_family",
    "invite_members",
    "view_metrics",
    "manage_rewards",
    "export_data",
    "manage_plugins",
  ];
  return validPermissions.includes(permission);
}

/**
 * Validates family role
 */
export function validateFamilyRole(role: string): boolean {
  const validRoles = ["admin", "parent", "member", "child", "guest"];
  return validRoles.includes(role);
}

// ============================================================================
// NETWORK VALIDATION
// ============================================================================

/**
 * Validates Hedera network name
 */
export function validateNetwork(network: string): boolean {
  const validNetworks = ["testnet", "mainnet", "previewnet", "local"];
  return validNetworks.includes(network);
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitizes family name input
 */
export function sanitizeFamilyName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Sanitizes nickname input
 */
export function sanitizeNickname(nickname: string): string {
  return nickname.trim().replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

// ============================================================================
// ERROR CODE VALIDATION
// ============================================================================

/**
 * Validates auth error code
 */
export function validateAuthErrorCode(code: string): code is AuthErrorCode {
  const validCodes: AuthErrorCode[] = [
    "WALLET_NOT_FOUND",
    "CONNECTION_FAILED",
    "USER_REJECTED",
    "NETWORK_MISMATCH",
    "INSUFFICIENT_BALANCE",
    "INVALID_SIGNATURE",
    "SESSION_EXPIRED",
    "FAMILY_NOT_FOUND",
    "PERMISSION_DENIED",
    "INVALID_INVITE_CODE",
  ];
  return validCodes.includes(code as AuthErrorCode);
}

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates email format (basic)
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates timestamp
 */
export function validateTimestamp(timestamp: number): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
}

/**
 * Validates that a value is within range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
): boolean {
  return value >= min && value <= max;
}

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Validates wallet connection data
 */
export function validateWalletConnection(connection: any): boolean {
  return (
    typeof connection === "object" &&
    validateAccountId(connection.accountId) &&
    validateNetwork(connection.network) &&
    typeof connection.isConnected === "boolean"
  );
}

/**
 * Validates family auth data
 */
export function validateFamilyAuth(family: any): boolean {
  return (
    typeof family === "object" &&
    typeof family.familyId === "string" &&
    validateFamilyName(family.familyName) &&
    validateInviteCode(family.inviteCode) &&
    validateAccountId(family.createdBy) &&
    Array.isArray(family.members)
  );
}

/**
 * Validates session data
 */
export function validateSessionData(session: any): boolean {
  return (
    typeof session === "object" &&
    validateSessionId(session.sessionId) &&
    validateAccountId(session.accountId) &&
    session.issuedAt instanceof Date &&
    session.expiresAt instanceof Date &&
    Array.isArray(session.permissions)
  );
}
