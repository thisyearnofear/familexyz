export interface HederaConfig {
    network: "testnet" | "mainnet" | "previewnet";
    accountId: string;
    privateKey: string;
    familyTopicId?: string;
    familyHealthTokenId?: string;
    achievementNftId?: string;
    treasuryAccountId?: string;
    // Optional Mirror Node base URL override
    mirrorNodeUrl?: string;
}

export interface HederaFamilyMetrics {
    familyId: string;
    agentId: string;
    timestamp: number;
    sentiment: SentimentAnalysis;
    healthScore: number;
    messageHash: string;
    interactionType: InteractionType;
}

export interface SentimentAnalysis {
    positive: number;
    negative: number;
    neutral?: number;
}

export type InteractionType =
    | "wisdom"
    | "intimacy"
    | "generational-bridge"
    | "presence"
    | "growth";

export interface FamilyInteraction {
    id: string;
    familyId: string;
    agentId: string;
    userId: string;
    timestamp: number;
    content: string;
    sentiment: SentimentAnalysis;
    healthScore: number;
    interactionType: InteractionType;
    messageHash: string;
    consensusTimestamp?: string;
    transactionId?: string;
}

export interface TokenReward {
    recipientId: string;
    amount: number;
    reason: string;
    transactionId: string;
    timestamp: number;
}

export interface FamilyHealthToken {
    tokenId: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
}

export interface AchievementNFT {
    tokenId: string;
    serialNumber: number;
    metadata: AchievementMetadata;
    owner: string;
    mintedAt: number;
}

export interface AchievementMetadata {
    name: string;
    description: string;
    image: string;
    attributes: AchievementAttribute[];
    familyId: string;
    achievementType: AchievementType;
    unlockedAt: number;
}

export interface AchievementAttribute {
    trait_type: string;
    value: string | number;
}

export type AchievementType =
    | "first_positive_interaction"
    | "week_streak"
    | "month_streak"
    | "family_harmony"
    | "wisdom_seeker"
    | "bridge_builder"
    | "presence_master"
    | "growth_champion";

export interface HederaServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    transactionId?: string;
    consensusTimestamp?: string;
}

export interface BatchOperation<T> {
    items: T[];
    batchId: string;
    timestamp: number;
    status: "pending" | "processing" | "completed" | "failed";
}

export interface ConsensusMessage {
    topicId: string;
    message: string;
    timestamp: number;
    consensusTimestamp?: string;
    transactionId?: string;
}

export interface TopicInfo {
    topicId: string;
    adminKey?: string;
    submitKey?: string;
    memo?: string;
    autoRenewAccount?: string;
    autoRenewPeriod?: number;
}

export interface AccountBalance {
    accountId: string;
    hbarBalance: number;
    tokens: TokenBalance[];
    nfts: NFTBalance[];
}

export interface TokenBalance {
    tokenId: string;
    balance: number;
    decimals: number;
    symbol?: string;
}

export interface NFTBalance {
    tokenId: string;
    serialNumbers: number[];
    count: number;
}

export interface HederaError {
    code: string;
    message: string;
    transactionId?: string;
    timestamp: number;
}

export interface PerformanceMetrics {
    operationsPerSecond: number;
    averageLatency: number;
    errorRate: number;
    batchEfficiency: number;
    lastUpdated: number;
}

export interface HederaCache {
    consensusMessages: Map<string, ConsensusMessage[]>;
    accountBalances: Map<string, AccountBalance>;
    tokenInfo: Map<string, FamilyHealthToken>;
    lastUpdated: Map<string, number>;
}

// Event types for real-time updates
export interface HederaEvent {
    type: HederaEventType;
    data: any;
    timestamp: number;
    familyId?: string;
}

export type HederaEventType =
    | "consensus_message"
    | "token_transfer"
    | "nft_mint"
    | "account_balance_update"
    | "topic_message"
    | "error";

// Configuration for performance optimization
export interface PerformanceConfig {
    batchSize: number;
    batchInterval: number; // milliseconds
    maxRetries: number;
    retryDelay: number; // milliseconds
    cacheTimeout: number; // milliseconds
    enableCompression: boolean;
}

// Smart contract related types
export interface ContractFunction {
    name: string;
    inputs: ContractParameter[];
    outputs: ContractParameter[];
}

export interface ContractParameter {
    name: string;
    type: string;
    value?: any;
}

export interface SmartContractCall {
    contractId: string;
    functionName: string;
    parameters: ContractParameter[];
    gas: number;
    payableAmount?: number;
}

export interface FamilyGovernanceState {
    familyId: string;
    members: FamilyMember[];
    healthThreshold: number;
    votingPeriod: number;
    proposalCount: number;
    isActive: boolean;
}

export interface FamilyMember {
    accountId: string;
    joinedAt: number;
    healthScore: number;
    role: FamilyRole;
    isActive: boolean;
    totalInteractions: number;
    lastInteraction: number;
}

export type FamilyRole = "admin" | "parent" | "child" | "guardian" | "observer";

// Utility types
export type HederaNetwork = "testnet" | "mainnet" | "previewnet";
export type TransactionStatus = "pending" | "success" | "failed" | "expired";
export type CacheKey = string;

// HCS-10 exports
export * from "./hcs10";

// Re-export commonly used types
export type {
    Client,
    AccountId,
    PrivateKey,
    TopicId,
    TokenId,
    ContractId,
    TransactionResponse,
    TransactionReceipt,
    Status,
} from "@hashgraph/sdk";
