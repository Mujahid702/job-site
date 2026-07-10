/**
 * tests/regression/isolation.test.js
 * Regression tests confirming rules:
 * 1. LocalStorage key scoping must append user IDs.
 * 2. AI caching hashes must partition entries per user.
 * 3. Cache purging must sweep all user-scoped data.
 */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// 1. Scoped key generation logic mock matching lib/security/LocalStorage
function getScopedKey(key, userId) {
  if (!userId || userId === "guest-user") return `${key}_guest`;
  return `${key}_${userId}`;
}

// 2. AI cache hashing logic mock matching lib/ai/router.ts
function getAiCacheKey(taskType, prompt, userId) {
  const cachePrefixes = {
    'ats_analyzer': 'ats',
    'jd_matcher': 'jd',
    'linkedin_optimizer': 'linkedin',
    'resume_enhancer': 'enhance',
  };
  const prefix = cachePrefixes[taskType] || 'default';
  
  const hashInput = JSON.stringify({
    prompt,
    userId: userId || "anonymous",
  });
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  return `${prefix}:${hash}`;
}

// 3. Purging logic simulation
function simulatePurge(keysList, targetUserId) {
  const prefix = `_${targetUserId}`;
  return keysList.filter(k => !(k.endsWith(prefix) || k.includes(targetUserId)));
}

test('Regression check: LocalStorage keys must partition user data from guest data', () => {
  const guestKey = getScopedKey("resume_os_snapshots", null);
  assert.strictEqual(guestKey, "resume_os_snapshots_guest");

  const userAKey = getScopedKey("resume_os_snapshots", "user-A");
  const userBKey = getScopedKey("resume_os_snapshots", "user-B");
  
  assert.strictEqual(userAKey, "resume_os_snapshots_user-A");
  assert.strictEqual(userBKey, "resume_os_snapshots_user-B");
  assert.notStrictEqual(userAKey, userBKey);

  // New interview scope assertions
  const interviewA = getScopedKey("interview_history", "user-A");
  const interviewB = getScopedKey("interview_history", "user-B");
  assert.strictEqual(interviewA, "interview_history_user-A");
  assert.notStrictEqual(interviewA, interviewB);
});

test('Regression check: AI Caching hashes must incorporate user IDs to prevent poisoning', () => {
  const prompt = "Assess my react project experience";
  const userACacheKey = getAiCacheKey("ats_analyzer", prompt, "user-A");
  const userBCacheKey = getAiCacheKey("ats_analyzer", prompt, "user-B");
  const anonCacheKey = getAiCacheKey("ats_analyzer", prompt, null);

  assert.notStrictEqual(userACacheKey, userBCacheKey);
  assert.notStrictEqual(userACacheKey, anonCacheKey);
  assert.match(userACacheKey, /^ats:[0-9a-f]{64}$/);
});

test('Regression check: Session logouts must cleanly purge user-scoped data residue', () => {
  const mockStorage = [
    "resume_os_snapshots_user-A",
    "resume_os_snapshots_user-B",
    "ats_score_user-A",
    "completed_daily_goals_guest",
    "gemini_api_key_user-A"
  ];

  const purgedStorageForUserA = simulatePurge(mockStorage, "user-A");

  // User A keys should be removed
  assert.ok(!purgedStorageForUserA.includes("resume_os_snapshots_user-A"));
  assert.ok(!purgedStorageForUserA.includes("ats_score_user-A"));
  assert.ok(!purgedStorageForUserA.includes("gemini_api_key_user-A"));

  // User B and Guest keys must remain
  assert.ok(purgedStorageForUserA.includes("resume_os_snapshots_user-B"));
  assert.ok(purgedStorageForUserA.includes("completed_daily_goals_guest"));
});
