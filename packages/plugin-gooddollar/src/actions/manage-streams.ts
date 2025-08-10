import {
  Action,
  ActionExample,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";
import { StreamingService } from "../services/streaming.js";
import { IdentityService } from "../services/identity.js";
import { ethers } from "ethers";

export const manageStreamsAction: Action = {
  name: "MANAGE_STREAMS",
  similes: [
    "SHOW_STREAMS",
    "LIST_STREAMS",
    "CHECK_STREAMS",
    "STREAM_STATUS",
    "MY_STREAMS",
    "UPDATE_STREAM",
    "CANCEL_STREAM",
    "STOP_STREAM",
  ],
  description: "Manage G$ streams - view, update, or cancel active streaming rewards and allowances",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    const manageKeywords = [
      "show",
      "list",
      "check",
      "status",
      "manage",
      "view",
      "cancel",
      "stop",
      "update",
      "pause",
    ];
    
    const streamKeywords = [
      "stream",
      "streams",
      "allowance",
      "streaming",
      "flow",
      "continuous",
    ];
    
    const hasManage = manageKeywords.some(keyword => content.includes(keyword));
    const hasStream = streamKeywords.some(keyword => content.includes(keyword));
    
    return hasManage && hasStream;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("🔍 Processing stream management request");
      
      // Get services
      const streamingService = runtime.getService<StreamingService>(StreamingService);
      const identityService = runtime.getService<IdentityService>(IdentityService);
      
      if (!streamingService) {
        throw new Error("Streaming service not available");
      }
      
      if (!identityService) {
        throw new Error("Identity service not available");
      }

      if (!streamingService.isStreamingEnabled()) {
        const disabledContent: Content = {
          text: "Streaming is currently disabled. Please enable streaming in your configuration.",
          action: "MANAGE_STREAMS",
        };
        callback?.(disabledContent);
        return false;
      }

      // Get user profile
      const userProfile = await identityService.getIdentityProfile(message.userId);
      if (!userProfile?.isVerified || !userProfile.walletAddress) {
        const notVerifiedContent: Content = {
          text: "You need to be verified to manage streams. Please complete your identity verification first.",
          action: "MANAGE_STREAMS",
        };
        callback?.(notVerifiedContent);
        return false;
      }

      const userAddress = userProfile.walletAddress;
      
      // Check if user wants to cancel a specific stream
      const cancelMatch = message.content.text.match(/cancel|stop.*stream[:\s]+([a-zA-Z0-9_-]+)/i);
      if (cancelMatch) {
        const streamId = cancelMatch[1];
        return await handleStreamCancellation(streamingService, streamId, callback);
      }

      // Get active streams
      const activeStreams = await streamingService.getActiveStreams(userAddress);
      
      if (activeStreams.length === 0) {
        const noStreamsContent: Content = {
          text: `📊 **Stream Management Dashboard**\n\n` +
                `👤 Address: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}\n` +
                `🌊 Active Streams: 0\n\n` +
                `No active streams found. You can create streams with:\n` +
                `• "Set up monthly allowance of 50 G$ for my child 0x..."\n` +
                `• "Create milestone stream of 100 G$ over 30 days for completing chores"\n` +
                `• "Start continuous reward of 2 G$/hour for good behavior"\n\n` +
                `💡 Streams provide automatic, real-time G$ distribution to family members!`,
          action: "MANAGE_STREAMS",
        };
        callback?.(noStreamsContent);
        return true;
      }

      // Calculate earnings estimates
      const estimates = await streamingService.calculateEstimatedEarnings(activeStreams, 24);
      
      // Build stream list
      const streamList = activeStreams.map((stream, index) => {
        const flowRatePerHour = ethers.formatEther(BigInt(stream.flowRate) * BigInt(3600));
        const dailyFlow = ethers.formatEther(BigInt(stream.flowRate) * BigInt(86400));
        const totalStreamed = ethers.formatEther(stream.totalStreamed);
        
        const typeEmoji = getStreamTypeEmoji(stream.familyContext.streamType);
        const direction = stream.sender === userAddress ? "📤 Outgoing" : "📥 Incoming";
        const counterparty = stream.sender === userAddress ? stream.receiver : stream.sender;
        
        const runningTime = Math.floor((Date.now() - stream.startTime) / (1000 * 60 * 60)); // hours
        
        return `**${index + 1}. ${typeEmoji} ${stream.familyContext.streamType.toUpperCase()}** ${direction}\n` +
               `   💰 Rate: ${flowRatePerHour} G$/hour (${dailyFlow} G$/day)\n` +
               `   👥 ${stream.sender === userAddress ? 'To' : 'From'}: ${counterparty.slice(0, 8)}...\n` +
               `   📈 Total Streamed: ${totalStreamed} G$\n` +
               `   ⏱️ Running: ${runningTime} hours\n` +
               `   🆔 ID: ${stream.streamId.slice(0, 12)}...`;
      });

      const managementContent: Content = {
        text: `📊 **Stream Management Dashboard**\n\n` +
              `👤 Address: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}\n` +
              `🌊 Active Streams: ${activeStreams.length}\n\n` +
              `**💰 Earnings Summary:**\n` +
              `• Current Rate: ${estimates.totalPerHour} G$/hour\n` +
              `• Estimated 24h: ${estimates.estimatedEarnings} G$\n` +
              `• Total Flowing: ${ethers.formatEther(activeStreams.reduce((sum, s) => sum + BigInt(s.totalStreamed), BigInt(0)))} G$\n\n` +
              `**🌊 Active Streams:**\n\n${streamList.join('\n\n')}\n\n` +
              `**📋 Management Options:**\n` +
              `• "Cancel stream [stream_id]" - Stop a specific stream\n` +
              `• "Update stream [stream_id] to [new_amount] G$/hour" - Change flow rate\n` +
              `• "Show stream [stream_id] details" - View detailed information\n\n` +
              `💡 All streams are real-time and funds flow every second!`,
        action: "MANAGE_STREAMS",
        metadata: {
          activeStreams: activeStreams.length,
          totalPerHour: estimates.totalPerHour,
          estimatedDaily: estimates.estimatedEarnings,
          userAddress,
        },
      };

      elizaLogger.success(`📊 Stream dashboard displayed: ${activeStreams.length} active streams`);
      callback?.(managementContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ Stream management failed:", error);
      
      const errorContent: Content = {
        text: `Failed to manage streams: ${error.message}\n\n` +
              `This might be due to:\n` +
              `• Network connectivity issues\n` +
              `• Service configuration problems\n` +
              `• Temporary system issues\n\n` +
              `Please try again or contact support if the problem persists.`,
        action: "MANAGE_STREAMS",
      };
      
      callback?.(errorContent);
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show me my active streams",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📊 **Stream Management Dashboard**\n\n👤 Address: 0x1234...5678\n🌊 Active Streams: 2\n\n**💰 Earnings Summary:**\n• Current Rate: 5.137 G$/hour\n• Estimated 24h: 123.29 G$\n• Total Flowing: 45.67 G$\n\n**🌊 Active Streams:**\n\n**1. 💰 ALLOWANCE** 📤 Outgoing\n   💰 Rate: 3.333 G$/hour (80.0 G$/day)\n   👥 To: 0x742d35Cc...\n   📈 Total Streamed: 25.5 G$\n   ⏱️ Running: 8 hours\n   🆔 ID: stream_abc123...\n\n**2. 🎯 MILESTONE** 📥 Incoming\n   💰 Rate: 1.804 G$/hour (43.29 G$/day)\n   👥 From: 0x9876543...\n   📈 Total Streamed: 20.17 G$\n   ⏱️ Running: 12 hours\n   🆔 ID: stream_def456...\n\n**📋 Management Options:**\n• \"Cancel stream [stream_id]\" - Stop a specific stream\n• \"Update stream [stream_id] to [new_amount] G$/hour\" - Change flow rate\n• \"Show stream [stream_id] details\" - View detailed information\n\n💡 All streams are real-time and funds flow every second!",
          action: "MANAGE_STREAMS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Cancel stream stream_abc123456",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🛑 **Stream Cancelled Successfully**\n\n🆔 Stream ID: stream_abc123456\n💰 Final Amount Streamed: 45.67 G$\n📄 Transaction: 0xabcdef1234567890...\n\n⏱️ The stream has been stopped and no more funds will flow.\n💳 All streamed funds have been properly distributed.\n\n✅ Stream cancellation complete!",
          action: "MANAGE_STREAMS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "List my streaming payments",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📊 **Stream Management Dashboard**\n\n👤 Address: 0x1234...5678\n🌊 Active Streams: 0\n\nNo active streams found. You can create streams with:\n• \"Set up monthly allowance of 50 G$ for my child 0x...\"\n• \"Create milestone stream of 100 G$ over 30 days for completing chores\"\n• \"Start continuous reward of 2 G$/hour for good behavior\"\n\n💡 Streams provide automatic, real-time G$ distribution to family members!",
          action: "MANAGE_STREAMS",
        },
      },
    ],
  ] as ActionExample[][],
};

async function handleStreamCancellation(
  streamingService: StreamingService,
  streamId: string,
  callback?: HandlerCallback
): Promise<boolean> {
  try {
    // Get stream details first
    const streamDetails = await streamingService.getStreamDetails(streamId);
    if (!streamDetails) {
      const notFoundContent: Content = {
        text: `Stream ${streamId} not found. Please check the stream ID and try again.`,
        action: "MANAGE_STREAMS",
      };
      callback?.(notFoundContent);
      return false;
    }

    // Cancel the stream
    const result = await streamingService.cancelStream(streamId);
    const finalAmount = ethers.formatEther(result.finalAmount);

    const successContent: Content = {
      text: `🛑 **Stream Cancelled Successfully**\n\n` +
            `🆔 Stream ID: ${streamId}\n` +
            `💰 Final Amount Streamed: ${finalAmount} G$\n` +
            `📄 Transaction: ${result.transactionHash.slice(0, 16)}...\n\n` +
            `⏱️ The stream has been stopped and no more funds will flow.\n` +
            `💳 All streamed funds have been properly distributed.\n\n` +
            `✅ Stream cancellation complete!`,
      action: "MANAGE_STREAMS",
      metadata: {
        streamId,
        finalAmount,
        transactionHash: result.transactionHash,
      },
    };

    callback?.(successContent);
    return true;

  } catch (error) {
    elizaLogger.error("❌ Stream cancellation failed:", error);
    
    const errorContent: Content = {
      text: `Failed to cancel stream: ${error.message}\n\n` +
            `Please check the stream ID and try again.`,
      action: "MANAGE_STREAMS",
    };
    
    callback?.(errorContent);
    return false;
  }
}

function getStreamTypeEmoji(streamType: string): string {
  const emojis = {
    "allowance": "💰",
    "milestone": "🎯", 
    "continuous_reward": "🔄",
    "achievement": "🏆",
  };
  
  return emojis[streamType] || "🌊";
}

export default manageStreamsAction;