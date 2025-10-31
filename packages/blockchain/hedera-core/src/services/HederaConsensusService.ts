import {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicInfoQuery,
    TopicId,
} from "@hashgraph/sdk";
import {
    HederaServiceResponse,
    FamilyInteraction,
    HederaFamilyMetrics,
    ConsensusMessage,
    TopicInfo,
    HCS10FamilyMessage,
    isHCS10Message,
    SentimentAnalysis,
} from "../types/index.js";
import type { HederaService } from "./HederaService.js";

export class HederaConsensusService {
    private messageQueue: (HederaFamilyMetrics | HCS10FamilyMessage)[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_SIZE = 10;
    private readonly BATCH_INTERVAL = 5000; // 5 seconds

    constructor(private hederaService: HederaService) {
        this.startBatchProcessor();
    }

    /**
     * Create a new topic for family interactions
     */
    async createFamilyTopic(
        familyId: string,
        memo?: string,
    ): Promise<HederaServiceResponse<string>> {
        return this.hederaService.executeWithRetry(async () => {
            const client = this.hederaService.getClient();

            const transaction = new TopicCreateTransaction()
                .setTopicMemo(memo || `Family interactions for ${familyId}`)
                .setAdminKey(client.operatorPublicKey!)
                .setSubmitKey(client.operatorPublicKey!)
                .setAutoRenewAccountId(client.operatorAccountId!)
                .setAutoRenewPeriod(7776000); // 90 days

            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            if (!receipt.topicId) {
                throw new Error(
                    "Failed to create topic - no topic ID returned",
                );
            }

            const topicId = receipt.topicId.toString();
            console.log(
                `✅ Created family topic: ${topicId} for family: ${familyId}`,
            );

            // Submit HCS-10 topic registration message
            const registrationMessage: HCS10FamilyMessage = {
                standard: "HCS-10",
                version: "1.0",
                timestamp: Date.now(),
                messageId: `reg_${familyId}_${Date.now()}`,
                sender: "system",
                topicId,
                type: "topic_registration",
                payload: {
                    familyId,
                    topicId,
                    memo: memo || `Family interactions for ${familyId}`,
                },
            };

            await this.submitHCS10Message(topicId, registrationMessage);

            return topicId;
        }, "createFamilyTopic");
    }

    /**
     * Submit a family interaction to the consensus service (queued for batching)
     */
    async queueInteraction(metrics: HederaFamilyMetrics): Promise<string> {
        const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Add to batch queue
        this.messageQueue.push(metrics);

        // Force flush if queue is full
        if (this.messageQueue.length >= this.BATCH_SIZE) {
            await this.flushBatch();
        }

        return queueId;
    }

    /**
     * Submit an HCS-10 compliant family message
     */
    async submitHCS10Message(
        topicId: string,
        message: HCS10FamilyMessage,
    ): Promise<HederaServiceResponse<string>> {
        return this.hederaService.executeWithRetry(async () => {
            const client = this.hederaService.getClient();
            const messageString = JSON.stringify(message);

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(TopicId.fromString(topicId))
                .setMessage(messageString);

            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            const transactionId = response.transactionId.toString();
            console.log(
                `✅ Submitted HCS-10 message to topic ${topicId}: ${transactionId}`,
            );

            return transactionId;
        }, "submitHCS10Message");
    }

    /**
     * Submit a single interaction directly (for urgent messages)
     */
    async submitInteractionDirect(
        topicId: string,
        metrics: HederaFamilyMetrics,
    ): Promise<HederaServiceResponse<string>> {
        return this.hederaService.executeWithRetry(async () => {
            const client = this.hederaService.getClient();
            const message = JSON.stringify(metrics);

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(TopicId.fromString(topicId))
                .setMessage(message);

            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            const transactionId = response.transactionId.toString();
            console.log(
                `✅ Submitted interaction to topic ${topicId}: ${transactionId}`,
            );

            return transactionId;
        }, "submitInteractionDirect");
    }

    /**
     * Get interaction history for a family
     */
    async getInteractionHistory(
        familyId: string,
        topicId?: string,
        limit = 100,
        startTime?: Date,
    ): Promise<HederaServiceResponse<FamilyInteraction[]>> {
        return this.hederaService.executeWithRetry(async () => {
            if (!topicId) {
                // Try to get from config
                topicId = this.hederaService.getConfig().familyTopicId;
                if (!topicId) {
                    throw new Error(
                        "No topic ID provided and none found in config",
                    );
                }
            }
            const interactions: FamilyInteraction[] = [];
            const cache = this.hederaService.getCache();
            const cacheKey = `${topicId}_${familyId}`;

            // Check cache first
            const cached = cache.consensusMessages.get(cacheKey);
            const lastUpdate = cache.lastUpdated.get(cacheKey) || 0;
            const now = Date.now();

            if (cached && now - lastUpdate < 30000) {
                // 30 second cache
                return this.parseConsensusMessages(cached, familyId);
            }

            // Fetch from Mirror Node
            const resp = await this.hederaService.mirror.getTopicMessages(
                topicId,
                {
                    limit,
                    order: "desc",
                    startTime: startTime ? startTime.toISOString() : undefined,
                },
            );

            const messages: ConsensusMessage[] =
                resp.success && resp.data ? resp.data : [];

            // Cache the results
            cache.consensusMessages.set(cacheKey, messages);
            cache.lastUpdated.set(cacheKey, now);

            return this.parseConsensusMessages(messages, familyId);
        }, "getInteractionHistory");
    }

    /**
     * Get topic information
     */
    async getTopicInfo(
        topicId: string,
    ): Promise<HederaServiceResponse<TopicInfo>> {
        return this.hederaService.executeWithRetry(async () => {
            const client = this.hederaService.getClient();

            // Use TopicInfoQuery to get topic information
            const topicInfo = await new TopicInfoQuery()
                .setTopicId(TopicId.fromString(topicId))
                .execute(client);

            // Return fields aligned with TopicInfo type; ensure numeric autoRenewPeriod
            return {
                topicId: topicInfo.topicId.toString(),
                adminKey: topicInfo.adminKey?.toString(),
                submitKey: topicInfo.submitKey?.toString(),
                memo: topicInfo.topicMemo,
                autoRenewPeriod: topicInfo.autoRenewPeriod
                    ? Number(topicInfo.autoRenewPeriod.seconds)
                    : undefined,
                autoRenewAccount: topicInfo.autoRenewAccountId?.toString(),
            };
        }, "getTopicInfo");
    }

    /**
     * Start the batch processor
     */
    private startBatchProcessor(): void {
        this.batchTimer = setInterval(() => {
            if (this.messageQueue.length > 0) {
                this.flushBatch().catch((error) => {
                    console.error("Batch flush failed:", error);
                });
            }
        }, this.BATCH_INTERVAL);
    }

    /**
     * Flush the current batch of messages
     */
    private async flushBatch(): Promise<void> {
        if (this.messageQueue.length === 0) return;

        const batch = this.messageQueue.splice(0, this.BATCH_SIZE);
        const config = this.hederaService.getConfig();

        if (!config.familyTopicId) {
            console.warn("No family topic ID configured, dropping batch");
            return;
        }

        try {
            const client = this.hederaService.getClient();
            const promises = batch.map(async (item) => {
                const message = JSON.stringify(item);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(TopicId.fromString(config.familyTopicId!))
                    .setMessage(message);

                return transaction.execute(client);
            });

            const responses = await Promise.allSettled(promises);

            let successful = 0;
            let failed = 0;

            for (const response of responses) {
                if (response.status === "fulfilled") {
                    successful++;
                } else {
                    failed++;
                    console.warn("Batch message failed:", response.reason);
                }
            }

            console.log(
                `✅ Batch processed: ${successful} successful, ${failed} failed`,
            );

            // Update performance metrics
            const efficiency = successful / (successful + failed);
            this.hederaService.updatePerformanceMetrics({
                batchEfficiency: efficiency,
                operationsPerSecond: successful / (this.BATCH_INTERVAL / 1000),
            });
        } catch (error) {
            console.error("Batch processing failed:", error);
            // Re-queue failed messages
            this.messageQueue.unshift(...batch);
        }
    }

    /**
     * Parse consensus messages into family interactions
     */
    private parseConsensusMessages(
        messages: ConsensusMessage[],
        familyId: string,
    ): FamilyInteraction[] {
        const interactions: FamilyInteraction[] = [];

        for (const message of messages) {
            try {
                const parsedMessage = JSON.parse(message.message);

                // Handle both legacy and HCS-10 messages
                if (isHCS10Message(parsedMessage)) {
                    // Handle HCS-10 compliant messages
                    const hcs10Message = parsedMessage as HCS10FamilyMessage;

                    // Convert to family interaction based on message type
                    let interaction: FamilyInteraction;

                    switch (hcs10Message.type) {
                        case "family_interaction":
                            // Convert HCS-10 sentiment to legacy SentimentAnalysis format
                            const sentiment: SentimentAnalysis = {
                                positive:
                                    hcs10Message.payload.sentiment.polarity > 0
                                        ? hcs10Message.payload.sentiment
                                              .polarity
                                        : 0,
                                negative:
                                    hcs10Message.payload.sentiment.polarity < 0
                                        ? Math.abs(
                                              hcs10Message.payload.sentiment
                                                  .polarity,
                                          )
                                        : 0,
                                neutral:
                                    hcs10Message.payload.sentiment.polarity ===
                                    0
                                        ? 1
                                        : 0,
                            };

                            interaction = {
                                id: hcs10Message.messageId,
                                familyId: hcs10Message.payload.familyId,
                                agentId: hcs10Message.payload.agentType,
                                userId: "unknown",
                                timestamp: hcs10Message.timestamp,
                                content: "Content not stored", // Privacy consideration
                                sentiment: sentiment,
                                healthScore:
                                    hcs10Message.payload.sentiment.healthScore,
                                interactionType: hcs10Message.payload
                                    .interactionType as any,
                                messageHash: hcs10Message.payload.contentHash,
                                consensusTimestamp: message.consensusTimestamp,
                                transactionId: message.transactionId,
                            };
                            break;

                        case "family_milestone":
                            interaction = {
                                id: hcs10Message.messageId,
                                familyId: hcs10Message.payload.familyId,
                                agentId: hcs10Message.payload.agentType,
                                userId: "unknown",
                                timestamp: hcs10Message.timestamp,
                                content: hcs10Message.payload.description,
                                sentiment: {
                                    positive: 1,
                                    negative: 0,
                                    neutral: 0,
                                },
                                healthScore: 80, // Default milestone score
                                interactionType: "growth" as any,
                                messageHash: "",
                                consensusTimestamp: message.consensusTimestamp,
                                transactionId: message.transactionId,
                            };
                            break;

                        default:
                            // Skip other message types
                            continue;
                    }

                    // Filter by family ID
                    if (interaction.familyId === familyId) {
                        interactions.push(interaction);
                    }
                } else {
                    // Handle legacy messages (existing HederaFamilyMetrics format)
                    const metrics: HederaFamilyMetrics = parsedMessage;

                    // Filter by family ID
                    if (metrics.familyId !== familyId) continue;

                    const interaction: FamilyInteraction = {
                        id: `${message.topicId}_${message.timestamp}`,
                        familyId: metrics.familyId,
                        agentId: metrics.agentId,
                        userId: "unknown", // Not stored in consensus message
                        timestamp: metrics.timestamp,
                        content: "Content not stored", // Privacy consideration
                        sentiment: metrics.sentiment,
                        healthScore: metrics.healthScore,
                        interactionType: metrics.interactionType,
                        messageHash: metrics.messageHash,
                        consensusTimestamp: message.consensusTimestamp,
                        transactionId: message.transactionId,
                    };

                    interactions.push(interaction);
                }
            } catch (error) {
                console.warn("Failed to parse consensus message:", error);
            }
        }

        return interactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Dispose of the service and clean up resources
     */
    async dispose(): Promise<void> {
        // Clear batch timer
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }

        // Flush any remaining messages
        if (this.messageQueue.length > 0) {
            console.log(
                `Flushing ${this.messageQueue.length} remaining messages...`,
            );
            await this.flushBatch();
        }

        console.log("✅ HederaConsensusService disposed");
    }
}
