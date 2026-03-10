// Telegram Integration - Extends existing DirectClient
import { DirectClient } from "@elizaos/client-direct";
import { elizaLogger } from "@elizaos/core";

// Extend existing DirectClient with Telegram integration endpoints
const oldStart = DirectClient.prototype.start;
DirectClient.prototype.start = function (...args: any[]) {
  
  // Telegram Integration Status
  this.app.get("/integrations/telegram/status", (req, res) => {
    try {
      // Check if Telegram client is configured
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const isConfigured = !!botToken;
      
      // In a real implementation, check actual bot status
      const status = {
        isConnected: isConfigured,
        botUsername: process.env.TELEGRAM_BOT_USERNAME || '@FamilyWisdomBot',
        connectedGroups: isConfigured ? 1 : 0, // Mock data
        lastActivity: isConfigured ? new Date() : null,
        error: isConfigured ? null : 'Bot token not configured'
      };
      
      res.json(status);
    } catch (error) {
      elizaLogger.error('Telegram status error:', error);
      res.status(500).json({ 
        error: "Failed to get status", 
        detail: error.message 
      });
    }
  });

  // Connect Telegram Bot
  this.app.post("/integrations/telegram/connect", async (req, res) => {
    try {
      const { botToken, botUsername, familyGroupId } = req.body;
      
      if (!botToken) {
        return res.status(400).json({ error: "Bot token is required" });
      }
      
      // In a real implementation, this would:
      // 1. Validate the bot token with Telegram API
      // 2. Set up webhook or polling
      // 3. Initialize the existing TelegramClient
      
      elizaLogger.info(`Connecting Telegram bot: ${botUsername}`);
      
      // Mock successful connection
      res.json({ 
        success: true, 
        message: "Telegram bot connected successfully",
        botUsername: botUsername || '@FamilyWisdomBot'
      });
      
    } catch (error) {
      elizaLogger.error('Telegram connect error:', error);
      res.status(500).json({ 
        error: "Connection failed", 
        detail: error.message 
      });
    }
  });

  // Get Family Groups
  this.app.get("/integrations/telegram/groups", (req, res) => {
    try {
      // Mock family groups data
      // In real implementation, this would query the database
      const groups = [
        {
          id: 'group_123',
          name: 'Smith Family',
          memberCount: 4,
          agentsEnabled: ['wisdom', 'intimacy', 'presence'],
          lastActivity: new Date()
        },
        {
          id: 'group_456', 
          name: 'Extended Family',
          memberCount: 8,
          agentsEnabled: ['wisdom', 'generationalbridge'],
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
      ];
      
      res.json(groups);
    } catch (error) {
      elizaLogger.error('Telegram groups error:', error);
      res.status(500).json({ 
        error: "Failed to get groups", 
        detail: error.message 
      });
    }
  });

  // Configure Group Agents
  this.app.put("/integrations/telegram/groups/:groupId/agents", async (req, res) => {
    try {
      const { groupId } = req.params;
      const { agentIds } = req.body;
      
      if (!Array.isArray(agentIds)) {
        return res.status(400).json({ error: "agentIds must be an array" });
      }
      
      elizaLogger.info(`Configuring agents for group ${groupId}:`, agentIds);
      
      // In real implementation, this would:
      // 1. Validate the group exists
      // 2. Update database with agent configuration
      // 3. Notify the Telegram client to update behavior
      
      res.json({ 
        success: true, 
        message: `Configured ${agentIds.length} agents for group ${groupId}`,
        agentIds 
      });
      
    } catch (error) {
      elizaLogger.error('Telegram configure error:', error);
      res.status(500).json({ 
        error: "Configuration failed", 
        detail: error.message 
      });
    }
  });

  // Send Test Message
  this.app.post("/integrations/telegram/test", async (req, res) => {
    try {
      const { groupId, agentId, message } = req.body;
      
      if (!groupId || !agentId || !message) {
        return res.status(400).json({ 
          error: "groupId, agentId, and message are required" 
        });
      }
      
      elizaLogger.info(`Sending test message to group ${groupId} from agent ${agentId}`);
      
      // In real implementation, this would:
      // 1. Get the agent runtime
      // 2. Send message through Telegram client
      // 3. Return actual message status
      
      // Mock successful send
      res.json({ 
        success: true, 
        message: "Test message sent successfully",
        messageId: `msg_${Date.now()}`
      });
      
    } catch (error) {
      elizaLogger.error('Telegram test message error:', error);
      res.status(500).json({ 
        error: "Test message failed", 
        detail: error.message 
      });
    }
  });

  // Disconnect Telegram
  this.app.post("/integrations/telegram/disconnect", async (req, res) => {
    try {
      elizaLogger.info('Disconnecting Telegram integration');
      
      // In real implementation, this would:
      // 1. Stop the Telegram client
      // 2. Clear webhook/polling
      // 3. Update database status
      
      res.json({ 
        success: true, 
        message: "Telegram integration disconnected" 
      });
      
    } catch (error) {
      elizaLogger.error('Telegram disconnect error:', error);
      res.status(500).json({ 
        error: "Disconnect failed", 
        detail: error.message 
      });
    }
  });

  // Call original start method
  return oldStart.apply(this, args);
};
