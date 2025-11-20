// packages/family/metrics/src/plugin.test.ts
// Comprehensive test for familyMetricsPlugin factory
// Tests all 4 agent plugins: intimacy, generational-bridge, presence, growth

import { describe, it, expect } from "vitest";
import { familyMetricsPlugin, FAMILY_METRICS_CONFIGS } from "./index";
import type { Memory, State } from "@elizaos/core";
import { ModelProviderName } from "@elizaos/core";
import type { FamilyMetricsConfig } from "./plugin";

describe("Family Metrics Plugin Factory", () => {
  // Mock Runtime (reusable across all tests)
  const createMockRuntime = (agentName: string): any => ({
    agentId: `mock-${agentName}-agent`,
    modelProvider: ModelProviderName.OPENAI,
    character: {
      name: agentName,
      settings: {
        secrets: {}
      }
    },
    getSetting: () => null,
    composeState: async () => ({}),
    updateRecentMessageState: async () => ({}),
    evaluate: async () => null,
    service: {
      get: () => null
    }
  });

  // Mock Message Factory (reusable)
  const createMockMessage = (text: string): Memory => ({
    id: "550e8400-e29b-41d4-a716-446655440001",
    userId: "550e8400-e29b-41d4-a716-446655440002",
    roomId: "550e8400-e29b-41d4-a716-446655440003",
    agentId: "550e8400-e29b-41d4-a716-446655440004",
    content: {
      text,
      action: "FAMILY_CONVERSATION"
    },
    createdAt: Date.now()
  });

  describe("Intimacy Plugin", () => {
    // Cast readonly config to mutable type for plugin factory
    const plugin = familyMetricsPlugin(FAMILY_METRICS_CONFIGS.INTIMACY as FamilyMetricsConfig);

    it("should create plugin with correct configuration", () => {
      expect(plugin.name).toBe("family-intimacy");
      expect(plugin.description).toContain("intimacy");
      expect(plugin.providers).toHaveLength(1);
    });

    it("should detect affection keywords", async () => {
      const runtime = createMockRuntime("Intimacy");
      const message = createMockMessage("I love spending time with you, you're so adored in this family");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result).toBeDefined();
      expect(result["family-intimacy"]).toBeDefined();
      expect(result["family-intimacy"].categoryScores.affection).toBeGreaterThan(0);
    });

    it("should detect tension keywords", async () => {
      const runtime = createMockRuntime("Intimacy");
      const message = createMockMessage("We had an angry argument and I feel ignored and distant");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-intimacy"].categoryScores.tension).toBeGreaterThan(0);
    });
  });

  describe("Generational Bridge Plugin", () => {
    const plugin = familyMetricsPlugin(FAMILY_METRICS_CONFIGS.GENERATIONAL_BRIDGE as FamilyMetricsConfig);

    it("should create plugin with correct configuration", () => {
      expect(plugin.name).toBe("family-generational-bridge");
      expect(plugin.description).toContain("generational");
      expect(plugin.providers).toHaveLength(1);
    });

    it("should detect bridge keywords", async () => {
      const runtime = createMockRuntime("GenerationalBridge");
      const message = createMockMessage("Let me share a story about our family tradition we remember together");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-generational-bridge"].categoryScores.bridge).toBeGreaterThan(0);
    });

    it("should detect gap keywords", async () => {
      const runtime = createMockRuntime("GenerationalBridge");
      const message = createMockMessage("I can't understand these young people, they don't get our old ways");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-generational-bridge"].categoryScores.gap).toBeGreaterThan(0);
    });
  });

  describe("Presence Plugin", () => {
    const plugin = familyMetricsPlugin(FAMILY_METRICS_CONFIGS.PRESENCE as FamilyMetricsConfig);

    it("should create plugin with correct configuration", () => {
      expect(plugin.name).toBe("family-presence");
      expect(plugin.description).toContain("presence");
      expect(plugin.providers).toHaveLength(1);
    });

    it("should detect attention keywords", async () => {
      const runtime = createMockRuntime("Presence");
      const message = createMockMessage("I'm here to listen and focus on being present in the now");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-presence"].categoryScores.attention).toBeGreaterThan(0);
    });

    it("should detect distraction keywords", async () => {
      const runtime = createMockRuntime("Presence");
      const message = createMockMessage("Everyone is on their phone scrolling through screens and devices online");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-presence"].categoryScores.distraction).toBeGreaterThan(0);
    });
  });

  describe("Growth Plugin", () => {
    const plugin = familyMetricsPlugin(FAMILY_METRICS_CONFIGS.GROWTH as FamilyMetricsConfig);

    it("should create plugin with correct configuration", () => {
      expect(plugin.name).toBe("family-growth");
      expect(plugin.description).toContain("growth");
      expect(plugin.providers).toHaveLength(1);
    });

    it("should detect growth mindset keywords", async () => {
      const runtime = createMockRuntime("Growth");
      const message = createMockMessage("Let's learn and grow from this challenge, we can try and practice from our mistakes");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-growth"].categoryScores.growth).toBeGreaterThan(0);
    });

    it("should detect fixed mindset keywords", async () => {
      const runtime = createMockRuntime("Growth");
      const message = createMockMessage("I can't do this, I'll fail, it's impossible and I never succeed");
      const provider = plugin.providers![0];

      const result = await provider.get(runtime, message, {} as State);

      expect(result["family-growth"].categoryScores.fixed).toBeGreaterThan(0);
    });
  });

  describe("Plugin Factory Consistency", () => {
    it("should create plugins with consistent structure", () => {
      const plugins = [
        familyMetricsPlugin(FAMILY_METRICS_CONFIGS.INTIMACY as FamilyMetricsConfig),
        familyMetricsPlugin(FAMILY_METRICS_CONFIGS.GENERATIONAL_BRIDGE as FamilyMetricsConfig),
        familyMetricsPlugin(FAMILY_METRICS_CONFIGS.PRESENCE as FamilyMetricsConfig),
        familyMetricsPlugin(FAMILY_METRICS_CONFIGS.GROWTH as FamilyMetricsConfig)
      ];

      plugins.forEach(plugin => {
        expect(plugin).toHaveProperty("name");
        expect(plugin).toHaveProperty("description");
        expect(plugin).toHaveProperty("providers");
        expect(plugin.providers).toHaveLength(1);
        expect(plugin.actions).toEqual([]);
        expect(plugin.evaluators).toEqual([]);
        expect(plugin.services).toEqual([]);
      });
    });
  });
});
