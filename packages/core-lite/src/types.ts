/**
 * Represents a UUID string in the format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Represents the content of a message or communication
 */
export interface Content {
    /** The main text content */
    text: string;
    /** Optional action associated with the message */
    action?: string;
    /** Optional source/origin of the content */
    source?: string;
    /** URL of the original message/post */
    url?: string;
    /** UUID of parent message if this is a reply/thread */
    inReplyTo?: UUID;
    /** Array of media attachments */
    attachments?: Media[];
    /** Additional dynamic properties */
    [key: string]: unknown;
}

/**
 * Represents a media attachment
 */
export type Media = {
    id: string;
    url: string;
    title: string;
    source: string;
    description: string;
    text: string;
    contentType?: string;
};

/**
 * Model size/type classification
 */
export enum ModelClass {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    EMBEDDING = "embedding",
    IMAGE = "image",
}

/**
 * Model settings
 */
export type ModelSettings = {
    name: string;
    maxInputTokens: number;
    maxOutputTokens: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    stop: string[];
    temperature: number;
};

/** Image model settings */
export type ImageModelSettings = {
    name: string;
    steps?: number;
};

/** Embedding model settings */
export type EmbeddingModelSettings = {
    name: string;
    dimensions?: number;
};

/**
 * Configuration for an AI model
 */
export type Model = {
    endpoint?: string;
    model: {
        [ModelClass.SMALL]?: ModelSettings;
        [ModelClass.MEDIUM]?: ModelSettings;
        [ModelClass.LARGE]?: ModelSettings;
        [ModelClass.EMBEDDING]?: EmbeddingModelSettings;
        [ModelClass.IMAGE]?: ImageModelSettings;
    };
};

/**
 * Available model providers (only the ones we use)
 */
export enum ModelProviderName {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    GROK = "grok",
    GROQ = "groq",
    VENICE = "venice",
    DEEPSEEK = "deepseek",
    OLLAMA = "ollama",
}

export type Models = {
    [ModelProviderName.OPENAI]: Model;
    [ModelProviderName.ANTHROPIC]: Model;
    [ModelProviderName.GROK]: Model;
    [ModelProviderName.GROQ]: Model;
    [ModelProviderName.VENICE]: Model;
    [ModelProviderName.DEEPSEEK]: Model;
    [ModelProviderName.OLLAMA]: Model;
};

/**
 * Represents a stored memory/message
 */
export interface Memory {
    id?: UUID;
    userId: UUID;
    agentId: UUID;
    createdAt?: number;
    content: Content;
    roomId: UUID;
}

/**
 * Handler function type for processing messages
 */
export type Handler = (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
) => Promise<unknown>;

/**
 * Callback function type for handlers
 */
export type HandlerCallback = (
    response: Content,
    files?: any
) => Promise<Memory[]>;

/**
 * Validator function type for actions/evaluators
 */
export type Validator = (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
) => Promise<boolean>;

/**
 * Example content with associated user
 */
export interface ActionExample {
    user: string;
    content: Content;
}

/**
 * Represents an action the agent can perform
 */
export interface Action {
    similes: string[];
    description: string;
    examples: ActionExample[][];
    handler: Handler;
    name: string;
    validate: Validator;
    suppressInitialMessage?: boolean;
}

/**
 * Provider for external data/services
 */
export interface Provider {
    get: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => Promise<any>;
}

/**
 * Represents the current state/context of a conversation
 */
export interface State {
    userId?: UUID;
    agentId?: UUID;
    bio: string;
    lore: string;
    messageDirections: string;
    postDirections: string;
    roomId: UUID;
    agentName?: string;
    senderName?: string;
    actors: string;
    recentMessages: string;
    recentMessagesData: Memory[];
    actionNames?: string;
    actions?: string;
    actionExamples?: string;
    providers?: string;
    responseData?: Content;
    formattedConversation?: string;
    [key: string]: unknown;
}

/**
 * Plugin for extending agent functionality
 */
export type Plugin = {
    name: string;
    description: string;
    actions?: Action[];
    providers?: Provider[];
};

/**
 * Minimal runtime interface — only what's needed for generation
 */
export interface IAgentRuntime {
    agentId: UUID;
    token: string | null;
    modelProvider: ModelProviderName;
    character: Character;
    actions: Action[];
    providers: Provider[];
    plugins: Plugin[];

    getSetting(key: string): string | null;
}

export interface ModelConfiguration {
    temperature?: number;
    max_response_length?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    maxInputTokens?: number;
}

export type TemplateType = string | ((options: { state: State }) => string);

/**
 * Configuration for an agent character
 */
export type Character = {
    id?: UUID;
    name: string;
    username?: string;
    system?: string;
    modelProvider: ModelProviderName;
    modelEndpointOverride?: string;
    templates?: {
        messageHandlerTemplate?: TemplateType;
        shouldRespondTemplate?: TemplateType;
    };
    bio: string | string[];
    lore: string[];
    messageExamples: ActionExample[][];
    postExamples: string[];
    topics: string[];
    adjectives: string[];
    knowledge?: (string | { path: string; shared?: boolean })[];
    plugins: Plugin[];
    settings?: {
        secrets?: { [key: string]: string };
        model?: string;
        modelConfig?: ModelConfiguration;
        embeddingModel?: string;
        voice?: {
            model?: string;
            url?: string;
        };
        veniceParameters?: {
            include_venice_system_prompt?: boolean;
            enable_web_search?: "auto" | "on" | "off";
        };
        /** Hackathon: identity tone/style/format constraints */
        tone?: string;
        format?: string;
        banned?: string[];
    };
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
    extends?: string[];
};

// ============================================================================
// Agent Status Types (shared across frontend + backend)
// ============================================================================

export type AgentStatus = "IDLE" | "BUSY" | "DONE" | "CRSH" | "RETRY";

export interface AgentStatusEvent {
    agentId: string;
    agentName: string;
    status: AgentStatus;
    task?: string;
    progress?: number;
    error?: string;
    timestamp: number;
}

export interface TransformRequest {
    content: string;
    identityId: string;
}

export interface TransformResponse {
    transformed: string;
    agents: AgentStatusEvent[];
}

export interface Identity {
    name: string;
    role: string;
    tone: string;
    format: string;
    banned: string[];
    bio: string[];
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
}
