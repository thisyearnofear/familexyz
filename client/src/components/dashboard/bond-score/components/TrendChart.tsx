/**
 * TrendChart Component
 * Displays historical bond score trend as a line chart
 */

import React, { useMemo } from 'react';
import { generateChartPoints } from '../utils';
import type { BondScoreHistoryEntry } from '@/types/bondScoring';
import styles from './TrendChart.module.css';

interface TrendChartProps {
  history: BondScoreHistoryEntry[];
  title?: string;
}

export const TrendChart: React.FC<TrendChartProps> = React.memo(({ history, title }) => {
  const chartPoints = useMemo(() => generateChartPoints(history), [history]);
  const weekCount = history.length;

  if (!history || history.length < 2) {
    return null;
  }

  return (
    <div className={styles.trendSection}>
      <h3>{title || `Score Trend (Last ${weekCount} Weeks)`}</h3>
      <div className={styles.trendChart}>
        <div className={styles.chartContainer}>
          <div className={styles.yAxis}>
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          <div className={styles.chartArea}>
            <svg viewBox="0 0 600 200" className={styles.trendLine}>
              <polyline
                points={chartPoints}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className={styles.trendLabels}>
              {history.map((entry, idx) => (
                <div key={idx} className={styles.trendLabel}>
                  W{entry.week}
                </div>
              ))}
              <div className={`${styles.trendLabel} ${styles.current}`}>Now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';
