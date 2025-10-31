import { Client, PrivateKey, AccountId, TopicId } from '@hashgraph/sdk';
import { HederaConsensusService } from './HederaConsensusService.js';
import { HederaMirrorService } from './HederaMirrorService.js';
import { HederaStandardsService } from './HederaStandardsService.js';
import { HederaService } from './HederaService.js';
import { HCS10FamilyTopicRegistration } from '../types/hcs10.js';

export interface TopicRegistryConfig {
  hederaService: HederaService;
  registryTopicId?: string; // Central registry topic for discovery
}

export interface FamilyTopicInfo {
  familyId: string;
  topicId: string;
  purpose: 'family_chat' | 'milestone_tracking' | 'reward_distribution';
  adminKey?: string;
  memo: string;
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  registeredAt: number;
  lastActivity?: number;
  metadata?: Record<string, any>;
}

export interface AgentInfo {
  agentId: string;
  name: string;
  type: string;
  capabilities: string[];
  topicId?: string;
  accountId?: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: number;
  familyIds: string[];
  metadata?: Record<string, any>;
}

export interface DiscoveryQuery {
  familyId?: string;
  agentType?: string;
  capabilities?: string[];
  purpose?: string;
  limit?: number;
}

/**
 * Topic Registry Service for Family/Agent Discovery
 * Implements Track 4 requirements for multi-agent coordination
 */
export class HederaTopicRegistry {
  private hederaService: HederaService;
  private standardsService: HederaStandardsService;
  private config: TopicRegistryConfig;
  private registryTopicId: string;

  // In-memory cache for performance
  private topicCache = new Map<string, FamilyTopicInfo>();
  private agentCache = new Map<string, AgentInfo>();
  private lastCacheUpdate = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: TopicRegistryConfig) {
    this.config = config;
    this.hederaService = config.hederaService;
    
    // Create standards service with config from HederaService
    const hederaConfig = this.hederaService.getConfig();
    this.standardsService = new HederaStandardsService({
      accountId: hederaConfig.accountId,
      privateKey: hederaConfig.privateKey,
      network: hederaConfig.network === 'previewnet' ? 'testnet' : hederaConfig.network
    });
    
    // Use provided registry topic or create a default one
    this.registryTopicId = config.registryTopicId || '0.0.REGISTRY';
  }

  /**
   * Initialize the registry service
   */
  async initialize(): Promise<void> {
    await this.refreshCache();
  }

  /**
   * Register a family topic in the registry
   */
  async registerFamilyTopic(topicInfo: Omit<FamilyTopicInfo, 'registeredAt'>): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Create HCS-10 topic registration message
      const hederaConfig = this.hederaService.getConfig();
      const registrationMessage: HCS10FamilyTopicRegistration = {
        standard: 'HCS-10',
        version: '1.0',
        timestamp: Date.now(),
        messageId: `topic-reg-${topicInfo.familyId}-${Date.now()}`,
        sender: hederaConfig.accountId,
        topicId: this.registryTopicId,
        type: 'topic_registration',
        payload: {
          familyId: topicInfo.familyId,
          topicId: topicInfo.topicId,
          adminKey: topicInfo.adminKey,
          memo: topicInfo.memo,
          metadata: {
            purpose: topicInfo.purpose,
            permissions: topicInfo.permissions,
            registeredAt: Date.now(),
            ...topicInfo.metadata
          }
        }
      };

      // Submit to registry topic
      const result = await this.hederaService.consensus.submitHCS10Message(
        this.registryTopicId,
        registrationMessage
      );

      if (result.success) {
        // Update local cache
        const fullTopicInfo: FamilyTopicInfo = {
          ...topicInfo,
          registeredAt: Date.now()
        };
        this.topicCache.set(topicInfo.familyId, fullTopicInfo);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to register topic: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Register an agent in the registry
   */
  async registerAgent(agentInfo: Omit<AgentInfo, 'lastSeen'>): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      // Create agent discovery message as raw message (not HCS10 compliant)
      const discoveryMessage = {
        agentId: agentInfo.agentId,
        name: agentInfo.name,
        type: agentInfo.type,
        capabilities: agentInfo.capabilities,
        topicId: agentInfo.topicId,
        accountId: agentInfo.accountId,
        status: agentInfo.status,
        familyIds: agentInfo.familyIds,
        metadata: agentInfo.metadata,
        timestamp: Date.now(),
        messageType: 'agent_discovery'
      };

      // Submit to registry topic
      const result = await this.hederaService.consensus.submitInteractionDirect(
        this.registryTopicId,
        discoveryMessage as any
      );

      if (result.success) {
        // Update local cache
        const fullAgentInfo: AgentInfo = {
          ...agentInfo,
          lastSeen: Date.now()
        };
        this.agentCache.set(agentInfo.agentId, fullAgentInfo);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to register agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Discover family topics based on query criteria
   */
  async discoverFamilyTopics(query: DiscoveryQuery): Promise<FamilyTopicInfo[]> {
    await this.ensureFreshCache();

    let results = Array.from(this.topicCache.values());

    // Apply filters
    if (query.familyId) {
      results = results.filter(topic => topic.familyId === query.familyId);
    }

    if (query.purpose) {
      results = results.filter(topic => topic.purpose === query.purpose);
    }

    // Sort by last activity (most recent first)
    results.sort((a, b) => (b.lastActivity || b.registeredAt) - (a.lastActivity || a.registeredAt));

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Discover agents based on query criteria
   */
  async discoverAgents(query: DiscoveryQuery): Promise<AgentInfo[]> {
    await this.ensureFreshCache();

    let results = Array.from(this.agentCache.values());

    // Apply filters
    if (query.familyId) {
      results = results.filter(agent => agent.familyIds.includes(query.familyId!));
    }

    if (query.agentType) {
      results = results.filter(agent => agent.type === query.agentType);
    }

    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(agent => 
        query.capabilities!.some(cap => agent.capabilities.includes(cap))
      );
    }

    // Sort by last seen (most recent first)
    results.sort((a, b) => b.lastSeen - a.lastSeen);

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get topic information by family ID
   */
  async getFamilyTopic(familyId: string): Promise<FamilyTopicInfo | null> {
    await this.ensureFreshCache();
    return this.topicCache.get(familyId) || null;
  }

  /**
   * Get agent information by agent ID
   */
  async getAgent(agentId: string): Promise<AgentInfo | null> {
    await this.ensureFreshCache();
    return this.agentCache.get(agentId) || null;
  }

  /**
   * Update agent status (heartbeat)
   */
  async updateAgentStatus(agentId: string, status: 'online' | 'offline' | 'busy'): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      const heartbeatMessage = {
        agentId,
        status,
        lastActivity: new Date().toISOString(),
        activeConnections: 0, // Could be enhanced to track actual connections
        timestamp: Date.now(),
        messageType: 'heartbeat'
      };

      const result = await this.hederaService.consensus.submitInteractionDirect(
        this.registryTopicId,
        heartbeatMessage as any
      );

      if (result.success) {
        // Update local cache
        const agent = this.agentCache.get(agentId);
        if (agent) {
          agent.status = status;
          agent.lastSeen = Date.now();
          this.agentCache.set(agentId, agent);
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update agent status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalTopics: number;
    totalAgents: number;
    onlineAgents: number;
    familiesWithTopics: number;
    lastCacheUpdate: number;
  } {
    const onlineAgents = Array.from(this.agentCache.values())
      .filter(agent => agent.status === 'online').length;

    const familiesWithTopics = new Set(
      Array.from(this.topicCache.values()).map(topic => topic.familyId)
    ).size;

    return {
      totalTopics: this.topicCache.size,
      totalAgents: this.agentCache.size,
      onlineAgents,
      familiesWithTopics,
      lastCacheUpdate: this.lastCacheUpdate
    };
  }

  /**
   * Refresh the cache from the registry topic
   */
  private async refreshCache(): Promise<void> {
    try {
      // Get messages from registry topic using HederaService
      const messagesResponse = await this.hederaService.mirror.getTopicMessages(this.registryTopicId, {
        limit: 1000 // Adjust based on expected registry size
      });

      if (!messagesResponse.success || !messagesResponse.data) {
        console.warn('Failed to fetch registry messages:', messagesResponse.error);
        return;
      }

      // Clear existing cache
      this.topicCache.clear();
      this.agentCache.clear();

      // Process messages
      for (const msg of messagesResponse.data) {
        try {
          const messageContent = Buffer.from(msg.message, 'base64').toString();
          const parseResult = this.standardsService.parseHCS10Message(messageContent);

          if (!parseResult.isValid || !parseResult.message) {
            continue;
          }

          const hcs10Message = parseResult.message;

          if (hcs10Message.type === 'topic_registration') {
            const payload = hcs10Message.payload;
            const topicInfo: FamilyTopicInfo = {
              familyId: payload.familyId,
              topicId: payload.topicId,
              purpose: payload.metadata?.purpose || 'family_chat',
              adminKey: payload.adminKey,
              memo: payload.memo,
              permissions: payload.metadata?.permissions || { read: [], write: [], admin: [] },
              registeredAt: payload.metadata?.registeredAt || hcs10Message.timestamp,
              metadata: payload.metadata
            };
            this.topicCache.set(payload.familyId, topicInfo);
          }

          // Handle other message types (agent_discovery, heartbeat, etc.)
          // This would be expanded based on the actual message structure

        } catch (error) {
          // Skip invalid messages
          continue;
        }
      }

      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Failed to refresh registry cache:', error);
    }
  }

  /**
   * Ensure cache is fresh
   */
  private async ensureFreshCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshCache();
    }
  }

  /**
   * Close the registry service
   */
  async close(): Promise<void> {
    // Cleanup resources if needed
  }
}