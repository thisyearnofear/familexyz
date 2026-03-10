// Model configuration with fallbacks for Venice AI
// Following DRY and CLEAN principles

export const VENICE_MODEL_CONFIG = {
  // Primary models for different agent types
  primary: {
    wisdom: "llama-3.3-70b",      // Large model for complex reasoning
    intimacy: "llama-3.3-70b",    // Large model for emotional intelligence
    generational: "llama-3.3-70b", // Large model for cross-generational understanding
    presence: "llama-3.2-3b",     // Smaller, faster model for mindfulness
    growth: "qwen-2.5-coder-32b"  // Specialized model for goal-oriented tasks
  },

  // Fallback models if primary fails
  fallbacks: [
    "llama-3.2-3b",     // Fast, lightweight fallback
    "qwen-2.5-32b",     // Alternative reasoning model
    "mistral-31-24b"    // Vision and function calling capabilities
  ],

  // Model capabilities mapping
  capabilities: {
    "llama-3.3-70b": {
      reasoning: "high",
      creativity: "high",
      speed: "medium",
      context: "128k"
    },
    "llama-3.2-3b": {
      reasoning: "medium",
      creativity: "medium",
      speed: "high",
      context: "32k"
    },
    "qwen-2.5-coder-32b": {
      reasoning: "high",
      creativity: "medium",
      speed: "medium",
      context: "64k",
      specialization: "code"
    },
    "mistral-31-24b": {
      reasoning: "high",
      creativity: "high",
      speed: "medium",
      context: "64k",
      features: ["vision", "function_calling", "web_search"]
    }
  }
};

// Privacy-focused Venice AI configuration
export const VENICE_PRIVACY_FEATURES = {
  noDataStorage: true,
  encryptedLocalStorage: true,
  decentralizedProcessing: true,
  noConversationLogging: true,
  proxyServerRouting: true
};