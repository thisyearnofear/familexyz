const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);

const settings = {
    OPENAI_API_KEY: env.OPENAI_API_KEY || "",
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || "",
    GROK_API_KEY: env.GROK_API_KEY || "",
    GROQ_API_KEY: env.GROQ_API_KEY || "",
    VENICE_API_KEY: env.VENICE_API_KEY || "",
    DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY || "",
    OPENAI_API_URL: env.OPENAI_API_URL || "",
    SYSTEM_PROMPT: env.SYSTEM_PROMPT || "",
    SMALL_VENICE_MODEL: env.SMALL_VENICE_MODEL || "llama-3.3-70b",
    MEDIUM_VENICE_MODEL: env.MEDIUM_VENICE_MODEL || "llama-3.3-70b",
    LARGE_VENICE_MODEL: env.LARGE_VENICE_MODEL || "llama-3.3-70b",
    IMAGE_VENICE_MODEL: env.IMAGE_VENICE_MODEL || "fluently-xl",
    SMALL_GROK_MODEL: env.SMALL_GROK_MODEL || "grok-4-1-fast",
    MEDIUM_GROK_MODEL: env.MEDIUM_GROK_MODEL || "grok-4-1-fast",
    LARGE_GROK_MODEL: env.LARGE_GROK_MODEL || "grok-4-1-fast",
};

export default settings;
