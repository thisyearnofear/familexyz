/**
 * E2E Tests for Payout Dashboard
 *
 * These tests verify the complete user workflows for payout functionality.
 * Designed to run with Cypress, Playwright, or similar E2E testing framework.
 */

describe('Payout Dashboard E2E Tests', () => {
  const baseUrl = process.env.CYPRESS_BASE_URL || 'http://localhost:3000';
  const agentId = 'e2e-test-agent-001';
  const familyId = 'e2e-test-family-001';

  beforeEach(() => {
    cy.visit(`${baseUrl}/dashboard`);
  });

  describe('Dashboard Navigation', () => {
    it('should load dashboard with all tabs visible', () => {
      cy.get('[role="tab"]').should('have.length', 4);
      cy.contains('History').should('be.visible');
      cy.contains('Performance').should('be.visible');
      cy.contains('Calculator').should('be.visible');
      cy.contains('Admin').should('be.visible');
    });

    it('should switch between tabs without errors', () => {
      // Click History tab
      cy.contains('[role="tab"]', 'History').click();
      cy.get('[data-testid="history-panel"]').should('be.visible');

      // Click Performance tab
      cy.contains('[role="tab"]', 'Performance').click();
      cy.get('[data-testid="performance-panel"]').should('be.visible');

      // Click Calculator tab
      cy.contains('[role="tab"]', 'Calculator').click();
      cy.get('[data-testid="calculator-panel"]').should('be.visible');

      // Click Admin tab
      cy.contains('[role="tab"]', 'Admin').click();
      cy.get('[data-testid="anomaly-panel"]').should('be.visible');
    });

    it('should maintain tab state when switching back', () => {
      cy.contains('[role="tab"]', 'History').click();
      cy.contains('[role="tab"]', 'Performance').click();
      cy.contains('[role="tab"]', 'History').click();
      cy.get('[data-testid="history-panel"]').should('be.visible');
    });
  });

  describe('Payout History Tab', () => {
    it('should display payout history for agent', () => {
      cy.contains('[role="tab"]', 'History').click();

      // Wait for data to load
      cy.get('[data-testid="payout-item"]', { timeout: 5000 }).should('exist');

      // Verify structure
      cy.get('[data-testid="payout-item"]').first().within(() => {
        cy.get('[data-testid="payout-amount"]').should('exist');
        cy.get('[data-testid="payout-score-delta"]').should('exist');
      });
    });

    it('should show summary statistics', () => {
      cy.contains('[role="tab"]', 'History').click();

      cy.get('[data-testid="total-payouts"]').should('be.visible');
      cy.get('[data-testid="total-amount"]').should('be.visible');
      cy.get('[data-testid="average-amount"]').should('be.visible');
    });

    it('should display loading state initially', () => {
      cy.contains('[role="tab"]', 'History').click();
      cy.get('[data-testid="loading-spinner"]').should('exist');
    });

    it('should handle empty history gracefully', () => {
      // This would require a test agent with no history
      cy.contains('[role="tab"]', 'History').click();

      // Check for either items or empty state message
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="payout-item"]').length > 0) {
          cy.get('[data-testid="payout-item"]').should('exist');
        } else {
          cy.get('[data-testid="empty-state"]').should('be.visible');
        }
      });
    });
  });

  describe('Performance Metrics Tab', () => {
    it('should display performance score gauge', () => {
      cy.contains('[role="tab"]', 'Performance').click();

      cy.get('[data-testid="performance-gauge"]').should('be.visible');
      cy.get('[data-testid="performance-score"]').should('contain.text', /\d+/);
    });

    it('should show performance level indicator', () => {
      cy.contains('[role="tab"]', 'Performance').click();

      cy.get('[data-testid="performance-level"]').should('be.visible');
      cy.get('[data-testid="performance-level"]').should(
        'contain.text',
        /Excellent|Good|Fair|Needs Improvement/
      );
    });

    it('should display all metrics', () => {
      cy.contains('[role="tab"]', 'Performance').click();

      cy.get('[data-testid="metric-card"]').should('have.length.at.least', 3);
      cy.contains('Consecutive Improvements').should('be.visible');
      cy.contains('Average Per Week').should('be.visible');
      cy.contains('Total Earned').should('be.visible');
    });

    it('should show cooling period alert when active', () => {
      // This test requires an agent in cooling period
      cy.contains('[role="tab"]', 'Performance').click();

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="cooling-alert"]').length > 0) {
          cy.get('[data-testid="cooling-alert"]').should('be.visible');
          cy.get('[data-testid="cooling-weeks-remaining"]').should('exist');
        }
      });
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.contains('[role="tab"]', 'Performance').click();

      cy.get('[data-testid="performance-gauge"]').should('be.visible');
      cy.get('[data-testid="metric-card"]').should('be.visible');
    });
  });

  describe('Payout Calculator Tab', () => {
    it('should render calculator inputs', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').should('be.visible');
      cy.get('[data-testid="current-score-input"]').should('be.visible');
      cy.get('[data-testid="calculate-button"]').should('be.visible');
    });

    it('should calculate payout with valid inputs', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      // Input scores
      cy.get('[data-testid="previous-score-input"]').clear().type('70');
      cy.get('[data-testid="current-score-input"]').clear().type('75');

      // Submit calculation
      cy.get('[data-testid="calculate-button"]').click();

      // Verify results display
      cy.get('[data-testid="calculation-result"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="score-delta"]').should('contain.text', '5');
      cy.get('[data-testid="final-amount"]').should('be.visible');
    });

    it('should show breakdown of calculation', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').clear().type('70');
      cy.get('[data-testid="current-score-input"]').clear().type('75');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="base-amount"]').should('be.visible');
      cy.get('[data-testid="performance-multiplier"]').should('be.visible');
      cy.get('[data-testid="recency-weight"]').should('be.visible');
    });

    it('should detect anomalies', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      // Input extreme values to trigger anomaly
      cy.get('[data-testid="previous-score-input"]').clear().type('0');
      cy.get('[data-testid="current-score-input"]').clear().type('100');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="anomaly-detected"]', { timeout: 5000 }).should('be.visible');
    });

    it('should provide recommendation', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').clear().type('70');
      cy.get('[data-testid="current-score-input"]').clear().type('75');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="recommendation"]', { timeout: 5000 }).should('be.visible');
    });

    it('should show execution feasibility', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').clear().type('70');
      cy.get('[data-testid="current-score-input"]').clear().type('75');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="would-execute"]', { timeout: 5000 }).should('be.visible');
    });

    it('should validate input fields', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      // Try to submit with empty inputs
      cy.get('[data-testid="calculate-button"]').click();

      // Should show validation errors or be disabled
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="validation-error"]').length > 0) {
          cy.get('[data-testid="validation-error"]').should('be.visible');
        } else {
          cy.get('[data-testid="calculate-button"]').should('be.disabled');
        }
      });
    });

    it('should handle large score deltas', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').clear().type('0');
      cy.get('[data-testid="current-score-input"]').clear().type('100');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="calculation-result"]', { timeout: 5000 }).should('be.visible');
    });

    it('should handle negative deltas', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').clear().type('75');
      cy.get('[data-testid="current-score-input"]').clear().type('70');
      cy.get('[data-testid="calculate-button"]').click();

      cy.get('[data-testid="calculation-result"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="final-amount"]').should('contain.text', '0'); // or negative
    });
  });

  describe('Anomaly Review Tab (Admin)', () => {
    it('should display pending payouts list', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      cy.get('[data-testid="pending-payouts-header"]').should('be.visible');
      cy.get('[data-testid="pending-count"]').should('be.visible');
    });

    it('should show empty state when no pending payouts', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="payout-list-item"]').length === 0) {
          cy.get('[data-testid="empty-pending"]').should('be.visible');
        }
      });
    });

    it('should allow selecting a payout for review', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      cy.get('[data-testid="payout-list-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="select-button"]').click();
        });

      cy.get('[data-testid="dispute-form"]').should('be.visible');
    });

    it('should file a dispute successfully', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      // Select first payout
      cy.get('[data-testid="payout-list-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="select-button"]').click();
        });

      // Fill dispute form
      cy.get('[data-testid="dispute-reason-input"]').type('Suspicious activity detected');
      cy.get('[data-testid="dispute-submit"]').click();

      // Verify success
      cy.get('[data-testid="dispute-success"]', { timeout: 5000 }).should('be.visible');
    });

    it('should require reason for dispute', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      cy.get('[data-testid="payout-list-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="select-button"]').click();
        });

      // Try to submit without reason
      cy.get('[data-testid="dispute-submit"]').click();

      cy.get('[data-testid="validation-error"]').should('be.visible');
    });

    it('should display stats header', () => {
      cy.contains('[role="tab"]', 'Admin').click();

      cy.get('[data-testid="pending-count"]').should('be.visible');
      cy.get('[data-testid="total-pending-amount"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('GET', '/api/**', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      });

      cy.contains('[role="tab"]', 'History').click();

      cy.get('[data-testid="error-message"]', { timeout: 5000 }).should('be.visible');
    });

    it('should retry failed requests', () => {
      let callCount = 0;

      cy.intercept('GET', '/api/agents/*/payouts', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({
            statusCode: 500,
            body: { error: 'Server error' },
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { agentId: 'agent-001', payouts: [] },
          });
        }
      });

      cy.contains('[role="tab"]', 'History').click();
      cy.get('[data-testid="retry-button"]').click();

      cy.get('[data-testid="history-panel"]', { timeout: 5000 }).should('be.visible');
    });

    it('should handle 404 errors', () => {
      cy.intercept('GET', '/api/**', {
        statusCode: 404,
        body: { error: 'Not found' },
      });

      cy.contains('[role="tab"]', 'History').click();

      cy.get('[data-testid="error-message"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');

      cy.contains('[role="tab"]', 'History').should('be.visible');
      cy.contains('[role="tab"]', 'Performance').click();
      cy.get('[data-testid="performance-panel"]').should('be.visible');
    });

    it('should work on tablets', () => {
      cy.viewport('ipad-2');

      cy.contains('[role="tab"]', 'History').should('be.visible');
      cy.contains('[role="tab"]', 'Calculator').click();
      cy.get('[data-testid="calculator-panel"]').should('be.visible');
    });

    it('should work on desktop', () => {
      cy.viewport('macbook-15');

      cy.contains('[role="tab"]', 'History').should('be.visible');
      cy.contains('[role="tab"]', 'Admin').click();
      cy.get('[data-testid="anomaly-panel"]').should('be.visible');
    });

    it('should handle viewport resize', () => {
      cy.viewport('macbook-15');
      cy.contains('[role="tab"]', 'History').click();

      cy.viewport('iphone-x');
      cy.get('[data-testid="history-panel"]').should('be.visible');

      cy.viewport('macbook-15');
      cy.get('[data-testid="history-panel"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper tab roles', () => {
      cy.get('[role="tab"]').each(($tab) => {
        cy.wrap($tab).should('have.attr', 'aria-selected');
      });
    });

    it('should be keyboard navigable', () => {
      cy.get('[role="tab"]').first().focus();
      cy.focused().should('have.attr', 'role', 'tab');

      cy.realPress('ArrowRight');
      cy.focused().should('have.attr', 'role', 'tab');
    });

    it('should have proper form labels', () => {
      cy.contains('[role="tab"]', 'Calculator').click();

      cy.get('[data-testid="previous-score-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="current-score-input"]').should('have.attr', 'aria-label');
    });

    it('should announce loading states', () => {
      cy.contains('[role="tab"]', 'History').click();

      cy.get('[data-testid="loading-spinner"]').should('have.attr', 'role', 'status');
    });

    it('should have proper error announcements', () => {
      cy.intercept('GET', '/api/**', {
        statusCode: 500,
      });

      cy.contains('[role="tab"]', 'History').click();

      cy.get('[data-testid="error-message"]').should('have.attr', 'role', 'alert');
    });
  });

  describe('Performance', () => {
    it('should load dashboard within reasonable time', () => {
      const startTime = Date.now();

      cy.visit(`${baseUrl}/dashboard`);

      cy.get('[role="tab"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should switch tabs smoothly', () => {
      cy.contains('[role="tab"]', 'History').click();
      cy.contains('[role="tab"]', 'Performance').click();

      // Tab should switch without noticeable lag
      cy.get('[data-testid="performance-panel"]')
        .should('be.visible')
        .then(($el) => {
          expect($el.css('opacity')).to.equal('1');
        });
    });

    it('should not cause layout shift when loading data', () => {
      cy.contains('[role="tab"]', 'History').click();

      // Initial layout
      cy.get('[data-testid="history-panel"]').then(($panel) => {
        const initialHeight = $panel.height();

        // Wait for data
        cy.get('[data-testid="payout-item"]', { timeout: 5000 });

        // Layout should not significantly shift
        cy.get('[data-testid="history-panel"]').then(($panelAfter) => {
          const finalHeight = $panelAfter.height();
          expect(Math.abs(finalHeight - initialHeight)).to.be.lessThan(50);
        });
      });
    });
  });
});
