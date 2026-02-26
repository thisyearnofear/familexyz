import { FamilyInteractionType, FamilyConversationContext, extractFamilyId, extractParticipants } from "@elizaos/family-nlp-utils";
import { IAgentRuntime, Memory, ModelClass } from "@elizaos/core";
import { GENERATIONAL_BRIDGE_PROMPTS } from "./constants";

export { extractFamilyId, extractParticipants };

export function determineGenerationalInteractionType(
  content: string,
): FamilyInteractionType {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("tradition") ||
    lowerContent.includes("recipe") ||
    lowerContent.includes("ritual") ||
    lowerContent.includes("holiday") ||
    lowerContent.includes("ceremony")
  ) {
    return "tradition_preserved";
  }

  if (
    lowerContent.includes("wisdom") ||
    lowerContent.includes("advice") ||
    lowerContent.includes("lesson") ||
    lowerContent.includes("taught")
  ) {
    return "wisdom_shared";
  }

  return "generational_story";
}

export async function generateGenerationalResponse(
  runtime: IAgentRuntime,
  content: string,
  interactionType: FamilyInteractionType,
  context: FamilyConversationContext,
): Promise<{
  content: string;
  qualityScore: number;
  storytellingRichness: number;
  traditionPreservation: number;
  crossAgeEngagement: number;
}> {
  let prompt = GENERATIONAL_BRIDGE_PROMPTS.storyCollection;
  if (interactionType === "tradition_preserved") {
    prompt = GENERATIONAL_BRIDGE_PROMPTS.traditionDocumentation;
  } else if (interactionType === "wisdom_shared") {
    prompt = GENERATIONAL_BRIDGE_PROMPTS.intergenerationalDialogue;
  }

  const contextualizedPrompt = prompt
    .replace("{context}", JSON.stringify(context.conversationHistory.slice(-3)))
    .replace("{goals}", context.familyGoals.join(", "))
    .replace("{challenges}", context.currentChallenges.join(", "))
    .replace("{situation}", content)
    .replace("{participants}", context.participants.join(", "))
    .replace("{dynamics}", `${context.participants.length} family members`)
    .replace("{opportunity}", content);

  const generationalText = await (runtime as any).generateText({
    context: contextualizedPrompt,
    modelClass: ModelClass.LARGE,
  });

  const qualityScore = calculateGenerationalQuality(generationalText, interactionType);
  const storytellingRichness = assessStorytellingRichness(generationalText);
  const traditionPreservation = assessTraditionPreservation(generationalText);
  const crossAgeEngagement = assessCrossAgeEngagement(generationalText);

  return {
    content: generationalText,
    qualityScore,
    storytellingRichness,
    traditionPreservation,
    crossAgeEngagement,
  };
}

export function calculateGenerationalQuality(
  text: string,
  interactionType: FamilyInteractionType,
): number {
  let score = 50;

  const qualityIndicators = [
    "story", "remember", "generation", "tradition", "heritage",
    "family", "ancestor", "history", "legacy", "memory",
  ];

  const lowerText = text.toLowerCase();
  qualityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) score += 5;
  });

  switch (interactionType) {
    case "generational_story":
      if (lowerText.includes("tell me") || lowerText.includes("what was")) score += 10;
      if (lowerText.includes("back then") || lowerText.includes("growing up")) score += 10;
      break;
    case "tradition_preserved":
      if (lowerText.includes("recipe") || lowerText.includes("always")) score += 10;
      if (lowerText.includes("every year") || lowerText.includes("ritual")) score += 10;
      break;
    case "wisdom_shared":
      if (lowerText.includes("lesson") || lowerText.includes("learned")) score += 10;
      if (lowerText.includes("experience") || lowerText.includes("taught")) score += 10;
      break;
  }

  if (text.length > 100) score += 5;
  if (text.length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function assessStorytellingRichness(text: string): number {
  const storytellingWords = [
    "once", "remember", "back when", "story", "told",
    "happened", "moment", "time when", "used to", "those days",
    "narrative",
  ];

  let richness = 0;
  const lowerText = text.toLowerCase();
  storytellingWords.forEach((word) => {
    if (lowerText.includes(word)) richness += 9;
  });

  return Math.min(100, richness);
}

export function assessTraditionPreservation(text: string): number {
  const preservationWords = [
    "tradition", "recipe", "ritual", "annual", "heritage",
    "custom", "ceremony", "celebrate", "preserve", "document",
    "pass down",
  ];

  let preservation = 0;
  const lowerText = text.toLowerCase();
  preservationWords.forEach((word) => {
    if (lowerText.includes(word)) preservation += 8;
  });

  return Math.min(100, preservation);
}

export function assessCrossAgeEngagement(text: string): number {
  const crossAgeWords = [
    "grandparent", "grandchild", "generation", "age",
    "young", "elder", "teen", "parent", "bridge", "both",
    "together", "teach", "learn from",
  ];

  let engagement = 0;
  const lowerText = text.toLowerCase();
  crossAgeWords.forEach((word) => {
    if (lowerText.includes(word)) engagement += 7;
  });

  return Math.min(100, engagement);
}
