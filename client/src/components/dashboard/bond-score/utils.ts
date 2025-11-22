/**
 * Bond Score Utilities
 * Reusable functions for chart generation, color mapping, and score calculation
 */

import { SCORE_TIERS, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING, MAX_SCORE } from './constants';

export function getScoreTier(score: number): typeof SCORE_TIERS[keyof typeof SCORE_TIERS] {
  if (score >= SCORE_TIERS.EXCELLENT.min) return SCORE_TIERS.EXCELLENT;
  if (score >= SCORE_TIERS.GOOD.min) return SCORE_TIERS.GOOD;
  if (score >= SCORE_TIERS.FAIR.min) return SCORE_TIERS.FAIR;
  return SCORE_TIERS.POOR;
}

export function getScoreColor(score: number): string {
  return getScoreTier(score).color;
}

export function getScoreTierLabel(score: number): string {
  return getScoreTier(score).label;
}

export interface HistoryPoint {
  bondScore: number;
}

export function generateChartPoints(history: HistoryPoint[]): string {
  if (!history || history.length === 0) return '';

  const xStep = (CHART_WIDTH - CHART_PADDING * 2) / (history.length - 1 || 1);
  const yScale = (CHART_HEIGHT - CHART_PADDING * 2) / MAX_SCORE;

  return history
    .map(
      (entry, idx) =>
        `${CHART_PADDING + idx * xStep},${CHART_HEIGHT - CHART_PADDING - entry.bondScore * yScale}`
    )
    .join(' ');
}

export function formatTrendDelta(delta: number): string {
  if (delta === 0) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta * 100) / 100}`;
}

export function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}
