/**
 * Main Entry Point
 * 
 * Orchestrates agent initialization and server startup.
 * Follows ORGANIZED principle: predictable, clear flow.
 * 
 * Refactored to use modular components:
 * - character/loader.ts - Character loading
 * - database/initializer.ts - Database setup
 * - services/token-provider.ts - Token management
 * - server/http-server.ts - HTTP API server
 * - server/direct-client-routes.ts - DirectClient routes
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.env.HOME || "/home/deploy", "familexyz/shared/.env") });
config(); // Also try loading from current directory .env

import { DirectClient } from "@elizaos/client-direct";
import {
    AgentRuntime,
    CacheManager,
    CacheStore,
    type Character,
    DbCacheAdapter,
    defaultCharacter,
    elizaLogger,
    FsCacheAdapter,
    type IDatabaseAdapter,
    type IDatabaseCacheAdapter,
    settings,
    stringToUuid,
} from "@elizaos/core";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import net from "net";
import { HederaService, HederaAgentKitService } from "@elizaos/hedera-core";
import type { HederaConfig, HederaFamilyMetrics, HederaAgentKitTool } from "@elizaos/hedera-core";

// Modular imports
import { parseArguments, loadCharacters, loadCharacterFromOnchain, loadCharacterTryPath, jsonToCharacter } from "./character/loader.js";
import { initializeDatabase } from "./database/initializer.js";
import { getTokenForProvider, getSecret } from "./services/token-provider.js";
import { createHttpServer } from "./server/http-server.js";
import { patchDirectClientRoutes } from "./server/direct-client-routes.js";
import { extendDirectClientWithTelegram, initializeTelegram } from "./integrations/telegram.js";

// Phase 4a: Bond Scoring System
import { runMigrations } from "./migrations/runner.js";
import { initializeWeeklyScheduler } from "./jobs/BondScoreScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply DirectClient route patches
patchDirectClientRoutes();

/**
 * Utility: Wait for random time
 */
export const wait = (minTime = 1000, maxTime = 3000) => {
    const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    return new Promise((resolve) => setTimeout(resolve, waitTime));
};

/**
 * Logging fetch wrapper
 */
const logFetch = async (url: string, options: any) => {
    elizaLogger.debug(`Fetching ${url}`);
    return fetch(url, options);
};

/**
 * Initialize clients for a character runtime
 */
export async function initializeClients(character: Character, runtime: AgentRuntime) {
    const clients: Record<string, any> = {};
    const clientTypes: string[] = character.clients?.map((str) => str.toLowerCase()) || [];
    
    elizaLogger.log("initializeClients", clientTypes, "for", character.name);
    
    if (character.plugins?.length > 0) {
        for (const plugin of character.plugins) {
            if (plugin && typeof plugin === "object" && "init" in plugin && typeof plugin.init === "function") {
                plugin.init(runtime);
            }
        }
    }
    
    return clients;
}

/**
 * Create agent runtime
 */
export async function createAgent(
    character: Character,
    db: IDatabaseAdapter,
    cache: CacheManager,
    token: string,
): Promise<AgentRuntime> {
    elizaLogger.log(`Creating runtime for character ${character.name}`);
    
    let nodePlugin: any;
    try {
        const nodePluginModule = await import("@elizaos/plugin-node");
        nodePlugin = nodePluginModule.createNodePlugin();
    } catch (error) {
        elizaLogger.warn("Node plugin not available:", error);
    }
    
    return new AgentRuntime({
        databaseAdapter: db,
        token,
        modelProvider: character.modelProvider,
        evaluators: [],
        character,
        plugins: [...(character.plugins ?? []), ...(nodePlugin ? [nodePlugin] : [])],
        providers: [],
        managers: [],
        cacheManager: cache,
        fetch: logFetch,
    });
}

/**
 * Initialize cache for character
 */
async function initializeCache(
    cacheStore: string,
    character: Character,
    baseDir?: string,
    db?: IDatabaseCacheAdapter,
) {
    switch (cacheStore) {
        case CacheStore.REDIS:
            if (process.env.REDIS_URL) {
                elizaLogger.info("Connecting to Redis...");
                const { RedisClient } = await import("@elizaos/adapter-redis");
                const redisClient = new RedisClient(process.env.REDIS_URL);
                if (!character?.id) {
                    throw new Error("CacheStore.REDIS requires id to be set in character definition");
                }
                return new CacheManager(new DbCacheAdapter(redisClient, character.id));
            }
            throw new Error("REDIS_URL environment variable is not set.");
            
        case CacheStore.DATABASE:
            if (db) {
                elizaLogger.info("Using Database Cache...");
                return new CacheManager(new DbCacheAdapter(db, character.id!));
            }
            throw new Error("Database adapter is not provided for CacheStore.Database.");
            
        case CacheStore.FILESYSTEM:
            elizaLogger.info("Using File System Cache...");
            if (!baseDir) {
                throw new Error("baseDir must be provided for CacheStore.FILESYSTEM.");
            }
            const cacheDir = path.resolve(baseDir, character.id!, "cache");
            return new CacheManager(new FsCacheAdapter(cacheDir));
            
        default:
            throw new Error(`Invalid cache store: ${cacheStore}`);
    }
}

/**
 * Start an agent
 */
async function startAgent(character: Character, directClient: DirectClient): Promise<AgentRuntime> {
    let db: IDatabaseAdapter & IDatabaseCacheAdapter;
    
    try {
        character.id ??= stringToUuid(character.name);
        character.username ??= character.name;
        
        const token = getTokenForProvider(character.modelProvider, character);
        const dataDir = path.join(__dirname, "../data");
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Check for cached database - DISABLED for testing
        // const cachedDbAdapter = (global as any).__cachedDbAdapter;
        const cachedDbAdapter = null; // Disable caching
        const filePath = process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
        const cachedFilePath = null; // (global as any).__cachedDbFilePath;
        
        if (false && cachedFilePath === filePath && cachedDbAdapter) {
            db = cachedDbAdapter;
        } else {
            db = (await initializeDatabase(dataDir)) as IDatabaseAdapter & IDatabaseCacheAdapter;
        }
        
        // Run database migrations
        try {
            await runMigrations(db);
        } catch (migrationError) {
            elizaLogger.warn("Database migrations encountered an issue (continuing anyway):", migrationError);
        }
        
        const cache = await initializeCache(
            process.env.CACHE_STORE ?? CacheStore.DATABASE,
            character,
            dataDir,
            db
        );
        
        const runtime: AgentRuntime = await createAgent(character, db, cache, token);
        
        // Initialize Hedera service if configured
        await initializeHederaService(character, runtime);
        
        // Start services/plugins/process knowledge
        await runtime.initialize();
        
        // Start assigned clients
        runtime.clients = await initializeClients(character, runtime);
        
        // Add to container
        directClient.registerAgent(runtime);
        
        elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);
        
        return runtime;
    } catch (error) {
        elizaLogger.error(`Error starting agent for character ${character.name}:`, error);
        if (db) {
            await db.close();
        }
        throw error;
    }
}

/**
 * Initialize Hedera services if configured
 */
async function initializeHederaService(character: Character, runtime: AgentRuntime): Promise<void> {
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
        
        // Initialize Hedera Agent Kit service and register tools
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
        
        // Create consensus topic if needed
        await createConsensusTopicIfNeeded(character, hederaService);
        
        // Submit startup test if configured
        await submitStartupTestIfNeeded(character, runtime, hederaService);
        
    } catch (hederaError) {
        elizaLogger.warn("Error initializing HederaService; continuing without it:", hederaError);
    }
}

/**
 * Create consensus topic if enabled and not exists
 */
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

/**
 * Submit startup test message if configured
 */
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

/**
 * Check if a port is available
 */
const checkPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") resolve(false);
        });
        server.once("listening", () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
};

/**
 * Check for valid remote URLs
 */
const hasValidRemoteUrls = () =>
    process.env.REMOTE_CHARACTER_URLS &&
    process.env.REMOTE_CHARACTER_URLS !== "" &&
    process.env.REMOTE_CHARACTER_URLS.startsWith("http");

/**
 * Main agent startup
 */
const startAgents = async () => {
    const directClient = new DirectClient();
    
    // Extend DirectClient with Telegram endpoints
    extendDirectClientWithTelegram(directClient);
    
    let serverPort = Number.parseInt(settings.SERVER_PORT || "31337");
    const args = await parseArguments();
    const charactersArg = args.characters || args.character;
    let characters = [defaultCharacter];
    
    // Load characters from various sources
    if (process.env.IQ_WALLET_ADDRESS && process.env.IQSOlRPC) {
        characters = await loadCharacterFromOnchain();
    }
    
    const onchainJson = process.env.ONCHAIN_JSON || null;
    const notOnchainJson = !onchainJson || onchainJson == "null";
    
    if ((notOnchainJson && charactersArg) || hasValidRemoteUrls()) {
        characters = await loadCharacters(charactersArg);
    }
    
    // Normalize characters
    const envModelProvider = process.env.MODEL_PROVIDER as Character["modelProvider"] | undefined;
    characters = characters.map((char) => ({
        ...char,
        id: (char.id || stringToUuid(char.name)) as `${string}-${string}-${string}-${string}-${string}`,
        username: char.username || char.name,
        plugins: char.plugins || [],
        modelProvider: char.modelProvider && char.modelProvider !== "llama_local"
            ? char.modelProvider
            : (envModelProvider || char.modelProvider),
    }));
    
    // Start agents
    let primaryRuntime: AgentRuntime | null = null;
    let primaryDb: IDatabaseAdapter | null = null;
    
    try {
        for (const character of characters) {
            const runtime = await startAgent(character, directClient);
            if (!primaryRuntime) {
                primaryRuntime = runtime;
                if ((runtime as any).databaseAdapter) {
                    primaryDb = (runtime as any).databaseAdapter;
                }
            }
        }
    } catch (error) {
        elizaLogger.error("Error starting agents:", error);
    }
    
    // Initialize weekly bond score scheduler
    if (primaryDb) {
        try {
            initializeWeeklyScheduler(primaryDb, primaryRuntime || undefined);
        } catch (error) {
            elizaLogger.warn("Failed to initialize bond score scheduler:", error);
        }
    }

    // Initialize Telegram bot
    if (primaryRuntime) {
        try {
            await initializeTelegram(primaryRuntime);
        } catch (error) {
            elizaLogger.warn("[Telegram] Failed to initialize Telegram integration:", error);
        }
    }
    
    // Find available port
    while (!(await checkPortAvailable(serverPort))) {
        elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
        serverPort++;
    }
    
    // Setup DirectClient methods
    directClient.startAgent = async (character) => {
        const { handlePluginImporting } = await import("./character/loader.js");
        character.plugins = await handlePluginImporting(character.plugins);
        return startAgent(character, directClient);
    };
    directClient.loadCharacterTryPath = loadCharacterTryPath;
    directClient.jsonToCharacter = jsonToCharacter;
    
    directClient.start(serverPort);
    
    // Start HTTP API server
    const healthPort = Number.parseInt(process.env.HEALTH_PORT || "31338");
    await createHttpServer({ port: healthPort, primaryDb });
    
    if (serverPort !== Number.parseInt(settings.SERVER_PORT || "31337")) {
        elizaLogger.log(`Server started on alternate port ${serverPort}`);
    }
    
    elizaLogger.log(
        "Run `pnpm start:client` to start the client and visit the outputted URL (http://localhost:5173) to chat with your agents."
    );
};

// Start agents
startAgents().catch((error) => {
    elizaLogger.error("Unhandled error in startAgents:", error);
    elizaLogger.error("Error stack:", error.stack);
    elizaLogger.error("Error message:", error.message);
    process.exit(1);
});

// Handle uncaught exceptions if configured
function parseBooleanFromText(value: string | undefined): boolean {
    if (!value) return false;
    return value.toLowerCase() === "true" || value === "1";
}

if (process.env.PREVENT_UNHANDLED_EXIT && parseBooleanFromText(process.env.PREVENT_UNHANDLED_EXIT)) {
    process.on("uncaughtException", (err) => console.error("uncaughtException", err));
    process.on("unhandledRejection", (err) => console.error("unhandledRejection", err));
}