import { HEALTH_THRESHOLDS } from "@/lib/constants";

export type HealthLevel = "excellent" | "good" | "fair" | "poor";

export const getHealthLevel = (score: number): HealthLevel => {
  if (score >= HEALTH_THRESHOLDS.EXCELLENT) return "excellent";
  if (score >= HEALTH_THRESHOLDS.GOOD) return "good";
  if (score >= HEALTH_THRESHOLDS.FAIR) return "fair";
  return "poor";
};

export const getHealthColor = (score: number): string => {
  const level = getHealthLevel(score);
  switch (level) {
    case "excellent":
      return "text-green-600";
    case "good":
      return "text-blue-600";
    case "fair":
      return "text-yellow-600";
    case "poor":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
};

export const getHealthDescription = (score: number): string => {
  const level = getHealthLevel(score);
  switch (level) {
    case "excellent":
      return "Your family is thriving with strong emotional connections";
    case "good":
      return "Your family has healthy communication patterns";
    case "fair":
      return "There are opportunities to strengthen family bonds";
    case "poor":
      return "Consider focusing on improving family communication";
    default:
      return "Analyzing family health...";
  }
};