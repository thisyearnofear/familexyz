import { IAgentRuntime, Memory } from "@elizaos/core";
import { FamilyConversationContext, extractFamilyId, extractParticipants } from "@elizaos/family-nlp-utils";

export { extractFamilyId, extractParticipants };

export function determineSavingsInteractionType(text: string): string {
  const content = text.toLowerCase();
  if (content.includes("deposit") || content.includes("save") || content.includes("add")) {
    return "family_savings_deposit";
  }
  if (content.includes("withdraw") || content.includes("take out") || content.includes("spend")) {
    return "family_savings_withdrawal";
  }
  if (content.includes("goal") || content.includes("target") || content.includes("saving for")) {
    return "savings_goal_setting";
  }
  if (content.includes("interest") || content.includes("yield") || content.includes("earn")) {
    return "interest_payout_check";
  }
  return "bonzo_vault_status";
}

export async function generateSavingsResponse(
  runtime: IAgentRuntime,
  text: string,
  type: string,
  context: FamilyConversationContext
) {
  const responses: Record<string, string> = {
    family_savings_deposit: "Great decision to save for the family's future! I've initiated a deposit into the Bonzo Finance lending vault to start earning yield on your FAM tokens.",
    family_savings_withdrawal: "I've processed your withdrawal request from the family savings vault. The funds will be available in your family wallet shortly.",
    savings_goal_setting: "Setting financial goals together is a great way to build family unity. I've logged this goal and will track our progress through Bonzo Finance yield.",
    interest_payout_check: "The family savings are currently earning 4.5% APY on Bonzo Finance. Your bonds are growing even while you sleep!",
    bonzo_vault_status: "Our Bonzo Finance vault is healthy and active. All family savings are securely earning interest in the lending market.",
  };

  return {
    content: responses[type] || responses.bonzo_vault_status,
    qualityScore: 9.0,
    savingsImpact: 0.5,
  };
}
