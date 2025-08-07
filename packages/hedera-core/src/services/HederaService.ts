import {
  Client,
  AccountId,
  PrivateKey,
  TopicId,
  TokenId,
  ContractId,
  Hbar,
  Status,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
import {
  HederaConfig,
  HederaServiceResponse,
  HederaError,
  HederaCache,
  PerformanceConfig,
  PerformanceMetrics,
  HederaNetwork,
} from "../types/index.js";
import { HederaConsensusService } from "./HederaConsensusService.js";
import { HederaTokenService } from "./HederaTokenService.js";
import { HederaContractService } from "./HederaContractService.js";
import { HederaPerformanceOptimizer } from "../utils/HederaPerformanceOptimizer.js";

export class HederaService {
  private static instance: HederaService;
  private client: Client | null = null;
  private isInitialized = false;
  private cache: HederaCache;
  private performanceMetrics: PerformanceMetrics;
  private performanceConfig: PerformanceConfig;

  // Service instances
  public readonly consensus: HederaConsensusService;
  public readonly tokens: HederaTokenService;
  public readonly contracts: HederaContractService;
  public readonly optimizer: HederaPerformanceOptimizer;

  // Configuration
  private readonly defaultPerformanceConfig: PerformanceConfig = {
    batchSize: 10,
    batchInterval: 5000, // 5 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    cacheTimeout: 30000, // 30 seconds
    enableCompression: true,
  };

  private constructor(
    private config: HederaConfig,
    performanceConfig: Partial<PerformanceConfig> = {},
  ) {
    // Merge performance config with defaults
    this.performanceConfig = {
      ...this.defaultPerformanceConfig,
      ...performanceConfig,
    };

    // Initialize cache
    this.cache = {
      consensusMessages: new Map(),
      accountBalances: new Map(),
      tokenInfo: new Map(),
      lastUpdated: new Map(),
    };

    // Initialize performance metrics
    this.performanceMetrics = {
      operationsPerSecond: 0,
      averageLatency: 0,
      errorRate: 0,
      batchEfficiency: 0,
      lastUpdated: Date.now(),
    };

    // Initialize services
    this.consensus = new HederaConsensusService(this);
    this.tokens = new HederaTokenService(this);
    this.contracts = new HederaContractService(this);
    this.optimizer = new HederaPerformanceOptimizer(
      this,
      this.performanceConfig,
    );
  }

  /**
   * Get singleton instance of HederaService
   */
  public static getInstance(
    config?: HederaConfig,
    performanceConfig?: PerformanceConfig,
  ): HederaService {
    if (!HederaService.instance) {
      if (!config) {
        throw new Error(
          "HederaService requires config for initial instantiation",
        );
      }
      HederaService.instance = new HederaService(config, performanceConfig);
    }
    return HederaService.instance;
  }

  /**
   * Initialize Hedera client connection
   */
  public async initialize(): Promise<HederaServiceResponse<boolean>> {
    if (this.isInitialized && this.client) {
      return { success: true, data: true };
    }

    try {
      // Validate configuration
      this.validateConfig();

      // Create client based on network
      this.client = this.createClient();

      // Set operator
      const accountId = AccountId.fromString(this.config.accountId);
      const privateKey = PrivateKey.fromString(this.config.privateKey);
      this.client.setOperator(accountId, privateKey);

      // Test connection with account balance query
      const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await balanceQuery.execute(this.client);
      console.log(
        `✅ Hedera client initialized. Account balance: ${balance.hbars.toString()}`,
      );

      this.isInitialized = true;
      return {
        success: true,
        data: true,
        transactionId: `init_${Date.now()}`,
      };
    } catch (error) {
      const hederaError = this.createHederaError(
        error as Error,
        "INITIALIZATION_FAILED",
      );
      console.error("❌ Failed to initialize Hedera client:", hederaError);
      return {
        success: false,
        error: hederaError.message,
      };
    }
  }

  /**
   * Get Hedera client instance
   */
  public getClient(): Client {
    if (!this.client || !this.isInitialized) {
      throw new Error(
        "HederaService not initialized. Call initialize() first.",
      );
    }
    return this.client;
  }

  /**
   * Get current configuration
   */
  public getConfig(): HederaConfig {
    return { ...this.config };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get cache instance
   */
  public getCache(): HederaCache {
    return this.cache;
  }

  /**
   * Update performance metrics
   */
  public updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...metrics,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Check if service is ready for operations
   */
  public isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<
    HederaServiceResponse<{
      status: string;
      network: HederaNetwork;
      accountBalance: string;
      latency: number;
    }>
  > {
    const startTime = Date.now();

    try {
      if (!this.isReady()) {
        return {
          success: false,
          error: "Service not initialized",
        };
      }

      const accountId = AccountId.fromString(this.config.accountId);
      const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await balanceQuery.execute(this.client!);
      const latency = Date.now() - startTime;

      return {
        success: true,
        data: {
          status: "healthy",
          network: this.config.network,
          accountBalance: balance.hbars.toString(),
          latency,
        },
      };
    } catch (error) {
      const hederaError = this.createHederaError(
        error as Error,
        "HEALTH_CHECK_FAILED",
      );
      return {
        success: false,
        error: hederaError.message,
      };
    }
  }

  /**
   * Gracefully close the service
   */
  public async close(): Promise<void> {
    try {
      // Close optimizer and flush any pending operations
      await this.optimizer.dispose();

      // Close client connection
      if (this.client) {
        this.client.close();
        this.client = null;
      }

      // Clear cache
      this.cache.consensusMessages.clear();
      this.cache.accountBalances.clear();
      this.cache.tokenInfo.clear();
      this.cache.lastUpdated.clear();

      this.isInitialized = false;
      console.log("✅ HederaService closed gracefully");
    } catch (error) {
      console.error("❌ Error closing HederaService:", error);
    }
  }

  /**
   * Create Hedera client based on network configuration
   */
  private createClient(): Client {
    switch (this.config.network) {
      case "testnet":
        return Client.forTestnet();
      case "mainnet":
        return Client.forMainnet();
      case "previewnet":
        return Client.forPreviewnet();
      default:
        throw new Error(`Unsupported Hedera network: ${this.config.network}`);
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const required = ["network", "accountId", "privateKey"];
    for (const field of required) {
      if (!this.config[field as keyof HederaConfig]) {
        throw new Error(`Missing required Hedera configuration: ${field}`);
      }
    }

    // Validate account ID format
    try {
      AccountId.fromString(this.config.accountId);
    } catch (error) {
      throw new Error(`Invalid account ID format: ${this.config.accountId}`);
    }

    // Validate private key format
    try {
      PrivateKey.fromString(this.config.privateKey);
    } catch (error) {
      throw new Error(`Invalid private key format`);
    }
  }

  /**
   * Create standardized Hedera error
   */
  public createHederaError(error: Error, code: string): HederaError {
    return {
      code,
      message: error.message,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<HederaServiceResponse<T>> {
    let lastError: Error;
    const startTime = Date.now();

    for (
      let attempt = 1;
      attempt <= this.performanceConfig.maxRetries;
      attempt++
    ) {
      try {
        const result = await operation();
        const latency = Date.now() - startTime;

        // Update performance metrics
        this.updatePerformanceMetrics({
          averageLatency:
            (this.performanceMetrics.averageLatency + latency) / 2,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${this.performanceConfig.maxRetries} failed for ${operationName}:`,
          error,
        );

        if (attempt < this.performanceConfig.maxRetries) {
          await this.delay(this.performanceConfig.retryDelay * attempt);
        }
      }
    }

    // Update error rate metrics
    const currentErrorRate = this.performanceMetrics.errorRate;
    this.updatePerformanceMetrics({
      errorRate: (currentErrorRate + 1) / 2,
    });

    const hederaError = this.createHederaError(
      lastError!,
      `${operationName.toUpperCase()}_FAILED`,
    );
    return {
      success: false,
      error: hederaError.message,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset singleton instance (for testing purposes)
   */
  public static resetInstance(): void {
    if (HederaService.instance) {
      HederaService.instance.close();
      HederaService.instance = null as any;
    }
  }
}
