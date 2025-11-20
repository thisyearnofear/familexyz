
import { describe, it, expect, vi } from "vitest";
import { wisdomAction } from "./actions";
import type { Memory, State } from "@elizaos/core";
import { ModelProviderName } from "@elizaos/core";

// Mock the NLP utils to control Hedera integration behavior
vi.mock("@elizaos/family-nlp-utils", async () => {
  return {
    createFamilyHederaIntegration: vi.fn().mockReturnValue({
      getEnhancedContext: vi.fn().mockResolvedValue({
        conversationHistory: [],
        familyGoals: ["Harmony"],
        currentChallenges: ["Communication"],
        participants: ["550e8400-e29b-41d4-a716-446655440002"]
      }),
      createConversationContext: vi.fn().mockResolvedValue({
        conversationHistory: [],
        familyGoals: ["Harmony"],
        currentChallenges: ["Communication"],
        participants: ["550e8400-e29b-41d4-a716-446655440002"]
      }),
      processFamilyInteraction: vi.fn().mockResolvedValue({
        message: {},
        rewards: {
          amount: 10,
          transactionId: "0.0.mock_tx_id"
        },
        familyHealthImpact: {
          communicationImprovement: 5,
          emotionalBonding: 5,
          conflictResolution: 5,
          traditionPreservation: 5
        }
      })
    }),
    DEFAULT_TOKENOMICS: {
      enabled: true,
      rewardPool: 1000,
      distributionRules: {
        immediateReward: 50,
        savingsReward: 30,
        charityReward: 20
      },
      milestoneRewards: {}
    },
    WISDOM_INTERACTIONS: ["wisdom_shared", "conflict_resolved"]
  };
});

describe("Wisdom Agent", () => {
  // Mock Runtime
  const mockRuntime: any = {
    agentId: "mock-wisdom-agent",
    modelProvider: ModelProviderName.OPENAI,
    character: {
      name: "Wisdom",
      settings: {
        secrets: {}
      }
    },
    getSetting: (key: string) => {
      if (key === "HEDERA_WISDOM_TOPIC_ID") return "0.0.12345";
      return null;
    },
    composeState: async () => ({}),
    updateRecentMessageState: async () => ({}),
    evaluate: async () => null,
    service: {
      get: () => null
    },
    // Mock Hedera Service (still needed for getOrCreateHederaIntegration check)
    hederaService: {
      initialize: async () => ({ success: true }),
    },
    // Mock Generation
    generateText: async () => "This is a mock wisdom response.",
    generateObject: async () => ({
      content: "This is a mock wisdom response.",
      qualityScore: 85,
      philosophicalDepth: 8,
      empathyLevel: 9,
      practicalGuidance: "Take a deep breath."
    })
  };

  // Mock Message
  const mockMessage: Memory = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    userId: "550e8400-e29b-41d4-a716-446655440002", 
    roomId: "550e8400-e29b-41d4-a716-446655440003",
    agentId: "550e8400-e29b-41d4-a716-446655440004",
    content: {
      text: "I am feeling very conflicted about a family argument.",
      action: "SHARE_FAMILY_WISDOM"
    },
    createdAt: Date.now()
  };

  it("should validate the trigger correctly", async () => {
    const isValid = await wisdomAction.validate(mockRuntime, mockMessage);
    expect(isValid).toBe(true);
  });

  it("should handle the action and return a response with Hedera metadata", async () => {
    let responseContent: any = null;
    const callback = async (content: any): Promise<Memory[]> => {
      responseContent = content;
      return [];
    };

    await wisdomAction.handler(mockRuntime, mockMessage, {} as State, {}, callback);

    expect(responseContent).toBeDefined();
    expect(responseContent.text).toBeDefined();
    expect(responseContent.metadata).toBeDefined();
    expect(responseContent.metadata.hedera).toBeDefined();
    expect(responseContent.metadata.hedera.transactionId).toBe("0.0.mock_tx_id");
  });
});
