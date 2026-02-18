/**
 * Token Provider Service
 * 
 * Handles API token retrieval for various model providers.
 * Centralizes token management following DRY principle.
 */

import { type Character, elizaLogger, settings } from "@elizaos/core";
import { ModelProviderName } from "@elizaos/config";

/**
 * Get the API token for a specific model provider
 */
export function getTokenForProvider(
    provider: ModelProviderName | string,
    character: Character,
): string | undefined {
    // Normalize string providers
    if (typeof provider === "string") {
        return getTokenForStringProvider(provider, character);
    }
    
    return getTokenForEnumProvider(provider, character);
}

/**
 * Handle string-based provider names
 */
function getTokenForStringProvider(provider: string, character: Character): string | undefined {
    const p = provider.toLowerCase();
    
    // Providers that don't need tokens
    if (p === "llama_local" || p === "llamalocal") return "";
    if (p === "ollama") return "";
    if (p === "gaianet") return "";
    
    // OpenAI via string
    if (p === "openai") {
        return character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY;
    }
    
    // Fall through to enum-based lookup
    const enumProvider = mapStringToEnum(provider);
    if (enumProvider) {
        return getTokenForEnumProvider(enumProvider, character);
    }
    
    elizaLogger.error(`Unsupported string provider: ${provider}`);
    throw new Error(`Unsupported model provider: ${provider}`);
}

/**
 * Map string provider name to enum
 */
function mapStringToEnum(provider: string): ModelProviderName | null {
    const mapping: Record<string, ModelProviderName> = {
        "openai": ModelProviderName.OPENAI,
        "anthropic": ModelProviderName.ANTHROPIC,
        "claude": ModelProviderName.ANTHROPIC,
        "claude_vertex": ModelProviderName.CLAUDE_VERTEX,
        "grok": ModelProviderName.GROK,
        "groq": ModelProviderName.GROQ,
        "google": ModelProviderName.GOOGLE,
        "mistral": ModelProviderName.MISTRAL,
        "venice": ModelProviderName.VENICE,
        "nvidia": ModelProviderName.NVIDIA,
        "deepseek": ModelProviderName.DEEPSEEK,
        "livepeer": ModelProviderName.LIVEPEER,
    };
    
    return mapping[provider.toLowerCase()] || null;
}

/**
 * Handle enum-based provider lookup
 */
function getTokenForEnumProvider(provider: ModelProviderName, character: Character): string | undefined {
    switch (provider) {
        // No key needed
        case ModelProviderName.LLAMALOCAL:
        case ModelProviderName.OLLAMA:
        case ModelProviderName.GAIANET:
            return "";
            
        case ModelProviderName.OPENAI:
            return character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY;
            
        case ModelProviderName.ETERNALAI:
            return character.settings?.secrets?.ETERNALAI_API_KEY || settings.ETERNALAI_API_KEY;
            
        case ModelProviderName.NINETEEN_AI:
            return character.settings?.secrets?.NINETEEN_AI_API_KEY || settings.NINETEEN_AI_API_KEY;
            
        case ModelProviderName.LLAMACLOUD:
        case ModelProviderName.TOGETHER:
            return (
                character.settings?.secrets?.LLAMACLOUD_API_KEY ||
                settings.LLAMACLOUD_API_KEY ||
                character.settings?.secrets?.TOGETHER_API_KEY ||
                settings.TOGETHER_API_KEY ||
                character.settings?.secrets?.OPENAI_API_KEY ||
                settings.OPENAI_API_KEY
            );
            
        case ModelProviderName.CLAUDE_VERTEX:
        case ModelProviderName.ANTHROPIC:
            return (
                character.settings?.secrets?.ANTHROPIC_API_KEY ||
                character.settings?.secrets?.CLAUDE_API_KEY ||
                settings.ANTHROPIC_API_KEY ||
                settings.CLAUDE_API_KEY
            );
            
        case ModelProviderName.REDPILL:
            return character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY;
            
        case ModelProviderName.OPENROUTER:
            return character.settings?.secrets?.OPENROUTER_API_KEY || settings.OPENROUTER_API_KEY;
            
        case ModelProviderName.GROK:
            return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
            
        case ModelProviderName.HEURIST:
            return character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY;
            
        case ModelProviderName.GROQ:
            return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
            
        case ModelProviderName.GALADRIEL:
            return character.settings?.secrets?.GALADRIEL_API_KEY || settings.GALADRIEL_API_KEY;
            
        case ModelProviderName.FAL:
            return character.settings?.secrets?.FAL_API_KEY || settings.FAL_API_KEY;
            
        case ModelProviderName.ALI_BAILIAN:
            return character.settings?.secrets?.ALI_BAILIAN_API_KEY || settings.ALI_BAILIAN_API_KEY;
            
        case ModelProviderName.VOLENGINE:
            return character.settings?.secrets?.VOLENGINE_API_KEY || settings.VOLENGINE_API_KEY;
            
        case ModelProviderName.NANOGPT:
            return character.settings?.secrets?.NANOGPT_API_KEY || settings.NANOGPT_API_KEY;
            
        case ModelProviderName.HYPERBOLIC:
            return character.settings?.secrets?.HYPERBOLIC_API_KEY || settings.HYPERBOLIC_API_KEY;
            
        case ModelProviderName.VENICE:
            return character.settings?.secrets?.VENICE_API_KEY || settings.VENICE_API_KEY;
            
        case ModelProviderName.ATOMA:
            return character.settings?.secrets?.ATOMASDK_BEARER_AUTH || settings.ATOMASDK_BEARER_AUTH;
            
        case ModelProviderName.NVIDIA:
            return character.settings?.secrets?.NVIDIA_API_KEY || settings.NVIDIA_API_KEY;
            
        case ModelProviderName.AKASH_CHAT_API:
            return character.settings?.secrets?.AKASH_CHAT_API_KEY || settings.AKASH_CHAT_API_KEY;
            
        case ModelProviderName.GOOGLE:
            return character.settings?.secrets?.GOOGLE_GENERATIVE_AI_API_KEY || settings.GOOGLE_GENERATIVE_AI_API_KEY;
            
        case ModelProviderName.MISTRAL:
            return character.settings?.secrets?.MISTRAL_API_KEY || settings.MISTRAL_API_KEY;
            
        case ModelProviderName.LETZAI:
            return character.settings?.secrets?.LETZAI_API_KEY || settings.LETZAI_API_KEY;
            
        case ModelProviderName.INFERA:
            return character.settings?.secrets?.INFERA_API_KEY || settings.INFERA_API_KEY;
            
        case ModelProviderName.DEEPSEEK:
            return character.settings?.secrets?.DEEPSEEK_API_KEY || settings.DEEPSEEK_API_KEY;
            
        case ModelProviderName.LIVEPEER:
            return character.settings?.secrets?.LIVEPEER_GATEWAY_URL || settings.LIVEPEER_GATEWAY_URL;
            
        default:
            const errorMessage = `Failed to get token - unsupported model provider: ${provider}`;
            elizaLogger.error(errorMessage);
            throw new Error(errorMessage);
    }
}

/**
 * Get secret from character settings or environment
 */
export function getSecret(character: Character, secret: string): string | undefined {
    return character.settings?.secrets?.[secret] || process.env[secret];
}