import React, { useState } from 'react';
import { usePayoutCalculator } from '../hooks/usePayoutData';
import '../payout-components.css';

interface PayoutCalculatorProps {
  agentId: string;
  familyId: string;
  className?: string;
}

export const PayoutCalculator: React.FC<PayoutCalculatorProps> = React.memo(
  ({ agentId, familyId, className = '' }) => {
    const [previousScore, setPreviousScore] = useState<number>(70);
    const [currentScore, setCurrentScore] = useState<number>(75);
    const { result, loading, error, calculate } = usePayoutCalculator();

    const handleCalculate = async () => {
      await calculate(agentId, familyId, previousScore, currentScore);
    };

    const scoreDelta = currentScore - previousScore;
    const hasAnomalies = result?.anomaliesDetected;

    return (
      <div className={`payout-calculator-container ${className}`}>
        <h3>Payout Calculator (Dry-Run)</h3>

        {/* Input Section */}
        <div className="calculator-inputs">
          <div className="input-group">
            <label>Previous Bond Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={previousScore}
              onChange={(e) => setPreviousScore(Number(e.target.value))}
              disabled={loading}
            />
            <small>Current known score</small>
          </div>

          <div className="input-group">
            <label>Current Bond Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={currentScore}
              onChange={(e) => setCurrentScore(Number(e.target.value))}
              disabled={loading}
            />
            <small>Latest bond score</small>
          </div>

          <div className="input-group delta">
            <label>Score Delta</label>
            <div className="delta-value">
              <span className={`delta-number ${scoreDelta > 0 ? 'positive' : scoreDelta < 0 ? 'negative' : ''}`}>
                {scoreDelta > 0 ? '+' : ''}{scoreDelta}
              </span>
            </div>
          </div>

          <button
            className="calculate-button"
            onClick={handleCalculate}
            disabled={loading || previousScore === currentScore}
          >
            {loading ? 'Calculating...' : 'Calculate Payout'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="result-error">
            <p>{error.message}</p>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="calculator-result">
            <div className="result-header">
              <h4>Payout Calculation Result</h4>
              <span className={`execution-badge ${result.wouldExecute ? 'would-execute' : 'blocked'}`}>
                {result.wouldExecute ? '✓ Would Execute' : '✗ Would Be Blocked'}
              </span>
            </div>

            {/* Calculation Breakdown */}
            <div className="calculation-breakdown">
              <div className="calc-row">
                <span className="label">Base Amount</span>
                <span className="value">{result.calculation.baseAmount.toFixed(2)} FAM</span>
              </div>
              <div className="calc-row">
                <span className="label">Performance Multiplier</span>
                <span className="value">{result.calculation.performanceMultiplier.toFixed(2)}x</span>
              </div>
              <div className="calc-row">
                <span className="label">Recency Weight</span>
                <span className="value">{result.calculation.recencyWeight.toFixed(2)}x</span>
              </div>
              <div className="calc-row total">
                <span className="label">Final Payout Amount</span>
                <span className="value">{result.calculation.finalAmount.toFixed(2)} FAM</span>
              </div>
            </div>

            {/* Anomaly Section */}
            <div className={`anomaly-section ${hasAnomalies ? 'has-anomalies' : ''}`}>
              <div className="anomaly-header">
                <span className="icon">{hasAnomalies ? '⚠️' : '✓'}</span>
                <span className="label">
                  {hasAnomalies ? 'Anomalies Detected' : 'No Anomalies'}
                </span>
              </div>
              {hasAnomalies && (
                <div className="anomaly-list">
                  {/* Placeholder for actual anomalies */}
                  <p>System flagged potential issues with this payout</p>
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className={`recommendation ${result.recommendation}`}>
              <div className="rec-label">Recommendation</div>
              <div className="rec-value">
                {result.recommendation === 'none' && 'Proceed with payout'}
                {result.recommendation === 'review' && 'Manual review recommended'}
                {result.recommendation === 'cooling_period' && 'Agent in cooling period - blocked'}
                {result.recommendation === 'investigation' && 'Requires investigation - blocked'}
              </div>
            </div>

            {/* Execution Status */}
            {!result.wouldExecute && (
              <div className="execution-note">
                <p>This payout would not be executed due to the recommendation above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

PayoutCalculator.displayName = 'PayoutCalculator';
