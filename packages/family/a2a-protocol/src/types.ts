export type AgentType = 
  | "wisdom"
  | "intimacy"
  | "generational-bridge"
  | "presence"
  | "growth"
  | "savings";

export type TradeType = 
  | "tool_license"
  | "insight_trade"
  | "compute_resource"
  | "capability_augment";

export type TradeStatus = 
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "failed";

export interface A2AMessage {
  id: string;
  sender: AgentType;
  recipient: AgentType;
  type: TradeType;
  payload: A2APayload;
  timestamp: number;
  expiresAt?: number;
}

export interface A2APayload {
  title: string;
  description: string;
  resource: AgentResource;
  cost: number;
  conditions?: TradeCondition[];
}

export interface AgentResource {
  id: string;
  type: "tool" | "insight" | "compute";
  name: string;
  value: unknown;
  metadata?: Record<string, unknown>;
}

export interface TradeCondition {
  type: "time_based" | "metric_based" | "event_based";
  description: string;
  parameters: Record<string, unknown>;
}

export interface Trade {
  id: string;
  message: A2AMessage;
  status: TradeStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
}

export interface AgentCapability {
  agentId: string;
  type: "tool" | "insight" | "data";
  name: string;
  description: string;
  cost: number;
  available: boolean;
}

export interface AgentRegistryEntry {
  agentType: AgentType;
  capabilities: AgentCapability[];
  registeredAt: number;
  lastActive: number;
}

export interface TradeResult {
  success: boolean;
  tradeId: string;
  error?: string;
  result?: unknown;
}

export interface A2ATradeLog {
  tradeId: string;
  sender: AgentType;
  recipient: AgentType;
  type: TradeType;
  resourceId: string;
  cost: number;
  status: TradeStatus;
  timestamp: number;
  transactionId?: string;
}
