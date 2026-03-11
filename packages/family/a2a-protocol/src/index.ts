export type {
  AgentType,
  TradeType,
  TradeStatus,
  A2AMessage,
  A2APayload,
  AgentResource,
  TradeCondition,
  Trade,
  AgentCapability,
  AgentRegistryEntry,
  TradeResult,
  A2ATradeLog,
} from "./types.js";

export { AgentRegistry, agentRegistry } from "./AgentRegistry.js";
export { TradeExecutor, tradeExecutor } from "./TradeExecutor.js";

import { AgentRegistry } from "./AgentRegistry.js";
import { TradeExecutor } from "./TradeExecutor.js";
import type { A2ATradeLog } from "./types.js";

export function initializeA2AProtocol(
  hederaService?: {
    submitA2ATrade: (log: A2ATradeLog) => Promise<{ success: boolean; transactionId?: string }>;
  }
): void {
  const registry = new AgentRegistry();
  const executor = new TradeExecutor(registry, hederaService);

  registry.registerAgent("wisdom", [
    { agentId: "wisdom", type: "tool", name: "conflict_resolution", description: "Framework for resolving family conflicts", cost: 10, available: true },
    { agentId: "wisdom", type: "tool", name: "empathy_coaching", description: "Empathy development exercises", cost: 8, available: true },
    { agentId: "wisdom", type: "insight", name: "emotional_patterns", description: "Family emotional pattern analysis", cost: 15, available: true },
  ]);

  registry.registerAgent("intimacy", [
    { agentId: "intimacy", type: "tool", name: "communication_frameworks", description: "Communication improvement tools", cost: 10, available: true },
    { agentId: "intimacy", type: "tool", name: "connection_activities", description: "Bonding activity suggestions", cost: 5, available: true },
    { agentId: "intimacy", type: "insight", name: "relationship_metrics", description: "Relationship health insights", cost: 12, available: true },
  ]);

  registry.registerAgent("presence", [
    { agentId: "presence", type: "tool", name: "mindfulness_exercises", description: "Mindfulness and meditation guides", cost: 5, available: true },
    { agentId: "presence", type: "tool", name: "digital_wellness", description: "Digital balance recommendations", cost: 5, available: true },
  ]);

  registry.registerAgent("growth", [
    { agentId: "growth", type: "tool", name: "challenge_creation", description: "Family challenge generator", cost: 8, available: true },
    { agentId: "growth", type: "insight", name: "growth_metrics", description: "Family growth analytics", cost: 10, available: true },
  ]);

  registry.registerAgent("generational-bridge", [
    { agentId: "generational-bridge", type: "tool", name: "story_prompts", description: "Intergenerational conversation starters", cost: 5, available: true },
    { agentId: "generational-bridge", type: "tool", name: "tradition_keeper", description: "Family tradition documentation", cost: 8, available: true },
  ]);

  registry.registerAgent("savings", [
    { agentId: "savings", type: "tool", name: "budget_planner", description: "Family budget planning tools", cost: 10, available: true },
    { agentId: "savings", type: "insight", name: "financial_patterns", description: "Family financial behavior insights", cost: 15, available: true },
  ]);

  console.log("[A2A] Protocol initialized with 6 agents");
}
