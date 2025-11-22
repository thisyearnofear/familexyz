/**
 * BondScoreDashboard
 * Orchestrates bond score visualization with modular sub-components
 */

import React from 'react';
import { useBondScore } from './hooks/useBondScore';
import { ScoreCard, TrendChart, SignalBreakdown, TrendDetails } from './components';
import styles from './BondScoreDashboard.module.css';

interface BondScoreDashboardProps {
  familyId: string;
  familyName?: string;
}

export const BondScoreDashboard: React.FC<BondScoreDashboardProps> = React.memo(
  ({ familyId, familyName = 'Family' }) => {
    const { data: bondScore, loading, error } = useBondScore(familyId);

    // Loading state
    if (loading) {
      return (
        <div className={`${styles.container} ${styles.loading}`}>
          <div className={styles.spinner}></div>
          <p>Loading family bond metrics...</p>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className={`${styles.container} ${styles.error}`}>
          <h3>Unable to Load Bond Score</h3>
          <p>{error}</p>
        </div>
      );
    }

    // No data state
    if (!bondScore) {
      return (
        <div className={`${styles.container} ${styles.empty}`}>
          <h3>No Bond Score Data Available</h3>
          <p>Bond score will be calculated after family interactions are recorded.</p>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>{familyName} - Family Bond Score</h2>
        </div>

        {/* Main Score Card */}
        <ScoreCard
          score={bondScore.current.bondScore}
          trend={bondScore.current.trend}
          delta={bondScore.current.delta}
          timestamp={bondScore.current.timestamp}
        />

        {/* Signal Breakdown */}
        <SignalBreakdown signals={bondScore.signals} />

        {/* Trend Chart */}
        {bondScore.history && bondScore.history.length > 1 && (
          <TrendChart history={bondScore.history} />
        )}

        {/* Trend Details */}
        <TrendDetails
          current={bondScore.current}
          history={bondScore.history}
          familyId={bondScore.familyId}
        />

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            Bond Score is calculated weekly based on family interactions and engagement metrics.
          </p>
        </div>
      </div>
    );
  }
);

BondScoreDashboard.displayName = 'BondScoreDashboard';

export default BondScoreDashboard;
