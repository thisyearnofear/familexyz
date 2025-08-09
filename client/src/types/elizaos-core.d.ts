// TypeScript declarations for @elizaos/core package
declare module '@elizaos/core' {
  export type UUID = string;
  
  export interface Character {
    id: UUID;
    name: string;
    username?: string;
    system?: string;
    modelProvider?: string;
    imageModelProvider?: string;
    bio?: string[];
    lore?: string[];
    messageExamples?: Array<{
      user: string;
      content: { text: string };
    }>;
    postExamples?: string[];
    topics?: string[];
    style?: {
      all?: string[];
      chat?: string[];
      post?: string[];
    };
    adjectives?: string[];
    knowledge?: string[];
    clients?: string[];
    plugins?: string[];
    settings?: {
      secrets?: Record<string, string>;
      voice?: {
        model?: string;
        url?: string;
        elevenlabs?: {
          voiceId: string;
          model?: string;
          stability?: string;
          similarityBoost?: string;
          style?: string;
          useSpeakerBoost?: string;
        };
      };
    };
  }

  export interface Content {
    text: string;
    action?: string;
    source?: string;
    url?: string;
    inReplyTo?: UUID;
    attachments?: Array<{
      id: string;
      url: string;
      title: string;
      source?: string;
      description?: string;
      text?: string;
    }>;
  }

  export interface Memory {
    id?: UUID;
    userId: UUID;
    agentId: UUID;
    roomId: UUID;
    content: Content;
    embedding?: number[];
    createdAt?: number;
    unique?: boolean;
  }

  export interface Goal {
    id?: UUID;
    roomId: UUID;
    userId: UUID;
    name: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    description?: string;
    objectives?: Array<{
      id: string;
      description: string;
      completed: boolean;
    }>;
  }

  export interface Room {
    id: UUID;
    participants: UUID[];
  }

  export interface State {
    userId?: UUID;
    agentId?: UUID;
    roomId?: UUID;
    bio?: string;
    lore?: string;
    messageDirections?: string;
    postDirections?: string;
    roomId?: UUID;
    agentName?: string;
    senderName?: string;
    actors?: string;
    actorsData?: Array<{
      name: string;
      details: Record<string, any>;
    }>;
    goals?: string;
    goalsData?: Goal[];
    recentMessages?: string;
    recentMessagesData?: Memory[];
    relevantFacts?: string;
    relevantFactsData?: Memory[];
    actionNames?: string;
    actions?: string;
    actionExamples?: string;
    providers?: Record<string, any>;
  }

  export interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: any, message: Memory) => Promise<boolean>;
    handler: (runtime: any, message: Memory, state?: State) => Promise<boolean>;
    examples: Array<{
      user: string;
      content: Content;
    }>;
  }

  export interface Provider {
    get: (runtime: any, message: Memory, state?: State) => Promise<string>;
  }

  export interface Evaluator {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: any, message: Memory) => Promise<boolean>;
    handler: (runtime: any, message: Memory) => Promise<string>;
    examples: Array<{
      context: string;
      messages: Array<{
        user: string;
        content: Content;
      }>;
      outcome: string;
    }>;
  }

  // Add other exports as needed
  export const elizaLogger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}
