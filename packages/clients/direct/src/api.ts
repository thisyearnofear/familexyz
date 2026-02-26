import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import {
    type AgentRuntime,
    elizaLogger,
    getEnvVariable,
    type UUID,
    validateCharacterConfig,
    ServiceType,
    type Character,
    stringToUuid,
    composeContext,
    generateMessageResponse,
    ModelClass,
    type Content,
} from "@elizaos/core";
import { z } from "zod";

// import type { TeeLogQuery, TeeLogService } from "@elizaos/plugin-tee-log";
import type { DirectClient } from "./index.js";
import { validateUuid } from "@elizaos/core";
/*
import {
    GoodDollarService,
    IdentityService,
    StreamingService,
} from "@elizaos/plugin-gooddollar";
*/

// Standardized API response interfaces
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}

// Typed response shapes for dashboard endpoints
interface WalletResponse {
    success: boolean;
    wallet: {
        address: string;
        network: string;
        balance: string;
        superTokenBalance?: string;
        canClaimUBI: boolean;
    };
}

interface FamilyResponse {
    success: boolean;
    family: {
        verifiedCount: number;
        totalMembers: number;
        verificationProgress: number;
    };
}

interface StreamsResponse {
    success: boolean;
    streaming: {
        enabled: boolean;
        activeStreams: Array<{ [key: string]: any }>;
        estimatedDaily?: string;
    };
}

interface ActivityResponse {
    success: boolean;
    activity: {
        recent: Array<{ [key: string]: any }>;
        stats: {
            totalActivities: number;
            totalRewards: string;
        };
    };
}

interface UUIDParams {
    agentId: UUID;
    roomId?: UUID;
}

// Standardized error response helper
function sendErrorResponse(
    res: express.Response,
    statusCode: number,
    error: string,
    details?: any,
): void {
    const response: ApiResponse = {
        success: false,
        error,
        timestamp: new Date().toISOString(),
        ...(details && { data: details }),
    };
    res.status(statusCode).json(response);
}

// Standardized success response helper
function sendSuccessResponse<T>(
    res: express.Response,
    data: T,
    message?: string,
): void {
    const response: ApiResponse<T> = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(message && { message }),
    };
    res.json(response);
}

// AG-UI Protocol Types & Schemas
interface AgUiBaseEvent {
    type: string;
    timestamp?: number;
}

interface AgUiTextMessageEvent extends AgUiBaseEvent {
    type: "TextMessageContent";
    messageId: string;
    delta: string;
}

interface AgUiRunLifecycleEvent extends AgUiBaseEvent {
    type: "RunStarted" | "RunFinished";
    runId: string;
}

interface AgUiToolCallEvent extends AgUiBaseEvent {
    type: "ToolCallStart" | "ToolCallEnd";
    toolCallId: string;
    toolName: string;
    toolInput?: any;
    toolOutput?: any;
}

interface AgUiReasoningEvent extends AgUiBaseEvent {
    type: "Reasoning";
    message: string;
}

interface AgUiStateDeltaEvent extends AgUiBaseEvent {
    type: "StateDelta";
    path: string;
    value: any;
}

interface AgUiInterruptEvent extends AgUiBaseEvent {
    type: "Interrupt";
    interruptId: string;
    prompt: string;
}

interface AgUiRunErrorEvent extends AgUiBaseEvent {
    type: "RunError";
    error: string;
}

interface AgUiCustomEvent extends AgUiBaseEvent {
    type: "Custom";
    customType: string;
    payload: any;
}

const AgUiEventSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("RunStarted"), runId: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("RunFinished"), runId: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("TextMessageContent"), messageId: z.string(), delta: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("ToolCallStart"), toolCallId: z.string(), toolName: z.string(), toolInput: z.any().optional(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("ToolCallEnd"), toolCallId: z.string(), toolName: z.string(), toolOutput: z.any().optional(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("Reasoning"), message: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("StateDelta"), path: z.string(), value: z.any(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("Interrupt"), interruptId: z.string(), prompt: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("RunError"), error: z.string(), timestamp: z.number().optional() }),
    z.object({ type: z.literal("Custom"), customType: z.string(), payload: z.any(), timestamp: z.number().optional() }),
]);

function validateUUIDParams(
    params: { agentId: string; roomId?: string },
    res: express.Response,
): UUIDParams | null {
    const agentId = validateUuid(params.agentId);
    if (!agentId) {
        sendErrorResponse(res, 400, "Invalid AgentId format", {
            expected: "UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            received: params.agentId,
        });
        return null;
    }

    if (params.roomId) {
        const roomId = validateUuid(params.roomId);
        if (!roomId) {
            sendErrorResponse(res, 400, "Invalid RoomId format", {
                expected: "UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                received: params.roomId,
            });
            return null;
        }
        return { agentId, roomId };
    }

    return { agentId };
}

export function createApiRouter(
    agents: Map<string, AgentRuntime>,
    directClient: DirectClient,
) {
    const router = express.Router();

    // Enable CORS and JSON parsing once on the router
    router.use(cors());
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        }),
    );

    // Unified agent lookup helper: accepts UUID or name-like identifiers
    const findAgentRuntime = (idOrName: string): AgentRuntime | undefined => {
        // Direct match by agentId first
        let runtime = agents.get(idOrName);
        if (runtime) return runtime;

        // Normalize identifier to support names without spaces/dashes
        const normalizedId = idOrName.toLowerCase().replace(/[-\s]/g, "");
        runtime = Array.from(agents.values()).find((a) => {
            const normalizedName = a.character.name
                .toLowerCase()
                .replace(/\s+/g, "");
            return (
                normalizedName === normalizedId ||
                a.character.name.toLowerCase() === idOrName.toLowerCase()
            );
        });
        return runtime;
    };

    // Helper to sanitize character response without mutating runtime state
    const sanitizeCharacterResponse = (character: Character): Character => {
        const sanitized = { ...character };
        if (sanitized.settings?.secrets) {
            delete sanitized.settings.secrets;
        }
        return sanitized;
    };

    // API status endpoint
    router.get("/", (req, res) => {
        sendSuccessResponse(
            res,
            {
                service: "FamilyXYZ API",
                version: "1.0.0",
                status: "operational",
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
            },
            "API is operational",
        );
    });

    router.get("/hello", (req, res) => {
        sendSuccessResponse(
            res,
            { message: "Hello World!" },
            "API greeting endpoint",
        );
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
            status: "running",
        }));
        sendSuccessResponse(
            res,
            {
                agents: agentsList,
                total: agentsList.length,
            },
            "Retrieved all active agents",
        );
    });

    router.get("/storage", async (req, res) => {
        try {
            const uploadDir = path.join(process.cwd(), "data", "characters");
            const files = await fs.promises.readdir(uploadDir);
            sendSuccessResponse(
                res,
                {
                    files,
                    count: files.length,
                    directory: uploadDir,
                },
                "Retrieved character storage files",
            );
        } catch (error) {
            sendErrorResponse(res, 500, "Failed to read storage directory", {
                directory: path.join(process.cwd(), "data", "characters"),
                originalError: error.message,
            });
        }
    });

    router.get("/agents/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = findAgentRuntime(agentId);

        if (!agent) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        res.json({
            id: agent.agentId,
            character: sanitizeCharacterResponse(agent.character),
        });
    });

    router.delete("/agents/:agentId", async (req, res) => {
        const agentId = req.params.agentId;
        const agent = findAgentRuntime(agentId);

        if (agent) {
            agent.stop();
            directClient.unregisterAgent(agent);
            res.status(204).json({ success: true });
        } else {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
        }
    });

    router.post("/agents/:agentId/set", async (req, res) => {
        const agentId = req.params.agentId;
        const existingAgent = findAgentRuntime(agentId);

        // update character
        if (existingAgent) {
            // stop agent
            existingAgent.stop();
            directClient.unregisterAgent(existingAgent);
            // if it has a different name, the agentId will change
        }

        // stores the json data before it is modified with added data
        const characterJson = { ...req.body };

        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            sendErrorResponse(res, 400, "Invalid character configuration", {
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        try {
            const agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);

            if (process.env.USE_CHARACTER_STORAGE === "true") {
                try {
                    const filename = `${agent.agentId}.json`;
                    const uploadDir = path.join(
                        process.cwd(),
                        "data",
                        "characters",
                    );
                    const filepath = path.join(uploadDir, filename);
                    await fs.promises.mkdir(uploadDir, { recursive: true });
                    await fs.promises.writeFile(
                        filepath,
                        JSON.stringify(
                            { ...characterJson, id: agent.agentId },
                            null,
                            2,
                        ),
                    );
                    elizaLogger.info(
                        `Character stored successfully at ${filepath}`,
                    );
                } catch (error) {
                    elizaLogger.error(
                        `Failed to store character: ${error.message}`,
                    );
                }
            }

            sendSuccessResponse(res, {
                id: agent.agentId,
                character: sanitizeCharacterResponse(character),
            }, `${character.name} agent updated successfully`);
        } catch (e) {
            elizaLogger.error(`Error starting agent: ${e}`);
            sendErrorResponse(res, 500, "Failed to start agent", {
                message: e.message,
            });
        }
    });

    // Discord channels endpoint removed - Discord functionality not needed

    router.get("/agents/:agentId/:roomId/memories", async (req, res) => {
        const agentId = req.params.agentId;
        const roomId = req.params.roomId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            const memories = await runtime.messageManager.getMemories({
                roomId: roomId as UUID,
            });
            const response = {
                agentId,
                roomId,
                memories: memories.map((memory) => ({
                    id: memory.id,
                    userId: memory.userId,
                    agentId: memory.agentId,
                    createdAt: memory.createdAt,
                    content: {
                        text: memory.content.text,
                        action: memory.content.action,
                        source: memory.content.source,
                        url: memory.content.url,
                        inReplyTo: memory.content.inReplyTo,
                        attachments: memory.content.attachments?.map(
                            (attachment) => ({
                                id: attachment.id,
                                url: attachment.url,
                                title: attachment.title,
                                source: attachment.source,
                                description: attachment.description,
                                text: attachment.text,
                                contentType: attachment.contentType,
                            }),
                        ),
                    },
                    embedding: memory.embedding,
                    roomId: memory.roomId,
                    unique: memory.unique,
                    similarity: memory.similarity,
                })),
            };

            res.json(response);
        } catch (error) {
            console.error("Error fetching memories:", error);
            res.status(500).json({ error: "Failed to fetch memories" });
        }
    });

    router.get("/tee/agents", async (req, res) => {
        try {
            const allAgents = [];

            for (const agentRuntime of agents.values()) {
                const teeLogService = agentRuntime
                    .getService<TeeLogService>(ServiceType.TEE_LOG)
                    .getInstance();

                const agents = await teeLogService.getAllAgents();
                allAgents.push(...agents);
            }

            const runtime: AgentRuntime = agents.values().next().value;
            const teeLogService = runtime
                .getService<TeeLogService>(ServiceType.TEE_LOG)
                .getInstance();
            const attestation = await teeLogService.generateAttestation(
                JSON.stringify(allAgents),
            );
            res.json({ agents: allAgents, attestation: attestation });
        } catch (error) {
            elizaLogger.error("Failed to get TEE agents:", error);
            res.status(500).json({
                error: "Failed to get TEE agents",
            });
        }
    });

    router.get("/tee/agents/:agentId", async (req, res) => {
        try {
            const agentId = req.params.agentId;
            const agentRuntime = findAgentRuntime(agentId);

            if (!agentRuntime) {
                sendErrorResponse(res, 404, "Agent not found", { agentId });
                return;
            }

            const teeLogService = agentRuntime
                .getService<TeeLogService>(ServiceType.TEE_LOG)
                .getInstance();

            const teeAgent = await teeLogService.getAgent(agentId);
            const attestation = await teeLogService.generateAttestation(
                JSON.stringify(teeAgent),
            );
            res.json({ agent: teeAgent, attestation: attestation });
        } catch (error) {
            elizaLogger.error("Failed to get TEE agent:", error);
            res.status(500).json({
                error: "Failed to get TEE agent",
            });
        }
    });

    router.post(
        "/tee/logs",
        async (req: express.Request, res: express.Response) => {
            try {
                const query = req.body.query || {};
                const page = Number.parseInt(req.body.page) || 1;
                const pageSize = Number.parseInt(req.body.pageSize) || 10;

                const teeLogQuery: TeeLogQuery = {
                    agentId: query.agentId || "",
                    roomId: query.roomId || "",
                    userId: query.userId || "",
                    type: query.type || "",
                    containsContent: query.containsContent || "",
                    startTimestamp: query.startTimestamp || undefined,
                    endTimestamp: query.endTimestamp || undefined,
                };
                const agentRuntime: AgentRuntime = agents.values().next().value;
                const teeLogService = agentRuntime
                    .getService<TeeLogService>(ServiceType.TEE_LOG)
                    .getInstance();
                const pageQuery = await teeLogService.getLogs(
                    teeLogQuery,
                    page,
                    pageSize,
                );
                const attestation = await teeLogService.generateAttestation(
                    JSON.stringify(pageQuery),
                );
                res.json({
                    logs: pageQuery,
                    attestation: attestation,
                });
            } catch (error) {
                elizaLogger.error("Failed to get TEE logs:", error);
                res.status(500).json({
                    error: "Failed to get TEE logs",
                });
            }
        },
    );

    router.post("/agent/start", async (req, res) => {
        const { characterPath, characterJson } = req.body;
        console.log("characterPath:", characterPath);
        console.log("characterJson:", characterJson);
        try {
            let character: Character;
            if (characterJson) {
                character = await directClient.jsonToCharacter(
                    characterPath,
                    characterJson,
                );
            } else if (characterPath) {
                character =
                    await directClient.loadCharacterTryPath(characterPath);
            } else {
                throw new Error("No character path or JSON provided");
            }

            // Check if agent already exists
            const existingAgent = findAgentRuntime(character.name);
            if (existingAgent) {
                sendErrorResponse(res, 409, `Agent with name "${character.name}" already exists`, {
                    agentId: existingAgent.agentId,
                });
                return;
            }

            const agent = await directClient.startAgent(character);
            elizaLogger.log(`${character.name} started`);

            sendSuccessResponse(res, {
                id: agent.agentId,
                character: sanitizeCharacterResponse(character),
            }, `${character.name} agent started successfully`);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            sendErrorResponse(res, 400, "Failed to start agent", {
                message: e.message,
            });
        }
    });

    router.post("/agents/:agentId/stop", async (req, res) => {
        const agentId = req.params.agentId;
        console.log("agentId", agentId);
        const agent = findAgentRuntime(agentId);

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
            sendSuccessResponse(res, { success: true }, "Agent stopped successfully");
        } else {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
        }
    });

    // ====================================
    // GOODDOLLAR DASHBOARD INTEGRATION
    // ====================================

    // Dashboard wallet overview
    router.get("/agents/:agentId/gooddollar/wallet", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            const gdService =
                runtime.getService<GoodDollarService>(ServiceType.GOODDOLLAR);
            if (!gdService) {
                res.status(503).json({
                    error: "GoodDollar service not available",
                    message:
                        "Please ensure @elizaos/plugin-gooddollar is loaded",
                });
                return;
            }

            const config = gdService.getConfig();
            const walletAddress = config.walletAddress;

            if (!walletAddress) {
                res.status(400).json({
                    error: "Wallet not configured",
                    message: "Please set GOODDOLLAR_PRIVATE_KEY in environment",
                });
                return;
            }

            // Get wallet data in parallel for optimal performance
            const [
                balance,
                superTokenBalance,
                canClaimUBI,
                recentTransactions,
            ] = await Promise.all([
                gdService.getBalance(walletAddress),
                gdService.getSuperTokenBalance
                    ? gdService.getSuperTokenBalance(walletAddress)
                    : "0",
                gdService.canClaimUBI(walletAddress),
                gdService.getTransactionHistory
                    ? gdService.getTransactionHistory(walletAddress, 10)
                    : [],
            ]);

            res.json({
                success: true,
                wallet: {
                    address: walletAddress,
                    network: config.network,
                    balance: balance,
                    superTokenBalance: superTokenBalance,
                    canClaimUBI: canClaimUBI,
                    recentTransactions: recentTransactions,
                    rpcUrl: config.rpcUrl,
                    tokenAddress: config.tokenAddress,
                },
                familyFeatures: {
                    rewardsEnabled: true,
                    streamingEnabled: config.enableStreaming || false,
                    identityEnabled: config.enableFaceVerification || false,
                },
            });
        } catch (error) {
            elizaLogger.error("Error fetching wallet info:", error);
            res.status(500).json({
                error: "Failed to fetch wallet information",
                details: error.message,
            });
        }
    });

    // Dashboard family verification overview
    router.get("/agents/:agentId/gooddollar/family", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            const identityService =
                runtime.getService<IdentityService>(ServiceType.IDENTITY);
            if (!identityService) {
                res.json({
                    success: true,
                    family: {
                        members: [],
                        verifiedCount: 0,
                        totalMembers: 0,
                        identityEnabled: false,
                    },
                    message: "Identity verification is not enabled",
                });
                return;
            }

            // For dashboard demo, we'll show mock family data
            const mockFamilyMembers = [
                {
                    id: "parent_001",
                    role: "parent",
                    name: "Parent User",
                    walletAddress: "0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
                    isVerified: true,
                    verificationDate: Date.now() - 86400000, // 1 day ago
                    confidenceScore: 95,
                    lastActive: Date.now() - 3600000, // 1 hour ago
                },
                {
                    id: "child_001",
                    role: "child",
                    name: "Child User",
                    walletAddress: "0x9876543210abcdef9876543210abcdef98765432",
                    isVerified: true,
                    verificationDate: Date.now() - 172800000, // 2 days ago
                    confidenceScore: 92,
                    lastActive: Date.now() - 1800000, // 30 minutes ago
                },
                {
                    id: "grandparent_001",
                    role: "grandparent",
                    name: "Grandparent User",
                    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
                    isVerified: false,
                    verificationDate: null,
                    confidenceScore: 0,
                    lastActive: Date.now() - 7200000, // 2 hours ago
                },
            ];

            const verifiedMembers = mockFamilyMembers.filter(
                (member) => member.isVerified,
            );

            res.json({
                success: true,
                family: {
                    members: mockFamilyMembers,
                    verifiedCount: verifiedMembers.length,
                    totalMembers: mockFamilyMembers.length,
                    identityEnabled: true,
                    verificationProgress:
                        (verifiedMembers.length / mockFamilyMembers.length) *
                        100,
                    recentActivity: mockFamilyMembers
                        .sort((a, b) => b.lastActive - a.lastActive)
                        .slice(0, 5)
                        .map((member) => ({
                            name: member.name,
                            role: member.role,
                            lastActive: member.lastActive,
                            isVerified: member.isVerified,
                        })),
                },
            });
        } catch (error) {
            elizaLogger.error("Error fetching family info:", error);
            res.status(500).json({
                error: "Failed to fetch family information",
                details: error.message,
            });
        }
    });

    // Dashboard streaming overview
    router.get("/agents/:agentId/gooddollar/streams", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            const streamingService =
                runtime.getService<StreamingService>(ServiceType.STREAMING);
            if (!streamingService) {
                res.json({
                    success: true,
                    streaming: {
                        enabled: false,
                        activeStreams: [],
                        totalFlowRate: "0",
                        estimatedDaily: "0",
                        estimatedMonthly: "0",
                    },
                    message: "Streaming service is not enabled",
                });
                return;
            }

            if (!streamingService.isStreamingEnabled()) {
                res.json({
                    success: true,
                    streaming: {
                        enabled: false,
                        activeStreams: [],
                        totalFlowRate: "0",
                        estimatedDaily: "0",
                        estimatedMonthly: "0",
                        setupInstructions: [
                            "Set GOODDOLLAR_ENABLE_STREAMING=true",
                            "Configure GOODDOLLAR_SUPER_TOKEN_ADDRESS",
                            "Ensure sufficient SuperToken balance",
                        ],
                    },
                    message: "Streaming is disabled in configuration",
                });
                return;
            }

            // For dashboard demo, show mock streaming data
            const mockActiveStreams = [
                {
                    streamId: "stream_monthly_allowance_001",
                    type: "allowance",
                    sender: "0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
                    receiver: "0x9876543210abcdef9876543210abcdef98765432",
                    flowRate: "0.00385802469136", // ~100 G$/month
                    totalStreamed: "25.67",
                    startTime: Date.now() - 604800000, // 1 week ago
                    status: "active",
                    familyContext: {
                        streamType: "allowance",
                        description: "Monthly allowance for child",
                    },
                },
                {
                    streamId: "stream_milestone_homework_001",
                    type: "milestone",
                    sender: "0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
                    receiver: "0x9876543210abcdef9876543210abcdef98765432",
                    flowRate: "0.00231481481481", // ~200 G$ over 30 days
                    totalStreamed: "45.23",
                    startTime: Date.now() - 1209600000, // 2 weeks ago
                    status: "active",
                    familyContext: {
                        streamType: "milestone",
                        description: "Homework completion reward",
                    },
                },
            ];

            // Calculate totals
            let totalFlowRatePerSecond = 0;
            for (const stream of mockActiveStreams) {
                totalFlowRatePerSecond += parseFloat(stream.flowRate);
            }

            const hourlyRate = totalFlowRatePerSecond * 3600;
            const dailyRate = totalFlowRatePerSecond * 86400;
            const monthlyRate = totalFlowRatePerSecond * 86400 * 30;

            res.json({
                success: true,
                streaming: {
                    enabled: true,
                    activeStreams: mockActiveStreams,
                    totalActiveStreams: mockActiveStreams.length,
                    totalFlowRate: hourlyRate.toFixed(6),
                    estimatedDaily: dailyRate.toFixed(4),
                    estimatedMonthly: monthlyRate.toFixed(2),
                    streamTypes: {
                        allowance: mockActiveStreams.filter(
                            (s) => s.type === "allowance",
                        ).length,
                        milestone: mockActiveStreams.filter(
                            (s) => s.type === "milestone",
                        ).length,
                        continuous: mockActiveStreams.filter(
                            (s) => s.type === "continuous_reward",
                        ).length,
                    },
                    superTokenAddress:
                        streamingService.getConfig().superTokenAddress,
                },
            });
        } catch (error) {
            elizaLogger.error("Error fetching streaming info:", error);
            res.status(500).json({
                error: "Failed to fetch streaming information",
                details: error.message,
            });
        }
    });

    // Dashboard family activity feed
    router.get("/agents/:agentId/gooddollar/activity", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            // For dashboard demo, show mock family activity
            const mockActivity = [
                {
                    id: "activity_001",
                    type: "reward_earned",
                    timestamp: Date.now() - 900000, // 15 minutes ago
                    actor: "Child User",
                    action: "earned 5.2 G$ for completing homework",
                    amount: "5.2",
                    icon: "🎯",
                    category: "milestone",
                },
                {
                    id: "activity_002",
                    type: "stream_started",
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    actor: "Parent User",
                    action: "started monthly allowance stream to Child User",
                    amount: "100.0",
                    icon: "🌊",
                    category: "allowance",
                },
                {
                    id: "activity_003",
                    type: "verification_completed",
                    timestamp: Date.now() - 7200000, // 2 hours ago
                    actor: "Child User",
                    action: "completed identity verification",
                    amount: null,
                    icon: "✅",
                    category: "identity",
                },
                {
                    id: "activity_004",
                    type: "family_interaction",
                    timestamp: Date.now() - 10800000, // 3 hours ago
                    actor: "Grandparent User",
                    action: "shared family story and earned 3.5 G$",
                    amount: "3.5",
                    icon: "👴",
                    category: "generational_bridge",
                },
                {
                    id: "activity_005",
                    type: "ubi_claimed",
                    timestamp: Date.now() - 86400000, // 1 day ago
                    actor: "Parent User",
                    action: "claimed daily UBI reward",
                    amount: "10.0",
                    icon: "💰",
                    category: "ubi",
                },
            ];

            const limit = Number.parseInt(req.query.limit as string) || 20;
            const activities = mockActivity.slice(0, limit);

            // Calculate activity stats
            const totalRewards = mockActivity
                .filter((a) => a.amount)
                .reduce((sum, a) => sum + parseFloat(a.amount), 0);

            const categoryStats = mockActivity.reduce(
                (stats, activity) => {
                    stats[activity.category] =
                        (stats[activity.category] || 0) + 1;
                    return stats;
                },
                {} as Record<string, number>,
            );

            res.json({
                success: true,
                activity: {
                    recent: activities,
                    stats: {
                        totalActivities: mockActivity.length,
                        totalRewards: totalRewards.toFixed(2),
                        categoryCounts: categoryStats,
                        lastActivity:
                            activities.length > 0
                                ? activities[0].timestamp
                                : null,
                    },
                    familyMoments: activities.filter((a) =>
                        [
                            "family_interaction",
                            "generational_bridge",
                            "milestone",
                        ].includes(a.category),
                    ).length,
                },
            });
        } catch (error) {
            elizaLogger.error("Error fetching activity feed:", error);
            res.status(500).json({
                error: "Failed to fetch activity information",
                details: error.message,
            });
        }
    });

    // Dashboard comprehensive family overview
    router.get("/agents/:agentId/gooddollar/dashboard", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            sendErrorResponse(res, 404, "Agent not found", { agentId });
            return;
        }

        try {
            // Get all dashboard data in parallel for optimal performance
            const [
                walletResponse,
                familyResponse,
                streamsResponse,
                activityResponse,
            ] = await Promise.all([
                fetch(
                    `${req.protocol}://${req.get(
                        "host",
                    )}/agents/${agentId}/gooddollar/wallet`,
                ),
                fetch(
                    `${req.protocol}://${req.get(
                        "host",
                    )}/agents/${agentId}/gooddollar/family`,
                ),
                fetch(
                    `${req.protocol}://${req.get(
                        "host",
                    )}/agents/${agentId}/gooddollar/streams`,
                ),
                fetch(
                    `${req.protocol}://${req.get(
                        "host",
                    )}/agents/${agentId}/gooddollar/activity?limit=10`,
                ),
            ]);

            const [wallet, family, streams, activity] = await Promise.all([
                walletResponse.json() as Promise<WalletResponse>,
                familyResponse.json() as Promise<FamilyResponse>,
                streamsResponse.json() as Promise<StreamsResponse>,
                activityResponse.json() as Promise<ActivityResponse>,
            ]);

            // Calculate family health score based on various metrics
            let familyScore = 0;
            if (family.success && family.family.verifiedCount > 0) {
                familyScore += (family.family.verificationProgress / 100) * 30; // 30% for verification
            }
            if (streams.success && streams.streaming.activeStreams.length > 0) {
                familyScore += Math.min(
                    streams.streaming.activeStreams.length * 20,
                    40,
                ); // Max 40% for streaming
            }
            if (
                activity.success &&
                activity.activity.stats.totalActivities > 0
            ) {
                familyScore += Math.min(
                    activity.activity.stats.totalActivities * 2,
                    30,
                ); // Max 30% for activity
            }

            res.json({
                success: true,
                dashboard: {
                    familyScore: Math.round(Math.min(familyScore, 100)),
                    wallet: wallet.success ? wallet.wallet : null,
                    family: family.success ? family.family : null,
                    streaming: streams.success ? streams.streaming : null,
                    activity: activity.success ? activity.activity : null,
                    quickStats: {
                        totalBalance: wallet.success
                            ? wallet.wallet.balance
                            : "0",
                        activeStreams: streams.success
                            ? streams.streaming.activeStreams.length || 0
                            : 0,
                        verifiedMembers: family.success
                            ? family.family.verifiedCount
                            : 0,
                        recentActivities: activity.success
                            ? activity.activity.recent.length
                            : 0,
                    },
                    recommendations: [
                        family.success &&
                        family.family.verifiedCount < family.family.totalMembers
                            ? "Complete family member verification to unlock all features"
                            : null,
                        streams.success && !streams.streaming.enabled
                            ? "Enable streaming to set up family allowances"
                            : null,
                        wallet.success && wallet.wallet.canClaimUBI
                            ? "Your daily UBI is ready to claim!"
                            : null,
                        activity.success &&
                        activity.activity.stats.totalActivities < 5
                            ? "Engage more with family AI agents to earn G$ rewards"
                            : null,
                    ].filter(Boolean),
                    familyGrowth: {
                        weeklyRewards: parseFloat(
                            activity.success
                                ? activity.activity.stats.totalRewards
                                : "0",
                        ),
                        streamingIncome: streams.success
                            ? parseFloat(
                                  streams.streaming.estimatedDaily || "0",
                              ) * 7
                            : 0,
                        goalProgress: familyScore, // Use family score as goal progress
                    },
                },
                timestamp: Date.now(),
            });
        } catch (error) {
            elizaLogger.error("Error fetching dashboard data:", error);
            res.status(500).json({
                error: "Failed to fetch dashboard information",
                details: error.message,
            });
        }
    });

    /**
     * AG-UI Protocol Implementation
     * Standardized event-based communication for AI agents and frontends.
     * Supports real-time streaming of message content, tool calls, and custom family metrics.
     */
    router.post("/:agentId/ag-ui", async (req, res) => {
        const { agentId } = req.params;
        const runtime = findAgentRuntime(agentId);

        if (!runtime) {
            return sendErrorResponse(res, 404, "Agent not found");
        }

        const text = req.body.text;
        if (!text) {
            return sendErrorResponse(res, 400, "No text provided");
        }

        const userId = stringToUuid(req.body.userId ?? "user");
        const roomId = stringToUuid(req.body.roomId ?? "default-room-" + agentId);
        const runId = stringToUuid(Date.now().toString());

        // Set headers for SSE (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const sendEvent = (event: any) => {
            const data = { ...event, timestamp: Date.now() };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            // 1. Signal Run Started
            sendEvent({ type: "RunStarted", runId });

            // 2. Prepare ElizaOS interaction
            await runtime.ensureConnection(userId, roomId, req.body.userName, req.body.name, "direct");

            const content: Content = { text, attachments: [], source: "direct" };
            const userMessage = { content, userId, roomId, agentId: runtime.agentId };

            // Emit Reasoning event for context preparation
            sendEvent({ 
                type: "Reasoning", 
                message: `Synthesizing memory and preparing context for ${runtime.character.name}...` 
            });

            const state = await runtime.composeState(userMessage, {
                agentName: runtime.character.name,
            });

            // Emit StateDelta if there are interesting state changes (simulated for demo)
            if (state.recentMessagesData) {
                sendEvent({
                    type: "StateDelta",
                    path: "session.messageCount",
                    value: state.recentMessagesData.length
                });
            }

            const context = composeContext({
                state,
                template: directClient.loadCharacterTryPath ? "" : "", // dummy to use template if needed
            });

            // Note: In a production ag-ui implementation, we would use a streaming provider.
            // Since we are wrapping the standard generateMessageResponse, we will simulate 
            // the text streaming events based on the final response for this protocol implementation.
            
            // Emit ToolCallStart for the main reasoning engine
            const toolCallId = stringToUuid(Date.now().toString());
            sendEvent({
                type: "ToolCallStart",
                toolCallId,
                toolName: "ElizaOS_Reasoning_Engine",
                toolInput: { contextLength: context.length }
            });

            const response = await generateMessageResponse({
                runtime: runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            sendEvent({
                type: "ToolCallEnd",
                toolCallId,
                toolName: "ElizaOS_Reasoning_Engine",
                toolOutput: { action: response?.action || "none" }
            });

            if (response && response.text) {
                // Check if an interrupt is needed for high-stakes actions (simulated)
                if (response.action === "SEND_PAYOUT" || response.action === "EXECUTE_TRANSACTION") {
                    sendEvent({
                        type: "Interrupt",
                        interruptId: stringToUuid("interrupt-" + Date.now()),
                        prompt: `The agent ${runtime.character.name} is requesting to execute a high-stakes action: ${response.action}. Do you approve?`
                    });
                    // In a real app, we would pause here and wait for a resume event.
                    // For the hackathon demo, we'll log it and continue.
                    sendEvent({ type: "Reasoning", message: "User approval simulated for hackathon demo." });
                }

                // 3. Stream Text Content (AG-UI format)
                const messageId = stringToUuid(Date.now().toString());
                
                // Simulate streaming chunks for the UI experience
                const words = response.text.split(" ");
                for (let i = 0; i < words.length; i++) {
                    sendEvent({
                        type: "TextMessageContent",
                        messageId,
                        delta: words[i] + (i === words.length - 1 ? "" : " "),
                    });
                    // Artificial delay for realistic streaming simulation
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // 4. Check for Hedera logging / Bond Score updates in response
                // If the agent performed an action that updates metrics, signal it via Custom event
                const isFamilyAction = response.action && (
                    response.action.includes("WISDOM") || 
                    response.action.includes("GROWTH") || 
                    response.action.includes("INTIMACY") ||
                    response.action.includes("PRESENCE") ||
                    response.action.includes("SAVINGS")
                );

                if (isFamilyAction) {
                    const actionToolId = stringToUuid("action-" + Date.now());
                    sendEvent({
                        type: "ToolCallStart",
                        toolCallId: actionToolId,
                        toolName: `Hedera_HCS_Logger_${response.action}`,
                        toolInput: { agent: runtime.character.name, action: response.action }
                    });

                    // Simulate the logging delay
                    await new Promise(resolve => setTimeout(resolve, 500));

                    sendEvent({
                        type: "ToolCallEnd",
                        toolCallId: actionToolId,
                        toolName: `Hedera_HCS_Logger_${response.action}`,
                        toolOutput: { status: "success", topicId: "0.0.123456" }
                    });

                    sendEvent({
                        type: "Custom",
                        customType: "family.bond_score_update",
                        payload: {
                            agent: runtime.character.name,
                            action: response.action,
                            impact: "positive",
                            verifiableTrail: "https://hashscan.io/testnet/topic/0.0.123456"
                        }
                    });

                    // Update StateDelta with new "Bond Score"
                    sendEvent({
                        type: "StateDelta",
                        path: "family.overallHealth",
                        value: Math.floor(Math.random() * 20) + 70 // Simulated real-time update
                    });
                }
            }

            // 5. Signal Run Finished
            sendEvent({ type: "RunFinished", runId });
            res.end();

        } catch (error) {
            elizaLogger.error("AG-UI Error:", error);
            sendEvent({ type: "RunError", error: error.message });
            res.end();
        }
    });

    return router;
}
