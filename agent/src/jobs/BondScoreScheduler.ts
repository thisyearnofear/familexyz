/**
 * Weekly Bond Score Scheduler
 * 
 * Runs every Sunday at 00:00 UTC to calculate family bond scores
 * and aggregate signals for all families.
 */

import { elizaLogger } from "@elizaos/core";
import type { IDatabaseAdapter, IAgentRuntime } from "@elizaos/core";
import { BondScoreService } from "@familexyz/agent-services";
import { aggregateAllSignals } from "../integrations/bondScoring.js";
import type { SignalAggregationContext } from "../integrations/bondScoring.js";

interface FamilyRecord {
  id: string;
  room_id?: string;
  roomId?: string;
}

/**
 * Get the week number for a given date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get date range for a given week
 */
export function getWeekDateRange(weekNumber: number, year: number = new Date().getFullYear()) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const weekEnd = new Date(ISOweekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    start: ISOweekStart,
    end: weekEnd,
  };
}

/**
 * Calculate bond score for a single family
 */
export async function calculateFamilyBondScore(
  familyId: string,
  roomId: string,
  weekNumber: number,
  db: IDatabaseAdapter,
): Promise<any> {
  try {
    const dateRange = getWeekDateRange(weekNumber);

    const ctx: SignalAggregationContext = {
      familyId,
      roomId,
      weekNumber,
      startDate: dateRange.start,
      endDate: dateRange.end,
      db,
    };

    // Aggregate all signals
    const { signals, scores } = await aggregateAllSignals(ctx);

    // Get previous week's score for trend calculation
    const previousWeekQuery = `
      SELECT bond_score 
      FROM family_bond_scores 
      WHERE family_id = ? 
      ORDER BY week_number DESC 
      LIMIT 1
    `;

    let previousScore: number | undefined;
    try {
      if ('all' in db && typeof (db as any).all === 'function') {
        const result = await (db as any).all(previousWeekQuery, [familyId]);
        previousScore = result[0]?.bond_score;
      }
    } catch (err) {
      elizaLogger.debug("Could not fetch previous score:", err);
    }

    // Calculate composite bond score
    const bondScore = BondScoreService.calculateBondScore(scores, undefined, previousScore);

    // Store signals to database
    const signalData = {
      generational_data: JSON.stringify(signals.generational),
      reciprocity_data: JSON.stringify(signals.reciprocity),
      sentiment_data: JSON.stringify(signals.sentiment),
      challenge_data: JSON.stringify(signals.challenges),
      presence_data: JSON.stringify(signals.presence),
      topology_data: JSON.stringify(signals.topology),
      consensus_data: JSON.stringify(signals.consensus),
    };

    const signalId = `signal_${familyId}_${weekNumber}_${Date.now()}`;
    const insertSignalQuery = `
      INSERT INTO bond_score_signals (
        id, family_id, week_number,
        generational_data, reciprocity_data, sentiment_data,
        challenge_data, presence_data, topology_data, consensus_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      if ('run' in db && typeof (db as any).run === 'function') {
        await (db as any).run(insertSignalQuery, [
          signalId,
          familyId,
          weekNumber,
          signalData.generational_data,
          signalData.reciprocity_data,
          signalData.sentiment_data,
          signalData.challenge_data,
          signalData.presence_data,
          signalData.topology_data,
          signalData.consensus_data,
        ]);
      }
    } catch (err) {
      elizaLogger.warn(`Could not store signal data: ${err}`);
    }

    // Store bond score to database
    const scoreId = `score_${familyId}_${weekNumber}_${Date.now()}`;
    const insertScoreQuery = `
      INSERT INTO family_bond_scores (
        id, family_id, week_number,
        generational_interaction_score, response_reciprocity_score,
        sentiment_trajectory_score, challenge_completion_score,
        presence_consistency_score, network_topology_score,
        hedera_consensus_score, bond_score, trend, week_over_week_delta,
        calculated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      if ('run' in db && typeof (db as any).run === 'function') {
        await (db as any).run(insertScoreQuery, [
          scoreId,
          familyId,
          weekNumber,
          scores.generationalInteraction,
          scores.responseReciprocity,
          scores.sentimentTrajectory,
          scores.challengeCompletion,
          scores.presenceConsistency,
          scores.networkTopology,
          scores.hederaConsensus,
          bondScore.bondScore,
          bondScore.trend,
          bondScore.weekOverWeekDelta,
          "scheduler",
        ]);
      }
    } catch (err) {
      elizaLogger.error(`Could not store bond score: ${err}`);
      throw err;
    }

    return {
      familyId,
      weekNumber,
      bondScore: bondScore.bondScore,
      trend: bondScore.trend,
      delta: bondScore.weekOverWeekDelta,
      scores,
    };
  } catch (err) {
    elizaLogger.error(`Failed to calculate bond score for family ${familyId}:`, err);
    throw err;
  }
}

/**
 * Run weekly bond score calculation for all families
 */
export async function runWeeklyBondScoreCalculation(
  db: IDatabaseAdapter,
  runtime?: IAgentRuntime,
): Promise<void> {
  try {
    elizaLogger.info("Starting weekly bond score calculation...");

    const weekNumber = getWeekNumber(new Date());

    // Get all rooms (families)
    let rooms: any[] = [];
    try {
      if ('all' in db && typeof (db as any).all === 'function') {
        rooms = await (db as any).all(
          "SELECT DISTINCT r.id, r.id as room_id FROM rooms r",
          []
        );
      }
    } catch (err) {
      elizaLogger.warn("Could not fetch rooms:", err);
      return;
    }

    if (!rooms || rooms.length === 0) {
      elizaLogger.info("No rooms found, skipping bond score calculation");
      return;
    }

    elizaLogger.info(`Calculating bond scores for ${rooms.length} families...`);

    let successCount = 0;
    let failureCount = 0;

    for (const room of rooms) {
      try {
        const roomId = room.id || room.room_id;
        const result = await calculateFamilyBondScore(
          roomId,
          roomId,
          weekNumber,
          db,
        );

        elizaLogger.debug(`Bond score calculated for room ${roomId}:`, result);
        successCount++;

        // Optional: Log to Hedera HCS if service available
        if (runtime && (runtime as any).hederaService) {
          try {
            // This would require the family's topic ID - to be implemented in Phase 4b
            elizaLogger.debug(`Would log bond score to Hedera for room ${roomId}`);
          } catch (err) {
            elizaLogger.warn(`Could not log to Hedera: ${err}`);
          }
        }
      } catch (err) {
        elizaLogger.error(`Failed to calculate bond score for room ${room.id}:`, err);
        failureCount++;
      }
    }

    elizaLogger.success(
      `Weekly bond score calculation completed: ${successCount} success, ${failureCount} failures`
    );
  } catch (err) {
    elizaLogger.error("Fatal error in weekly bond score calculation:", err);
  }
}

/**
 * Initialize the weekly scheduler
 * 
 * Runs every Sunday at 00:00 UTC
 */
export function initializeWeeklyScheduler(
  db: IDatabaseAdapter,
  runtime?: IAgentRuntime,
): NodeJS.Timer | null {
  try {
    // Try to import cron, but don't fail if not available
    try {
      const cron = require("node-cron");

      // Schedule: Every Sunday at 00:00 UTC
      const job = cron.schedule("0 0 * * 0", async () => {
        elizaLogger.info("[BondScoreScheduler] Running scheduled bond score calculation...");
        await runWeeklyBondScoreCalculation(db, runtime);
      });

      elizaLogger.success("Bond score scheduler initialized (runs Sundays 00:00 UTC)");
      return job;
    } catch (err) {
      elizaLogger.warn("node-cron not available, bond score scheduler disabled:", err);
      
      // Fallback: provide a manual trigger function
      (global as any).triggerBondScoreCalculation = () => {
        elizaLogger.info("[BondScoreScheduler] Manual trigger - running bond score calculation...");
        return runWeeklyBondScoreCalculation(db, runtime);
      };

      elizaLogger.info("You can manually trigger bond score calculation via: triggerBondScoreCalculation()");
      return null;
    }
  } catch (err) {
    elizaLogger.error("Failed to initialize bond score scheduler:", err);
    return null;
  }
}
