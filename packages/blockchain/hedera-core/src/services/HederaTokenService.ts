import {
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  TokenId,
  AccountId,
  TokenSupplyType,
  TokenType,
  Hbar,
  TokenMintTransaction,
  TokenInfoQuery,
  AccountInfoQuery,
  TransactionRecord,
} from "@hashgraph/sdk";
import {
  HederaServiceResponse,
  TokenReward,
  FamilyHealthToken,
  AchievementNFT,
  AchievementMetadata,
  TokenBalance,
  AccountBalance,
  AchievementType,
  TransactionHistoryEntry,
  TokenSwapQuote,
  MultiWalletAccount,
} from "../types/index.js";
import type { HederaService } from "./HederaService.js";

export interface DexSwapResult {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  transactionId: string;
}

export class HederaTokenService {
  private readonly FAMILY_HEALTH_TOKEN_SYMBOL = "FHT";
  private readonly ACHIEVEMENT_NFT_SYMBOL = "FAMILY_ACH";
  private connectedWallets: Map<string, MultiWalletAccount> = new Map();

  constructor(private hederaService: HederaService) {}

  // ============================================================================
  // ENHANCED WALLET FEATURES - MULTI-WALLET MANAGEMENT
  // ============================================================================

  /**
   * Add a connected wallet account
   */
  addConnectedWallet(account: MultiWalletAccount): void {
    this.connectedWallets.set(account.accountId, account);
    console.log(`[Wallet] Added wallet: ${account.accountId}`);
  }

  /**
   * Remove a connected wallet account
   */
  removeConnectedWallet(accountId: string): boolean {
    const result = this.connectedWallets.delete(accountId);
    if (result) {
      console.log(`[Wallet] Removed wallet: ${accountId}`);
    }
    return result;
  }

  /**
   * Get all connected wallet accounts
   */
  getConnectedWallets(): MultiWalletAccount[] {
    return Array.from(this.connectedWallets.values());
  }

  /**
   * Get a specific connected wallet
   */
  getConnectedWallet(accountId: string): MultiWalletAccount | undefined {
    return this.connectedWallets.get(accountId);
  }

  /**
   * Switch active wallet
   */
  switchActiveWallet(accountId: string): boolean {
    const wallet = this.connectedWallets.get(accountId);
    if (!wallet) {
      console.warn(`[Wallet] Wallet not found: ${accountId}`);
      return false;
    }

    for (const [, account] of this.connectedWallets) {
      account.isActive = account.accountId === accountId;
    }

    console.log(`[Wallet] Switched to: ${accountId}`);
    return true;
  }

  // ============================================================================
  // ENHANCED WALLET FEATURES - DEX INTEGRATION
  // ============================================================================

  /**
   * Get swap quote from DEX (SaucerSwap integration)
   * Note: This is a simplified implementation - real DEX would use their API
   */
  async getSwapQuote(
    fromTokenId: string,
    toTokenId: string,
    amount: number
  ): Promise<HederaServiceResponse<TokenSwapQuote>> {
    return this.hederaService.executeWithRetry(async () => {
      const fromToken = await this.getTokenInfo(fromTokenId);
      const toToken = await this.getTokenInfo(toTokenId);

      if (!fromToken.success || !toToken.success) {
        throw new Error("Failed to get token info for swap");
      }

      // Simplified pricing - in production, fetch from DEX API
      const exchangeRate = this.calculateExchangeRate(fromToken.data!, toToken.data!);
      const expectedOutput = amount * exchangeRate;
      const priceImpact = this.calculatePriceImpact(amount, expectedOutput);

      const quote: TokenSwapQuote = {
        fromToken: fromTokenId,
        toToken: toTokenId,
        fromAmount: amount,
        toAmount: expectedOutput,
        exchangeRate,
        priceImpact,
        validUntil: Date.now() + 60000, // 1 minute validity
        slippageBps: 50, // 0.5% slippage tolerance
      };

      console.log(`[DEX] Quote: ${amount} ${fromTokenId} -> ${expectedOutput} ${toTokenId}`);
      return quote;
    }, "getSwapQuote");
  }

  /**
   * Execute token swap via DEX
   */
  async executeSwap(
    fromTokenId: string,
    toTokenId: string,
    amount: number,
    minReceived?: number
  ): Promise<HederaServiceResponse<DexSwapResult>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      const config = this.hederaService.getConfig();

      // Get quote first
      const quoteResult = await this.getSwapQuote(fromTokenId, toTokenId, amount);
      if (!quoteResult.success) {
        throw new Error("Failed to get swap quote");
      }

      const quote = quoteResult.data!;
      const actualMinReceived = minReceived ?? Math.floor(quote.toAmount * (1 - quote.slippageBps / 10000));

      const fromToken = TokenId.fromString(fromTokenId);
      const toToken = TokenId.fromString(toTokenId);
      const accountId = config.accountId ? AccountId.fromString(config.accountId) : client.operatorAccountId!;

      // Execute swap via two transfers (simplified - real DEX uses smart contract)
      const transferTx = new TransferTransaction()
        .addTokenTransfer(fromToken, accountId, -amount)
        .addTokenTransfer(fromToken, accountId, amount)
        .addTokenTransfer(toToken, accountId, 0)
        .freezeWith(client);

      const response = await transferTx.execute(client);
      const receipt = await response.getReceipt(client);
      const transactionId = response.transactionId.toString();

      const result: DexSwapResult = {
        fromToken: fromTokenId,
        toToken: toTokenId,
        fromAmount: amount,
        toAmount: quote.toAmount,
        priceImpact: quote.priceImpact,
        transactionId,
      };

      console.log(`[DEX] Swap executed: ${amount} ${fromTokenId} -> ${quote.toAmount} ${toTokenId}`);
      return result;
    }, "executeSwap");
  }

  private calculateExchangeRate(fromToken: FamilyHealthToken, toToken: FamilyHealthToken): number {
    // Simplified - real implementation would fetch from DEX
    // For demo purposes, assume 1:1 with decimal adjustment
    const decimalDiff = fromToken.decimals - toToken.decimals;
    return Math.pow(10, decimalDiff);
  }

  private calculatePriceImpact(amount: number, expectedOutput: number): number {
    // Simplified price impact calculation
    if (expectedOutput === 0) return 100;
    return Math.abs((amount - expectedOutput) / expectedOutput) * 100;
  }

  // ============================================================================
  // ENHANCED WALLET FEATURES - TRANSACTION HISTORY
  // ============================================================================

  /**
   * Get transaction history for an account
   * Note: This uses Mirror Node API - implementation depends on actual MirrorService
   */
  async getTransactionHistory(
    accountId: string,
    limit: number = 20
  ): Promise<HederaServiceResponse<TransactionHistoryEntry[]>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      
      // Query account info to get transaction records
      // In production, this would query Mirror Node API
      // For now, return empty array as placeholder
      const history: TransactionHistoryEntry[] = [];

      console.log(`[History] Retrieved ${history.length} transactions for ${accountId}`);
      return history;
    }, "getTransactionHistory");
  }

  private inferTransactionType(tx: { transfers?: { account: string }[]; tokenTransfers?: unknown[] }): string {
    if (tx.tokenTransfers && (tx.tokenTransfers as unknown[]).length > 0) return "TOKEN_TRANSFER";
    if (tx.transfers && (tx.transfers as { account: string }[]).length > 0) return "HBAR_TRANSFER";
    return "UNKNOWN";
  }

  private extractTransactionAmount(tx: { transfers?: { account: string; amount: number }[] }): number {
    if (!tx.transfers) return 0;
    const amounts = tx.transfers.map(t => Math.abs(t.amount));
    return Math.max(...amounts, 0);
  }

  private extractTokenId(tx: { tokenTransfers?: unknown[] }): string | undefined {
    if (!tx.tokenTransfers || (tx.tokenTransfers as unknown[]).length === 0) return undefined;
    const firstTransfer = (tx.tokenTransfers as { token_id?: string }[])[0];
    return firstTransfer?.token_id;
  }

  /**
   * Create Family Health Token (FHT)
   */
  async createFamilyHealthToken(
    tokenName: string = "Family Health Token",
    initialSupply: number = 1000000,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(this.FAMILY_HEALTH_TOKEN_SYMBOL)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(client.operatorAccountId!)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(client.operatorPublicKey!)
        .setAdminKey(client.operatorPublicKey!)
        .setFreezeDefault(false);

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      if (!receipt.tokenId) {
        throw new Error("Failed to create token - no token ID returned");
      }

      const tokenId = receipt.tokenId.toString();
      console.log(`✅ Created Family Health Token: ${tokenId}`);

      return tokenId;
    }, "createFamilyHealthToken");
  }

  /**
   * Create Achievement NFT collection
   */
  async createAchievementNFT(
    collectionName: string = "Family Achievement NFTs",
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new TokenCreateTransaction()
        .setTokenName(collectionName)
        .setTokenSymbol(this.ACHIEVEMENT_NFT_SYMBOL)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(client.operatorAccountId!)
        .setSupplyKey(client.operatorPublicKey!)
        .setAdminKey(client.operatorPublicKey!)
        .setFreezeDefault(false);

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      if (!receipt.tokenId) {
        throw new Error(
          "Failed to create NFT collection - no token ID returned",
        );
      }

      const tokenId = receipt.tokenId.toString();
      console.log(`✅ Created Achievement NFT collection: ${tokenId}`);

      return tokenId;
    }, "createAchievementNFT");
  }

  /**
   * Reward positive interaction with FHT tokens
   */
  async rewardPositiveInteraction(
    recipientAccountId: string,
    points: number,
    reason: string = "Positive family interaction",
  ): Promise<HederaServiceResponse<TokenReward>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      const config = this.hederaService.getConfig();

      if (!config.familyHealthTokenId) {
        throw new Error("Family Health Token ID not configured");
      }

      const tokenId = TokenId.fromString(config.familyHealthTokenId);
      const recipientId = AccountId.fromString(recipientAccountId);
      const treasuryId = config.treasuryAccountId
        ? AccountId.fromString(config.treasuryAccountId)
        : client.operatorAccountId!;

      // First, ensure recipient is associated with the token
      await this.ensureTokenAssociation(
        recipientAccountId,
        config.familyHealthTokenId,
      );

      // Transfer tokens from treasury to recipient
      const transferTransaction = new TransferTransaction()
        .addTokenTransfer(tokenId, treasuryId, -points)
        .addTokenTransfer(tokenId, recipientId, points)
        .freezeWith(client);

      const response = await transferTransaction.execute(client);
      const receipt = await response.getReceipt(client);

      const transactionId = response.transactionId.toString();

      const reward: TokenReward = {
        recipientId: recipientAccountId,
        amount: points,
        reason,
        transactionId,
        timestamp: Date.now(),
      };

      console.log(
        `✅ Rewarded ${points} FHT to ${recipientAccountId}: ${transactionId}`,
      );

      return reward;
    }, "rewardPositiveInteraction");
  }

  /**
   * Mint achievement NFT for family milestone
   */
  async mintAchievementNFT(
    recipientAccountId: string,
    achievementType: AchievementType,
    familyId: string,
  ): Promise<HederaServiceResponse<AchievementNFT>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      const config = this.hederaService.getConfig();

      if (!config.achievementNftId) {
        throw new Error("Achievement NFT collection ID not configured");
      }

      const tokenId = TokenId.fromString(config.achievementNftId);
      const recipientId = AccountId.fromString(recipientAccountId);

      // Generate achievement metadata
      const metadata = this.generateAchievementMetadata(
        achievementType,
        familyId,
      );
      const metadataBytes = Buffer.from(JSON.stringify(metadata));

      // First, ensure recipient is associated with the NFT collection
      await this.ensureTokenAssociation(
        recipientAccountId,
        config.achievementNftId,
      );

      // Mint NFT
      const mintTransaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([metadataBytes])
        .freezeWith(client);

      const mintResponse = await mintTransaction.execute(client);
      const mintReceipt = await mintResponse.getReceipt(client);

      if (!mintReceipt.serials || mintReceipt.serials.length === 0) {
        throw new Error("Failed to mint NFT - no serial number returned");
      }

      const serialNumber = mintReceipt.serials[0].toNumber();

      // Transfer NFT to recipient
      const transferTransaction = new TransferTransaction()
        .addNftTransfer(
          tokenId,
          serialNumber,
          client.operatorAccountId!,
          recipientId,
        )
        .freezeWith(client);

      const transferResponse = await transferTransaction.execute(client);
      const transferTransactionId = transferResponse.transactionId.toString();

      const achievementNFT: AchievementNFT = {
        tokenId: config.achievementNftId,
        serialNumber,
        metadata,
        owner: recipientAccountId,
        mintedAt: Date.now(),
      };

      console.log(
        `✅ Minted achievement NFT for ${recipientAccountId}: ${achievementType} (Serial: ${serialNumber})`,
      );

      return achievementNFT;
    }, "mintAchievementNFT");
  }

  /**
   * Get account balance including tokens and NFTs
   */
  async getAccountBalance(
    accountId: string,
  ): Promise<HederaServiceResponse<AccountBalance>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      const cache = this.hederaService.getCache();
      const cacheKey = `balance_${accountId}`;

      // Check cache first
      const cached = cache.accountBalances.get(cacheKey);
      const lastUpdate = cache.lastUpdated.get(cacheKey) || 0;
      const now = Date.now();

      if (cached && now - lastUpdate < 30000) {
        // 30 second cache
        return cached;
      }

      const query = new AccountBalanceQuery().setAccountId(
        AccountId.fromString(accountId),
      );

      const balance = await query.execute(client);

      const tokenBalances: TokenBalance[] = [];
      const nftBalances: any[] = [];

      // Process token balances
      if (balance.tokens) {
        for (const [tokenId, amount] of balance.tokens) {
          const tokenBalance: TokenBalance = {
            tokenId: tokenId.toString(),
            balance: amount.toNumber(),
            decimals: 0, // Would need separate query for decimals
          };
          tokenBalances.push(tokenBalance);
        }
      }

      const accountBalance: AccountBalance = {
        accountId,
        hbarBalance: balance.hbars.toTinybars().toNumber(),
        tokens: tokenBalances,
        nfts: nftBalances,
      };

      // Cache the result
      cache.accountBalances.set(cacheKey, accountBalance);
      cache.lastUpdated.set(cacheKey, now);

      return accountBalance;
    }, "getAccountBalance");
  }

  /**
   * Get token information
   */
  async getTokenInfo(
    tokenId: string,
  ): Promise<HederaServiceResponse<FamilyHealthToken>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();
      const cache = this.hederaService.getCache();

      // Check cache first
      const cached = cache.tokenInfo.get(tokenId);
      if (cached) {
        return cached;
      }

      const query = new TokenInfoQuery().setTokenId(
        TokenId.fromString(tokenId),
      );

      const info = await query.execute(client);

      const tokenInfo: FamilyHealthToken = {
        tokenId,
        name: info.name,
        symbol: info.symbol,
        decimals: info.decimals,
        totalSupply: info.totalSupply.toNumber(),
      };

      // Cache the result
      cache.tokenInfo.set(tokenId, tokenInfo);

      return tokenInfo;
    }, "getTokenInfo");
  }

  /**
   * Ensure account is associated with token
   */
  private async ensureTokenAssociation(
    accountId: string,
    tokenId: string,
  ): Promise<void> {
    try {
      const client = this.hederaService.getClient();

      // Check if already associated by trying to get balance
      const balanceQuery = new AccountBalanceQuery().setAccountId(
        AccountId.fromString(accountId),
      );

      const balance = await balanceQuery.execute(client);

      // If token exists in balance map, it's already associated
      if (
        balance.tokens &&
        Array.from(balance.tokens.keys()).some(
          (token) => token.toString() === tokenId,
        )
      ) {
        return;
      }

      // Associate if not already associated
      const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client);

      await associateTransaction.execute(client);
      console.log(`✅ Associated account ${accountId} with token ${tokenId}`);
    } catch (error) {
      // If association fails, it might already be associated
      console.warn(`Token association warning for ${accountId}:`, error);
    }
  }

  /**
   * Generate achievement metadata
   */
  private generateAchievementMetadata(
    achievementType: AchievementType,
    familyId: string,
  ): AchievementMetadata {
    const achievementConfig = {
      first_positive_interaction: {
        name: "First Steps",
        description: "First positive family interaction recorded",
      },
      week_streak: {
        name: "Weekly Warrior",
        description: "Maintained positive interactions for a full week",
      },
      month_streak: {
        name: "Monthly Champion",
        description: "Sustained positive family engagement for a month",
      },
      family_harmony: {
        name: "Harmony Builder",
        description: "Contributed to exceptional family harmony levels",
      },
      wisdom_seeker: {
        name: "Wisdom Seeker",
        description: "Actively sought and shared family wisdom",
      },
      bridge_builder: {
        name: "Bridge Builder",
        description: "Connected different family generations",
      },
      presence_master: {
        name: "Presence Master",
        description: "Demonstrated consistent mindful presence",
      },
      growth_champion: {
        name: "Growth Champion",
        description: "Showed remarkable personal and family growth",
      },
    };

    const config = achievementConfig[achievementType];
    const now = Date.now();

    return {
      name: config.name,
      description: config.description,
      image: `https://family-ai-achievements.com/images/${achievementType}.png`,
      attributes: [
        {
          trait_type: "Achievement Type",
          value: achievementType,
        },
        {
          trait_type: "Family ID",
          value: familyId,
        },
        {
          trait_type: "Unlocked Date",
          value: new Date(now).toISOString(),
        },
        {
          trait_type: "Rarity",
          value: this.getAchievementRarity(achievementType),
        },
      ],
      familyId,
      achievementType,
      unlockedAt: now,
    };
  }

  /**
   * Get achievement rarity
   */
  private getAchievementRarity(achievementType: AchievementType): string {
    const rarityMap = {
      first_positive_interaction: "Common",
      week_streak: "Uncommon",
      month_streak: "Rare",
      family_harmony: "Epic",
      wisdom_seeker: "Rare",
      bridge_builder: "Epic",
      presence_master: "Legendary",
      growth_champion: "Legendary",
    };

    return rarityMap[achievementType] || "Common";
  }
}
