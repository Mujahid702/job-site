/**
 * tests/unit/platform-ecosystem.test.js
 * Unit tests verifying public developer API parsing and AI autonomous agent insights.
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Mock developer authentication validator
function mockVerifyDeveloperKey(authHeader, mockDbKeys) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, errorMsg: "Missing or malformed Bearer token." };
  }
  const key = authHeader.replace("Bearer ", "").trim();
  const matched = mockDbKeys.find(record => record.api_key === key);
  if (!matched) {
    return { authorized: false, errorMsg: "Invalid developer API key." };
  }
  return { authorized: true, userId: matched.user_id };
}

// Mock AI career agent insights logic
function mockGenerateProactiveInsights(context) {
  const insights = [];
  if (context.atsScore < 70) {
    insights.push({ type: "warning", message: "ATS score under 70%" });
  }
  if (context.weaknesses.includes("SQL")) {
    insights.push({ type: "info", message: "Focus on SQL weakness" });
  }
  return insights;
}

test('Ecosystem API: authenticates valid bearer tokens and rejects invalid keys', () => {
  const dbKeys = [{ api_key: "bb_live_secretkey123", user_id: "user_a" }];
  
  const authSuccess = mockVerifyDeveloperKey("Bearer bb_live_secretkey123", dbKeys);
  const authFail = mockVerifyDeveloperKey("Bearer bb_invalid_key", dbKeys);
  const authMalformed = mockVerifyDeveloperKey("Basic token", dbKeys);

  assert.strictEqual(authSuccess.authorized, true);
  assert.strictEqual(authSuccess.userId, "user_a");
  assert.strictEqual(authFail.authorized, false);
  assert.strictEqual(authFail.errorMsg, "Invalid developer API key.");
  assert.strictEqual(authMalformed.authorized, false);
  assert.match(authMalformed.errorMsg, /malformed/);
});

test('Autonomous Agent: outputs custom insights based on weaknesses and low ATS scores', () => {
  const badContext = { atsScore: 65, weaknesses: ["SQL"] };
  const goodContext = { atsScore: 88, weaknesses: [] };

  const badInsights = mockGenerateProactiveInsights(badContext);
  const goodInsights = mockGenerateProactiveInsights(goodContext);

  assert.strictEqual(badInsights.length, 2);
  assert.strictEqual(badInsights[0].type, "warning");
  assert.strictEqual(badInsights[1].message, "Focus on SQL weakness");
  assert.strictEqual(goodInsights.length, 0);
});
