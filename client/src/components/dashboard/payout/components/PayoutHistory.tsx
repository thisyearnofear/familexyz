import React from 'react';
import { usePayoutData } from '../hooks/usePayoutData';
import '../payout-components.css';

interface PayoutHistoryProps {
  agentId: string;
  weeks?: number;
  className?: string;
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = React.memo(
  ({ agentId, weeks = 12, className = '' }) => {
    const { data, loading, error } = usePayoutData(agentId, weeks);

    if (loading) {
      return (
        <div className={`payout-history-container loading ${className}`}>
          <div className="spinner"></div>
          <p>Loading payout history...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`payout-history-container error ${className}`}>
          <div className="error-message">
            <p>Failed to load payout history</p>
            <small>{error.message}</small>
          </div>
        </div>
      );
    }

    if (!data || data.payouts.length === 0) {
      return (
        <div className={`payout-history-container empty ${className}`}>
          <p>No payout history available</p>
        </div>
      );
    }

    return (
      <div className={`payout-history-container ${className}`}>
        <div className="history-header">
          <h3>Payout History</h3>
          <div className="stats">
            <div className="stat">
              <label>Total Payouts</label>
              <value>{data.stats.totalPayouts}</value>
            </div>
            <div className="stat">
              <label>Total Amount</label>
              <value>{data.stats.totalAmount.toFixed(2)} FAM</value>
            </div>
            <div className="stat">
              <label>Average</label>
              <value>{data.stats.averageAmount.toFixed(2)} FAM</value>
            </div>
          </div>
        </div>

        <div className="payouts-timeline">
          {data.payouts.map((payout, idx) => (
            <div key={idx} className="payout-entry">
              <div className="entry-time">
                {new Date(payout.timestamp).toLocaleDateString()}
              </div>
              <div className="entry-details">
                <div className="amount-row">
                  <span className="label">Amount</span>
                  <span className="value">{payout.amount.toFixed(2)} FAM</span>
                </div>
                <div className="details-row">
                  <span className="detail">
                    Δ Score: {payout.scoreDelta > 0 ? '+' : ''}{payout.scoreDelta}
                  </span>
                  <span className="detail">
                    Multiplier: {payout.multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

PayoutHistory.displayName = 'PayoutHistory';
