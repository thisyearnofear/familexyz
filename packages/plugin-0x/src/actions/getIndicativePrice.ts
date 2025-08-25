import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
} from "@elizaos/core";

export interface IndicativePriceContent {
    sellTokenSymbol: string;
    sellAmount: number;
    buyTokenSymbol: string;
    chain: string;
}

export const getIndicativePrice: Action = {
    name: "GET_INDICATIVE_PRICE_0X",
    similes: [],
    suppressInitialMessage: true,
    description:
        "Get indicative price for a swap from 0x when user wants to convert their tokens",
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
            text: "0x price checking is currently unavailable. The 0x SDK dependency has been removed for Docker compatibility.",
        });
        return false;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the price of 2 ETH in USDC on Optimism?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check the current exchange rate for ETH/USDC on Optimism.",
                    action: "GET_INDICATIVE_PRICE_0X",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to swap WETH for USDT on Arbitrum",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you check the price. How much WETH would you like to swap?",
                    action: "GET_INDICATIVE_PRICE_0X",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "5 WETH",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me get the indicative price for 5 WETH to USDT on Arbitrum.",
                    action: "GET_INDICATIVE_PRICE_0X",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Price check for 1000 USDC to WETH on Base",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the current exchange rate for 1000 USDC to WETH on Base network.",
                    action: "GET_INDICATIVE_PRICE_0X",
                },
            },
        ],
    ],
};
