import {
  IAgentRuntime,
  elizaLogger,
  Service,
  ServiceType,
  UUID,
} from "@elizaos/core";
import { ethers } from "ethers";
import NodeCache from "node-cache";
import type {
  GDollarConfig,
  StreamingReward,
} from "../types.js";
import { validateGDollarConfig } from "../environment.js";

// Superfluid Framework integration types
interface SuperfluidConfig {
  hostAddress: string;
  cfaV1Address: string;
  superTokenAddress: string;
  resolverAddress: string;
}

// Mock Superfluid service (in production, would use @superfluid-finance/sdk-core)
class MockSuperfluidService {
  private config: SuperfluidConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private activeStreams: Map<string, StreamingReward>;

  constructor(config: SuperfluidConfig, provider: ethers.JsonRpcProvider, wallet: ethers.Wallet) {
    this.config = config;
    this.provider = provider;
    this.wallet = wallet;
    this.activeStreams = new Map();
  }

  async createStream(
    sender: string,
    receiver: string,
    flowRate: string,
    familyContext: StreamingReward['familyContext']
  ): Promise<{
    streamId: string;
    transactionHash: string;
  }> {
    elizaLogger.info(`🌊 Creating stream: ${sender} -> ${receiver} at ${flowRate} G$/sec`);
    
    // Simulate stream creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    const stream: StreamingReward = {
      streamId,
      sender,
      receiver,
      flowRate,
      startTime: Date.now(),
      totalStreamed: "0",
      status: "active",
      familyContext,
    };
    
    this.activeStreams.set(streamId, stream);
    
    elizaLogger.success(`✅ Stream created: ${streamId}`);
    return { streamId, transactionHash };
  }

  async updateStream(
    streamId: string,
    newFlowRate: string
  ): Promise<{
    transactionHash: string;
  }> {
    elizaLogger.info(`🔄 Updating stream: ${streamId} to ${newFlowRate} G$/sec`);
    
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    // Calculate total streamed so far
    const timeElapsed = (Date.now() - stream.startTime) / 1000; // seconds
    const totalStreamed = BigInt(Math.floor(Number(stream.flowRate) * timeElapsed));
    
    stream.flowRate = newFlowRate;
    stream.totalStreamed = totalStreamed.toString();
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 800));
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    this.activeStreams.set(streamId, stream);
    
    elizaLogger.success(`✅ Stream updated: ${streamId}`);
    return { transactionHash };
  }

  async deleteStream(streamId: string): Promise<{
    transactionHash: string;
    finalAmount: string;
  }> {
    elizaLogger.info(`🛑 Deleting stream: ${streamId}`);
    
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    
    // Calculate final total streamed
    const timeElapsed = (Date.now() - stream.startTime) / 1000; // seconds
    const finalAmount = BigInt(Math.floor(Number(stream.flowRate) * timeElapsed));
    
    stream.status = "cancelled";
    stream.endTime = Date.now();
    stream.totalStreamed = finalAmount.toString();
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 800));
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    this.activeStreams.delete(streamId);
    
    elizaLogger.success(`✅ Stream deleted: ${streamId}, final amount: ${ethers.formatEther(finalAmount)} G$`);
    return { transactionHash, finalAmount: finalAmount.toString() };
  }

  async getStream(streamId: string): Promise<StreamingReward | null> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return null;
    }

    // Update total streamed amount
    if (stream.status === "active") {
      const timeElapsed = (Date.now() - stream.startTime) / 1000;
      const totalStreamed = BigInt(Math.floor(Number(stream.flowRate) * timeElapsed));
      stream.totalStreamed = totalStreamed.toString();
    }

    return stream;
  }

  async getStreamsForUser(address: string): Promise<StreamingReward[]> {
    const userStreams: StreamingReward[] = [];
    
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.sender === address || stream.receiver === address) {
        // Update total streamed amount for active streams
        if (stream.status === "active") {
          const timeElapsed = (Date.now() - stream.startTime) / 1000;
          const totalStreamed = BigInt(Math.floor(Number(stream.flowRate) * timeElapsed));
          stream.totalStreamed = totalStreamed.toString();
        }
        userStreams.push(stream);
      }
    }
    
    return userStreams;
  }

  async calculateFlowRate(amountPerSecond: string): Promise<string> {
    // Convert G$ per second to wei per second
    return ethers.parseEther(amountPerSecond).toString();
  }

  async estimateMonthlyFlow(flowRate: string): Promise<string> {
    // Calculate monthly flow (30 days)
    const secondsPerMonth = 30 * 24 * 60 * 60;
    const monthlyWei = BigInt(flowRate) * BigInt(secondsPerMonth);
    return ethers.formatEther(monthlyWei);
  }
}

export class StreamingService extends Service {
  static serviceType: ServiceType = ServiceType.STREAMING;
  
  private config: GDollarConfig;
  private superfluidConfig: SuperfluidConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private superfluidService: MockSuperfluidService | null = null;
  private cache: NodeCache;

  constructor() {
    super();
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    try {
      this.config = validateGDollarConfig(runtime);
      
      if (!this.config.enableStreaming) {
        elizaLogger.info("🌊 Streaming is disabled in configuration");
        return;
      }

      this.provider = new ethers.JsonRpcProvider(this.config.rpcEndpoint);
      
      // Initialize wallet if private key is provided
      const privateKey = runtime.getSetting("GOODDOLLAR_PRIVATE_KEY");
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
      }

      // Setup Superfluid configuration based on network
      this.superfluidConfig = this.getSuperfluidConfig(this.config.network);
      
      if (this.wallet) {
        this.superfluidService = new MockSuperfluidService(
          this.superfluidConfig,
          this.provider,
          this.wallet
        );
        elizaLogger.success(`🌊 Superfluid streaming service initialized on ${this.config.network}`);
      } else {
        elizaLogger.warn("⚠️ No wallet configured for streaming service");
      }

    } catch (error) {
      elizaLogger.error("❌ Failed to initialize Streaming service:", error);
      throw error;
    }
  }

  private getSuperfluidConfig(network: "celo" | "fuse"): SuperfluidConfig {
    // Superfluid addresses for different networks
    const configs = {
      celo: {
        hostAddress: "0x18dd4e0eb8699eA4fee238dE41ecF115e32272F8", // Superfluid Host on Celo
        cfaV1Address: "0x9d369e78e1a682cE0F8d9aD849BeB00A3b1c3b67", // CFA V1 on Celo  
        superTokenAddress: this.config.superTokenAddress || "0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f",
        resolverAddress: "0xE0cc76334405EE8b39213E620587d815967af39C", // Resolver on Celo
      },
      fuse: {
        hostAddress: "0x18dd4e0eb8699eA4fee238dE41ecF115e32272F8", // Mock addresses for Fuse
        cfaV1Address: "0x9d369e78e1a682cE0F8d9aD849BeB00A3b1c3b67",
        superTokenAddress: this.config.superTokenAddress || "0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f",
        resolverAddress: "0xE0cc76334405EE8b39213E620587d815967af39C",
      },
    };
    
    return configs[network];
  }

  async createFamilyAllowanceStream(
    parentAddress: string,
    childAddress: string,
    monthlyAmount: string, // G$ per month
    familyId: UUID
  ): Promise<StreamingReward> {
    if (!this.superfluidService) {
      throw new Error("Streaming service not initialized or disabled");
    }

    try {
      // Calculate flow rate (G$ per second)
      const monthlyWei = ethers.parseEther(monthlyAmount);
      const secondsPerMonth = 30 * 24 * 60 * 60;
      const flowRatePerSecond = monthlyWei / BigInt(secondsPerMonth);

      const familyContext = {
        familyId,
        streamType: "allowance" as const,
        metadata: {
          monthlyAmount,
          purpose: "Family allowance from parent to child",
          createdAt: Date.now(),
        },
      };

      const result = await this.superfluidService.createStream(
        parentAddress,
        childAddress,
        flowRatePerSecond.toString(),
        familyContext
      );

      const stream = await this.superfluidService.getStream(result.streamId);
      if (!stream) {
        throw new Error("Failed to retrieve created stream");
      }

      elizaLogger.success(`💰 Family allowance stream created: ${monthlyAmount} G$/month from parent to child`);
      return stream;

    } catch (error) {
      elizaLogger.error("❌ Failed to create family allowance stream:", error);
      throw error;
    }
  }

  async createMilestoneStream(
    fromAddress: string,
    toAddress: string,
    totalAmount: string, // Total G$ to stream
    durationDays: number,
    milestoneDescription: string,
    familyId: UUID
  ): Promise<StreamingReward> {
    if (!this.superfluidService) {
      throw new Error("Streaming service not initialized or disabled");
    }

    try {
      // Calculate flow rate (G$ per second for specified duration)
      const totalWei = ethers.parseEther(totalAmount);
      const durationSeconds = durationDays * 24 * 60 * 60;
      const flowRatePerSecond = totalWei / BigInt(durationSeconds);

      const familyContext = {
        familyId,
        streamType: "milestone" as const,
        metadata: {
          totalAmount,
          durationDays,
          milestoneDescription,
          createdAt: Date.now(),
        },
      };

      const result = await this.superfluidService.createStream(
        fromAddress,
        toAddress,
        flowRatePerSecond.toString(),
        familyContext
      );

      const stream = await this.superfluidService.getStream(result.streamId);
      if (!stream) {
        throw new Error("Failed to retrieve created stream");
      }

      elizaLogger.success(`🎯 Milestone stream created: ${totalAmount} G$ over ${durationDays} days for "${milestoneDescription}"`);
      return stream;

    } catch (error) {
      elizaLogger.error("❌ Failed to create milestone stream:", error);
      throw error;
    }
  }

  async createContinuousRewardStream(
    fromAddress: string,
    toAddress: string,
    rewardRatePerHour: string, // G$ per hour
    familyId: UUID,
    behaviorType: string
  ): Promise<StreamingReward> {
    if (!this.superfluidService) {
      throw new Error("Streaming service not initialized or disabled");
    }

    try {
      // Calculate flow rate (G$ per second)
      const hourlyWei = ethers.parseEther(rewardRatePerHour);
      const secondsPerHour = 60 * 60;
      const flowRatePerSecond = hourlyWei / BigInt(secondsPerHour);

      const familyContext = {
        familyId,
        streamType: "continuous_reward" as const,
        metadata: {
          rewardRatePerHour,
          behaviorType,
          createdAt: Date.now(),
        },
      };

      const result = await this.superfluidService.createStream(
        fromAddress,
        toAddress,
        flowRatePerSecond.toString(),
        familyContext
      );

      const stream = await this.superfluidService.getStream(result.streamId);
      if (!stream) {
        throw new Error("Failed to retrieve created stream");
      }

      elizaLogger.success(`🔄 Continuous reward stream created: ${rewardRatePerHour} G$/hour for "${behaviorType}"`);
      return stream;

    } catch (error) {
      elizaLogger.error("❌ Failed to create continuous reward stream:", error);
      throw error;
    }
  }

  async updateStreamFlowRate(
    streamId: string,
    newAmountPerSecond: string
  ): Promise<string> {
    if (!this.superfluidService) {
      throw new Error("Streaming service not initialized or disabled");
    }

    try {
      const flowRate = await this.superfluidService.calculateFlowRate(newAmountPerSecond);
      const result = await this.superfluidService.updateStream(streamId, flowRate);
      
      elizaLogger.success(`🔄 Stream flow rate updated: ${streamId}`);
      return result.transactionHash;

    } catch (error) {
      elizaLogger.error("❌ Failed to update stream flow rate:", error);
      throw error;
    }
  }

  async cancelStream(streamId: string): Promise<{
    transactionHash: string;
    finalAmount: string;
  }> {
    if (!this.superfluidService) {
      throw new Error("Streaming service not initialized or disabled");
    }

    try {
      const result = await this.superfluidService.deleteStream(streamId);
      
      elizaLogger.success(`🛑 Stream cancelled: ${streamId}`);
      return result;

    } catch (error) {
      elizaLogger.error("❌ Failed to cancel stream:", error);
      throw error;
    }
  }

  async getActiveStreams(userAddress: string): Promise<StreamingReward[]> {
    if (!this.superfluidService) {
      return [];
    }

    try {
      const cacheKey = `streams_${userAddress}`;
      const cached = this.cache.get<StreamingReward[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const streams = await this.superfluidService.getStreamsForUser(userAddress);
      const activeStreams = streams.filter(stream => stream.status === "active");
      
      this.cache.set(cacheKey, activeStreams);
      return activeStreams;

    } catch (error) {
      elizaLogger.error("❌ Failed to get active streams:", error);
      return [];
    }
  }

  async getStreamDetails(streamId: string): Promise<StreamingReward | null> {
    if (!this.superfluidService) {
      return null;
    }

    try {
      return await this.superfluidService.getStream(streamId);
    } catch (error) {
      elizaLogger.error("❌ Failed to get stream details:", error);
      return null;
    }
  }

  async calculateEstimatedEarnings(
    streams: StreamingReward[],
    timeframeHours: number = 24
  ): Promise<{
    totalPerHour: string;
    estimatedEarnings: string;
    breakdown: Array<{
      streamId: string;
      type: string;
      hourlyRate: string;
      estimatedAmount: string;
    }>;
  }> {
    const breakdown: Array<{
      streamId: string;
      type: string;
      hourlyRate: string;
      estimatedAmount: string;
    }> = [];

    let totalPerSecond = BigInt(0);

    for (const stream of streams) {
      if (stream.status !== "active") continue;

      const hourlyRate = BigInt(stream.flowRate) * BigInt(3600); // Convert per-second to per-hour
      const estimatedAmount = hourlyRate * BigInt(timeframeHours);
      
      totalPerSecond += BigInt(stream.flowRate);
      
      breakdown.push({
        streamId: stream.streamId,
        type: stream.familyContext.streamType,
        hourlyRate: ethers.formatEther(hourlyRate),
        estimatedAmount: ethers.formatEther(estimatedAmount),
      });
    }

    const totalPerHour = totalPerSecond * BigInt(3600);
    const estimatedEarnings = totalPerHour * BigInt(timeframeHours);

    return {
      totalPerHour: ethers.formatEther(totalPerHour),
      estimatedEarnings: ethers.formatEther(estimatedEarnings),
      breakdown,
    };
  }

  isStreamingEnabled(): boolean {
    return this.config.enableStreaming;
  }

  getConfig(): GDollarConfig {
    return this.config;
  }
}