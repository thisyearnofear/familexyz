import { HederaService } from "@elizaos/hedera-core";
import {
    FamilyHederaMetricsLogger,
    FamilyInteractionType,
    FamilyMetricsConfig,
    createFamilyMetricsLogger,
} from "../metrics/FamilyHederaMetrics.js";
import {
    TopicId,
    TokenId,
    AccountId,
    TransferTransaction,
    Hbar,
} from "@hashgraph/sdk";

/**
 * Family agent configuration for Hedera integration
 */
export interface FamilyAgentConfig {
    agentType: "wisdom" | "intimacy" | "generational" | "presence" | "growth";
    consensusTopicId: string;
    rewardTokenId?: string;
    specializations: FamilyInteractionType[];
    rewardMultiplier: number;
    enableTokenomics: boolean;
    enableConsensusLogging: boolean;
}

/**
 * Family conversation context for enhanced interactions
 */
export interface FamilyConversationContext {
    sessionId: string;
    participants: string[];
    familyId: string;
    agentType: FamilyAgentConfig["agentType"];
    conversationHistory: FamilyMessage[];
    familyGoals: string[];
    currentChallenges: string[];
    culturalContext?: {
        traditions: string[];
        language: string;
        values: string[];
    };
}

/**
 * Enhanced family message with Hedera tracking
 */
export interface FamilyMessage {
    id: string;
    content: string;
    sender: string;
    timestamp: number;
    interactionType: FamilyInteractionType;
    sentiment?: {
        polarity: number;
        familyTone: string;
        healthScore: number;
    };
    hederaMetadata?: {
        transactionId?: string;
        consensusTimestamp?: number;
        rewardAmount?: number;
    };
}

/**
 * Family tokenomics configuration
 */
export interface FamilyTokenomics {
    enabled: boolean;
    tokenId?: string;
    treasuryAccountId?: string;
    rewardPool: number; // Available rewards in tinybars
    distributionRules: {
        immediateReward: number; // Percentage for immediate distribution
        savingsReward: number; // Percentage for family savings
        charityReward: number; // Percentage for family charity
    };
    milestoneRewards: Record<string, number>; // Special milestone rewards
}

/**
 * Shared integration layer for all family agents with Hedera
 * Implements DRY principles and common functionality
 */
export class FamilyHederaIntegration {
    private hederaService: HederaService;
    private metricsLogger: FamilyHederaMetricsLogger;
    private config: FamilyAgentConfig;
    private tokenomics: FamilyTokenomics;
    private conversationCache: Map<string, FamilyConversationContext> =
        new Map();

    constructor(
        hederaService: HederaService,
        agentConfig: FamilyAgentConfig,
        tokenomics: FamilyTokenomics,
        metricsConfig?: Partial<FamilyMetricsConfig>,
    ) {
        this.hederaService = hederaService;
        this.config = agentConfig;
        this.tokenomics = tokenomics;

        // Create metrics logger with agent-specific configuration
        const enhancedMetricsConfig = {
            consensusTopicId: agentConfig.consensusTopicId,
            rewardTokenId: agentConfig.rewardTokenId,
            ...metricsConfig,
            // Apply agent-specific reward multiplier
            rewardRates: this.applyRewardMultiplier(
                metricsConfig?.rewardRates || {},
            ),
        };

        this.metricsLogger = createFamilyMetricsLogger(
            hederaService,
            enhancedMetricsConfig,
        );
    }

    /**
     * Process a family interaction with full Hedera integration
     */
    async processFamilyInteraction(
        content: string,
        interactionType: FamilyInteractionType,
        context: FamilyConversationContext,
    ): Promise<{
        message: FamilyMessage;
        rewards: {
            amount: number;
            distributed: boolean;
            transactionId?: string;
        };
        familyHealthImpact: {
            communicationImprovement: number;
            emotionalBonding: number;
            conflictResolution: number;
            traditionPreservation: number;
        };
    }> {
        // Validate that this agent can handle this interaction type
        if (!this.config.specializations.includes(interactionType)) {
            throw new Error(
                `Agent ${this.config.agentType} cannot process interaction type ${interactionType}`,
            );
        }

        // Log metrics to Hedera consensus
        const metrics = await this.metricsLogger.logFamilyInteraction(
            content,
            interactionType,
            context.participants,
            this.calculateInteractionDuration(context),
        );

        // Create family message
        const message: FamilyMessage = {
            id: this.generateMessageId(),
            content,
            sender: `${this.config.agentType}_agent`,
            timestamp: Date.now(),
            interactionType,
            sentiment: {
                polarity: metrics.sentiment.polarity,
                familyTone: metrics.sentiment.familyTone,
                healthScore: metrics.sentiment.healthScore,
            },
            hederaMetadata: {
                rewardAmount: metrics.hederaReward.amount,
            },
        };

        // Distribute rewards if tokenomics enabled
        let rewardResult: {
            amount: number;
            distributed: boolean;
            transactionId?: string;
        } = {
            amount: metrics.hederaReward.amount,
            distributed: false,
        };

        if (this.tokenomics.enabled && this.config.enableTokenomics) {
            rewardResult = await this.distributeRewards(
                metrics.hederaReward.amount,
                context.participants,
                context.familyId,
            );

            // Update message with transaction info
            message.hederaMetadata!.transactionId = rewardResult.transactionId;
        }

        // Submit HCS-10 compliant message to consensus
        if (this.config.enableConsensusLogging) {
            await this.submitHCS10Interaction(
                content,
                interactionType,
                context,
                metrics,
            );
        }

        // Update conversation context
        await this.updateConversationContext(context, message);

        return {
            message,
            rewards: rewardResult,
            familyHealthImpact: metrics.familyHealthImpact,
        };
    }

    /**
     * Submit HCS-10 compliant family interaction to consensus
     */
    private async submitHCS10Interaction(
        content: string,
        interactionType: FamilyInteractionType,
        context: FamilyConversationContext,
        metrics: any,
    ): Promise<void> {
        try {
            const hcs10Message = {
                standard: "HCS-10",
                version: "1.0",
                timestamp: Date.now(),
                messageId: this.generateMessageId(),
                sender: `${this.config.agentType}_agent`,
                topicId: this.config.consensusTopicId,
                type: "family_interaction",
                payload: {
                    familyId: context.familyId,
                    agentType: this.config.agentType,
                    interactionType: interactionType,
                    contentHash: this.hashContent(content),
                    participants: context.participants,
                    sentiment: {
                        polarity: metrics.sentiment.polarity,
                        familyTone: metrics.sentiment.familyTone,
                        healthScore: metrics.sentiment.healthScore,
                    },
                    metadata: {
                        sessionId: context.sessionId,
                        interactionDuration:
                            this.calculateInteractionDuration(context),
                    },
                },
            };

            await this.hederaService.consensus.submitHCS10Message(
                this.config.consensusTopicId,
                hcs10Message,
            );
        } catch (error) {
            console.error("Failed to submit HCS-10 message:", error);
        }
    }

    /**
     * Create agent-specific conversation context
     */
    async createConversationContext(
        familyId: string,
        participants: string[],
        initialGoals: string[] = [],
        culturalContext?: FamilyConversationContext["culturalContext"],
    ): Promise<FamilyConversationContext> {
        const sessionId = this.generateSessionId();

        const context: FamilyConversationContext = {
            sessionId,
            participants,
            familyId,
            agentType: this.config.agentType,
            conversationHistory: [],
            familyGoals: this.getAgentSpecificGoals(initialGoals),
            currentChallenges: await this.identifyCurrentChallenges(familyId),
            culturalContext,
        };

        this.conversationCache.set(sessionId, context);
        return context;
    }

    /**
     * Get family-specific conversation context with agent expertise
     */
    async getEnhancedContext(
        sessionId: string,
    ): Promise<FamilyConversationContext | null> {
        const context = this.conversationCache.get(sessionId);
        if (!context) return null;

        // Enhance context with agent-specific insights
        context.familyGoals = await this.updateFamilyGoals(context);
        context.currentChallenges = await this.identifyCurrentChallenges(
            context.familyId,
        );

        return context;
    }

    /**
     * Submit family milestone to Hedera consensus
     */
    async submitFamilyMilestone(
        milestoneType: string,
        description: string,
        participants: string[],
        familyId: string,
    ): Promise<{
        success: boolean;
        transactionId?: string;
        consensusTimestamp?: number;
        rewardAmount?: number;
    }> {
        if (!this.config.enableConsensusLogging) {
            return { success: false };
        }

        try {
            let rewardAmount = 0;
            if (
                this.tokenomics.enabled &&
                this.tokenomics.milestoneRewards[milestoneType]
            ) {
                rewardAmount = this.tokenomics.milestoneRewards[milestoneType];
                await this.distributeRewards(
                    rewardAmount,
                    participants,
                    familyId,
                );
            }

            // Submit HCS-10 compliant milestone message
            const hcs10Message = {
                standard: "HCS-10",
                version: "1.0",
                timestamp: Date.now(),
                messageId: `milestone_${this.generateMessageId()}`,
                sender: `${this.config.agentType}_agent`,
                topicId: this.config.consensusTopicId,
                type: "family_milestone",
                payload: {
                    familyId,
                    agentType: this.config.agentType,
                    milestoneType,
                    description,
                    participants,
                    rewardAmount: rewardAmount > 0 ? rewardAmount : undefined,
                    metadata: {
                        agentSignature: await this.generateAgentSignature(
                            milestoneType,
                            familyId,
                        ),
                    },
                },
            };

            const response =
                await this.hederaService.consensus.submitHCS10Message(
                    this.config.consensusTopicId,
                    hcs10Message,
                );

            return {
                success: true,
                transactionId: response.data,
                rewardAmount,
            };
        } catch (error) {
            console.error(
                `❌ Failed to submit milestone for ${this.config.agentType}:`,
                error,
            );
            return { success: false };
        }
    }

    /**
     * Get family health dashboard data
     */
    async getFamilyHealthDashboard(familyId: string): Promise<{
        overallHealthScore: number;
        agentSpecificMetrics: Record<string, number>;
        recentMilestones: string[];
        recommendedActions: string[];
        tokenomicsStats: {
            totalEarned: number;
            rewardsDistributed: number;
            savingsBalance: number;
        };
    }> {
        // Agent-specific health calculations
        const agentMetrics = await this.calculateAgentMetrics(familyId);
        const overallScore = this.calculateOverallHealthScore(agentMetrics);

        return {
            overallHealthScore: overallScore,
            agentSpecificMetrics: agentMetrics,
            recentMilestones: await this.getRecentMilestones(familyId),
            recommendedActions: this.generateRecommendations(agentMetrics),
            tokenomicsStats: await this.getTokenomicsStats(familyId),
        };
    }

    /**
     * Distribute rewards according to family tokenomics rules
     */
    private async distributeRewards(
        amount: number,
        participants: string[],
        familyId: string,
    ): Promise<{
        amount: number;
        distributed: boolean;
        transactionId?: string;
    }> {
        if (!this.tokenomics.enabled || !this.tokenomics.tokenId) {
            return { amount, distributed: false };
        }

        try {
            const tokenId = TokenId.fromString(this.tokenomics.tokenId);
            const treasuryId = AccountId.fromString(
                this.tokenomics.treasuryAccountId!,
            );

            // Calculate distribution amounts
            const immediateAmount = Math.floor(
                (amount * this.tokenomics.distributionRules.immediateReward) /
                    100,
            );
            const savingsAmount = Math.floor(
                (amount * this.tokenomics.distributionRules.savingsReward) /
                    100,
            );
            const charityAmount = amount - immediateAmount - savingsAmount;

            // Create transfer transaction
            const transferTx = new TransferTransaction();

            // Distribute immediate rewards to participants
            const rewardPerParticipant = Math.floor(
                immediateAmount / participants.length,
            );
            participants.forEach((participantId) => {
                transferTx
                    .addTokenTransfer(
                        tokenId,
                        treasuryId,
                        -rewardPerParticipant,
                    )
                    .addTokenTransfer(
                        tokenId,
                        AccountId.fromString(participantId),
                        rewardPerParticipant,
                    );
            });

            // Execute transaction
            const response = await transferTx.execute(
                this.hederaService.getClient(),
            );
            const receipt = await response.getReceipt(
                this.hederaService.getClient(),
            );

            return {
                amount,
                distributed: receipt.status.toString() === "SUCCESS",
                transactionId: response.transactionId.toString(),
            };
        } catch (error) {
            console.error("❌ Failed to distribute rewards:", error);
            return { amount, distributed: false };
        }
    }

    /**
     * Apply agent-specific reward multipliers
     */
    private applyRewardMultiplier(
        baseRates: Record<string, number>,
    ): Record<FamilyInteractionType, number> {
        const defaultRates: Record<FamilyInteractionType, number> = {
            wisdom_shared: 150,
            intimacy_moment: 200,
            generational_story: 175,
            mindful_presence: 100,
            growth_milestone: 250,
            conflict_resolved: 300,
            tradition_preserved: 200,
            empathy_expressed: 125,
        };

        const rates = { ...defaultRates, ...baseRates };

        // Apply agent-specific multiplier
        Object.keys(rates).forEach((key) => {
            rates[key as FamilyInteractionType] = Math.floor(
                rates[key as FamilyInteractionType] *
                    this.config.rewardMultiplier,
            );
        });

        return rates;
    }

    /**
     * Get agent-specific family goals
     */
    private getAgentSpecificGoals(generalGoals: string[]): string[] {
        const agentSpecificGoals: Record<string, string[]> = {
            wisdom: [
                "Develop emotional intelligence",
                "Improve conflict resolution skills",
                "Strengthen family values alignment",
                "Practice empathy and understanding",
            ],
            intimacy: [
                "Increase quality time together",
                "Improve communication in relationships",
                "Strengthen emotional bonds",
                "Create romantic moments and memories",
            ],
            generational: [
                "Preserve family history and traditions",
                "Bridge generational communication gaps",
                "Share wisdom across age groups",
                "Document family stories and recipes",
            ],
            presence: [
                "Practice mindfulness as a family",
                "Reduce screen time during family activities",
                "Develop stress management techniques",
                "Create peaceful family environments",
            ],
            growth: [
                "Set and achieve family goals together",
                "Celebrate individual and family milestones",
                "Develop growth mindset in all family members",
                "Support each other's personal development",
            ],
        };

        return [
            ...generalGoals,
            ...(agentSpecificGoals[this.config.agentType] || []),
        ];
    }

    /**
     * Calculate agent-specific metrics for family health
     */
    private async calculateAgentMetrics(
        familyId: string,
    ): Promise<Record<string, number>> {
        // This would typically query stored metrics from Hedera consensus
        // For now, return example metrics based on agent type
        const baseMetrics: Record<string, number> = {
            engagement: 75,
            satisfaction: 80,
            progress: 70,
            consistency: 85,
        };

        // Agent-specific metric adjustments
        switch (this.config.agentType) {
            case "wisdom":
                baseMetrics.conflictResolution = 78;
                baseMetrics.emotionalIntelligence = 82;
                break;
            case "intimacy":
                baseMetrics.relationshipSatisfaction = 85;
                baseMetrics.communicationQuality = 79;
                break;
            case "generational":
                baseMetrics.traditionPreservation = 88;
                baseMetrics.storytellingEngagement = 92;
                break;
            case "presence":
                baseMetrics.mindfulnessScore = 76;
                baseMetrics.digitalWellness = 71;
                break;
            case "growth":
                baseMetrics.goalAchievement = 83;
                baseMetrics.challengeCompletion = 77;
                break;
        }

        return baseMetrics;
    }

    private calculateOverallHealthScore(
        metrics: Record<string, number>,
    ): number {
        const values = Object.values(metrics);
        return Math.floor(
            values.reduce((sum, val) => sum + val, 0) / values.length,
        );
    }

    private async getRecentMilestones(familyId: string): Promise<string[]> {
        // Would query Hedera consensus for recent milestones
        return [`Recent ${this.config.agentType} milestone achieved`];
    }

    private generateRecommendations(metrics: Record<string, number>): string[] {
        const recommendations: string[] = [];

        // Generate agent-specific recommendations based on metrics
        Object.entries(metrics).forEach(([metric, score]) => {
            if (score < 70) {
                recommendations.push(
                    `Improve ${metric} through targeted ${this.config.agentType} activities`,
                );
            }
        });

        return recommendations;
    }

    private async getTokenomicsStats(familyId: string): Promise<{
        totalEarned: number;
        rewardsDistributed: number;
        savingsBalance: number;
    }> {
        // Would query actual Hedera token balances and transaction history
        return {
            totalEarned: 5000,
            rewardsDistributed: 3000,
            savingsBalance: 2000,
        };
    }

    private async identifyCurrentChallenges(
        familyId: string,
    ): Promise<string[]> {
        // Would analyze recent interactions and identify challenges
        return [`${this.config.agentType}-specific challenge identified`];
    }

    private async updateFamilyGoals(
        context: FamilyConversationContext,
    ): Promise<string[]> {
        // Would update goals based on progress and new insights
        return context.familyGoals;
    }

    private calculateInteractionDuration(
        context: FamilyConversationContext,
    ): number {
        // Calculate estimated duration based on conversation length and type
        const baseSeconds = 180; // 3 minutes base
        const messagesMultiplier = context.conversationHistory.length * 30; // 30 seconds per message
        return baseSeconds + messagesMultiplier;
    }

    private async updateConversationContext(
        context: FamilyConversationContext,
        message: FamilyMessage,
    ): Promise<void> {
        context.conversationHistory.push(message);

        // Keep only last 50 messages to prevent memory issues
        if (context.conversationHistory.length > 50) {
            context.conversationHistory =
                context.conversationHistory.slice(-50);
        }

        // Update cache
        this.conversationCache.set(context.sessionId, context);
    }

    private async generateAgentSignature(
        milestoneType: string,
        familyId: string,
    ): Promise<string> {
        // Generate a unique signature for this agent's milestone submissions
        const data = `${this.config.agentType}_${milestoneType}_${familyId}_${Date.now()}`;
        return Buffer.from(data).toString("base64");
    }

    private generateMessageId(): string {
        return `${this.config.agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateSessionId(): string {
        return `session_${this.config.agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private hashContent(content: string): string {
        // Simple hash function for content hashing
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Clean shutdown of the integration layer
     */
    async dispose(): Promise<void> {
        await this.metricsLogger.dispose();
        this.conversationCache.clear();
    }
}

/**
 * Factory function to create configured family-Hedera integration
 */
export function createFamilyHederaIntegration(
    hederaService: HederaService,
    agentConfig: FamilyAgentConfig,
    tokenomics: FamilyTokenomics,
    metricsConfig?: Partial<FamilyMetricsConfig>,
): FamilyHederaIntegration {
    return new FamilyHederaIntegration(
        hederaService,
        agentConfig,
        tokenomics,
        metricsConfig,
    );
}

/**
 * Default configurations for different family agents
 */
export const DEFAULT_AGENT_CONFIGS: Record<
    FamilyAgentConfig["agentType"],
    Partial<FamilyAgentConfig>
> = {
    wisdom: {
        specializations: [
            "wisdom_shared",
            "conflict_resolved",
            "empathy_expressed",
        ],
        rewardMultiplier: 1.2,
    },
    intimacy: {
        specializations: ["intimacy_moment", "empathy_expressed"],
        rewardMultiplier: 1.5,
    },
    generational: {
        specializations: [
            "generational_story",
            "tradition_preserved",
            "wisdom_shared",
        ],
        rewardMultiplier: 1.3,
    },
    presence: {
        specializations: ["mindful_presence", "growth_milestone"],
        rewardMultiplier: 1.0,
    },
    growth: {
        specializations: ["growth_milestone", "conflict_resolved"],
        rewardMultiplier: 1.4,
    },
};

/**
 * Default tokenomics configuration
 */
export const DEFAULT_TOKENOMICS: FamilyTokenomics = {
    enabled: true,
    rewardPool: 1000000, // 1M tinybars
    distributionRules: {
        immediateReward: 60, // 60% immediate
        savingsReward: 30, // 30% savings
        charityReward: 10, // 10% charity
    },
    milestoneRewards: {
        weekly_goal_achieved: 500,
        monthly_challenge_completed: 1000,
        family_tradition_preserved: 750,
        conflict_peacefully_resolved: 1200,
        new_family_member_welcomed: 2000,
    },
};
