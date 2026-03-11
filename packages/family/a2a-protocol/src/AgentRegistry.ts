import type { 
  AgentType, 
  AgentRegistryEntry, 
  AgentCapability,
  AgentResource 
} from "./types.js";

export class AgentRegistry {
  private registry: Map<AgentType, AgentRegistryEntry> = new Map();
  private resourceCache: Map<string, AgentResource> = new Map();

  registerAgent(
    agentType: AgentType,
    capabilities: AgentCapability[]
  ): AgentRegistryEntry {
    const entry: AgentRegistryEntry = {
      agentType,
      capabilities,
      registeredAt: Date.now(),
      lastActive: Date.now(),
    };
    
    this.registry.set(agentType, entry);
    
    for (const cap of capabilities) {
      this.resourceCache.set(`${agentType}:${cap.name}`, {
        id: `${agentType}:${cap.name}`,
        type: cap.type as "tool" | "insight" | "compute",
        name: cap.name,
        value: null,
      });
    }
    
    console.log(`[A2A] Registered agent: ${agentType} with ${capabilities.length} capabilities`);
    return entry;
  }

  unregisterAgent(agentType: AgentType): boolean {
    const entry = this.registry.get(agentType);
    if (!entry) return false;

    for (const cap of entry.capabilities) {
      this.resourceCache.delete(`${agentType}:${cap.name}`);
    }
    
    this.registry.delete(agentType);
    console.log(`[A2A] Unregistered agent: ${agentType}`);
    return true;
  }

  getAgent(agentType: AgentType): AgentRegistryEntry | undefined {
    return this.registry.get(agentType);
  }

  getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  getAgentCapabilities(agentType: AgentType): AgentCapability[] {
    const entry = this.registry.get(agentType);
    return entry?.capabilities ?? [];
  }

  getAvailableTools(): Array<AgentCapability & { agentType: AgentType }> {
    const tools: Array<AgentCapability & { agentType: AgentType }> = [];
    
    for (const [agentType, entry] of this.registry) {
      for (const cap of entry.capabilities) {
        if (cap.type === "tool" && cap.available) {
          tools.push({ ...cap, agentType });
        }
      }
    }
    
    return tools;
  }

  getAvailableInsights(): Array<AgentCapability & { agentType: AgentType }> {
    const insights: Array<AgentCapability & { agentType: AgentType }> = [];
    
    for (const [agentType, entry] of this.registry) {
      for (const cap of entry.capabilities) {
        if (cap.type === "insight" && cap.available) {
          insights.push({ ...cap, agentType });
        }
      }
    }
    
    return insights;
  }

  updateAgentActivity(agentType: AgentType): void {
    const entry = this.registry.get(agentType);
    if (entry) {
      entry.lastActive = Date.now();
    }
  }

  setCapabilityAvailability(
    agentType: AgentType,
    capabilityName: string,
    available: boolean
  ): boolean {
    const entry = this.registry.get(agentType);
    if (!entry) return false;

    const capability = entry.capabilities.find(c => c.name === capabilityName);
    if (!capability) return false;

    capability.available = available;
    return true;
  }

  getResource(agentType: AgentType, resourceName: string): AgentResource | undefined {
    return this.resourceCache.get(`${agentType}:${resourceName}`);
  }

  hasCapability(agentType: AgentType, capabilityName: string): boolean {
    const entry = this.registry.get(agentType);
    if (!entry) return false;
    return entry.capabilities.some(c => c.name === capabilityName && c.available);
  }
}

export const agentRegistry = new AgentRegistry();
