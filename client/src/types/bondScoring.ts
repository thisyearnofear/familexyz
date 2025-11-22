/**
 * Actual response format from the bond score API
 * Maps to agent/src/index.ts GET /api/families/:familyId/bond-score
 */
export interface BondScoreHistoryEntry {
  week: number;
  bondScore: number;
  trend: string;
  delta: number;
  timestamp: string;
}

export interface BondScoreResponse {
  familyId: string;
  current: {
    bondScore: number;
    trend: string;
    delta: number;
    timestamp: string;
  };
  history: BondScoreHistoryEntry[];
  signals: {
    generational: number;
    reciprocity: number;
    sentiment: number;
    challenges: number;
    presence: number;
    topology: number;
    consensus: number;
  };
}

export interface BondScoreDashboardData extends BondScoreResponse {
  score: number;
  calculated_at: string;
  previous_scores?: number[];
  family_member_count?: number;
  interaction_count?: number;
  avg_response_time?: number;
  total_signals_calculated?: number;
}

export interface BondScoreMetadata {
  familyId: string;
  familyName: string;
  memberCount: number;
  lastSyncAt: string;
}
