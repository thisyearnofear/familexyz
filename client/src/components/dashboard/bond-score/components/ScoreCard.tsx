/**
 * ScoreCard Component
 * Displays the current family bond score with trend and metadata
 */

import React, { useMemo } from 'react';
import { getScoreTierLabel, getScoreColor, formatTrendDelta, formatTimestamp } from '../utils';
import { SCORE_DESCRIPTIONS } from '../constants';
import styles from './ScoreCard.module.css';

interface ScoreCardProps {
  score: number;
  trend: string;
  delta: number;
  timestamp: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = React.memo(
  ({ score, trend, delta, timestamp }) => {
    const tier = useMemo(() => getScoreTierLabel(score), [score]);
    const color = useMemo(() => getScoreColor(score), [score]);
    const description = useMemo(() => SCORE_DESCRIPTIONS[tier], [tier]);
    const formattedDelta = useMemo(() => formatTrendDelta(delta), [delta]);
    const formattedTime = useMemo(() => formatTimestamp(timestamp), [timestamp]);

    return (
      <div className={`${styles.scoreCard} ${styles[tier]}`}>
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreNumber}>{Math.round(score)}</div>
          <div className={styles.scoreLabel}>Family Bond Strength</div>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreFill}
              style={{ width: `${Math.min(100, score)}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.scoreDetails}>
          <div className={styles.trendInfo}>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Trend</span>
              <span className={styles.trendValue}>{trend}</span>
            </div>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Week-over-Week</span>
              <span className={styles.trendValue}>{formattedDelta}</span>
            </div>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Last Updated</span>
              <span className={styles.trendValue}>{formattedTime}</span>
            </div>
          </div>

          <div className={styles.description}>
            <p>{description}</p>
          </div>
        </div>
      </div>
    );
  }
);

ScoreCard.displayName = 'ScoreCard';
