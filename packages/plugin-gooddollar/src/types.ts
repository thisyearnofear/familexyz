import type { UUID } from "@elizaos/core";

/**
 * GoodDollar specific types and interfaces
 */

export interface GDollarConfig {
  /** Network configuration (celo or fuse) */
  network: "celo" | "fuse";
  /** G$ token contract address */
  tokenAddress: string;
  /** SuperGoodDollar token address for streaming */
  superTokenAddress?: string;
  /** RPC endpoint for the network */
  rpcEndpoint: string;
  /** Chain ID */
  chainId: number;
  /** Enable face verification */
  enableFaceVerification: boolean;
  /** Enable UBI claiming */
  enableUBIClaim: boolean;
  /** Enable Superfluid streaming */
  enableStreaming: boolean;
  walletAddress?: string;
}

export interface GDollarWallet {
  /** Wallet address */
  address: string;
  /** Private key (encrypted) */
  privateKey?: string;
  /** Network */
  network: "celo" | "fuse";
  /** Is verified via face recognition */
  isVerified: boolean;
  /** Last UBI claim timestamp */
  lastClaimTime?: number;
  /** Current G$ balance */
  balance?: string;
  /** SuperToken balance for streaming */
  superTokenBalance?: string;
}

export interface GDollarReward {
  /** Unique reward ID */
  id: UUID;
  /** Family member receiving reward */
  recipientId: UUID;
  /** Amount in G$ (wei format) */
  amount: string;
  /** Reward reason/trigger */
  reason: string;
  /** Interaction type that triggered reward */
  interactionType: FamilyInteractionType;
  /** Quality score of the interaction */
  qualityScore: number;
  /** Timestamp of reward */
  timestamp: number;
  /** Transaction hash if distributed */
  transactionHash?: string;
  /** Reward status */
  status: "pending" | "distributed" | "failed";
}

export interface GDollarTransaction {
  /** Transaction hash */
  hash: string;
  /** From address */
  from: string;
  /** To address */
  to: string;
  /** Amount in G$ (wei format) */
  amount: string;
  /** Transaction type */
  type: "transfer" | "transferAndCall" | "stream" | "claim";
  /** Transaction data (for transferAndCall) */
  data?: string;
  /** Block number */
  blockNumber?: number;
  /** Gas used */
  gasUsed?: string;
  /** Transaction status */
  status: "pending" | "confirmed" | "failed";
  /** Timestamp */
  timestamp: number;
}

export interface FaceVerificationResult {
  /** Is verification successful */
  success: boolean;
  /** Verification confidence score */
  confidence: number;
  /** FaceTec session ID */
  sessionId: string;
  /** Error message if failed */
  error?: string;
  /** User ID associated with verification */
  userId: UUID;
  /** Verification timestamp */
  timestamp: number;
}

export interface UBIClaimResult {
  /** Claim success status */
  success: boolean;
  /** Amount claimed in G$ (wei format) */
  amount: string;
  /** Transaction hash */
  transactionHash: string;
  /** Next eligible claim time */
  nextClaimTime: number;
  /** Error message if failed */
  error?: string;
}

export interface StreamingReward {
  /** Stream ID */
  streamId: string;
  /** Sender address */
  sender: string;
  /** Receiver address */
  receiver: string;
  /** Flow rate (G$ per second in wei) */
  flowRate: string;
  /** Stream start time */
  startTime: number;
  /** Stream end time (if applicable) */
  endTime?: number;
  /** Total amount streamed */
  totalStreamed: string;
  /** Stream status */
  status: "active" | "paused" | "cancelled" | "completed";
  /** Family context */
  familyContext: {
    familyId: UUID;
    streamType: "allowance" | "milestone" | "achievement" | "continuous_reward";
    metadata: Record<string, any>;
  };
}

export interface GDollarIdentityProfile {
  /** User ID */
  userId: UUID;
  /** Wallet address */
  walletAddress: string;
  /** Verification status */
  isVerified: boolean;
  /** Face verification data (anonymized) */
  verificationData?: {
    hash: string;
    expiryTime: number;
  };
  /** Family relationships */
  familyRelationships: {
    familyId: UUID;
    role: "parent" | "child" | "grandparent" | "sibling" | "other";
    verifiedBy?: UUID;
  }[];
  /** UBI eligibility */
  ubiEligible: boolean;
  /** Last activity timestamp */
  lastActivity: number;
}

export interface GoodCollectivePool {
  /** Pool ID */
  poolId: string;
  /** Pool name */
  name: string;
  /** Pool description */
  description: string;
  /** Pool type */
  type: "family_climate" | "community_ubi" | "education" | "health";
  /** Total pool size in G$ (wei format) */
  totalSize: string;
  /** Current contributions in G$ (wei format) */
  currentContributions: string;
  /** Number of contributors */
  contributorCount: number;
  /** Family contributions */
  familyContributions: {
    familyId: UUID;
    amount: string;
    timestamp: number;
  }[];
  /** Pool rewards distributed */
  rewardsDistributed: string;
  /** Pool status */
  status: "active" | "completed" | "paused";
}

export type FamilyInteractionType = 
  | "wisdom_shared" 
  | "conflict_resolved" 
  | "empathy_expressed" 
  | "growth_achieved" 
  | "presence_practiced" 
  | "generational_bridge";

export interface GDollarFamilyMetrics {
  /** Family ID */
  familyId: UUID;
  /** Total G$ earned by family */
  totalEarned: string;
  /** G$ earned this period */
  periodEarned: string;
  /** Number of positive interactions */
  positiveInteractions: number;
  /** Average interaction quality score */
  averageQualityScore: number;
  /** Cross-generational interaction count */
  crossGenerationalInteractions: number;
  /** Conflict resolutions */
  conflictResolutions: number;
  /** Active streams */
  activeStreams: number;
  /** UBI pool contributions */
  ubiContributions: string;
  /** Family health score (0-100) */
  healthScore: number;
}

export interface GDollarEnvironment {
  GOODDOLLAR_NETWORK?: "celo" | "fuse";
  GOODDOLLAR_TOKEN_ADDRESS?: string;
  GOODDOLLAR_SUPER_TOKEN_ADDRESS?: string;
  GOODDOLLAR_RPC_URL?: string;
  GOODDOLLAR_PRIVATE_KEY?: string;
  GOODDOLLAR_ENABLE_FACE_VERIFICATION?: string;
  GOODDOLLAR_ENABLE_UBI_CLAIM?: string;
  GOODDOLLAR_ENABLE_STREAMING?: string;
  GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER?: string;
  GOODDOLLAR_FACETEC_PRODUCTION_KEY?: string;
  GOODDOLLAR_GOODCOLLECTIVE_API_URL?: string;
  GOODDOLLAR_REWARD_MULTIPLIER?: string;
}