/**
 * Hedera Payout Logger
 * 
 * Logs all agent payout decisions to Hedera Consensus Service (HCS) for immutable audit trail.
 * Creates verifiable record of every reward distribution decision.
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Immutable payout record stored on HCS
 */
export interface PayoutRecord {
  // Record metadata
  recordId: string;
  timestamp: Date;
  weekNumber: number;

  // Participants
  agentId: string;
  familyId: string;

  // Score data
  previousScore: number;
  currentScore: number;
  scoreDelta: number;

  // Payout calculation
  baseRate: number;
  performanceMultiplier: number;
  recencyWeight: number;
  calculatedPayout: number;
  finalPayout: number;

  // Validation
  anomalyFlags: string[];
  coolingPeriodActive: boolean;
  familyValidated: boolean | null;

  // Transaction
  txHash: string;
  hcsSequenceNumber?: number;
  status: "pending" | "confirmed" | "failed";

  // Additional context
  notes: string[];
}

/**
 * HCS message format for payout records
 */
export interface HcsPayoutMessage {
  type: "AGENT_PAYOUT";
  version: "1.0";
  agentId: string;
  familyId: string;
  weekNumber: number;
  scoreDelta: number;
  finalPayout: number;
  txHash: string;
  timestamp: string;
  anomalyFlags?: string[];
  familyValidated?: boolean;
}

/**
 * Minimal DB adapter interface for payout persistence.
 * Matches the `(db as any).query(sql, params)` pattern used elsewhere.
 */
export interface PayoutDbAdapter {
  query(sql: string, params: any[]): Promise<any[]>;
}

/**
 * HederaPayoutLogger - Audit trail via HCS + optional SQLite persistence
 */
export class HederaPayoutLogger {
  private hcsTopicId: string;
  private recordStorage: Map<string, PayoutRecord>;
  private db: PayoutDbAdapter | null;

  constructor(hcsTopicId: string, db?: PayoutDbAdapter) {
    this.hcsTopicId = hcsTopicId;
    this.recordStorage = new Map();
    this.db = db || null;
  }

  /**
   * Attach a DB adapter after construction (e.g. when primaryDb becomes available)
   */
  setDbAdapter(db: PayoutDbAdapter): void {
    this.db = db;
  }

  /**
   * Log a payout record to Hedera Consensus Service
   * 
   * In production, this would submit to actual HCS topic.
   * For now, stores in memory and simulates HCS submission.
   */
  async logPayoutRecord(record: PayoutRecord): Promise<string> {
    try {
      // Format as HCS message
      const hcsMessage: HcsPayoutMessage = {
        type: "AGENT_PAYOUT",
        version: "1.0",
        agentId: record.agentId,
        familyId: record.familyId,
        weekNumber: record.weekNumber,
        scoreDelta: record.scoreDelta,
        finalPayout: record.finalPayout,
        txHash: record.txHash,
        timestamp: record.timestamp.toISOString(),
        anomalyFlags: record.anomalyFlags.length > 0 ? record.anomalyFlags : undefined,
        familyValidated: record.familyValidated !== null ? record.familyValidated : undefined,
      };

      // In production, submit to HCS:
      // const submitResponse = await client.topicMessageSubmit(
      //   TopicMessageSubmitTransaction.new()
      //     .setTopicId(this.hcsTopicId)
      //     .setMessage(JSON.stringify(hcsMessage))
      // );
      // record.hcsSequenceNumber = submitResponse.sequenceNumber;
      // record.status = "confirmed";

      // Simulate HCS submission with generated sequence number
      const sequenceNumber = this.recordStorage.size + 1;
      record.hcsSequenceNumber = sequenceNumber;
      record.status = "confirmed";

      // Store record in memory cache
      this.recordStorage.set(record.recordId, record);

      // Persist to SQLite if adapter is available
      await this.persistRecordToDb(record);

      return `HCS:${this.hcsTopicId}:${sequenceNumber}`;
    } catch (error) {
      console.error("Failed to log payout record to HCS:", error);
      record.status = "failed";
      return "";
    }
  }

  /**
   * Get payout audit trail for an agent
   */
  async getPayoutAuditTrail(
    agentId: string,
    limit: number = 52
  ): Promise<PayoutRecord[]> {
    // Try DB first
    const dbRecords = await this.queryRecordsFromDb(
      "SELECT * FROM agent_payout_tracking WHERE agent_id = ? ORDER BY week_number DESC LIMIT ?",
      [agentId, limit],
    );
    if (dbRecords.length > 0) return dbRecords;

    // Fallback to in-memory
    return Array.from(this.recordStorage.values())
      .filter(r => r.agentId === agentId)
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, limit);
  }

  /**
   * Get payout audit trail for a family
   */
  async getFamilyPayoutAuditTrail(
    familyId: string,
    limit: number = 52
  ): Promise<PayoutRecord[]> {
    // Try DB first
    const dbRecords = await this.queryRecordsFromDb(
      "SELECT * FROM agent_payout_tracking WHERE family_id = ? ORDER BY week_number DESC LIMIT ?",
      [familyId, limit],
    );
    if (dbRecords.length > 0) return dbRecords;

    // Fallback to in-memory
    return Array.from(this.recordStorage.values())
      .filter(r => r.familyId === familyId)
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, limit);
  }

  /**
   * Get single payout record
   */
  async getPayoutRecord(recordId: string): Promise<PayoutRecord | null> {
    return this.recordStorage.get(recordId) || null;
  }

  /**
   * Get all payout records for a specific week
   */
  async getWeeklyPayoutRecords(weekNumber: number): Promise<PayoutRecord[]> {
    return Array.from(this.recordStorage.values())
      .filter(r => r.weekNumber === weekNumber)
      .sort((a, b) => b.finalPayout - a.finalPayout); // Sorted by payout amount
  }

  /**
   * Get total payouts for agent in time period
   */
  async getAgentPayoutStats(
    agentId: string,
    startWeek: number,
    endWeek: number
  ): Promise<{
    totalPayouts: number;
    averagePayout: number;
    maxPayout: number;
    minPayout: number;
    recordCount: number;
    confirmedCount: number;
    pendingCount: number;
    failedCount: number;
  }> {
    const records = Array.from(this.recordStorage.values()).filter(
      r =>
        r.agentId === agentId &&
        r.weekNumber >= startWeek &&
        r.weekNumber <= endWeek
    );

    if (records.length === 0) {
      return {
        totalPayouts: 0,
        averagePayout: 0,
        maxPayout: 0,
        minPayout: 0,
        recordCount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
      };
    }

    const payouts = records.map(r => r.finalPayout);
    const totalPayouts = payouts.reduce((sum, p) => sum + p, 0);

    return {
      totalPayouts,
      averagePayout: totalPayouts / records.length,
      maxPayout: Math.max(...payouts),
      minPayout: Math.min(...payouts),
      recordCount: records.length,
      confirmedCount: records.filter(r => r.status === "confirmed").length,
      pendingCount: records.filter(r => r.status === "pending").length,
      failedCount: records.filter(r => r.status === "failed").length,
    };
  }

  /**
   * Get total payouts for family in time period
   */
  async getFamilyPayoutStats(
    familyId: string,
    startWeek: number,
    endWeek: number
  ): Promise<{
    totalPayouts: number;
    averagePayout: number;
    maxPayout: number;
    minPayout: number;
    recordCount: number;
    agentCount: number;
    confirmedCount: number;
  }> {
    const records = Array.from(this.recordStorage.values()).filter(
      r =>
        r.familyId === familyId &&
        r.weekNumber >= startWeek &&
        r.weekNumber <= endWeek
    );

    if (records.length === 0) {
      return {
        totalPayouts: 0,
        averagePayout: 0,
        maxPayout: 0,
        minPayout: 0,
        recordCount: 0,
        agentCount: 0,
        confirmedCount: 0,
      };
    }

    const payouts = records.map(r => r.finalPayout);
    const agents = new Set(records.map(r => r.agentId));
    const totalPayouts = payouts.reduce((sum, p) => sum + p, 0);

    return {
      totalPayouts,
      averagePayout: totalPayouts / records.length,
      maxPayout: Math.max(...payouts),
      minPayout: Math.min(...payouts),
      recordCount: records.length,
      agentCount: agents.size,
      confirmedCount: records.filter(r => r.status === "confirmed").length,
    };
  }

  /**
   * Get disputes and anomalies
   */
  async getAnomalousPayouts(startWeek?: number, endWeek?: number): Promise<PayoutRecord[]> {
    return Array.from(this.recordStorage.values()).filter(r => {
      const withinRange = !startWeek || !endWeek || (r.weekNumber >= startWeek && r.weekNumber <= endWeek);
      const hasAnomalies = r.anomalyFlags.length > 0;
      const isDisputed = r.familyValidated === false;
      return withinRange && (hasAnomalies || isDisputed);
    });
  }

  /**
   * Update family validation status
   */
  async updateFamilyValidation(
    recordId: string,
    validated: boolean,
    notes: string
  ): Promise<boolean> {
    const record = this.recordStorage.get(recordId);
    if (!record) return false;

    record.familyValidated = validated;
    record.notes.push(`Family validation: ${validated ? "confirmed" : "disputed"} - ${notes}`);

    return true;
  }

  /**
   * Create payout record from calculation
   */
  createPayoutRecord(
    agentId: string,
    familyId: string,
    weekNumber: number,
    previousScore: number,
    currentScore: number,
    calculation: {
      baseRate: number;
      performanceMultiplier: number;
      recencyWeight: number;
      calculatedPayout: number;
    },
    validation: {
      finalPayout: number;
      anomalyFlags: string[];
      requiresFamilyValidation: boolean;
    }
  ): PayoutRecord {
    return {
      recordId: uuidv4(),
      timestamp: new Date(),
      weekNumber,
      agentId,
      familyId,
      previousScore,
      currentScore,
      scoreDelta: currentScore - previousScore,
      baseRate: calculation.baseRate,
      performanceMultiplier: calculation.performanceMultiplier,
      recencyWeight: calculation.recencyWeight,
      calculatedPayout: calculation.calculatedPayout,
      finalPayout: validation.finalPayout,
      anomalyFlags: validation.anomalyFlags,
      coolingPeriodActive: false,
      familyValidated: validation.requiresFamilyValidation ? null : undefined,
      txHash: "",
      status: "pending",
      notes: [],
    };
  }

  /**
   * Get HCS topic ID
   */
  getHcsTopicId(): string {
    return this.hcsTopicId;
  }

  /**
   * Get total records stored
   */
  getTotalRecords(): number {
    return this.recordStorage.size;
  }

  /**
   * Export audit trail as JSON
   */
  async exportAuditTrail(): Promise<PayoutRecord[]> {
    return Array.from(this.recordStorage.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Clear storage (for testing)
   */
  clearStorage(): void {
    this.recordStorage.clear();
  }

  // ===========================================================================
  // SQLite persistence helpers
  // ===========================================================================

  /**
   * Persist a payout record to the agent_payout_tracking table.
   */
  private async persistRecordToDb(record: PayoutRecord): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.query(
        `INSERT OR REPLACE INTO agent_payout_tracking
           (id, agent_id, family_id, week_number,
            previous_bond_score, new_bond_score, score_delta,
            base_payout, performance_multiplier, recency_weight, final_payout,
            hcs_record_id, tx_hash, status,
            anomalies_detected, anomaly_flags, cooling_period_active, family_validated,
            notes, created_at, executed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.recordId,
          record.agentId,
          record.familyId,
          record.weekNumber,
          record.previousScore,
          record.currentScore,
          record.scoreDelta,
          record.baseRate,
          record.performanceMultiplier,
          record.recencyWeight,
          record.finalPayout,
          record.hcsSequenceNumber ? `HCS:${this.hcsTopicId}:${record.hcsSequenceNumber}` : null,
          record.txHash || null,
          record.status,
          record.anomalyFlags.length > 0 ? 1 : 0,
          JSON.stringify(record.anomalyFlags),
          record.coolingPeriodActive ? 1 : 0,
          record.familyValidated ?? null,
          JSON.stringify(record.notes),
          record.timestamp.toISOString(),
          record.status === "confirmed" ? new Date().toISOString() : null,
        ],
      );
    } catch (err) {
      console.error("Failed to persist payout record to SQLite:", err);
    }
  }

  /**
   * Query payout records from SQLite and convert rows to PayoutRecord[]
   */
  private async queryRecordsFromDb(sql: string, params: any[]): Promise<PayoutRecord[]> {
    if (!this.db) return [];
    try {
      const rows: any[] = await this.db.query(sql, params);
      if (!rows || rows.length === 0) return [];

      return rows.map((row: any) => ({
        recordId: row.id,
        timestamp: new Date(row.created_at),
        weekNumber: row.week_number,
        agentId: row.agent_id,
        familyId: row.family_id,
        previousScore: row.previous_bond_score || 0,
        currentScore: row.new_bond_score || 0,
        scoreDelta: row.score_delta || 0,
        baseRate: row.base_payout || 0,
        performanceMultiplier: row.performance_multiplier || 1,
        recencyWeight: row.recency_weight || 1,
        calculatedPayout: row.final_payout || 0,
        finalPayout: row.final_payout || 0,
        anomalyFlags: row.anomaly_flags ? JSON.parse(row.anomaly_flags) : [],
        coolingPeriodActive: !!row.cooling_period_active,
        familyValidated: row.family_validated ?? null,
        txHash: row.tx_hash || "",
        hcsSequenceNumber: undefined,
        status: row.status || "pending",
        notes: row.notes ? JSON.parse(row.notes) : [],
      }));
    } catch (err) {
      // Table may not exist yet — fall back silently
      return [];
    }
  }

  /**
   * Load existing records from SQLite into memory cache on startup.
   */
  async loadFromDb(): Promise<number> {
    if (!this.db) return 0;
    try {
      const records = await this.queryRecordsFromDb(
        "SELECT * FROM agent_payout_tracking ORDER BY created_at DESC LIMIT 500",
        [],
      );
      for (const record of records) {
        this.recordStorage.set(record.recordId, record);
      }
      return records.length;
    } catch {
      return 0;
    }
  }
}

/**
 * Helper to generate HCS topic ID
 */
export function generateHcsTopicId(): string {
  // Format: 0.0.{shard}.{realm}.{num}
  // For testnet: typically 0.0.0.0.xxxxxxxx
  return `0.0.0.0.${Math.floor(Math.random() * 1000000000)}`;
}

/**
 * Helper to format payout record for display
 */
export function formatPayoutRecord(record: PayoutRecord): string {
  return (
    `Agent ${record.agentId} → Family ${record.familyId}\n` +
    `Week ${record.weekNumber}: ${record.previousScore} → ${record.currentScore} (+${record.scoreDelta.toFixed(2)})\n` +
    `Payout: ${record.finalPayout.toFixed(2)} FAM\n` +
    `Status: ${record.status} ${record.hcsSequenceNumber ? `[HCS #${record.hcsSequenceNumber}]` : ""}`
  );
}
