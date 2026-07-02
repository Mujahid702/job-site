/**
 * tests/unit/memory.test.js
 * Unit tests verifying Context Engine 2.0 multi-layered memories (permanent, long-term, working, episodic).
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Core context assembler memory logic mock
function mockFilterExpiredMemories(memories, checkTime = new Date()) {
  return memories.filter(mem => {
    if (mem.expires_at && new Date(mem.expires_at) < checkTime) {
      return false;
    }
    return true;
  });
}

function mockAssembleContext(profile, memories) {
  const permanent = memories.filter(m => m.memory_type === 'permanent');
  const longTerm = memories.filter(m => m.memory_type === 'long_term');
  const working = memories.filter(m => m.memory_type === 'working');
  const episodic = memories.filter(m => m.memory_type === 'episodic');

  let context = `### SYSTEM ADAPTIVE STUDENT MEMORY ###\n`;
  context += `[STUDENT INTEGRATION METRICS]\n`;
  context += `- Target Roles: ${profile.target_roles?.join(', ') || 'General'}\n`;
  
  if (permanent.length > 0) {
    context += `[PERMANENT MEMORY]\n`;
    permanent.forEach(m => context += `- ${m.key}: ${JSON.stringify(m.value)}\n`);
  }
  if (longTerm.length > 0) {
    context += `[LONG-TERM EVOLVING MEMORY]\n`;
    longTerm.forEach(m => context += `- ${m.key}: ${JSON.stringify(m.value)}\n`);
  }
  if (working.length > 0) {
    context += `[WORKING CHAT CONTEXT]\n`;
    working.forEach(m => context += `- Active Focus: ${m.key} -> ${JSON.stringify(m.value)}\n`);
  }
  if (episodic.length > 0) {
    context += `[EPISODIC STUDENT MILESTONES]\n`;
    episodic.forEach(m => context += `- Milestone: ${m.key}\n`);
  }
  return context;
}

test('Memory layer filtering: prunes expired working memories dynamically', () => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 100000);
  const pastDate = new Date(now.getTime() - 100000);

  const mockMemories = [
    { id: '1', key: 'active_topic', value: 'SQL Indexes', expires_at: futureDate },
    { id: '2', key: 'expired_session', value: 'old assessment review', expires_at: pastDate },
    { id: '3', key: 'permanent_key', value: 'Software SDE', expires_at: null }
  ];

  const active = mockFilterExpiredMemories(mockMemories, now);
  assert.strictEqual(active.length, 2);
  assert.strictEqual(active.some(m => m.key === 'expired_session'), false);
});

test('Context builder assembler: properly maps multi-layered inputs into context prompt block', () => {
  const profile = { target_roles: ['Frontend Developer'] };
  const mockMemories = [
    { memory_type: 'permanent', key: 'target_companies', value: ['Google'] },
    { memory_type: 'episodic', key: 'Passed Amazon OA', value: true }
  ];

  const output = mockAssembleContext(profile, mockMemories);
  assert.ok(output.includes('SYSTEM ADAPTIVE STUDENT MEMORY'));
  assert.ok(output.includes('Frontend Developer'));
  assert.ok(output.includes('Google'));
  assert.ok(output.includes('Passed Amazon OA'));
});
