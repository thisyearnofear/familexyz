import { FamilyInteractionType, FamilyConversationContext, extractFamilyId, extractParticipants } from "@elizaos/family-nlp-utils";
import { IAgentRuntime, Memory, ModelClass } from "@elizaos/core";
import { INTIMACY_PROMPTS } from "./constants";

export { extractFamilyId, extractParticipants };

export function determineIntimacyInteractionType(
  content: string,
): FamilyInteractionType {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("communicate") ||
    lowerContent.includes("talk") ||
    lowerContent.includes("listen") ||
    lowerContent.includes("express") ||
    lowerContent.includes("understand")
  ) {
    return "empathy_expressed";
  }

  return "intimacy_moment";
}

export async function generateIntimacyResponse(
  runtime: IAgentRuntime,
  content: string,
  interactionType: FamilyInteractionType,
  context: FamilyConversationContext,
): Promise<{
  content: string;
  qualityScore: number;
  connectionDepth: number;
  communicationQuality: number;
  emotionalVulnerability: number;
}> {
  // Select appropriate prompt template
  let prompt = INTIMACY_PROMPTS.relationshipCoaching;
  if (interactionType === "empathy_expressed") {
    prompt = INTIMACY_PROMPTS.communicationImprovement;
  }

  // Check if the user is asking for activity suggestions
  const lowerContent = content.toLowerCase();
  if (
    lowerContent.includes("date") ||
    lowerContent.includes("activity") ||
    lowerContent.includes("quality time") ||
    lowerContent.includes("together")
  ) {
    prompt = INTIMACY_PROMPTS.connectionActivities;
  }

  // Contextualize the prompt
  const contextualizedPrompt = prompt
    .replace("{context}", JSON.stringify(context.conversationHistory.slice(-3)))
    .replace("{goals}", context.familyGoals.join(", "))
    .replace("{challenges}", context.currentChallenges.join(", "))
    .replace("{situation}", content)
    .replace("{participants}", context.participants.join(", "))
    .replace("{dynamics}", `${context.participants.length} family members`)
    .replace("{opportunity}", content);

  const intimacyText = await (runtime as any).generateText({
    context: contextualizedPrompt,
    modelClass: ModelClass.LARGE,
  });

  // Calculate quality metrics
  const qualityScore = calculateIntimacyQuality(intimacyText, interactionType);
  const connectionDepth = assessConnectionDepth(intimacyText);
  const communicationQuality = assessCommunicationQuality(intimacyText);
  const emotionalVulnerability = assessEmotionalVulnerability(intimacyText);

  return {
    content: intimacyText,
    qualityScore,
    connectionDepth,
    communicationQuality,
    emotionalVulnerability,
  };
}

export function calculateIntimacyQuality(
  text: string,
  interactionType: FamilyInteractionType,
): number {
  let score = 50;

  const qualityIndicators = [
    "connection", "together", "listen", "share", "love",
    "support", "appreciate", "trust", "safe", "open",
  ];

  const lowerText = text.toLowerCase();
  qualityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) score += 5;
  });

  switch (interactionType) {
    case "intimacy_moment":
      if (lowerText.includes("quality time") || lowerText.includes("together")) score += 10;
      if (lowerText.includes("ritual") || lowerText.includes("tradition")) score += 10;
      break;
    case "empathy_expressed":
      if (lowerText.includes("i feel") || lowerText.includes("i hear you")) score += 10;
      if (lowerText.includes("validate") || lowerText.includes("acknowledge")) score += 10;
      break;
  }

  if (text.length > 100) score += 5;
  if (text.length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function assessConnectionDepth(text: string): number {
  const connectionWords = [
    "vulnerable", "intimate", "deep", "bond", "closeness",
    "heart", "soul", "cherish", "devoted", "connected", "trust",
  ];

  let depth = 0;
  const lowerText = text.toLowerCase();
  connectionWords.forEach((word) => {
    if (lowerText.includes(word)) depth += 9;
  });

  return Math.min(100, depth);
}

export function assessCommunicationQuality(text: string): number {
  const communicationWords = [
    "listen", "express", "share", "dialogue", "conversation",
    "respond", "acknowledge", "validate", "check-in", "feedback",
    "ask",
  ];

  let quality = 0;
  const lowerText = text.toLowerCase();
  communicationWords.forEach((word) => {
    if (lowerText.includes(word)) quality += 8;
  });

  return Math.min(100, quality);
}

export function assessEmotionalVulnerability(text: string): number {
  const vulnerabilityWords = [
    "feel", "emotion", "vulnerable", "open", "honest",
    "afraid", "need", "hope", "safe", "courage", "brave",
  ];

  let vulnerability = 0;
  const lowerText = text.toLowerCase();
  vulnerabilityWords.forEach((word) => {
    if (lowerText.includes(word)) vulnerability += 8;
  });

  return Math.min(100, vulnerability);
}
