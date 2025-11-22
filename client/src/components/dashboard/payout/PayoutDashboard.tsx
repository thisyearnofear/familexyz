/**
 * PayoutDashboard
 * Orchestrates payout visualization with modular sub-components
 */

import React, { useState } from 'react';
import { PayoutHistory } from './components/PayoutHistory';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { PayoutCalculator } from './components/PayoutCalculator';
import { AnomalyReview } from './components/AnomalyReview';
import styles from './PayoutDashboard.module.css';

interface PayoutDashboardProps {
  agentId: string;
  familyId: string;
  agentName?: string;
}

type TabName = 'history' | 'performance' | 'calculator' | 'admin';

export const PayoutDashboard: React.FC<PayoutDashboardProps> = React.memo(
  ({ agentId, familyId, agentName = 'Agent' }) => {
    const [activeTab, setActiveTab] = useState<TabName>('history');

    const tabs: { id: TabName; label: string; icon: string }[] = [
      { id: 'history', label: 'Payout History', icon: '📊' },
      { id: 'performance', label: 'Performance', icon: '⚡' },
      { id: 'calculator', label: 'Calculator', icon: '🧮' },
      { id: 'admin', label: 'Admin Review', icon: '⚙️' },
    ];

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{agentName} Rewards & Payouts</h2>
          <p className={styles.subtitle}>Agent: {agentId}</p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={styles.label}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'history' && (
            <PayoutHistory agentId={agentId} weeks={12} className={styles.contentPanel} />
          )}

          {activeTab === 'performance' && (
            <PerformanceMetrics agentId={agentId} className={styles.contentPanel} />
          )}

          {activeTab === 'calculator' && (
            <PayoutCalculator
              agentId={agentId}
              familyId={familyId}
              className={styles.contentPanel}
            />
          )}

          {activeTab === 'admin' && (
            <AnomalyReview className={styles.contentPanel} />
          )}
        </div>
      </div>
    );
  },
);

PayoutDashboard.displayName = 'PayoutDashboard';
