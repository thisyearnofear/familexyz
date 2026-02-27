/**
 * Integration types - consolidated from services/
 */

export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  webhookUrl?: string;
  familyGroupId?: string;
}

export interface TelegramIntegrationStatus {
  isConnected: boolean;
  botUsername?: string;
  connectedGroups: number;
  lastActivity?: Date;
  error?: string;
}

export interface TelegramFamilyGroup {
  id: string;
  name: string;
  memberCount: number;
  agentsEnabled: string[];
  lastActivity: Date;
}

// Payout types
export interface PayoutStats {
  totalPayouts: number;
  totalAmount: number;
  averageAmount: number;
  lastPayoutDate?: Date;
  weeksCovered?: number;
}

export interface Payout {
  timestamp: number;
  amount: number;
  transactionId?: string;
  status?: "completed" | "pending" | "failed";
  reason?: string;
  scoreDelta?: number;
  multiplier?: number;
  familyId?: string;
}

export interface PayoutHistory {
  agentId: string;
  payouts: Payout[];
  stats?: PayoutStats;
}

export interface PayoutError {
  message: string;
  code?: string;
  retryable?: boolean;
  status?: number;
}
