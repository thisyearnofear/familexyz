// Telegram Integration Service - Leverages existing backend client
import { API_CONFIG } from "@/lib/constants";

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

class TelegramIntegrationService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Get current Telegram integration status
   * Leverages existing backend API structure
   */
  async getStatus(): Promise<TelegramIntegrationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get Telegram status:', error);
      return {
        isConnected: false,
        connectedGroups: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Connect Telegram bot using existing client infrastructure
   */
  async connectBot(config: TelegramBotConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to connect Telegram bot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get family groups where bot is active
   */
  async getFamilyGroups(): Promise<TelegramFamilyGroup[]> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/groups`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get family groups:', error);
      return [];
    }
  }

  /**
   * Configure agents for a specific family group
   */
  async configureGroupAgents(groupId: string, agentIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/groups/${groupId}/agents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentIds })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to configure group agents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration failed'
      };
    }
  }

  /**
   * Send test message to verify bot functionality
   */
  async sendTestMessage(groupId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          agentId,
          message: 'Hello! This is a test message from your family agent. I\'m ready to help strengthen your family bonds! 🤖❤️'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send test message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test message failed'
      };
    }
  }

  /**
   * Disconnect Telegram integration
   */
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/telegram/disconnect`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect Telegram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      };
    }
  }

  /**
   * Get bot invite link for family groups
   */
  getBotInviteLink(botUsername: string): string {
    return `https://t.me/${botUsername.replace('@', '')}`;
  }

  /**
   * Generate family group setup instructions
   */
  getSetupInstructions(botUsername: string): string[] {
    return [
      `1. Add ${botUsername} to your family group chat`,
      '2. Make the bot an admin (required for full functionality)',
      '3. Type /start to activate family agents',
      '4. Use /help to see available commands',
      '5. Configure which agents are active in your group'
    ];
  }
}

// Export singleton instance
export const telegramIntegration = new TelegramIntegrationService();
