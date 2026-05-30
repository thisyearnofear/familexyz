export interface FamilyMetrics {
  affection: number;
  tension: number;
}

export interface FamilyStats {
  healthScore: number;
  total: number;
  positive: number;
  negative: number;
  latestTransactionId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  birthday?: string;
  avatar?: string;
  interests: string[];
  favoriteActivities: string[];
  communicationStyle: "visual" | "auditory" | "kinesthetic";
  personalityTraits: string[];
  goals: string[];
  preferences: {
    notifications: boolean;
    privacy: "open" | "moderate" | "private";
    shareProgress: boolean;
  };
  notes?: string;
}

export interface FamilyHistoryPoint {
  ts: string;
  health: number;
}

export interface FamilyHistory {
  timeline: FamilyHistoryPoint[];
}
