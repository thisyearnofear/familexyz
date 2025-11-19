// Family-specific types - centralized and well-defined
export interface FamilyMetrics {
  affection: number;
  tension: number;
}

export interface PresenceMetrics {
  attention: number;
  distraction: number;
}

export interface GenerationalMetrics {
  bridge: number;
  gap: number;
}

export interface GrowthMetrics {
  growth: number;
  fixed: number;
}

export interface FamilyStats {
  healthScore: number;
  total: number;
  positive: number;
  negative: number;
  intimacy?: FamilyMetrics;
  presence?: PresenceMetrics;
  generational?: GenerationalMetrics;
  growth?: GrowthMetrics;
  latestTransactionId?: string;
}

export interface FamilyHistoryPoint {
  ts: string;
  health: number;
}

export interface FamilyHistory {
  timeline: FamilyHistoryPoint[];
}

export interface ConnectionOpportunity {
  title: string;
  description: string;
  category?: 'activity' | 'conversation' | 'tradition';
  difficulty?: 'easy' | 'medium' | 'challenging';
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
  contact?: {
    email?: string;
    phone?: string;
  };
  notes?: string;
}

export interface ConsentScopes {
  text: boolean;
  photo: boolean;
  audio: boolean;
}

// Chart configuration types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    r?: {
      beginAtZero?: boolean;
      max?: number;
    };
    y?: {
      beginAtZero?: boolean;
      max?: number;
    };
  };
}