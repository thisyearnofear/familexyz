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
import { ethers } from "ethers";

export const transferGDollarAction: Action = {
  name: "TRANSFER_GDOLLAR",
  similes: [
    "SEND_G$",
    "SEND_GOODDOLLAR",
    "TRANSFER_G$",
    "SEND_UBI",
    "GIVE_GDOLLAR",
    "PAY_GDOLLAR",
  ],
  description: "Transfer G$ (GoodDollar) tokens to family members or other addresses using ERC677 transferAndCall",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    // Check for transfer keywords and amount patterns
    const transferKeywords = [
      "send",
      "transfer", 
      "give",
      "pay",
      "reward",
      "tip",
    ];
    
    const currencyKeywords = [
      "g$",
      "gdollar",
      "gooddollar",
      "ubi",
      "dollars",
    ];
    
    // Look for amount patterns (numbers with currency)
    const amountPattern = /\d+\.?\d*\s*(g\$|gdollar|gooddollar|ubi|dollars)/i;
    
    const hasTransferKeyword = transferKeywords.some(keyword => 
      content.includes(keyword)
    );
    const hasCurrency = currencyKeywords.some(keyword => 
      content.includes(keyword)
    ) || amountPattern.test(content);
    
    // Must have both transfer intent and currency mention
    return hasTransferKeyword && hasCurrency;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("🎯 Processing G$ transfer request");
      
      // Get GoodDollar service
      const gdService = runtime.getService<GoodDollarService>(GoodDollarService);
      if (!gdService) {
        throw new Error("GoodDollar service not available");
      }

      // Extract transfer details from message
      const transferDetails = extractTransferDetails(message.content.text);
      
      if (!transferDetails.recipient || !transferDetails.amount) {
        const helpContent: Content = {
          text: "I need more details to send G$. Please specify:\n• Who to send to (wallet address or @username)\n• How much to send (e.g., '5 G$')\n\nExample: 'Send 10 G$ to 0x1234... for helping with homework'",
          action: "TRANSFER_GDOLLAR",
        };
        callback?.(helpContent);
        return false;
      }

      // Validate amount
      if (isNaN(Number(transferDetails.amount)) || Number(transferDetails.amount) <= 0) {
        const errorContent: Content = {
          text: `Invalid amount: ${transferDetails.amount}. Please specify a positive number.`,
          action: "TRANSFER_GDOLLAR",
        };
        callback?.(errorContent);
        return false;
      }

      // Validate recipient address
      if (!ethers.isAddress(transferDetails.recipient)) {
        const errorContent: Content = {
          text: `Invalid recipient address: ${transferDetails.recipient}. Please provide a valid Ethereum address.`,
          action: "TRANSFER_GDOLLAR",
        };
        callback?.(errorContent);
        return false;
      }

      // Check wallet balance
      const walletAddress = gdService.getWalletAddress();
      if (!walletAddress) {
        throw new Error("Wallet not initialized");
      }

      const balance = await gdService.getBalance(walletAddress);
      const balanceFormatted = await gdService.formatAmount(balance);
      const requiredAmount = Number(transferDetails.amount);

      if (Number(balanceFormatted) < requiredAmount) {
        const insufficientContent: Content = {
          text: `Insufficient balance. You have ${balanceFormatted} G$ but need ${requiredAmount} G$.`,
          action: "TRANSFER_GDOLLAR",
        };
        callback?.(insufficientContent);
        return false;
      }

      // Prepare transfer data for ERC677 transferAndCall
      const transferData = JSON.stringify({
        reason: transferDetails.reason || "Family transfer",
        timestamp: Date.now(),
        familyContext: true,
        messageId: message.id,
      });
      
      // Convert to bytes
      const dataBytes = ethers.toUtf8Bytes(transferData);
      const dataHex = ethers.hexlify(dataBytes);

      // Execute transfer
      const transaction = await gdService.transfer(
        transferDetails.recipient,
        transferDetails.amount,
        dataHex
      );

      // Format success response
      const successContent: Content = {
        text: `✅ Successfully sent ${transferDetails.amount} G$ to ${transferDetails.recipient.slice(0, 6)}...${transferDetails.recipient.slice(-4)}!\n\n` +
              `📄 Transaction: ${transaction.hash}\n` +
              `💰 Amount: ${transferDetails.amount} G$\n` +
              `🎯 Reason: ${transferDetails.reason || "Family transfer"}\n\n` +
              `Your new balance: ${(Number(balanceFormatted) - requiredAmount).toFixed(2)} G$`,
        action: "TRANSFER_GDOLLAR",
        metadata: {
          transaction: transaction.hash,
          amount: transferDetails.amount,
          recipient: transferDetails.recipient,
          reason: transferDetails.reason,
        },
      };

      elizaLogger.success(`✅ G$ transfer completed: ${transaction.hash}`);
      callback?.(successContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ G$ transfer failed:", error);
      
      const errorContent: Content = {
        text: `Transfer failed: ${error.message}. Please try again or check your wallet configuration.`,
        action: "TRANSFER_GDOLLAR",
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
          text: "Send 5 G$ to 0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1 for helping with homework",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "✅ Successfully sent 5 G$ to 0x742d...b2E1!\n\n📄 Transaction: 0x1234567890abcdef...\n💰 Amount: 5 G$\n🎯 Reason: helping with homework\n\nYour new balance: 45.0 G$",
          action: "TRANSFER_GDOLLAR",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Give 10 GoodDollar to my daughter for completing her chores",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'd love to help send G$ to your daughter! Please provide her wallet address so I can send the 10 G$. Example format: 0x1234567890abcdef1234567890abcdef12345678",
          action: "TRANSFER_GDOLLAR",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Transfer 2.5 G$ to grandma for sharing family stories",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I need grandma's wallet address to send the 2.5 G$. Once you provide her address, I can send the reward for sharing those wonderful family stories!",
          action: "TRANSFER_GDOLLAR",
        },
      },
    ],
  ] as ActionExample[][],
};

interface TransferDetails {
  recipient?: string;
  amount?: string;
  reason?: string;
}

function extractTransferDetails(text: string): TransferDetails {
  const details: TransferDetails = {};
  
  // Extract recipient address (0x followed by 40 hex characters)
  const addressPattern = /0x[a-fA-F0-9]{40}/;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) {
    details.recipient = addressMatch[0];
  }
  
  // Extract amount (number followed by currency)
  const amountPatterns = [
    /(\d+\.?\d*)\s*(g\$|gdollar|gooddollar|ubi)/i,
    /(\d+\.?\d*)\s+g\$/i,
    /(\d+\.?\d*)\s*dollars?/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      details.amount = match[1];
      break;
    }
  }
  
  // Extract reason (text after "for" or "because")
  const reasonPatterns = [
    /for\s+(.+?)(?:\s*$|\s*\.|\s*!|\s*\?)/i,
    /because\s+(.+?)(?:\s*$|\s*\.|\s*!|\s*\?)/i,
    /reason:\s*(.+?)(?:\s*$|\s*\.|\s*!|\s*\?)/i,
  ];
  
  for (const pattern of reasonPatterns) {
    const match = text.match(pattern);
    if (match) {
      details.reason = match[1].trim();
      break;
    }
  }
  
  return details;
}

export default transferGDollarAction;