import { randomBytes, createHash } from "node:crypto";

// ============================================================================
// ID GENERATION UTILITIES
// ============================================================================

/**
 * Generates a unique family ID
 */
export function generateFamilyId(): string {
  const timestamp = Date.now();
  const random = randomBytes(6).toString("hex");
  return `family_${timestamp}_${random}`;
}

/**
 * Generates a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString("hex");
  return `session_${timestamp}_${random}`;
}

/**
 * Generates a unique request ID for transactions
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString("hex");
  return `req_${timestamp}_${random}`;
}

/**
 * Generates a unique agent ID
 */
export function generateAgentId(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString("hex");
  return `agent_${timestamp}_${random}`;
}

// ============================================================================
// INVITE CODE GENERATION
// ============================================================================

/**
 * Generates a human-readable invite code
 */
export function generateInviteCode(length: number = 8): string {
  // Use alphanumeric characters excluding confusing ones (0, O, I, l, 1)
  const chars = "ABCDEFGHIJKMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

/**
 * Generates a secure invite code with checksum
 */
export function generateSecureInviteCode(
  familyId: string,
  length: number = 8,
): string {
  const baseCode = generateInviteCode(length - 2);
  const checksum = generateChecksum(familyId + baseCode).slice(0, 2);
  return baseCode + checksum;
}

/**
 * Validates a secure invite code with checksum
 */
export function validateSecureInviteCode(
  code: string,
  familyId: string,
): boolean {
  if (code.length < 4) return false;

  const baseCode = code.slice(0, -2);
  const providedChecksum = code.slice(-2);
  const expectedChecksum = generateChecksum(familyId + baseCode).slice(0, 2);

  return providedChecksum === expectedChecksum;
}

// ============================================================================
// SECURE TOKEN GENERATION
// ============================================================================

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generates a JWT-style token (header.payload.signature simulation)
 */
export function generateJWTStyleToken(payload: object): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = generateSignature(encodedHeader + "." + encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Generates an API key
 */
export function generateApiKey(prefix: string = "fam"): string {
  const random = randomBytes(16).toString("hex");
  return `${prefix}_${random}`;
}

// ============================================================================
// HASH GENERATION
// ============================================================================

/**
 * Generates a checksum for data integrity
 */
export function generateChecksum(data: string): string {
  return createHash("md5").update(data).digest("hex").toUpperCase();
}

/**
 * Generates a SHA256 hash
 */
export function generateSHA256Hash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generates a signature-like hash for tokens
 */
export function generateSignature(data: string): string {
  return createHash("sha256")
    .update(data + "family_secret_salt")
    .digest("hex")
    .slice(0, 16);
}

// ============================================================================
// NONCE GENERATION
// ============================================================================

/**
 * Generates a cryptographic nonce
 */
export function generateNonce(length: number = 16): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generates a timestamp-based nonce
 */
export function generateTimestampNonce(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString("hex");
  return `${timestamp}_${random}`;
}

// ============================================================================
// FAMILY-SPECIFIC GENERATORS
// ============================================================================

/**
 * Generates a unique member ID within a family
 */
export function generateMemberId(familyId: string, accountId: string): string {
  const hash = createHash("md5")
    .update(familyId + accountId)
    .digest("hex");
  return `member_${hash.slice(0, 8)}`;
}

/**
 * Generates a unique plugin instance ID
 */
export function generatePluginInstanceId(
  pluginName: string,
  familyId: string,
): string {
  const hash = createHash("md5")
    .update(pluginName + familyId)
    .digest("hex");
  return `plugin_${pluginName}_${hash.slice(0, 6)}`;
}

/**
 * Generates a metric event ID
 */
export function generateMetricEventId(): string {
  const timestamp = Date.now();
  const random = randomBytes(3).toString("hex");
  return `metric_${timestamp}_${random}`;
}

// ============================================================================
// BATCH ID GENERATION
// ============================================================================

/**
 * Generates multiple unique IDs at once
 */
export function generateBatchIds(
  count: number,
  prefix: string = "id",
): string[] {
  const ids: string[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    const random = randomBytes(4).toString("hex");
    ids.push(`${prefix}_${timestamp}_${i}_${random}`);
  }

  return ids;
}

/**
 * Generates multiple invite codes at once
 */
export function generateBatchInviteCodes(
  count: number,
  length: number = 8,
): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    codes.push(generateInviteCode(length));
  }

  // Ensure uniqueness
  const uniqueCodes = Array.from(new Set(codes));

  // If we lost some due to duplicates, generate more
  while (uniqueCodes.length < count) {
    const newCode = generateInviteCode(length);
    if (!uniqueCodes.includes(newCode)) {
      uniqueCodes.push(newCode);
    }
  }

  return uniqueCodes;
}

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * Base64 URL-safe encoding
 */
export function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64 URL-safe decoding
 */
export function base64UrlDecode(encoded: string): string {
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString();
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates generated ID format
 */
export function validateGeneratedId(
  id: string,
  expectedPrefix?: string,
): boolean {
  const parts = id.split("_");

  if (parts.length < 3) return false;

  if (expectedPrefix && parts[0] !== expectedPrefix) return false;

  // Check if second part is a valid timestamp
  const timestamp = parseInt(parts[1]);
  if (isNaN(timestamp) || timestamp <= 0) return false;

  // Check if last part is a valid hex string
  const hex = parts[parts.length - 1];
  if (!/^[a-f0-9]+$/i.test(hex)) return false;

  return true;
}

/**
 * Extracts timestamp from generated ID
 */
export function extractTimestampFromId(id: string): number | null {
  const parts = id.split("_");
  if (parts.length < 2) return null;

  const timestamp = parseInt(parts[1]);
  return isNaN(timestamp) ? null : timestamp;
}

// ============================================================================
// ADVANCED GENERATORS
// ============================================================================

/**
 * Generates a hierarchical ID with parent reference
 */
export function generateHierarchicalId(parentId: string, type: string): string {
  const timestamp = Date.now();
  const random = randomBytes(3).toString("hex");
  const parentHash = createHash("md5")
    .update(parentId)
    .digest("hex")
    .slice(0, 4);
  return `${type}_${parentHash}_${timestamp}_${random}`;
}

/**
 * Generates a deterministic ID based on input
 */
export function generateDeterministicId(
  input: string,
  prefix: string = "det",
): string {
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 16);
  return `${prefix}_${hash}`;
}

/**
 * Generates a short ID for human use (like YouTube video IDs)
 */
export function generateShortId(length: number = 11): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}
