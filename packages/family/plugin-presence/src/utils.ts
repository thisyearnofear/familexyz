import { FamilyInteractionType, FamilyConversationContext } from "@elizaos/family-nlp-utils";
import { IAgentRuntime, Memory, State, ModelClass } from "@elizaos/core";
import { PRESENCE_PROMPTS } from "./constants";

export function determinePresenceInteractionType(
  content: string,
): FamilyInteractionType {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("screen") ||
    lowerContent.includes("phone") ||
    lowerContent.includes("device") ||
    lowerContent.includes("digital") ||
    lowerContent.includes("social media") ||
    lowerContent.includes("scroll")
  ) {
    return "growth_milestone"; // digital wellness is a growth area
  }

  return "mindful_presence";
}

export async function generatePresenceResponse(
  runtime: IAgentRuntime,
  content: string,
  interactionType: FamilyInteractionType,
  context: FamilyConversationContext,
): Promise<{
  content: string;
  qualityScore: number;
  mindfulnessDepth: number;
  practicalApplicability: number;
  digitalWellnessImpact: number;
}> {
  let prompt = PRESENCE_PROMPTS.mindfulnessExercise;

  const lowerContent = content.toLowerCase();
  if (
    lowerContent.includes("screen") ||
    lowerContent.includes("phone") ||
    lowerContent.includes("device") ||
    lowerContent.includes("digital")
  ) {
    prompt = PRESENCE_PROMPTS.digitalWellness;
  } else if (
    lowerContent.includes("attention") ||
    lowerContent.includes("focus") ||
    lowerContent.includes("distract") ||
    lowerContent.includes("busy")
  ) {
    prompt = PRESENCE_PROMPTS.presenceBuilding;
  }

  const contextualizedPrompt = prompt
    .replace("{context}", JSON.stringify(context.conversationHistory.slice(-3)))
    .replace("{goals}", context.familyGoals.join(", "))
    .replace("{challenges}", context.currentChallenges.join(", "))
    .replace("{situation}", content)
    .replace("{participants}", context.participants.join(", "))
    .replace("{dynamics}", `${context.participants.length} family members`)
    .replace("{opportunity}", content);

  const presenceText = await (runtime as any).generateText({
    context: contextualizedPrompt,
    modelClass: ModelClass.LARGE,
  });

  const qualityScore = calculatePresenceQuality(presenceText, interactionType);
  const mindfulnessDepth = assessMindfulnessDepth(presenceText);
  const practicalApplicability = assessPracticalApplicability(presenceText);
  const digitalWellnessImpact = assessDigitalWellnessImpact(presenceText);

  return {
    content: presenceText,
    qualityScore,
    mindfulnessDepth,
    practicalApplicability,
    digitalWellnessImpact,
  };
}

export function calculatePresenceQuality(
  text: string,
  interactionType: FamilyInteractionType,
): number {
  let score = 50;

  const qualityIndicators = [
    "present", "mindful", "breathe", "notice", "calm",
    "awareness", "moment", "attention", "peace", "still",
  ];

  const lowerText = text.toLowerCase();
  qualityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) score += 5;
  });

  switch (interactionType) {
    case "mindful_presence":
      if (lowerText.includes("breathe") || lowerText.includes("breath")) score += 10;
      if (lowerText.includes("notice") || lowerText.includes("observe")) score += 10;
      break;
    case "growth_milestone":
      if (lowerText.includes("device-free") || lowerText.includes("unplug")) score += 10;
      if (lowerText.includes("together") || lowerText.includes("connect")) score += 10;
      break;
  }

  if (text.length > 100) score += 5;
  if (text.length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function assessMindfulnessDepth(text: string): number {
  const mindfulnessWords = [
    "awareness", "present", "moment", "breath", "meditation",
    "mindful", "conscious", "grounded", "centered", "still",
    "inner", "peace",
  ];

  let depth = 0;
  const lowerText = text.toLowerCase();
  mindfulnessWords.forEach((word) => {
    if (lowerText.includes(word)) depth += 8;
  });

  return Math.min(100, depth);
}

export function assessPracticalApplicability(text: string): number {
  const practicalWords = [
    "try", "practice", "exercise", "minute", "step",
    "when", "before", "after", "daily", "routine",
    "simple", "easy",
  ];

  let practical = 0;
  const lowerText = text.toLowerCase();
  practicalWords.forEach((word) => {
    if (lowerText.includes(word)) practical += 8;
  });

  return Math.min(100, practical);
}

export function assessDigitalWellnessImpact(text: string): number {
  const digitalWords = [
    "screen", "device", "phone", "digital", "offline",
    "unplug", "technology", "notification", "boundary",
    "device-free", "disconnect", "detox",
  ];

  let impact = 0;
  const lowerText = text.toLowerCase();
  digitalWords.forEach((word) => {
    if (lowerText.includes(word)) impact += 8;
  });

  return Math.min(100, impact);
}

export function extractParticipants(message: Memory, state?: State): string[] {
  const participants = [message.userId];
  return participants.filter(Boolean);
}

export function extractFamilyId(message: Memory): string | null {
  return message.roomId || null;
}
