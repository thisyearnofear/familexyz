import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';
import { 
  HCS10FamilyMessage, 
  HCS10BaseMessage,
  isHCS10Message,
  isHCS10FamilyInteraction,
  isHCS10FamilyMilestone,
  isHCS10FamilyReward,
  isHCS10FamilyTopicRegistration
} from '../types/hcs10.js';

export interface HederaStandardsConfig {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
}

export interface ParsedHCS10Message {
  isValid: boolean;
  messageType?: string;
  message?: HCS10FamilyMessage;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Service for HCS-10 message parsing, validation, and family interaction processing
 * Provides utilities for working with HCS-10 compliant family messages
 */
export class HederaStandardsService {
  private client: Client;
  private config: HederaStandardsConfig;

  constructor(config: HederaStandardsConfig) {
    this.config = config;
    
    // Initialize Hedera client
    this.client = config.network === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    const privateKey = PrivateKey.fromString(config.privateKey);
    const accountId = AccountId.fromString(config.accountId);
    
    this.client.setOperator(accountId, privateKey);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Service is ready to use
  }

  /**
   * Parse and validate HCS-10 message from raw topic message content
   */
  parseHCS10Message(rawMessage: string): ParsedHCS10Message {
    try {
      const parsed = JSON.parse(rawMessage);
      
      // Check if it's a valid HCS-10 base message
      if (!isHCS10Message(parsed)) {
        return {
          isValid: false,
          error: 'Message does not conform to HCS-10 base structure'
        };
      }

      // Determine message type and validate accordingly
      if (isHCS10FamilyInteraction(parsed)) {
        return {
          isValid: true,
          messageType: 'family_interaction',
          message: parsed
        };
      }

      if (isHCS10FamilyMilestone(parsed)) {
        return {
          isValid: true,
          messageType: 'family_milestone',
          message: parsed
        };
      }

      if (isHCS10FamilyReward(parsed)) {
        return {
          isValid: true,
          messageType: 'family_reward',
          message: parsed
        };
      }

      if (isHCS10FamilyTopicRegistration(parsed)) {
        return {
          isValid: true,
          messageType: 'topic_registration',
          message: parsed
        };
      }

      return {
        isValid: false,
        error: 'Unknown HCS-10 family message type'
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Failed to parse message: ${error instanceof Error ? error.message : 'Invalid JSON'}`
      };
    }
  }

  /**
   * Validate HCS-10 message structure and content
   */
  validateHCS10Message(message: HCS10FamilyMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate base message structure
    if (!message.standard || message.standard !== 'HCS-10') {
      errors.push('Missing or invalid standard field');
    }

    if (!message.version || message.version !== '1.0') {
      errors.push('Missing or invalid version field');
    }

    if (!message.timestamp || typeof message.timestamp !== 'number') {
      errors.push('Missing or invalid timestamp field');
    }

    if (!message.messageId || typeof message.messageId !== 'string') {
      errors.push('Missing or invalid messageId field');
    }

    if (!message.sender || typeof message.sender !== 'string') {
      errors.push('Missing or invalid sender field');
    }

    if (!message.topicId || typeof message.topicId !== 'string') {
      errors.push('Missing or invalid topicId field');
    }

    // Validate payload based on message type
    if (message.type === 'family_interaction') {
      const payload = message.payload;
      if (!payload.familyId) errors.push('Missing familyId in payload');
      if (!payload.agentType) errors.push('Missing agentType in payload');
      if (!payload.interactionType) errors.push('Missing interactionType in payload');
      if (!payload.participants || !Array.isArray(payload.participants)) {
        errors.push('Missing or invalid participants array');
      }
      if (!payload.sentiment) warnings.push('Missing sentiment analysis');
    }

    if (message.type === 'family_milestone') {
      const payload = message.payload;
      if (!payload.familyId) errors.push('Missing familyId in payload');
      if (!payload.milestoneType) errors.push('Missing milestoneType in payload');
      if (!payload.description) errors.push('Missing description in payload');
      if (!payload.participants || !Array.isArray(payload.participants)) {
        errors.push('Missing or invalid participants array');
      }
    }

    if (message.type === 'family_reward') {
      const payload = message.payload;
      if (!payload.familyId) errors.push('Missing familyId in payload');
      if (!payload.recipient) errors.push('Missing recipient in payload');
      if (typeof payload.amount !== 'number' || payload.amount <= 0) {
        errors.push('Invalid reward amount');
      }
      if (!payload.reason) errors.push('Missing reward reason');
    }

    if (message.type === 'topic_registration') {
      const payload = message.payload;
      if (!payload.familyId) errors.push('Missing familyId in payload');
      if (!payload.topicId) errors.push('Missing topicId in payload');
      if (!payload.memo) errors.push('Missing memo in payload');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract family interactions from HCS-10 messages
   */
  extractFamilyInteractions(messages: HCS10FamilyMessage[]): Array<{
    familyId: string;
    timestamp: number;
    interactionType: string;
    participants: string[];
    sentiment?: any;
    healthScore?: number;
  }> {
    return messages
      .filter(msg => msg.type === 'family_interaction')
      .map(msg => ({
        familyId: msg.payload.familyId,
        timestamp: msg.timestamp,
        interactionType: msg.payload.interactionType,
        participants: msg.payload.participants,
        sentiment: msg.payload.sentiment,
        healthScore: msg.payload.sentiment?.healthScore
      }));
  }

  /**
   * Extract family milestones from HCS-10 messages
   */
  extractFamilyMilestones(messages: HCS10FamilyMessage[]): Array<{
    familyId: string;
    timestamp: number;
    milestoneType: string;
    description: string;
    participants: string[];
    rewardAmount?: number;
  }> {
    return messages
      .filter(msg => msg.type === 'family_milestone')
      .map(msg => ({
        familyId: msg.payload.familyId,
        timestamp: msg.timestamp,
        milestoneType: msg.payload.milestoneType,
        description: msg.payload.description,
        participants: msg.payload.participants,
        rewardAmount: msg.payload.rewardAmount
      }));
  }

  /**
   * Extract family rewards from HCS-10 messages
   */
  extractFamilyRewards(messages: HCS10FamilyMessage[]): Array<{
    familyId: string;
    timestamp: number;
    recipient: string;
    amount: number;
    tokenId?: string;
    reason: string;
    transactionId?: string;
  }> {
    return messages
      .filter(msg => msg.type === 'family_reward')
      .map(msg => ({
        familyId: msg.payload.familyId,
        timestamp: msg.timestamp,
        recipient: msg.payload.recipient,
        amount: msg.payload.amount,
        tokenId: msg.payload.tokenId,
        reason: msg.payload.reason,
        transactionId: msg.payload.transactionId
      }));
  }

  /**
   * Get statistics about HCS-10 message types
   */
  getMessageStatistics(messages: HCS10FamilyMessage[]): {
    total: number;
    byType: Record<string, number>;
    byFamily: Record<string, number>;
    timeRange: { earliest: number; latest: number } | null;
  } {
    const stats = {
      total: messages.length,
      byType: {} as Record<string, number>,
      byFamily: {} as Record<string, number>,
      timeRange: null as { earliest: number; latest: number } | null
    };

    if (messages.length === 0) {
      return stats;
    }

    let earliest = messages[0].timestamp;
    let latest = messages[0].timestamp;

    messages.forEach(msg => {
      // Count by type
      stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;

      // Count by family
      const familyId = msg.payload.familyId;
      if (familyId) {
        stats.byFamily[familyId] = (stats.byFamily[familyId] || 0) + 1;
      }

      // Track time range
      if (msg.timestamp < earliest) earliest = msg.timestamp;
      if (msg.timestamp > latest) latest = msg.timestamp;
    });

    stats.timeRange = { earliest, latest };
    return stats;
  }

  /**
   * Close the service and cleanup resources
   */
  async close(): Promise<void> {
    this.client.close();
  }
}