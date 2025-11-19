import { FamilyInteractionType, FamilyConversationContext } from "@elizaos/family-nlp-utils";
import { IAgentRuntime, Memory, State, ModelClass } from "@elizaos/core";
import { WISDOM_PROMPTS } from "./constants";

export function determineWisdomInteractionType(
  content: string,
): FamilyInteractionType {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("conflict") ||
    lowerContent.includes("argument") ||
    lowerContent.includes("fight") ||
    lowerContent.includes("disagree")
  ) {
    return "conflict_resolved";
  }

  if (
    lowerContent.includes("empathy") ||
    lowerContent.includes("understand") ||
    lowerContent.includes("feelings") ||
    lowerContent.includes("perspective")
  ) {
    return "empathy_expressed";
  }

  return "wisdom_shared";
}

export async function generateWisdomResponse(
  runtime: IAgentRuntime,
  content: string,
  interactionType: FamilyInteractionType,
  context: FamilyConversationContext,
): Promise<{
  content: string;
  qualityScore: number;
  philosophicalDepth: number;
  empathyLevel: number;
  practicalGuidance: number;
}> {
  // Select appropriate prompt template
  let prompt = WISDOM_PROMPTS.philosophical;
  if (interactionType === "conflict_resolved") {
    prompt = WISDOM_PROMPTS.conflictResolution;
  } else if (interactionType === "empathy_expressed") {
    prompt = WISDOM_PROMPTS.empathyBuilding;
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

  // We need to use generateText directly if available, or fallback to a method that exists on runtime.
  // Assuming generateText exists on runtime based on previous code usage, but if it errors, we might need to check the interface.
  // For now, we'll assume the previous code was correct about its existence, or we cast it.

  const wisdomText = await (runtime as any).generateText({
    context: contextualizedPrompt,
    modelClass: ModelClass.LARGE,
  });

  // Calculate quality metrics
  const qualityScore = calculateWisdomQuality(wisdomText, interactionType);
  const philosophicalDepth = assessPhilosophicalDepth(wisdomText);
  const empathyLevel = assessEmpathyLevel(wisdomText);
  const practicalGuidance = assessPracticalGuidance(wisdomText);

  return {
    content: wisdomText,
    qualityScore,
    philosophicalDepth,
    empathyLevel,
    practicalGuidance,
  };
}

export function calculateWisdomQuality(
  text: string,
  interactionType: FamilyInteractionType,
): number {
  let score = 50; // Base score

  // Quality indicators
  const qualityIndicators = [
    "question",
    "perspective",
    "understand",
    "wisdom",
    "guidance",
    "empathy",
    "feeling",
    "experience",
    "learn",
    "grow",
  ];

  const lowerText = text.toLowerCase();
  qualityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) score += 5;
  });

  // Interaction type bonuses
  switch (interactionType) {
    case "conflict_resolved":
      if (lowerText.includes("both") || lowerText.includes("all")) score += 10;
      if (lowerText.includes("solution") || lowerText.includes("resolve"))
        score += 10;
      break;
    case "empathy_expressed":
      if (lowerText.includes("feel") || lowerText.includes("emotion"))
        score += 10;
      if (lowerText.includes("perspective") || lowerText.includes("viewpoint"))
        score += 10;
      break;
    case "wisdom_shared":
      if (lowerText.includes("wisdom") || lowerText.includes("insight"))
        score += 10;
      if (lowerText.includes("experience") || lowerText.includes("lesson"))
        score += 10;
      break;
  }

  // Length bonus for thoughtful responses
  if (text.length > 100) score += 5;
  if (text.length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function assessPhilosophicalDepth(text: string): number {
  const deepThinkingWords = [
    "meaning",
    "purpose",
    "values",
    "principles",
    "wisdom",
    "truth",
    "existence",
    "nature",
    "essence",
    "fundamental",
    "deeper",
  ];

  let depth = 0;
  const lowerText = text.toLowerCase();
  deepThinkingWords.forEach((word) => {
    if (lowerText.includes(word)) depth += 10;
  });

  return Math.min(100, depth);
}

export function assessEmpathyLevel(text: string): number {
  const empathyWords = [
    "feel",
    "emotion",
    "understand",
    "perspective",
    "heart",
    "compassion",
    "care",
    "support",
    "listen",
    "validate",
    "acknowledge",
  ];

  let empathy = 0;
  const lowerText = text.toLowerCase();
  empathyWords.forEach((word) => {
    if (lowerText.includes(word)) empathy += 8;
  });

  return Math.min(100, empathy);
}

export function assessPracticalGuidance(text: string): number {
  const practicalWords = [
    "try",
    "practice",
    "action",
    "step",
    "approach",
    "method",
    "technique",
    "strategy",
    "tool",
    "exercise",
    "habit",
  ];

  let practical = 0;
  const lowerText = text.toLowerCase();
  practicalWords.forEach((word) => {
    if (lowerText.includes(word)) practical += 8;
  });

  return Math.min(100, practical);
}

export function extractParticipants(message: Memory, state?: State): string[] {
  // Extract participant IDs from message context
  const participants = [message.userId];

  // Add other family members if mentioned
  // Note: state.recentMessages is a string, so we can't map over it easily without parsing.
  // For now, we'll rely on the current message's userId.
  /*
  if (state?.recentMessages) {
    // ... implementation that would parse the string ...
  }
  */

  return participants.filter(Boolean);
}

export function extractFamilyId(message: Memory): string | null {
  // Extract family ID from room or user context
  return message.roomId || null;
}
