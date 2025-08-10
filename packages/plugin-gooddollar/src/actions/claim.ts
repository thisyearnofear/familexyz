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
import { GoodDollarService } from "../services/gooddollar.js";

export const claimUBIAction: Action = {
  name: "CLAIM_UBI",
  similes: [
    "CLAIM_GDOLLAR",
    "CLAIM_G$",
    "GET_UBI",
    "COLLECT_UBI",
    "CLAIM_BASIC_INCOME",
    "GET_DAILY_CLAIM",
  ],
  description: "Claim Universal Basic Income (UBI) in G$ tokens from the GoodDollar protocol",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    const claimKeywords = [
      "claim",
      "collect",
      "get",
      "receive",
      "earn",
    ];
    
    const ubiKeywords = [
      "ubi",
      "basic income",
      "daily",
      "claim",
      "g$",
      "gdollar",
      "gooddollar",
    ];
    
    const hasClaim = claimKeywords.some(keyword => content.includes(keyword));
    const hasUBI = ubiKeywords.some(keyword => content.includes(keyword));
    
    return hasClaim && hasUBI;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("🎯 Processing UBI claim request");
      
      // Get GoodDollar service
      const gdService = runtime.getService<GoodDollarService>(GoodDollarService);
      if (!gdService) {
        throw new Error("GoodDollar service not available");
      }

      const config = gdService.getConfig();
      if (!config.enableUBIClaim) {
        const disabledContent: Content = {
          text: "UBI claiming is currently disabled in the configuration. Please contact your administrator to enable this feature.",
          action: "CLAIM_UBI",
        };
        callback?.(disabledContent);
        return false;
      }

      const walletAddress = gdService.getWalletAddress();
      if (!walletAddress) {
        const noWalletContent: Content = {
          text: "No wallet configured. Please set up your wallet with GOODDOLLAR_PRIVATE_KEY to claim UBI.",
          action: "CLAIM_UBI",
        };
        callback?.(noWalletContent);
        return false;
      }

      // Get current balance before claim
      const balanceBefore = await gdService.getBalance(walletAddress);
      const balanceBeforeFormatted = await gdService.formatAmount(balanceBefore);

      elizaLogger.info(`💰 Current balance: ${balanceBeforeFormatted} G$`);

      // Attempt to claim UBI
      const claimResult = await gdService.claimUBI();

      if (!claimResult.success) {
        const failureContent: Content = {
          text: `Unable to claim UBI: ${claimResult.error || "Unknown error"}\n\n` +
                `This could be because:\n` +
                `• You've already claimed today\n` +
                `• Your account isn't verified\n` +
                `• The claim period hasn't started\n\n` +
                `Current balance: ${balanceBeforeFormatted} G$`,
          action: "CLAIM_UBI",
        };
        callback?.(failureContent);
        return false;
      }

      // Format claim amount
      const claimedAmount = await gdService.formatAmount(claimResult.amount);
      const newBalance = Number(balanceBeforeFormatted) + Number(claimedAmount);
      
      // Calculate next claim time
      const nextClaimDate = new Date(claimResult.nextClaimTime);
      const timeUntilNextClaim = Math.max(0, claimResult.nextClaimTime - Date.now());
      const hoursUntilNext = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutesUntilNext = Math.floor((timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60));

      const successContent: Content = {
        text: `🎉 Successfully claimed your daily UBI!\n\n` +
              `💰 Claimed: ${claimedAmount} G$\n` +
              `📈 Previous balance: ${balanceBeforeFormatted} G$\n` +
              `💳 New balance: ${newBalance.toFixed(2)} G$\n` +
              `📄 Transaction: ${claimResult.transactionHash}\n\n` +
              `⏰ Next claim available in: ${hoursUntilNext}h ${minutesUntilNext}m\n` +
              `📅 Next claim time: ${nextClaimDate.toLocaleString()}\n\n` +
              `🌍 Thank you for being part of the GoodDollar UBI community!`,
        action: "CLAIM_UBI",
        metadata: {
          claimedAmount: claimedAmount,
          transactionHash: claimResult.transactionHash,
          newBalance: newBalance.toFixed(2),
          nextClaimTime: claimResult.nextClaimTime,
        },
      };

      elizaLogger.success(`✅ UBI claimed successfully: ${claimedAmount} G$`);
      callback?.(successContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ UBI claim failed:", error);
      
      const errorContent: Content = {
        text: `Failed to claim UBI: ${error.message}\n\n` +
              `This might be due to:\n` +
              `• Network connectivity issues\n` +
              `• Wallet configuration problems\n` +
              `• Smart contract issues\n\n` +
              `Please try again or check your configuration.`,
        action: "CLAIM_UBI",
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
          text: "I want to claim my daily UBI",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎉 Successfully claimed your daily UBI!\n\n💰 Claimed: 100.0 G$\n📈 Previous balance: 50.0 G$\n💳 New balance: 150.0 G$\n📄 Transaction: 0x1234567890abcdef...\n\n⏰ Next claim available in: 23h 45m\n📅 Next claim time: Tomorrow at 9:00 AM\n\n🌍 Thank you for being part of the GoodDollar UBI community!",
          action: "CLAIM_UBI",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can I get my G$ basic income?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎉 Successfully claimed your daily UBI!\n\n💰 Claimed: 100.0 G$\n📈 Previous balance: 250.5 G$\n💳 New balance: 350.5 G$\n📄 Transaction: 0xabcdef1234567890...\n\n⏰ Next claim available in: 24h 0m\n📅 Next claim time: Tomorrow at 9:00 AM\n\n🌍 Thank you for being part of the GoodDollar UBI community!",
          action: "CLAIM_UBI",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Collect my daily GoodDollar reward",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Unable to claim UBI: You've already claimed today\n\nThis could be because:\n• You've already claimed today\n• Your account isn't verified\n• The claim period hasn't started\n\nCurrent balance: 175.25 G$",
          action: "CLAIM_UBI",
        },
      },
    ],
  ] as ActionExample[][],
};

export default claimUBIAction;