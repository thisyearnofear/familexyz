import React from 'react';
import { useAgentPerformance } from '../hooks/usePayoutData';
import '../payout-components.css';

interface PerformanceMetricsProps {
  agentId: string;
  className?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = React.memo(
  ({ agentId, className = '' }) => {
    const { data, loading, error } = useAgentPerformance(agentId);

    if (loading) {
      return (
        <div className={`performance-metrics-container loading ${className}`}>
          <div className="spinner"></div>
          <p>Loading performance metrics...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`performance-metrics-container error ${className}`}>
          <div className="error-message">
            <p>Failed to load performance metrics</p>
            <small>{error.message}</small>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className={`performance-metrics-container empty ${className}`}>
          <p>No performance data available</p>
        </div>
      );
    }

    const scoreColor = getScoreColor(data.performanceScore);
    const scoreLabel = getScoreLabel(data.performanceScore);

    return (
      <div className={`performance-metrics-container ${className}`}>
        <h3>Agent Performance</h3>

        {/* Main Score Card */}
        <div className="score-card">
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${scoreColor} 0deg ${(data.performanceScore / 100) * 360}deg, #e5e7eb ${(data.performanceScore / 100) * 360}deg)`,
              }}
            >
              <div className="score-inner">
                <div className="score-number">{data.performanceScore.toFixed(0)}</div>
                <div className="score-label">{scoreLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          {/* Consecutive Improvements */}
          <div className="metric-card">
            <div className="metric-header">
              <label>Consecutive Improvements</label>
            </div>
            <div className="metric-value">
              <span className="value">{data.consecutiveImprovements}</span>
              <span className="unit">weeks</span>
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${Math.min((data.consecutiveImprovements / 10) * 100, 100)}%`,
                  backgroundColor: '#8b5cf6',
                }}
              ></div>
            </div>
          </div>

          {/* Average Payout */}
          <div className="metric-card">
            <div className="metric-header">
              <label>Avg Payout/Week</label>
            </div>
            <div className="metric-value">
              <span className="value">{data.averagePayoutPerWeek.toFixed(2)}</span>
              <span className="unit">FAM</span>
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${Math.min((data.averagePayoutPerWeek / 100) * 100, 100)}%`,
                  backgroundColor: '#06b6d4',
                }}
              ></div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="metric-card">
            <div className="metric-header">
              <label>Total Earned</label>
            </div>
            <div className="metric-value">
              <span className="value">{data.totalEarned.toFixed(2)}</span>
              <span className="unit">FAM</span>
            </div>
          </div>

          {/* Cooling Period */}
          <div className={`metric-card cooling-period ${data.coolingPeriodActive ? 'active' : ''}`}>
            <div className="metric-header">
              <label>Cooling Period</label>
              <span
                className={`badge ${data.coolingPeriodActive ? 'active' : 'inactive'}`}
              >
                {data.coolingPeriodActive ? 'ACTIVE' : 'None'}
              </span>
            </div>
            {data.coolingPeriodActive && (
              <div className="metric-value">
                <span className="value">{data.coolingPeriodWeeksRemaining}</span>
                <span className="unit">weeks remaining</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {data.coolingPeriodActive && (
          <div className="status-alert cooling">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <p className="alert-title">Cooling Period Active</p>
              <p className="alert-message">
                Agent is in cooling period for {data.coolingPeriodWeeksRemaining} more weeks.
                No payouts will be processed during this time.
              </p>
            </div>
          </div>
        )}

        {data.performanceScore >= 80 && (
          <div className="status-alert success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">
              <p className="alert-title">High Performance</p>
              <p className="alert-message">
                Excellent performance score. Agent is eligible for maximum payouts.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

PerformanceMetrics.displayName = 'PerformanceMetrics';
