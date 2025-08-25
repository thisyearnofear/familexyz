import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
} from "@elizaos/core";

export const getQuote: Action = {
    name: "GET_QUOTE_0X",
    similes: [],
    suppressInitialMessage: true,
    description:
        "Get a firm quote for a swap from 0x when user wants to execute a trade. This action is triggered only after user has requested for an indicative price.",
    validate: async (runtime: IAgentRuntime) => {
        return false; // Disabled - 0x SDK dependency removed for Docker compatibility
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: Record<string, unknown>,
        callback: HandlerCallback,
    ) => {
        callback({
            text: "0x quote generation is currently unavailable. The 0x SDK dependency has been removed for Docker compatibility.",
        });
        return false;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Get me a quote for 500 USDC to WETH on Optimism",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch a firm quote for swapping 500 USDC to WETH on Optimism.",
                    action: "GET_QUOTE_0X",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Quote for 2.5 WETH to USDT on Arbitrum please",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll get you a firm quote for swapping 2.5 WETH to USDT on Arbitrum.",
                    action: "GET_QUOTE_0X",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "quote 100 MATIC to USDC on Polygon",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll fetch a firm quote for swapping 100 MATIC to USDC on Polygon.",
                    action: "GET_QUOTE_0X",
                },
            },
        ],
    ],
};

const formatTime = (time: string) => {
    const expirationDate = new Date(parseInt(time) * 1000);

    // Format: "Mar 15, 2:30 PM"
    const formattedTime = expirationDate.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return `${formattedTime}`;
};

export const retrieveLatestPriceInquiry = async (
    runtime: IAgentRuntime,
    message: Memory,
): Promise<PriceInquiry | null> => {
    const memoryManager = new MemoryManager({
        runtime,
        tableName: ZX_MEMORY.price.tableName,
    });

    try {
        const memories = await memoryManager.getMemories({
            roomId: message.roomId,
            count: 1,
            start: 0,
            end: Date.now(),
        });

        if (memories?.[0]) {
            return JSON.parse(memories[0].content.text) as PriceInquiry;
        }
        return null;
    } catch (error) {
        elizaLogger.error(`Failed to retrieve price inquiry: ${error.message}`);
        return null;
    }
};

export const storeQuoteToMemory = async (
    runtime: IAgentRuntime,
    message: Memory,
    quote: Quote,
) => {
    const memory: Memory = {
        roomId: message.roomId,
        userId: message.userId,
        agentId: runtime.agentId,
        content: {
            text: JSON.stringify(quote),
            type: ZX_MEMORY.quote.type,
        },
    };

    const memoryManager = new MemoryManager({
        runtime,
        tableName: ZX_MEMORY.quote.tableName,
    });

    await memoryManager.createMemory(memory);
};

/**
 * @returns example:
 * 🛣️ Route:
 * WETH → DAI → LINK
 *  • WETH → DAI: 100% via Uniswap_V3
 *  • DAI → LINK: 14.99% via Uniswap_V3, 85.01% via Uniswap_V3
 */

export const formatRouteInfo = (quote: GetQuoteResponse): string[] => {
    if (!quote.route.tokens || !quote.route.fills) {
        return [];
    }
    // Get unique route path
    const routeTokens = quote.route.tokens;
    const routePath = routeTokens.map((t) => t.symbol).join(" → ");

    // Group fills by token pairs
    const fillsByPair = quote.route.fills.reduce(
        (acc, fill) => {
            const key = `${fill.from}-${fill.to}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(fill);
            return acc;
        },
        {} as Record<string, typeof quote.route.fills>,
    );

    // Format each pair's route details
    const routeDetails = Object.entries(fillsByPair).map(([pair, fills]) => {
        const [fromAddr, toAddr] = pair.split("-");
        const from = routeTokens.find(
            (t) => t.address.toLowerCase() === fromAddr.toLowerCase(),
        )?.symbol;
        const to = routeTokens.find(
            (t) => t.address.toLowerCase() === toAddr.toLowerCase(),
        )?.symbol;

        if (fills.length === 1) {
            return `  • ${from} → ${to}: ${
                Number(fills[0].proportionBps) / 100
            }% via ${fills[0].source}`;
        }
        return [
            `  • ${from} → ${to}:`,
            ...fills.map(
                (f) => `${Number(f.proportionBps) / 100}% via ${f.source}`,
            ),
        ].join(", ");
    });

    return ["🛣️ Route:", routePath, ...routeDetails];
};
