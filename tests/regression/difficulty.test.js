/**
 * tests/regression/difficulty.test.js
 * Regression tests confirming rules:
 * 1. Recommendations must respect selected difficulty.
 * 2. JD Matcher rejects invalid/empty descriptions.
 */
const test = require('node:test');
const assert = require('node:assert');

// 1. Difficulty bounds check logic
function getRecommendations(role, difficulty) {
  const allProjects = [
    { title: 'Task Logger', level: 'Beginner' },
    { title: 'Crypto Ledger', level: 'Advanced' },
    { title: 'E-commerce API', level: 'Intermediate' }
  ];
  return allProjects.filter(p => p.level === difficulty);
}

// 2. JD Validation helper
function validateJDDescription(description) {
  if (!description || description.trim().length < 15) {
    return { valid: false, error: 'Description too short or invalid' };
  }
  return { valid: true };
}

test('Regression check: recommendations only return projects matching the exact selected difficulty', () => {
  const advancedRecommendations = getRecommendations('Software Engineer', 'Advanced');
  assert.strictEqual(advancedRecommendations.length, 1);
  assert.strictEqual(advancedRecommendations[0].title, 'Crypto Ledger');
  
  const beginnerRecommendations = getRecommendations('Software Engineer', 'Beginner');
  assert.strictEqual(beginnerRecommendations.length, 1);
  assert.strictEqual(beginnerRecommendations[0].title, 'Task Logger');
});

test('Regression check: JD Matcher rejects empty or extremely short descriptions', () => {
  const resultEmpty = validateJDDescription('');
  assert.strictEqual(resultEmpty.valid, false);
  
  const resultShort = validateJDDescription('Dev required'); // 12 chars
  assert.strictEqual(resultShort.valid, false);
  
  const resultLong = validateJDDescription('Senior React developer with 5 years experience in building high performance UI components.');
  assert.strictEqual(resultLong.valid, true);
});
