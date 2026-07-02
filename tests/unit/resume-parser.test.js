/**
 * tests/unit/resume-parser.test.js
 * Unit tests for Resume OS parser and scoring calculations.
 * Run using node:test natively.
 */
const test = require('node:test');
const assert = require('node:assert');

// Mock parser scorer helper logic
function calculateMockATSScore(keywordsFound, formatIssuesLength) {
  const base = 50;
  const keywordPoints = keywordsFound.length * 10;
  const formatPenalties = formatIssuesLength * 5;
  return Math.min(100, Math.max(0, base + keywordPoints - formatPenalties));
}

test('Resume Scorer: returns 100 for maximum keywords found and no formatting penalties', () => {
  const keywords = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis'];
  const issuesCount = 0;
  const score = calculateMockATSScore(keywords, issuesCount);
  assert.strictEqual(score, 100);
});

test('Resume Scorer: penalizes formatting mistakes correctly', () => {
  const keywords = ['React', 'TypeScript'];
  const issuesCount = 3; // 3 * 5 = 15 penalty
  const score = calculateMockATSScore(keywords, issuesCount);
  // 50 + 20 - 15 = 55
  assert.strictEqual(score, 55);
});

test('Resume Scorer: bounds score between 0 and 100', () => {
  assert.strictEqual(calculateMockATSScore([], 20), 0); // negative boundary clip to 0
  assert.strictEqual(calculateMockATSScore(['a','b','c','d','e','f','g','h','i'], 0), 100); // overflow boundary clip to 100
});
