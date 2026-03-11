import { AccountId, PrivateKey, PublicKey } from "@hashgraph/sdk";

// ============================================================================
// CORE AUTHENTICATION TYPES
// ============================================================================

export interface HederaWalletConfig {
  projectId: string; // WalletConnect project ID
  name: string;
  description: string;
  url: string;
  icons: string[];
  network: HederaNetwork;
  debug?: boolean;
}

export type HederaNetwork = "testnet" | "mainnet" | "previewnet" | "local";

export interface WalletMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

// ============================================================================
// WALLET CONNECTION TYPES
// ============================================================================

export interface HederaWalletConnection {
  accountId: string;
  network: HederaNetwork;
  publicKey?: string;
  walletType: WalletType;
  isConnected: boolean;
  sessionData?: {
    accountIds: string[];
    metadata: WalletMetadata;
    network: string;
  };
  connectionState: string;
}

export type WalletType =
  | "blade"
  | "kabila"
  | "metamask"
  | "walletconnect";

export interface WalletConnectionEvent {
  type: "connected" | "disconnected" | "error" | "session_update";
  accountId?: string;
  error?: string;
  data?: any;
}

// ============================================================================
// FAMILY AUTHENTICATION TYPES
// ============================================================================

export interface FamilyAuth {
  familyId: string;
  familyName: string;
  inviteCode: string;
  createdBy: string; // Account ID
  createdAt: Date;
  members: FamilyMember[];
  settings: FamilySettings;
}

export interface FamilyMember {
  accountId: string;
  role: FamilyRole;
  nickname?: string;
  joinedAt: Date;
  isActive: boolean;
  permissions: FamilyPermission[];
}

export type FamilyRole = "admin" | "parent" | "member" | "child" | "guest";

export type FamilyPermission =
  | "manage_family"
  | "invite_members"
  | "view_metrics"
  | "manage_rewards"
  | "export_data"
  | "manage_plugins";

export interface FamilySettings {
  isPrivate: boolean;
  allowGuestAccess: boolean;
  dataRetentionDays: number;
  rewardDistribution: "equal" | "merit-based" | "admin-controlled";
  enabledPlugins: string[];
}

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

export interface AuthSession {
  sessionId: string;
  accountId: string;
  familyId?: string;
  publicKey: string;
  issuedAt: Date;
  expiresAt: Date;
  permissions: string[];
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: DeviceInfo;
  lastActivity: Date;
}

export interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  os?: string;
  browser?: string;
}

// ============================================================================
// AUTHENTICATION STATE TYPES
// ============================================================================

export interface AuthState {
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  currentConnection?: HederaWalletConnection;
  currentFamily?: FamilyAuth;
  availableWallets: WalletInfo[];
  error?: AuthError;
  session?: AuthSession;
}

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  isAvailable: boolean;
  isInstalled: boolean;
  downloadUrl?: string;
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

export type AuthErrorCode =
  | "WALLET_NOT_FOUND"
  | "CONNECTION_FAILED"
  | "USER_REJECTED"
  | "NETWORK_MISMATCH"
  | "INSUFFICIENT_BALANCE"
  | "INVALID_SIGNATURE"
  | "SESSION_EXPIRED"
  | "FAMILY_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "INVALID_INVITE_CODE";

// ============================================================================
// TRANSACTION SIGNING TYPES
// ============================================================================

export interface SigningRequest {
  requestId: string;
  accountId: string;
  transaction: any; // Hedera transaction
  metadata: {
    description: string;
    familyContext?: string;
    pluginSource?: string;
  };
  createdAt: Date;
}

export interface SigningResponse {
  requestId: string;
  success: boolean;
  signedTransaction?: any;
  transactionId?: string;
  error?: string;
  signature?: string;
}

// ============================================================================
// FAMILY INVITE & JOIN TYPES
// ============================================================================

export interface FamilyInvite {
  inviteCode: string;
  familyId: string;
  familyName: string;
  createdBy: string;
  expiresAt: Date;
  maxUses?: number;
  currentUses: number;
  role: FamilyRole;
  isActive: boolean;
}

export interface JoinFamilyRequest {
  inviteCode: string;
  accountId: string;
  nickname?: string;
  requestedAt: Date;
}

export interface JoinFamilyResponse {
  success: boolean;
  familyAuth?: FamilyAuth;
  member?: FamilyMember;
  error?: string;
}

// ============================================================================
// HEDERA-SPECIFIC TYPES
// ============================================================================

export interface HederaAccountInfo {
  accountId: string;
  balance: string; // HBAR balance
  publicKey: string;
  isDeleted: boolean;
  proxyAccountId?: string;
  proxyReceived?: string;
  expirationTime?: Date;
}

export interface TokenBalance {
  tokenId: string;
  symbol: string;
  balance: string;
  decimals: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AuthServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Awaitable<T> = T | Promise<T>;

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

export interface AuthCache {
  sessions: Map<string, CacheEntry<AuthSession>>;
  families: Map<string, CacheEntry<FamilyAuth>>;
  accounts: Map<string, CacheEntry<HederaAccountInfo>>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AuthEventMap {
  "wallet:connected": HederaWalletConnection;
  "wallet:disconnected": void;
  "wallet:error": AuthError;
  "family:joined": FamilyAuth;
  "family:left": string; // familyId
  "session:created": AuthSession;
  "session:expired": string; // sessionId
  "transaction:signed": SigningResponse;
  "transaction:failed": { requestId: string; error: string };
}

export type AuthEventType = keyof AuthEventMap;
export type AuthEventHandler<T extends AuthEventType> = (
  data: AuthEventMap[T],
) => void;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface HederaAuthConfig {
  wallet: HederaWalletConfig;
  session: {
    ttl: number; // Session time-to-live in seconds
    refreshThreshold: number; // Refresh when this many seconds remain
    maxConcurrentSessions: number;
  };
  family: {
    inviteCodeLength: number;
    inviteExpirationDays: number;
    maxMembersPerFamily: number;
  };
  cache: {
    ttl: number;
    maxEntries: number;
    cleanupInterval: number;
  };
  security: {
    requireSignature: boolean;
    allowedDomains?: string[];
    rateLimiting?: {
      maxRequests: number;
      windowMs: number;
    };
  };
  /**
   * Feature flags for wallet connection strategy.
   * Allows runtime control of connection behavior.
   */
  featureFlags?: {
    /** Auto-connect timeout in milliseconds (default: 15000) */
    autoConnectTimeoutMs?: number;
  };
}
