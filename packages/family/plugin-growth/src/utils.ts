import { IAgentRuntime, Memory } from "@elizaos/core";
import { FamilyConversationContext, extractFamilyId, extractParticipants } from "@elizaos/family-nlp-utils";

export { extractFamilyId, extractParticipants };

export function determineGrowthInteractionType(text: string): string {
  const content = text.toLowerCase();
  if (content.includes("can't") || content.includes("hard") || content.includes("fail")) {
    return "growth_mindset_reframing";
  }
  if (content.includes("worked hard") || content.includes("effort") || content.includes("proud")) {
    return "effort_celebration";
  }
  if (content.includes("learn") || content.includes("challenge") || content.includes("new")) {
    return "learning_challenge";
  }
  return "skill_development";
}

export async function generateGrowthResponse(
  runtime: IAgentRuntime,
  text: string,
  type: string,
  context: FamilyConversationContext
) {
  // Simple deterministic response for now, similar to other plugins
  // In a real scenario, this would use the LLM to generate a contextual response
  const responses: Record<string, string> = {
    growth_mindset_reframing: "I hear that this feels difficult right now. Let's remember that our brains grow when we tackle hard things! What's one small step we can take to learn more about this?",
    effort_celebration: "That is incredible effort! I'm so proud of how you persisted. Celebrating these moments of hard work is how we build a family culture of growth.",
    learning_challenge: "Learning something new together is the ultimate family bonding activity. I've noted this challenge for your family — let's track our progress!",
    skill_development: "Developing new skills takes time and patience. Your family is on a great path of continuous improvement.",
  };

  return {
    content: responses[type] || responses.skill_development,
    qualityScore: 8.5,
    growthImpact: 0.2,
  };
}
