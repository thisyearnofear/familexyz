/**
 * Onboarding Components Index
 * 
 * Exports all onboarding step components.
 * Follows MODULAR principle: composable, independent modules.
 */

export { WelcomeStep } from "./WelcomeStep";
export { FamilyProfileStep } from "./FamilyProfileStep";
export { FamilyGoalsStep } from "./FamilyGoalsStep";

// Re-export types for convenience
export type { FamilyMember, FamilyProfile } from "./FamilyProfileStep";