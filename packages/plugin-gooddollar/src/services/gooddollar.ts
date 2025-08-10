import {
  IAgentRuntime,
  elizaLogger,
  Service,
  ServiceType,
} from "@elizaos/core";
import { ethers } from "ethers";
import NodeCache from "node-cache";
import type {
  GDollarConfig,
  GDollarWallet,
  GDollarTransaction,
  GDollarReward,
  UBIClaimResult,
} from "../types.js";
import { validateGDollarConfig } from "../environment.js";

// G$ Token ABI (ERC677 compatible)
const G_DOLLAR_ABI = [
  // ERC20 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // ERC677 extension
  "function transferAndCall(address to, uint256 value, bytes data) returns (bool)",
  
  // GoodDollar specific functions
  "function claim() returns (uint256)",
  "function claimAmount() view returns (uint256)",
  "function canClaim(address user) view returns (bool)",
  "function lastClaimed(address user) view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TransferAndCall(address indexed from, address indexed to, uint256 value, bytes data)",
  "event UBIClaim(address indexed claimer, uint256 amount)",
];

export class GoodDollarService extends Service {
  static serviceType: ServiceType = ServiceType.OTHER;
  
  private config: GDollarConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private tokenContract: ethers.Contract | null = null;
  private cache: NodeCache;

  constructor() {
    super();
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    try {
      this.config = validateGDollarConfig(runtime);
      this.provider = new ethers.JsonRpcProvider(this.config.rpcEndpoint);
      
      // Initialize wallet if private key is provided
      const privateKey = runtime.getSetting("GOODDOLLAR_PRIVATE_KEY");
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        elizaLogger.info(`🎯 GoodDollar wallet initialized: ${this.wallet.address}`);
      }

      // Initialize token contract
      this.tokenContract = new ethers.Contract(
        this.config.tokenAddress,
        G_DOLLAR_ABI,
        this.wallet || this.provider
      );

      // Verify contract connection
      await this.verifyConnection();
      
      elizaLogger.success(`✅ GoodDollar service initialized on ${this.config.network}`);
    } catch (error) {
      elizaLogger.error("❌ Failed to initialize GoodDollar service:", error);
      throw error;
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      const tokenName = await this.tokenContract!.name();
      const tokenSymbol = await this.tokenContract!.symbol();
      const decimals = await this.tokenContract!.decimals();
      
      elizaLogger.info(`🪙 Connected to ${tokenName} (${tokenSymbol}) with ${decimals} decimals`);
      
      if (this.wallet) {
        const balance = await this.getBalance(this.wallet.address);
        elizaLogger.info(`💰 Wallet balance: ${ethers.formatEther(balance)} G$`);
      }
    } catch (error) {
      throw new Error(`Failed to verify GoodDollar connection: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const cacheKey = `balance_${address}`;
      const cachedBalance = this.cache.get<string>(cacheKey);
      if (cachedBalance) {
        return cachedBalance;
      }

      const balance = await this.tokenContract!.balanceOf(address);
      const balanceStr = balance.toString();
      
      this.cache.set(cacheKey, balanceStr);
      return balanceStr;
    } catch (error) {
      elizaLogger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  async transfer(to: string, amount: string, data?: string): Promise<GDollarTransaction> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized. Cannot perform transfers.");
    }

    try {
      let tx;
      const amountWei = ethers.parseEther(amount);
      
      if (data) {
        // Use transferAndCall for data transfers
        tx = await this.tokenContract!.transferAndCall(to, amountWei, data);
        elizaLogger.info(`📤 transferAndCall sent: ${amount} G$ to ${to} with data`);
      } else {
        // Standard transfer
        tx = await this.tokenContract!.transfer(to, amountWei);
        elizaLogger.info(`📤 Transfer sent: ${amount} G$ to ${to}`);
      }

      const transaction: GDollarTransaction = {
        hash: tx.hash,
        from: this.wallet.address,
        to,
        amount: amountWei.toString(),
        type: data ? "transferAndCall" : "transfer",
        data,
        status: "pending",
        timestamp: Date.now(),
      };

      // Wait for confirmation
      const receipt = await tx.wait();
      transaction.status = receipt.status === 1 ? "confirmed" : "failed";
      transaction.blockNumber = receipt.blockNumber;
      transaction.gasUsed = receipt.gasUsed.toString();

      elizaLogger.success(`✅ Transaction confirmed: ${tx.hash}`);
      
      // Clear balance cache
      this.cache.del(`balance_${this.wallet.address}`);
      this.cache.del(`balance_${to}`);

      return transaction;
    } catch (error) {
      elizaLogger.error("❌ Transfer failed:", error);
      throw error;
    }
  }

  async claimUBI(): Promise<UBIClaimResult> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized. Cannot claim UBI.");
    }

    if (!this.config.enableUBIClaim) {
      throw new Error("UBI claiming is disabled in configuration.");
    }

    try {
      // Check if user can claim
      const canClaim = await this.tokenContract!.canClaim(this.wallet.address);
      if (!canClaim) {
        const lastClaimedTimestamp = await this.tokenContract!.lastClaimed(this.wallet.address);
        throw new Error(`Cannot claim UBI yet. Last claimed: ${new Date(Number(lastClaimedTimestamp) * 1000)}`);
      }

      // Get claim amount
      const claimAmount = await this.tokenContract!.claimAmount();
      
      // Perform claim
      const tx = await this.tokenContract!.claim();
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error("UBI claim transaction failed");
      }

      // Calculate next claim time (typically 24 hours)
      const nextClaimTime = Date.now() + (24 * 60 * 60 * 1000);

      const result: UBIClaimResult = {
        success: true,
        amount: claimAmount.toString(),
        transactionHash: tx.hash,
        nextClaimTime,
      };

      elizaLogger.success(`✅ UBI claimed: ${ethers.formatEther(claimAmount)} G$`);
      
      // Clear balance cache
      this.cache.del(`balance_${this.wallet.address}`);

      return result;
    } catch (error) {
      elizaLogger.error("❌ UBI claim failed:", error);
      return {
        success: false,
        amount: "0",
        transactionHash: "",
        nextClaimTime: 0,
        error: error.message,
      };
    }
  }

  async distributeFamilyReward(reward: GDollarReward): Promise<GDollarTransaction> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized. Cannot distribute rewards.");
    }

    try {
      // Create reward data for transferAndCall
      const rewardData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "uint256", "uint256"],
        [reward.reason, reward.interactionType, reward.qualityScore, reward.timestamp]
      );

      const transaction = await this.transfer(
        reward.recipientId, // Assuming recipientId is the wallet address
        ethers.formatEther(reward.amount),
        rewardData
      );

      elizaLogger.success(`🎁 Family reward distributed: ${ethers.formatEther(reward.amount)} G$ for ${reward.reason}`);
      
      return transaction;
    } catch (error) {
      elizaLogger.error("❌ Failed to distribute family reward:", error);
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<GDollarTransaction[]> {
    try {
      const cacheKey = `tx_history_${address}_${limit}`;
      const cachedHistory = this.cache.get<GDollarTransaction[]>(cacheKey);
      if (cachedHistory) {
        return cachedHistory;
      }

      // Get recent Transfer events
      const transferFilter = this.tokenContract!.filters.Transfer(null, address);
      const transferEvents = await this.tokenContract!.queryFilter(transferFilter, -1000); // Last 1000 blocks

      // Get recent TransferAndCall events
      const transferAndCallFilter = this.tokenContract!.filters.TransferAndCall(null, address);
      const transferAndCallEvents = await this.tokenContract!.queryFilter(transferAndCallFilter, -1000);

      // Combine and format events
      const allEvents = [...transferEvents, ...transferAndCallEvents];
      const transactions: GDollarTransaction[] = [];

      for (const event of allEvents.slice(-limit)) {
        const block = await event.getBlock();
        const transaction: GDollarTransaction = {
          hash: event.transactionHash,
          from: event.args![0],
          to: event.args![1],
          amount: event.args![2].toString(),
          type: event.eventName === "TransferAndCall" ? "transferAndCall" : "transfer",
          data: event.eventName === "TransferAndCall" ? event.args![3] : undefined,
          blockNumber: event.blockNumber,
          status: "confirmed",
          timestamp: block.timestamp * 1000,
        };
        transactions.push(transaction);
      }

      this.cache.set(cacheKey, transactions);
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      elizaLogger.error(`Failed to get transaction history for ${address}:`, error);
      throw error;
    }
  }

  async formatAmount(amountWei: string): Promise<string> {
    try {
      return ethers.formatEther(amountWei);
    } catch (error) {
      elizaLogger.error("Failed to format amount:", error);
      return "0";
    }
  }

  async parseAmount(amount: string): Promise<string> {
    try {
      return ethers.parseEther(amount).toString();
    } catch (error) {
      elizaLogger.error("Failed to parse amount:", error);
      return "0";
    }
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  getConfig(): GDollarConfig {
    return this.config;
  }

  async getNetworkInfo(): Promise<{
    name: string;
    chainId: number;
    blockNumber: number;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber,
      };
    } catch (error) {
      elizaLogger.error("Failed to get network info:", error);
      throw error;
    }
  }

  async estimateGas(to: string, amount: string, data?: string): Promise<string> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized. Cannot estimate gas.");
    }

    try {
      const amountWei = ethers.parseEther(amount);
      let gasEstimate;

      if (data) {
        gasEstimate = await this.tokenContract!.transferAndCall.estimateGas(to, amountWei, data);
      } else {
        gasEstimate = await this.tokenContract!.transfer.estimateGas(to, amountWei);
      }

      return gasEstimate.toString();
    } catch (error) {
      elizaLogger.error("Failed to estimate gas:", error);
      throw error;
    }
  }
}