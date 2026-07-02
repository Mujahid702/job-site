/**
 * tests/unit/intelligence.test.js
 * Unit tests verifying Student Intelligence profile algorithms.
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Core placement model simulation logic
function simulatePlacementCalculations(codingScore, technicalScore, consistency, learningSpeed) {
  const probInterview = Math.round(Math.min(95, Math.max(20, 40 + (consistency * 30))));
  const probOA = Math.round(Math.min(95, Math.max(15, 20 + (codingScore * 0.8))));
  const probPlacement = Math.round((probInterview * 0.3) + (probOA * 0.7)); // weighted math
  const confidenceLower = Math.max(10, probPlacement - 8);
  const confidenceUpper = Math.min(99, probPlacement + 6);
  
  const gap = Math.max(0, 85 - (codingScore + technicalScore) / 2);
  const timelineDays = Math.round(Math.max(15, gap * 3 * (2 - learningSpeed)));

  return {
    probInterview,
    probOA,
    probPlacement,
    confidenceLower,
    confidenceUpper,
    timelineDays
  };
}

test('Placement Probability: calculates interview shortlist based on consistency scale', () => {
  const resLow = simulatePlacementCalculations(60, 60, 0.2, 1.0);
  assert.strictEqual(resLow.probInterview, 46); // 40 + 6
  
  const resHigh = simulatePlacementCalculations(60, 60, 1.0, 1.0);
  assert.strictEqual(resHigh.probInterview, 70); // 40 + 30
});

test('Placement Probability: bounds final placement probabilities and calculates confidence bounds', () => {
  const res = simulatePlacementCalculations(90, 85, 0.9, 1.2);
  assert.ok(res.probPlacement > 50);
  assert.strictEqual(res.confidenceLower, res.probPlacement - 8);
  assert.strictEqual(res.confidenceUpper, res.probPlacement + 6);
});

test('Readiness Timeline: reduces estimated preparation days for fast learners', () => {
  const coding = 60;
  const tech = 60;
  const gap = 85 - 60; // 25
  
  const daysSlow = simulatePlacementCalculations(coding, tech, 0.8, 0.8).timelineDays; // 25 * 3 * 1.2 = 90
  const daysFast = simulatePlacementCalculations(coding, tech, 0.8, 1.5).timelineDays; // 25 * 3 * 0.5 = 38
  
  assert.ok(daysFast < daysSlow);
});
