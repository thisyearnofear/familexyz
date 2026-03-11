import type { 
  AgentType, 
  A2AMessage, 
  Trade, 
  TradeResult, 
  TradeStatus,
  A2ATradeLog 
} from "./types.js";
import { AgentRegistry, agentRegistry } from "./AgentRegistry.js";

export interface A2AHederaService {
  submitA2ATrade: (log: A2ATradeLog) => Promise<{ success: boolean; transactionId?: string }>;
}

export class TradeExecutor {
  private trades: Map<string, Trade> = new Map();
  private hederaService?: A2AHederaService;
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry = agentRegistry, hederaService?: A2AHederaService) {
    this.registry = registry;
    this.hederaService = hederaService;
  }

  setHederaService(service: A2AHederaService): void {
    this.hederaService = service;
  }

  async proposeTrade(message: A2AMessage): Promise<Trade> {
    if (!this.isValidTrade(message)) {
      throw new Error(`Invalid trade proposal from ${message.sender} to ${message.recipient}`);
    }

    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.trades.set(trade.id, trade);
    console.log(`[A2A] Trade proposed: ${trade.id} from ${message.sender} to ${message.recipient}`);
    
    return trade;
  }

  async acceptTrade(tradeId: string): Promise<TradeResult> {
    const trade = this.trades.get(tradeId);
    if (!trade) {
      return { success: false, tradeId, error: "Trade not found" };
    }

    if (trade.status !== "pending") {
      return { success: false, tradeId, error: `Trade is not pending (current: ${trade.status})` };
    }

    trade.status = "accepted";
    trade.updatedAt = Date.now();

    const result = await this.executeTrade(trade);
    
    return {
      success: result.success,
      tradeId,
      error: result.error,
      result: result.data,
    };
  }

  async rejectTrade(tradeId: string, reason?: string): Promise<TradeResult> {
    const trade = this.trades.get(tradeId);
    if (!trade) {
      return { success: false, tradeId, error: "Trade not found" };
    }

    if (trade.status !== "pending") {
      return { success: false, tradeId, error: `Trade is not pending` };
    }

    trade.status = "rejected";
    trade.updatedAt = Date.now();
    trade.error = reason || "Rejected by recipient";

    await this.logTradeToHedera(trade, "rejected");
    
    console.log(`[A2A] Trade rejected: ${tradeId} - ${reason}`);
    
    return { success: true, tradeId };
  }

  private async executeTrade(trade: Trade): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const { message } = trade;
    const { sender, recipient, payload } = message;

    try {
      if (!this.registry.hasCapability(sender, payload.resource.name)) {
        throw new Error(`Sender ${sender} does not have resource ${payload.resource.name}`);
      }

      const result = await this.performTrade(sender, recipient, payload);

      trade.status = "completed";
      trade.updatedAt = Date.now();
      trade.completedAt = Date.now();

      await this.logTradeToHedera(trade, "completed");
      
      console.log(`[A2A] Trade completed: ${trade.id}`);
      
      return { success: true, data: result };
    } catch (error) {
      trade.status = "failed";
      trade.updatedAt = Date.now();
      trade.error = error instanceof Error ? error.message : "Unknown error";

      await this.logTradeToHedera(trade, "failed");
      
      return { success: false, error: trade.error };
    }
  }

  private async performTrade(
    sender: AgentType,
    recipient: AgentType,
    payload: A2AMessage["payload"]
  ): Promise<unknown> {
    switch (payload.resource.type) {
      case "tool":
        return this.executeToolLicense(sender, recipient, payload);
      case "insight":
        return this.executeInsightTrade(sender, recipient, payload);
      case "compute":
        return this.executeComputeTrade(sender, recipient, payload);
      default:
        throw new Error(`Unknown resource type: ${payload.resource.type}`);
    }
  }

  private async executeToolLicense(
    sender: AgentType,
    recipient: AgentType,
    payload: A2AMessage["payload"]
  ): Promise<{ toolName: string; licensedTo: AgentType; expiresAt?: number }> {
    console.log(`[A2A] Tool license: ${sender} -> ${recipient}: ${payload.resource.name}`);
    
    return {
      toolName: payload.resource.name,
      licensedTo: recipient,
      expiresAt: payload.conditions?.find(c => c.type === "time_based") 
        ? Date.now() + (payload.conditions[0].parameters["duration"] as number ?? 86400000)
        : undefined,
    };
  }

  private async executeInsightTrade(
    sender: AgentType,
    recipient: AgentType,
    payload: A2AMessage["payload"]
  ): Promise<{ insight: unknown; sharedBy: AgentType }> {
    console.log(`[A2A] Insight trade: ${sender} -> ${recipient}: ${payload.resource.name}`);
    
    return {
      insight: payload.resource.value,
      sharedBy: sender,
    };
  }

  private async executeComputeTrade(
    sender: AgentType,
    recipient: AgentType,
    payload: A2AMessage["payload"]
  ): Promise<{ computeUnits: number; provider: AgentType }> {
    const computeUnits = payload.conditions?.find(c => c.type === "metric_based")
      ? (payload.conditions[0].parameters["units"] as number ?? 100)
      : 100;

    console.log(`[A2A] Compute trade: ${sender} -> ${recipient}: ${computeUnits} units`);
    
    return {
      computeUnits,
      provider: sender,
    };
  }

  private async logTradeToHedera(trade: Trade, statusOverride?: TradeStatus): Promise<void> {
    if (!this.hederaService) {
      console.log(`[A2A] No Hedera service configured, skipping HCS log`);
      return;
    }

    const log: A2ATradeLog = {
      tradeId: trade.id,
      sender: trade.message.sender,
      recipient: trade.message.recipient,
      type: trade.message.type,
      resourceId: trade.message.payload.resource.id,
      cost: trade.message.payload.cost,
      status: statusOverride ?? trade.status,
      timestamp: trade.completedAt ?? trade.updatedAt,
    };

    try {
      const result = await this.hederaService.submitA2ATrade(log);
      if (result.success) {
        console.log(`[A2A] Trade logged to HCS: ${trade.id}, tx: ${result.transactionId}`);
      }
    } catch (error) {
      console.error(`[A2A] Failed to log trade to HCS:`, error);
    }
  }

  private isValidTrade(message: A2AMessage): boolean {
    if (!message.sender || !message.recipient) {
      return false;
    }

    if (message.sender === message.recipient) {
      return false;
    }

    if (!this.registry.getAgent(message.sender)) {
      return false;
    }

    if (!this.registry.getAgent(message.recipient)) {
      return false;
    }

    if (message.expiresAt && message.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  getTrade(tradeId: string): Trade | undefined {
    return this.trades.get(tradeId);
  }

  getTradesByStatus(status: TradeStatus): Trade[] {
    return Array.from(this.trades.values()).filter(t => t.status === status);
  }

  getTradesByAgent(agentType: AgentType): Trade[] {
    return Array.from(this.trades.values()).filter(
      t => t.message.sender === agentType || t.message.recipient === agentType
    );
  }
}

export const tradeExecutor = new TradeExecutor();
