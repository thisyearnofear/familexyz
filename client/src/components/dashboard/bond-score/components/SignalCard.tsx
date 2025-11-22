/**
 * SignalCard Component
 * Individual signal card with expandable details
 */

import React, { useCallback } from 'react';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  signalKey: string;
  label: string;
  description: string;
  value: number;
  isSelected: boolean;
  onSelect: (signalKey: string) => void;
}

export const SignalCard: React.FC<SignalCardProps> = React.memo(
  ({ signalKey, label, description, value, isSelected, onSelect }) => {
    const handleClick = useCallback(() => {
      onSelect(signalKey);
    }, [signalKey, onSelect]);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(signalKey);
        }
      },
      [signalKey, onSelect]
    );

    return (
      <div
        className={`${styles.signalCard} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
        onKeyPress={handleKeyPress}
        role="button"
        tabIndex={0}
      >
        <div className={styles.signalHeader}>
          <h4>{label}</h4>
          <div className={styles.signalValue}>{Math.round(value * 100)}%</div>
        </div>
        <div className={styles.signalBar}>
          <div className={styles.signalFill} style={{ width: `${value * 100}%` }}></div>
        </div>
        {isSelected && (
          <div className={styles.signalDetail}>
            <p>{description}</p>
          </div>
        )}
      </div>
    );
  }
);

SignalCard.displayName = 'SignalCard';
