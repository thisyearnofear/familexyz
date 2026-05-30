import { createOpenAI } from "@ai-sdk/openai";
import { generateText as aiGenerateText } from "ai";
import { elizaLogger } from "./logger";
import {
    models,
    getModelSettings,
    getEndpoint,
} from "./models";
import settings from "./settings";
import {
    type IAgentRuntime,
    ModelClass,
    ModelProviderName,
} from "./types";

/**
 * Send a message to the model for text generation.
 * Stripped-down version — only supports the providers we use.
 */
export async function generateText({
    runtime,
    context,
    modelClass,
}: {
    runtime: IAgentRuntime;
    context: string;
    modelClass: ModelClass;
}): Promise<string> {
    if (!context) {
        elizaLogger.error("generateText context is empty");
        return "";
    }

    const provider = runtime.modelProvider;
    const endpoint = runtime.character.modelEndpointOverride || getEndpoint(provider) || "";
    const modelSettings = getModelSettings(provider, modelClass);
    if (!modelSettings) {
        throw new Error(`No model settings for provider=${provider} class=${modelClass}`);
    }

    let model = modelSettings.name;
    const temperature = modelSettings.temperature;
    const maxTokens = modelSettings.maxOutputTokens;

    // Resolve API key
    const apiKey = (() => {
        switch (provider) {
            case ModelProviderName.OPENAI:
                return runtime.getSetting("OPENAI_API_KEY") || settings.OPENAI_API_KEY || runtime.token;
            case ModelProviderName.ANTHROPIC:
                return runtime.getSetting("ANTHROPIC_API_KEY") || settings.ANTHROPIC_API_KEY || runtime.token;
            case ModelProviderName.GROK:
                return runtime.getSetting("GROK_API_KEY") || settings.GROK_API_KEY || runtime.token;
            case ModelProviderName.GROQ:
                return runtime.getSetting("GROQ_API_KEY") || settings.GROQ_API_KEY || runtime.token;
            case ModelProviderName.VENICE:
                return runtime.getSetting("VENICE_API_KEY") || settings.VENICE_API_KEY || runtime.token;
            case ModelProviderName.DEEPSEEK:
                return runtime.getSetting("DEEPSEEK_API_KEY") || settings.DEEPSEEK_API_KEY || runtime.token;
            default:
                return runtime.token || "";
        }
    })();

    if (!apiKey) {
        throw new Error(`No API key configured for provider: ${provider}`);
    }

    elizaLogger.info("Generating text", { provider, model });

    try {
        const openai = createOpenAI({
            apiKey,
            baseURL: endpoint,
        });

        const { text: response } = await aiGenerateText({
            model: openai.languageModel(model),
            prompt: context,
            system: runtime.character.system ?? settings.SYSTEM_PROMPT ?? undefined,
            temperature,
            maxTokens,
        });

        return response;
    } catch (error) {
        elizaLogger.error("Error in generateText", error);
        throw error;
    }
}
