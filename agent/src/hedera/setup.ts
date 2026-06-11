import {
    type AgentRuntime,
    type Character,
    elizaLogger,
} from "@elizaos/core";
import { HederaService, HederaAgentKitService } from "@elizaos/hedera-core";
import type { HederaConfig, HederaFamilyMetrics } from "@elizaos/hedera-core";

export async function initializeHederaService(character: Character, runtime: AgentRuntime): Promise<void> {
    const hasOperatorCreds = !!process.env.HEDERA_OPERATOR_ID && !!process.env.HEDERA_OPERATOR_KEY;

    if (!hasOperatorCreds) {
        elizaLogger.info("Hedera env not found; skipping HederaService initialization");
        return;
    }

    try {
        const hederaConfig: HederaConfig = {
            network: (process.env.HEDERA_NETWORK as any) || "testnet",
            accountId: process.env.HEDERA_OPERATOR_ID!,
            privateKey: process.env.HEDERA_OPERATOR_KEY!,
            familyTopicId: process.env.HEDERA_WISDOM_TOPIC_ID,
            familyHealthTokenId: process.env.HEDERA_FAMILY_TOKEN_ID,
            treasuryAccountId: process.env.HEDERA_TREASURY_ACCOUNT_ID,
        };

        const hederaService = HederaService.getInstance(hederaConfig);
        const init = await hederaService.initialize();

        if (!init.success) {
            elizaLogger.warn("HederaService initialization failed:", init.error);
            return;
        }

        (runtime as any).hederaService = hederaService;
        elizaLogger.info("HederaService initialized and attached");

        try {
            const client = hederaService.getClient();
            const agentKit = HederaAgentKitService.getInstance();
            agentKit.initialize(client);

            const tools = agentKit.getTools();
            for (const tool of tools) {
                runtime.registerAction(tool as any);
            }
            elizaLogger.info(`Hedera Agent Kit initialized with ${tools.length} tools registered`);
        } catch (agentKitError) {
            elizaLogger.warn("Hedera Agent Kit initialization failed; continuing without it:", agentKitError);
        }

        await createConsensusTopicIfNeeded(character, hederaService);
        await submitStartupTestIfNeeded(character, runtime, hederaService);

    } catch (hederaError) {
        elizaLogger.warn("Error initializing HederaService; continuing without it:", hederaError);
    }
}

async function createConsensusTopicIfNeeded(character: Character, hederaService: HederaService): Promise<void> {
    const consensusEnabled = process.env.HEDERA_ENABLE_CONSENSUS === "true";
    const hasTopicId = !!process.env.HEDERA_WISDOM_TOPIC_ID;

    if (consensusEnabled && !hasTopicId) {
        const memo = process.env.HEDERA_TOPIC_MEMO_DEFAULT ||
            `Family interactions consensus log for ${character.name}`;

        const topicResp = await hederaService.consensus.createFamilyTopic(
            character.id ?? character.name,
            memo
        );

        if (topicResp.success && topicResp.data) {
            process.env.HEDERA_WISDOM_TOPIC_ID = topicResp.data;
            elizaLogger.info(`Created HCS topic: ${topicResp.data}`);
        } else {
            elizaLogger.warn("Failed to create HCS topic:", topicResp.error);
        }
    }
}

async function submitStartupTestIfNeeded(
    character: Character,
    runtime: AgentRuntime,
    hederaService: HederaService
): Promise<void> {
    const submitStartupTest = process.env.HEDERA_SUBMIT_STARTUP_TEST === "true";

    if (submitStartupTest && process.env.HEDERA_WISDOM_TOPIC_ID) {
        const metrics: HederaFamilyMetrics = {
            familyId: character.id ?? character.name,
            agentId: runtime.agentId,
            timestamp: Date.now(),
            sentiment: { positive: 1, negative: 0, neutral: 0 },
            healthScore: 1,
            messageHash: `${runtime.agentId}-${Date.now()}`,
            interactionType: "wisdom",
        };

        const submitResp = await hederaService.consensus.submitInteractionDirect(
            process.env.HEDERA_WISDOM_TOPIC_ID,
            metrics
        );

        if (submitResp.success) {
            elizaLogger.info(`Submitted startup HCS test message: ${submitResp.transactionId}`);
        } else {
            elizaLogger.warn("Failed to submit startup HCS test message:", submitResp.error);
        }
    }
}
