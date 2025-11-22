/**
 * SignalBreakdown Component
 * Displays the 7 contributing signals with interactive cards
 */

import React, { useState, useCallback } from 'react';
import { SIGNAL_DEFINITIONS, SIGNAL_ORDER } from '../constants';
import { SignalCard } from './SignalCard';
import type { BondScoreResponse } from '@/types/bondScoring';
import styles from './SignalBreakdown.module.css';

interface SignalBreakdownProps {
  signals: BondScoreResponse['signals'];
}

export const SignalBreakdown: React.FC<SignalBreakdownProps> = React.memo(({ signals }) => {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  const handleSignalClick = useCallback((signalKey: string) => {
    setSelectedSignal((prev) => (prev === signalKey ? null : signalKey));
  }, []);

  return (
    <div className={styles.signalsSection}>
      <h3>Contributing Signals</h3>
      <div className={styles.signalsGrid}>
        {SIGNAL_ORDER.map((signalKey) => {
          const definition = SIGNAL_DEFINITIONS[signalKey as keyof typeof SIGNAL_DEFINITIONS];
          const value = signals[signalKey as keyof typeof signals];

          return (
            <SignalCard
              key={signalKey}
              signalKey={signalKey}
              label={definition.label}
              description={definition.description}
              value={value}
              isSelected={selectedSignal === signalKey}
              onSelect={handleSignalClick}
            />
          );
        })}
      </div>
    </div>
  );
});

SignalBreakdown.displayName = 'SignalBreakdown';
