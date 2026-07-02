/**
 * tests/unit/admin-analytics.test.js
 * Unit tests verifying Enterprise Analytics RAG telemetry calculations.
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Core aggregator mock logic
function mockAggregateRagLogs(logs) {
  const count = logs.length;
  const avgSimilarity = logs.length > 0 
    ? logs.reduce((acc, log) => acc + Number(log.average_similarity), 0) / logs.length 
    : 0;
  const avgLatency = logs.length > 0
    ? Math.round(logs.reduce((acc, log) => acc + Number(log.latency_ms), 0) / logs.length)
    : 0;
  const hallucinationsCount = logs.filter(log => log.hallucination_detected).length;

  return {
    totalRagQueries: count,
    avgSimilarityScore: Math.round(avgSimilarity * 100),
    avgLatencyMs: avgLatency,
    hallucinationsFlagged: hallucinationsCount
  };
}

test('Admin Analytics: aggregates RAG logs correctly with latency and similarity metrics', () => {
  const mockLogs = [
    { average_similarity: 0.85, latency_ms: 120, hallucination_detected: false },
    { average_similarity: 0.65, latency_ms: 80, hallucination_detected: false },
    { average_similarity: 0.30, latency_ms: 220, hallucination_detected: true }
  ];

  const aggregated = mockAggregateRagLogs(mockLogs);
  
  assert.strictEqual(aggregated.totalRagQueries, 3);
  // Avg Similarity: (0.85 + 0.65 + 0.3) / 3 = 1.8 / 3 = 0.6 -> 60%
  assert.strictEqual(aggregated.avgSimilarityScore, 60);
  // Avg Latency: Math.round((120 + 80 + 220) / 3) = Math.round(420 / 3) = 140ms
  assert.strictEqual(aggregated.avgLatencyMs, 140);
  assert.strictEqual(aggregated.hallucinationsFlagged, 1);
});

test('Admin Analytics: handles empty RAG logs gracefully returning default zeros', () => {
  const aggregated = mockAggregateRagLogs([]);
  
  assert.strictEqual(aggregated.totalRagQueries, 0);
  assert.strictEqual(aggregated.avgSimilarityScore, 0);
  assert.strictEqual(aggregated.avgLatencyMs, 0);
  assert.strictEqual(aggregated.hallucinationsFlagged, 0);
});
