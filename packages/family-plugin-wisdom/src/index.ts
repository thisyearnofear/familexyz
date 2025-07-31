import type { PluginInitializer } from "@elizaos/core";

interface FamilyMetrics {
  total: number;
  positive: number;
  negative: number;
}

const POSITIVE = [
  "love", "joy", "happy", "grateful", "forgive", "understand", "appreciate", "connected", "growth", "peace", "kind"
];
const NEGATIVE = [
  "angry", "sad", "upset", "frustrated", "hate", "resent", "hurt", "lonely", "conflict", "fight", "ignore"
];

function analyzeSentiment(text: string): {positive: number, negative: number} {
  const lower = text?.toLowerCase() || "";
  let positive = 0, negative = 0;
  for (const word of POSITIVE) if (lower.includes(word)) positive++;
  for (const word of NEGATIVE) if (lower.includes(word)) negative++;
  return { positive, negative };
}

const plugin: PluginInitializer = () => {
  return {
    name: "family-plugin-wisdom",
    onMessage: async ({ message, runtime }) => {
      if (!message || message.userId === runtime.agentId) return;
      if (!runtime.meta.familyMetrics) {
        runtime.meta.familyMetrics = { total: 0, positive: 0, negative: 0 };
      }
      const metrics: FamilyMetrics = runtime.meta.familyMetrics;
      metrics.total += 1;
      const sentiment = analyzeSentiment(message.content?.text ?? "");
      metrics.positive += sentiment.positive;
      metrics.negative += sentiment.negative;
      runtime.logger.debug(`[family-plugin-wisdom] received message: ${message.content?.text} (+${sentiment.positive}/-${sentiment.negative})`);
    },
  };
};

export default plugin;