import React, { useState } from 'react';
import { usePendingPayouts } from '../hooks/usePayoutData';
import '../payout-components.css';

interface AnomalyReviewProps {
  className?: string;
}

export const AnomalyReview: React.FC<AnomalyReviewProps> = React.memo(
  ({ className = '' }) => {
    const { data, loading, error } = usePendingPayouts();
    const [selectedPayout, setSelectedPayout] = useState<any>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [filingDispute, setFilingDispute] = useState(false);

    const handleFileDispute = async () => {
      if (!selectedPayout || !disputeReason.trim()) return;

      setFilingDispute(true);
      try {
        const response = await fetch('/api/payouts/dispute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payoutRecordId: selectedPayout.recordId,
            reason: disputeReason,
            evidence: '',
          }),
        });

        if (response.ok) {
          alert('Dispute filed successfully');
          setSelectedPayout(null);
          setDisputeReason('');
        }
      } catch (err) {
        alert('Failed to file dispute');
      } finally {
        setFilingDispute(false);
      }
    };

    if (loading) {
      return (
        <div className={`anomaly-review-container loading ${className}`}>
          <div className="spinner"></div>
          <p>Loading anomaly data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`anomaly-review-container error ${className}`}>
          <div className="error-message">
            <p>Failed to load anomalies</p>
            <small>{error.message}</small>
          </div>
        </div>
      );
    }

    return (
      <div className={`anomaly-review-container ${className}`}>
        <div className="review-header">
          <h3>Payout Review & Disputes</h3>
          <div className="header-stats">
            <div className="stat">
              <label>Pending Payouts</label>
              <value>{data?.pendingCount || 0}</value>
            </div>
            <div className="stat">
              <label>Total Amount</label>
              <value>{(data?.totalAmount || 0).toFixed(2)} FAM</value>
            </div>
          </div>
        </div>

        {/* Pending Payouts List */}
        <div className="pending-payouts-section">
          <h4>Pending Payouts</h4>
          {!data?.payouts || data.payouts.length === 0 ? (
            <p className="empty-message">No pending payouts</p>
          ) : (
            <div className="payouts-list">
              {data.payouts.map((payout: any, idx: number) => (
                <div
                  key={idx}
                  className={`payout-item ${selectedPayout?.recordId === payout.recordId ? 'selected' : ''}`}
                  onClick={() => setSelectedPayout(payout)}
                >
                  <div className="payout-main">
                    <div className="payout-agent">
                      <strong>Agent:</strong> {payout.agentId}
                    </div>
                    <div className="payout-family">
                      <strong>Family:</strong> {payout.familyId}
                    </div>
                  </div>
                  <div className="payout-amount">
                    <span className="amount">{payout.amount.toFixed(2)} FAM</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Form */}
        {selectedPayout && (
          <div className="dispute-form">
            <h4>File Dispute</h4>
            <div className="form-section">
              <p className="form-subtitle">
                Agent: <strong>{selectedPayout.agentId}</strong> • Amount:{' '}
                <strong>{selectedPayout.amount.toFixed(2)} FAM</strong>
              </p>

              <div className="form-group">
                <label htmlFor="dispute-reason">Reason for Dispute</label>
                <textarea
                  id="dispute-reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you believe this payout should be disputed..."
                  disabled={filingDispute}
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setSelectedPayout(null);
                    setDisputeReason('');
                  }}
                  disabled={filingDispute}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleFileDispute}
                  disabled={!disputeReason.trim() || filingDispute}
                >
                  {filingDispute ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="admin-notes">
          <h4>Admin Tools</h4>
          <div className="notes-content">
            <p>• Review pending payouts before execution</p>
            <p>• File disputes for suspicious payouts</p>
            <p>• Check anomaly flags and cooling periods</p>
            <p>• Approve or reject payouts based on family validation</p>
          </div>
        </div>
      </div>
    );
  },
);

AnomalyReview.displayName = 'AnomalyReview';
