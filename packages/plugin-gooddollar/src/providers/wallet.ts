import {
  IAgentRuntime,
  Provider,
  elizaLogger,
} from "@elizaos/core";
import { GoodDollarService } from "../services/gooddollar.js";
import type { GDollarWallet } from "../types.js";

const WALLET_TEMPLATE = `# GoodDollar Wallet Information

## Network: {{network}}
## Address: {{address}}
## Verification Status: {{verificationStatus}}
## Balance: {{balance}} G$
## Super Token Balance: {{superTokenBalance}} G$
## Last UBI Claim: {{lastClaimTime}}
## Can Claim UBI: {{canClaimUBI}}

## Recent Transactions:
{{recentTransactions}}

## Network Details:
- Chain ID: {{chainId}}
- Block Number: {{blockNumber}}
- Token Contract: {{tokenAddress}}
- Super Token Contract: {{superTokenAddress}}
`;

export const gdollarWalletProvider: Provider = {
  get: async (runtime: IAgentRuntime): Promise<string> => {
    try {
      // Get GoodDollar service
      const gdService = runtime.getService<GoodDollarService>(GoodDollarService);
      if (!gdService) {
        elizaLogger.warn("GoodDollar service not available");
        return "GoodDollar wallet service not available";
      }

      const config = gdService.getConfig();
      const walletAddress = gdService.getWalletAddress();

      if (!walletAddress) {
        return "GoodDollar wallet not configured. Please set GOODDOLLAR_PRIVATE_KEY.";
      }

      // Get wallet information
      const [balance, networkInfo, recentTransactions] = await Promise.all([
        gdService.getBalance(walletAddress).catch(() => "0"),
        gdService.getNetworkInfo().catch(() => ({
          name: config.network,
          chainId: config.chainId,
          blockNumber: 0,
        })),
        gdService.getTransactionHistory(walletAddress, 5).catch(() => []),
      ]);

      const balanceFormatted = await gdService.formatAmount(balance);

      // Format recent transactions
      const transactionsText = recentTransactions.length > 0
        ? recentTransactions.map((tx, index) => 
            `${index + 1}. ${tx.type.toUpperCase()}: ${gdService.formatAmount(tx.amount)} G$ to ${tx.to.slice(0, 8)}... (${tx.status})`
          ).join('\n')
        : "No recent transactions";

      // Determine verification status
      const verificationStatus = "Pending"; // This would be determined by face verification
      
      // Format last claim time
      const lastClaimTime = "Not claimed yet"; // This would come from smart contract

      // Can claim UBI status
      const canClaimUBI = config.enableUBIClaim ? "Yes (if verified)" : "Disabled";

      // Format super token balance (placeholder)
      const superTokenBalance = "0.00"; // This would come from Superfluid contract

      const walletInfo = WALLET_TEMPLATE
        .replace(/{{network}}/g, config.network.toUpperCase())
        .replace(/{{address}}/g, walletAddress)
        .replace(/{{verificationStatus}}/g, verificationStatus)
        .replace(/{{balance}}/g, balanceFormatted)
        .replace(/{{superTokenBalance}}/g, superTokenBalance)
        .replace(/{{lastClaimTime}}/g, lastClaimTime)
        .replace(/{{canClaimUBI}}/g, canClaimUBI)
        .replace(/{{recentTransactions}}/g, transactionsText)
        .replace(/{{chainId}}/g, networkInfo.chainId.toString())
        .replace(/{{blockNumber}}/g, networkInfo.blockNumber.toString())
        .replace(/{{tokenAddress}}/g, config.tokenAddress)
        .replace(/{{superTokenAddress}}/g, config.superTokenAddress || "Not configured");

      return walletInfo;

    } catch (error) {
      elizaLogger.error("Error in GoodDollar wallet provider:", error);
      return `Error retrieving GoodDollar wallet information: ${error.message}`;
    }
  },
};

export default gdollarWalletProvider;