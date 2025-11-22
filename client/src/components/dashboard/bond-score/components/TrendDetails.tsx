/**
 * TrendDetails Component
 * Displays additional trend statistics and metadata
 */

import React from 'react';
import { formatTrendDelta } from '../utils';
import type { BondScoreResponse } from '@/types/bondScoring';
import styles from './TrendDetails.module.css';

interface TrendDetailsProps {
  current: BondScoreResponse['current'];
  history: BondScoreResponse['history'];
  familyId: string;
}

export const TrendDetails: React.FC<TrendDetailsProps> = React.memo(
  ({ current, history, familyId }) => {
    const weekCount = history.length;
    const familyIdShort = familyId.substring(0, 8) + '...';
    const formattedDelta = formatTrendDelta(current.delta);

    return (
      <div className={styles.statsSection}>
        <h3>Current Trend</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Trend</div>
            <div className={styles.statValue}>{current.trend || '—'}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Week-over-Week Change</div>
            <div className={styles.statValue}>{formattedDelta}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Total Weeks Tracked</div>
            <div className={styles.statValue}>{weekCount}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Family ID</div>
            <div className={styles.statValue} style={{ fontSize: '0.875rem' }}>
              {familyIdShort}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TrendDetails.displayName = 'TrendDetails';
