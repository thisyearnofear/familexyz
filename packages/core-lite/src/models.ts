import {
    type EmbeddingModelSettings,
    type ImageModelSettings,
    ModelClass,
    ModelProviderName,
    type Models,
    type ModelSettings,
} from "./types";

/** Environment-backed settings for model overrides */
const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);

export const models: Models = {
    [ModelProviderName.OPENAI]: {
        endpoint: env.OPENAI_API_URL || "https://api.openai.com/v1",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_OPENAI_MODEL || "gpt-4o-mini",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_OPENAI_MODEL || "gpt-4o",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_OPENAI_MODEL || "gpt-4o",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.6,
            },
            [ModelClass.EMBEDDING]: {
                name: env.EMBEDDING_OPENAI_MODEL || "text-embedding-3-small",
                dimensions: 1536,
            },
            [ModelClass.IMAGE]: {
                name: env.IMAGE_OPENAI_MODEL || "dall-e-3",
            },
        },
    },
    [ModelProviderName.ANTHROPIC]: {
        endpoint: "https://api.anthropic.com/v1",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_ANTHROPIC_MODEL || "claude-3-haiku-20240307",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
                stop: [],
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
        },
    },
    [ModelProviderName.GROK]: {
        endpoint: "https://api.x.ai/v1",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_GROK_MODEL || "grok-4-1-fast",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_GROK_MODEL || "grok-4-1-fast",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_GROK_MODEL || "grok-4-1-fast",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: env.EMBEDDING_GROK_MODEL || "grok-4-1-fast",
            },
        },
    },
    [ModelProviderName.GROQ]: {
        endpoint: "https://api.groq.com/openai/v1",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_GROQ_MODEL || "llama-3.1-8b-instant",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_GROQ_MODEL || "llama-3.3-70b-versatile",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_GROQ_MODEL || "llama-3.2-90b-vision-preview",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8000,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: env.EMBEDDING_GROQ_MODEL || "llama-3.1-8b-instant",
            },
        },
    },
    [ModelProviderName.VENICE]: {
        endpoint: "https://api.venice.ai/api/v1",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_VENICE_MODEL || "llama-3.3-70b",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                temperature: 0.6,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_VENICE_MODEL || "llama-3.3-70b",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                temperature: 0.6,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_VENICE_MODEL || "llama-3.3-70b",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                temperature: 0.6,
            },
            [ModelClass.IMAGE]: {
                name: env.IMAGE_VENICE_MODEL || "fluently-xl",
            },
        },
    },
    [ModelProviderName.DEEPSEEK]: {
        endpoint: env.DEEPSEEK_API_URL || "https://api.deepseek.com",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_DEEPSEEK_MODEL || "deepseek-chat",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_DEEPSEEK_MODEL || "deepseek-chat",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_DEEPSEEK_MODEL || "deepseek-chat",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                temperature: 0.7,
            },
        },
    },
    [ModelProviderName.OLLAMA]: {
        endpoint: env.OLLAMA_SERVER_URL || "http://localhost:11434",
        model: {
            [ModelClass.SMALL]: {
                name: env.SMALL_OLLAMA_MODEL || env.OLLAMA_MODEL || "llama3.2",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.MEDIUM]: {
                name: env.MEDIUM_OLLAMA_MODEL || env.OLLAMA_MODEL || "hermes3",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.LARGE]: {
                name: env.LARGE_OLLAMA_MODEL || env.OLLAMA_MODEL || "hermes3:70b",
                stop: [],
                maxInputTokens: 128000,
                maxOutputTokens: 8192,
                frequency_penalty: 0.4,
                presence_penalty: 0.4,
                temperature: 0.7,
            },
            [ModelClass.EMBEDDING]: {
                name: env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large",
                dimensions: env.OLLAMA_EMBEDDING_MODEL === "nomic-embed-text" ? 768 : 1024,
            },
        },
    },
};

export function getModelSettings(
    provider: ModelProviderName,
    type: ModelClass
): ModelSettings | undefined {
    return models[provider]?.model[type] as ModelSettings | undefined;
}

export function getImageModelSettings(
    provider: ModelProviderName
): ImageModelSettings | undefined {
    return models[provider]?.model[ModelClass.IMAGE] as
        | ImageModelSettings
        | undefined;
}

export function getEmbeddingModelSettings(
    provider: ModelProviderName
): EmbeddingModelSettings | undefined {
    return models[provider]?.model[ModelClass.EMBEDDING] as
        | EmbeddingModelSettings
        | undefined;
}

export function getEndpoint(provider: ModelProviderName) {
    return models[provider]?.endpoint;
}
