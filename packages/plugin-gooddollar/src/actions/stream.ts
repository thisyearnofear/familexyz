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

export const createStreamAction: Action = {
  name: "CREATE_STREAM",
  similes: [
    "START_ALLOWANCE",
    "STREAM_G$",
    "CREATE_ALLOWANCE",
    "SET_UP_STREAMING",
    "STREAM_REWARD",
    "CONTINUOUS_PAYMENT",
  ],
  description: "Create G$ streaming rewards including family allowances, milestone rewards, and continuous behavior incentives",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    const streamKeywords = [
      "stream",
      "allowance",
      "continuous",
      "monthly",
      "weekly",
      "daily reward",
      "ongoing",
    ];
    
    const paymentKeywords = [
      "g$",
      "gdollar",
      "gooddollar",
      "payment",
      "reward",
      "pay",
    ];
    
    // Look for streaming patterns
    const streamingPatterns = [
      /stream.*\d+.*g\$/i,
      /allowance.*\d+/i,
      /\d+.*g\$.*per\s+(month|week|day|hour)/i,
      /monthly.*\d+.*g\$/i,
      /continuous.*reward/i,
    ];
    
    const hasStreamKeyword = streamKeywords.some(keyword => content.includes(keyword));
    const hasPayment = paymentKeywords.some(keyword => content.includes(keyword));
    const hasStreamPattern = streamingPatterns.some(pattern => pattern.test(content));
    
    return (hasStreamKeyword && hasPayment) || hasStreamPattern;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("🌊 Processing stream creation request");
      
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
          text: "Streaming is currently disabled. Please enable streaming in your configuration:\n\n" +
                "Set GOODDOLLAR_ENABLE_STREAMING=true in your environment variables.",
          action: "CREATE_STREAM",
        };
        callback?.(disabledContent);
        return false;
      }

      // Extract stream details
      const streamDetails = extractStreamDetails(message.content.text);
      const familyId = message.roomId || "default_family";
      
      if (!streamDetails.streamType) {
        const helpContent: Content = {
          text: "I can help you create different types of G$ streams:\n\n" +
                "**Family Allowances:**\n" +
                "• 'Set up monthly allowance of 50 G$ for my child 0x1234...'\n" +
                "• 'Stream 100 G$ per month to my daughter'\n\n" +
                "**Milestone Rewards:**\n" +
                "• 'Create milestone stream of 200 G$ over 30 days for completing chores'\n" +
                "• 'Stream 150 G$ over 2 weeks for good grades'\n\n" +
                "**Continuous Rewards:**\n" +
                "• 'Start continuous reward of 5 G$ per hour for mindful behavior'\n" +
                "• 'Stream 2 G$/hour for active family participation'\n\n" +
                "Please specify the type, amount, duration, and recipient address.",
          action: "CREATE_STREAM",
        };
        callback?.(helpContent);
        return false;
      }

      if (!streamDetails.recipientAddress) {
        const addressNeededContent: Content = {
          text: `To create a ${streamDetails.streamType} stream, I need the recipient's wallet address.\n\n` +
                `Please provide the recipient's address (0x...)`,
          action: "CREATE_STREAM",
        };
        callback?.(addressNeededContent);
        return false;
      }

      // Validate recipient address
      if (!ethers.isAddress(streamDetails.recipientAddress)) {
        const invalidAddressContent: Content = {
          text: `Invalid recipient address: ${streamDetails.recipientAddress}. Please provide a valid Ethereum address.`,
          action: "CREATE_STREAM",
        };
        callback?.(invalidAddressContent);
        return false;
      }

      // Check if sender is verified
      const senderProfile = await identityService.getIdentityProfile(message.userId);
      if (!senderProfile?.isVerified) {
        const notVerifiedContent: Content = {
          text: "You need to be verified to create G$ streams. Please complete your identity verification first:\n\n" +
                "Use: 'Verify me as a [role] with wallet 0x...' to get started.",
          action: "CREATE_STREAM",
        };
        callback?.(notVerifiedContent);
        return false;
      }

      const senderAddress = senderProfile.walletAddress;

      // Show processing message
      const processingContent: Content = {
        text: `🌊 Creating ${streamDetails.streamType} stream...\n\n` +
              `📤 From: ${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}\n` +
              `📥 To: ${streamDetails.recipientAddress.slice(0, 6)}...${streamDetails.recipientAddress.slice(-4)}\n` +
              `💰 Amount: ${streamDetails.amount} G$\n` +
              `⏱️ Duration: ${streamDetails.duration || 'Ongoing'}\n\n` +
              `Setting up Superfluid streaming...`,
        action: "CREATE_STREAM",
      };
      callback?.(processingContent);

      let stream;
      let streamDescription = "";

      // Create appropriate stream type
      switch (streamDetails.streamType) {
        case "allowance":
          stream = await streamingService.createFamilyAllowanceStream(
            senderAddress,
            streamDetails.recipientAddress,
            streamDetails.amount,
            familyId
          );
          streamDescription = `Family allowance: ${streamDetails.amount} G$ per month`;
          break;

        case "milestone":
          if (!streamDetails.duration) {
            throw new Error("Milestone streams require a duration");
          }
          const durationDays = parseDurationToDays(streamDetails.duration);
          stream = await streamingService.createMilestoneStream(
            senderAddress,
            streamDetails.recipientAddress,
            streamDetails.amount,
            durationDays,
            streamDetails.description || "Family milestone reward",
            familyId
          );
          streamDescription = `Milestone reward: ${streamDetails.amount} G$ over ${durationDays} days`;
          break;

        case "continuous_reward":
          if (!streamDetails.rate) {
            throw new Error("Continuous rewards require a rate (per hour)");
          }
          stream = await streamingService.createContinuousRewardStream(
            senderAddress,
            streamDetails.recipientAddress,
            streamDetails.rate,
            familyId,
            streamDetails.description || "Continuous family behavior reward"
          );
          streamDescription = `Continuous reward: ${streamDetails.rate} G$ per hour`;
          break;

        default:
          throw new Error(`Unknown stream type: ${streamDetails.streamType}`);
      }

      // Calculate estimated flow information
      const flowRatePerHour = (BigInt(stream.flowRate) * BigInt(3600)).toString();
      const dailyFlow = (BigInt(stream.flowRate) * BigInt(86400)).toString();
      
      const successContent: Content = {
        text: `🎉 Stream created successfully!\n\n` +
              `🆔 **Stream ID:** ${stream.streamId.slice(0, 12)}...\n` +
              `📋 **Type:** ${streamDescription}\n` +
              `💰 **Flow Rate:** ${ethers.formatEther(flowRatePerHour)} G$/hour\n` +
              `📅 **Daily Flow:** ${ethers.formatEther(dailyFlow)} G$/day\n` +
              `📤 **From:** ${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}\n` +
              `📥 **To:** ${streamDetails.recipientAddress.slice(0, 6)}...${streamDetails.recipientAddress.slice(-4)}\n\n` +
              `✨ **Benefits:**\n` +
              `• Automatic G$ distribution\n` +
              `• Real-time streaming (funds flow every second)\n` +
              `• Family-verified recipients\n` +
              `• Transparent on-chain records\n\n` +
              `🔄 The stream is now active and funds are flowing! You can update or cancel it anytime.`,
        action: "CREATE_STREAM",
        metadata: {
          streamId: stream.streamId,
          streamType: streamDetails.streamType,
          flowRate: stream.flowRate,
          sender: senderAddress,
          recipient: streamDetails.recipientAddress,
          familyId: familyId,
        },
      };

      elizaLogger.success(`✅ Stream created: ${stream.streamId}`);
      callback?.(successContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ Stream creation failed:", error);
      
      const errorContent: Content = {
        text: `Stream creation failed: ${error.message}\n\n` +
              `This might be due to:\n` +
              `• Insufficient SuperToken balance\n` +
              `• Network connectivity issues\n` +
              `• Invalid stream parameters\n` +
              `• Service configuration problems\n\n` +
              `Please check your configuration and try again.`,
        action: "CREATE_STREAM",
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
          text: "Set up a monthly allowance of 100 G$ for my child 0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎉 Stream created successfully!\n\n🆔 **Stream ID:** stream_abc123...\n📋 **Type:** Family allowance: 100 G$ per month\n💰 **Flow Rate:** 0.137 G$/hour\n📅 **Daily Flow:** 3.29 G$/day\n📤 **From:** 0x1234...5678\n📥 **To:** 0x742d...b2E1\n\n✨ **Benefits:**\n• Automatic G$ distribution\n• Real-time streaming (funds flow every second)\n• Family-verified recipients\n• Transparent on-chain records\n\n🔄 The stream is now active and funds are flowing! You can update or cancel it anytime.",
          action: "CREATE_STREAM",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Create milestone stream of 200 G$ over 15 days for my son completing his school project",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "To create a milestone stream, I need the recipient's wallet address.\n\nPlease provide the recipient's address (0x...)",
          action: "CREATE_STREAM",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Start continuous reward of 3 G$ per hour for my daughter's mindful behavior to 0x9876543210abcdef9876543210abcdef98765432",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎉 Stream created successfully!\n\n🆔 **Stream ID:** stream_def456...\n📋 **Type:** Continuous reward: 3 G$ per hour\n💰 **Flow Rate:** 3.0 G$/hour\n📅 **Daily Flow:** 72.0 G$/day\n📤 **From:** 0x1234...5678\n📥 **To:** 0x9876...5432\n\n✨ **Benefits:**\n• Automatic G$ distribution\n• Real-time streaming (funds flow every second)\n• Family-verified recipients\n• Transparent on-chain records\n\n🔄 The stream is now active and funds are flowing! You can update or cancel it anytime.",
          action: "CREATE_STREAM",
        },
      },
    ],
  ] as ActionExample[][],
};

interface StreamDetails {
  streamType?: "allowance" | "milestone" | "continuous_reward";
  amount?: string;
  duration?: string;
  rate?: string;
  recipientAddress?: string;
  description?: string;
}

function extractStreamDetails(text: string): StreamDetails {
  const details: StreamDetails = {};
  
  // Determine stream type
  if (/allowance|monthly|per\s+month/i.test(text)) {
    details.streamType = "allowance";
  } else if (/milestone|over\s+\d+|for\s+\d+.*days|reward.*\d+.*days/i.test(text)) {
    details.streamType = "milestone";
  } else if (/continuous|per\s+hour|hourly|ongoing/i.test(text)) {
    details.streamType = "continuous_reward";
  }
  
  // Extract recipient address
  const addressPattern = /0x[a-fA-F0-9]{40}/;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) {
    details.recipientAddress = addressMatch[0];
  }
  
  // Extract amount
  const amountPatterns = [
    /(\d+(?:\.\d+)?)\s*g\$/i,
    /(\d+(?:\.\d+)?)\s*gdollar/i,
    /(\d+(?:\.\d+)?)\s*gooddollar/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      details.amount = match[1];
      break;
    }
  }
  
  // Extract rate for continuous rewards (per hour)
  const ratePatterns = [
    /(\d+(?:\.\d+)?)\s*g\$\s*per\s+hour/i,
    /(\d+(?:\.\d+)?)\s*g\$\/hour/i,
    /(\d+(?:\.\d+)?)\s*g\$\s*hourly/i,
  ];
  
  for (const pattern of ratePatterns) {
    const match = text.match(pattern);
    if (match) {
      details.rate = match[1];
      details.streamType = "continuous_reward";
      break;
    }
  }
  
  // Extract duration for milestone streams
  const durationPatterns = [
    /over\s+(\d+)\s*days?/i,
    /for\s+(\d+)\s*days?/i,
    /(\d+)\s*days?/i,
    /over\s+(\d+)\s*weeks?/i,
    /for\s+(\d+)\s*weeks?/i,
    /(\d+)\s*weeks?/i,
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      details.duration = match[0];
      break;
    }
  }
  
  // Extract description (text after "for" that's not duration)
  const descriptionPattern = /for\s+(.+?)(?:\s+(?:to|0x)|$)/i;
  const descriptionMatch = text.match(descriptionPattern);
  if (descriptionMatch && !details.duration?.includes(descriptionMatch[1])) {
    details.description = descriptionMatch[1].trim();
  }
  
  return details;
}

function parseDurationToDays(duration: string): number {
  const dayMatch = duration.match(/(\d+)\s*days?/i);
  if (dayMatch) {
    return parseInt(dayMatch[1]);
  }
  
  const weekMatch = duration.match(/(\d+)\s*weeks?/i);
  if (weekMatch) {
    return parseInt(weekMatch[1]) * 7;
  }
  
  // Default to 30 days if unable to parse
  return 30;
}

export default createStreamAction;