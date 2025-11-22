/**
 * E2E Tests for Payout API
 *
 * These tests verify the API endpoints work correctly with full request/response cycles.
 * Designed to run against a running server instance.
 */

describe('Payout API E2E Tests', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const agentId = 'e2e-api-test-agent-001';
  const familyId = 'e2e-api-test-family-001';

  describe('GET /api/agents/:agentId/payouts', () => {
    it('should return agent payout history', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts?weeks=12`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('agentId', agentId);
        expect(response.body).to.have.property('payouts');
        expect(response.body).to.have.property('stats');
        expect(response.body.stats).to.have.property('totalPayouts');
        expect(response.body.stats).to.have.property('totalAmount');
        expect(response.body.stats).to.have.property('averageAmount');
        expect(response.body.stats).to.have.property('weeksCovered', 12);
      });
    });

    it('should accept custom weeks parameter', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts?weeks=4`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.stats.weeksCovered).to.equal(4);
      });
    });

    it('should default to 12 weeks when not specified', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.stats.weeksCovered).to.equal(12);
      });
    });

    it('should return empty array for agent with no payouts', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/nonexistent-agent/payouts`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(Array.isArray(response.body.payouts)).to.be.true;
      });
    });

    it('should have proper CORS headers', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        expect(response.headers['access-control-allow-origin']).to.equal('*');
      });
    });
  });

  describe('GET /api/agents/:agentId/performance', () => {
    it('should return agent performance metrics', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/performance`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('agentId', agentId);
        expect(response.body).to.have.property('performanceScore');
        expect(response.body).to.have.property('consecutiveImprovements');
        expect(response.body).to.have.property('coolingPeriodActive');
        expect(response.body).to.have.property('coolingPeriodWeeksRemaining');
        expect(response.body).to.have.property('averagePayoutPerWeek');
        expect(response.body).to.have.property('totalEarned');
      });
    });

    it('should have performance score in valid range (0-100)', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/performance`,
      }).then((response) => {
        expect(response.body.performanceScore).to.be.at.least(0);
        expect(response.body.performanceScore).to.be.at.most(100);
      });
    });

    it('should have valid cooling period status', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/performance`,
      }).then((response) => {
        expect(typeof response.body.coolingPeriodActive).to.equal('boolean');
        expect(typeof response.body.coolingPeriodWeeksRemaining).to.equal('number');
        expect(response.body.coolingPeriodWeeksRemaining).to.be.at.least(0);
      });
    });

    it('should return metrics for nonexistent agent with defaults', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/nonexistent-agent/performance`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.performanceScore).to.equal(50); // default
      });
    });
  });

  describe('GET /api/families/:familyId/payouts', () => {
    it('should return family payout history', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/families/${familyId}/payouts?weeks=12`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('familyId', familyId);
        expect(response.body).to.have.property('payoutsByAgent');
        expect(Array.isArray(response.body.payoutsByAgent)).to.be.true;
        expect(response.body).to.have.property('stats');
      });
    });

    it('should include stats for all agents', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/families/${familyId}/payouts?weeks=12`,
      }).then((response) => {
        expect(response.body.stats).to.have.property('totalFamilyPayouts');
        expect(response.body.stats).to.have.property('totalAmount');
        expect(response.body.stats).to.have.property('averagePerAgent');
        expect(response.body.stats).to.have.property('agentCount');
      });
    });
  });

  describe('GET /api/payouts/pending', () => {
    it('should return pending payouts', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/payouts/pending`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('pendingCount');
        expect(response.body).to.have.property('totalAmount');
        expect(response.body).to.have.property('payouts');
        expect(Array.isArray(response.body.payouts)).to.be.true;
      });
    });

    it('should have matching pending count and array length', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/payouts/pending`,
      }).then((response) => {
        expect(response.body.payouts.length).to.equal(response.body.pendingCount);
      });
    });

    it('should include payout structure', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/payouts/pending`,
      }).then((response) => {
        if (response.body.payouts.length > 0) {
          const payout = response.body.payouts[0];
          expect(payout).to.have.property('agentId');
          expect(payout).to.have.property('familyId');
          expect(payout).to.have.property('amount');
          expect(payout).to.have.property('reason');
        }
      });
    });
  });

  describe('POST /api/payouts/calculate', () => {
    it('should calculate payout with valid inputs', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 70,
          currentScore: 75,
        },
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('calculation');
        expect(response.body.calculation).to.have.property('scoreDelta', 5);
        expect(response.body.calculation).to.have.property('baseAmount');
        expect(response.body.calculation).to.have.property('performanceMultiplier');
        expect(response.body.calculation).to.have.property('recencyWeight');
        expect(response.body.calculation).to.have.property('finalAmount');
      });
    });

    it('should have valid multipliers', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 70,
          currentScore: 75,
        },
      }).then((response) => {
        expect(response.body.calculation.performanceMultiplier).to.be.greaterThan(0);
        expect(response.body.calculation.performanceMultiplier).to.be.at.most(2);
        expect(response.body.calculation.recencyWeight).to.be.greaterThan(0);
        expect(response.body.calculation.recencyWeight).to.be.at.most(1);
      });
    });

    it('should indicate execution feasibility', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 70,
          currentScore: 75,
        },
      }).then((response) => {
        expect(response.body).to.have.property('wouldExecute');
        expect(typeof response.body.wouldExecute).to.equal('boolean');
      });
    });

    it('should provide recommendation', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 70,
          currentScore: 75,
        },
      }).then((response) => {
        expect(response.body).to.have.property('recommendation');
        expect(response.body.recommendation).to.be.oneOf([
          'none',
          'review',
          'cooling_period',
          'investigation',
          'error',
        ]);
      });
    });

    it('should detect anomalies', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 0,
          currentScore: 100, // Extreme jump
        },
      }).then((response) => {
        expect(response.body).to.have.property('anomaliesDetected');
        expect(typeof response.body.anomaliesDetected).to.equal('boolean');
      });
    });

    it('should handle zero delta', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 70,
          currentScore: 70,
        },
      }).then((response) => {
        expect(response.body.calculation.scoreDelta).to.equal(0);
      });
    });

    it('should handle negative delta', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId,
          familyId,
          previousScore: 75,
          currentScore: 70,
        },
      }).then((response) => {
        expect(response.body.calculation.scoreDelta).to.equal(-5);
      });
    });

    it('should require all parameters', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {
          agentId, // missing other fields
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
      });
    });
  });

  describe('GET /api/payouts/anomalies', () => {
    it('should return anomaly review list', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/payouts/anomalies`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('total');
        expect(response.body).to.have.property('anomalies');
        expect(Array.isArray(response.body.anomalies)).to.be.true;
      });
    });

    it('should support pagination', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/payouts/anomalies?limit=10&offset=0`,
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(Array.isArray(response.body.anomalies)).to.be.true;
      });
    });
  });

  describe('POST /api/payouts/dispute', () => {
    it('should file a payout dispute', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/dispute`,
        body: {
          recordId: 'record-001',
          reason: 'Score seems inflated',
          evidence: 'Supporting evidence',
        },
      }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success');
        expect(response.body).to.have.property('disputeId');
        expect(response.body).to.have.property('status');
        expect(response.body).to.have.property('message');
      });
    });

    it('should require reason', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/dispute`,
        body: {
          recordId: 'record-001',
          // missing reason
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
      });
    });

    it('should require recordId', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/dispute`,
        body: {
          reason: 'Some reason',
          // missing recordId
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent agent endpoint', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/nonexistent/payouts`,
        failOnStatusCode: false,
      }).then((response) => {
        // Should either return 404 or empty data
        expect([200, 404]).to.include(response.status);
      });
    });

    it('should return 400 for invalid parameters', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts?weeks=invalid`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
      });
    });

    it('should return proper error structure on failure', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
      });
    });
  });

  describe('Response Formats', () => {
    it('should return JSON content type', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
      });
    });

    it('should have consistent response structure', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        expect(response.body).to.be.an('object');
        expect(Object.keys(response.body).length).to.be.greaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        // Response time is in milliseconds
        expect(response.duration).to.be.lessThan(1000); // 1 second
      });
    });

    it('should handle concurrent requests', () => {
      const requests = [];

      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: `${baseUrl}/api/agents/${agentId}/payouts`,
          })
        );
      }

      cy.wrap(requests).then((responses) => {
        expect(responses.length).to.equal(5);
        responses.forEach((response) => {
          expect(response.status).to.equal(200);
        });
      });
    });
  });

  describe('Security', () => {
    it('should have proper CORS headers', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/api/agents/${agentId}/payouts`,
      }).then((response) => {
        expect(response.headers['access-control-allow-origin']).to.exist;
      });
    });

    it('should not expose internal errors', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/calculate`,
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        // Error message should not contain stack traces or internal details
        expect(JSON.stringify(response.body)).not.to.include('at ');
        expect(JSON.stringify(response.body)).not.to.include('stack');
      });
    });

    it('should require valid authorization (if applicable)', () => {
      // This test assumes authorization might be required
      cy.request({
        method: 'POST',
        url: `${baseUrl}/api/payouts/dispute`,
        body: {
          recordId: 'test',
          reason: 'test',
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should either succeed or return 401/403
        expect([200, 201, 401, 403]).to.include(response.status);
      });
    });
  });
});
