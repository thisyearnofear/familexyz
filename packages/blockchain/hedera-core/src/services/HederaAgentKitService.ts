import { Client } from "@hashgraph/sdk";
import { HederaElizaOSToolkit } from "@hashgraph/hedera-agent-kit-elizaos";
import type { Configuration } from "@hashgraph/hedera-agent-kit-elizaos";

/**
 * Lightweight interface for Hedera Agent Kit tools returned by the ElizaOS toolkit.
 * These implement the ElizaOS Action interface for compatibility with the runtime.
 */
export interface HederaAgentKitTool {
    description: string;
    handler: (...args: any[]) => Promise<any>;
    similes?: string[];
    examples?: any[][];
    name: string;
    validate: (...args: any[]) => Promise<boolean>;
    [key: string]: unknown;
}

/**
 * HederaAgentKitService - Integration layer for @hashgraph/hedera-agent-kit
 *
 * Provides a singleton service that initializes the Hedera Agent Kit
 * ElizaOS toolkit and exposes its tools as ElizaOS-compatible actions.
 *
 * This service complements the existing HederaService by providing a
 * higher-level, AI-agent-optimized interface to Hedera operations:
 *   - HCS: Create topics, submit messages
 *   - HTS: Create fungible tokens, NFTs, airdrop tokens
 *   - Accounts: Transfer HBAR, query balances
 *   - Mirror node: Query account/topic/token info
 *
 * Usage:
 *   const agentKit = HederaAgentKitService.getInstance();
 *   agentKit.initialize(hederaClient);
 *   const tools = agentKit.getTools();
 *   // Register tools as actions on the AgentRuntime
 */
export class HederaAgentKitService {
    private static instance: HederaAgentKitService | null = null;
    private toolkit: HederaElizaOSToolkit | null = null;
    private tools: HederaAgentKitTool[] = [];
    private initialized = false;

    private constructor() {}

    /**
     * Get the singleton instance
     */
    public static getInstance(): HederaAgentKitService {
        if (!HederaAgentKitService.instance) {
            HederaAgentKitService.instance = new HederaAgentKitService();
        }
        return HederaAgentKitService.instance;
    }

    /**
     * Initialize the Agent Kit with a Hedera client.
     * Must be called after the client has been configured with an operator.
     *
     * @param client - Configured Hedera Client instance
     * @param config - Optional partial configuration overrides
     */
    public initialize(client: Client, config?: Partial<Configuration>): void {
        if (this.initialized) return;

        const configuration: Configuration = {
            context: {
                accountId: client.operatorAccountId?.toString(),
                accountPublicKey: client.operatorPublicKey?.toString(),
            },
            ...config,
        };

        this.toolkit = new HederaElizaOSToolkit({
            client: client as any,
            configuration,
        });

        this.tools = this.toolkit.getTools();
        this.initialized = true;
    }

    /**
     * Get all available Agent Kit tools as ElizaOS-compatible action objects.
     * These can be registered on an AgentRuntime via runtime.registerAction().
     */
    public getTools(): HederaAgentKitTool[] {
        return [...this.tools];
    }

    /**
     * Get a specific tool by name
     */
    public getTool(name: string): HederaAgentKitTool | undefined {
        return this.tools.find((t) => t.name === name);
    }

    /**
     * Check if the service has been initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Reset the singleton instance (useful for testing)
     */
    public static resetInstance(): void {
        HederaAgentKitService.instance = null;
    }
}
