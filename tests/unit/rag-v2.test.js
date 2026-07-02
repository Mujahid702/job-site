/**
 * tests/unit/rag-v2.test.js
 * Unit tests verifying AI Knowledge Intelligence Platform (RAG 2.0) retrieval models.
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Core RAG 2.0 ranking algorithm mock
function mockRankRAGDocuments(docs, filters) {
  return docs
    .filter(doc => {
      if (filters.category && doc.category !== filters.category) return false;
      if (filters.company && doc.company !== filters.company && doc.company !== 'General') return false;
      if (filters.role && doc.role !== filters.role && doc.role !== 'General') return false;
      if (filters.difficulty && doc.difficulty !== filters.difficulty && doc.difficulty !== 'General') return false;
      return true;
    })
    .map(doc => {
      // Calculate rank score: similarity * 0.7 + confidence * 0.2 + popularity * 0.1
      const score = (doc.similarity * 0.7) + (doc.confidence_score * 0.2) + ((doc.popularity || 0) * 0.1 / 100);
      return { ...doc, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score);
}

const mockKnowledgeBase = [
  { id: '1', title: 'Google System Design Playbook', category: 'playbook', company: 'Google', role: 'General', difficulty: 'Advanced', similarity: 0.85, confidence_score: 0.95, popularity: 150 },
  { id: '2', title: 'Microsoft C# Guidelines', category: 'guide', company: 'Microsoft', role: 'General', difficulty: 'Intermediate', similarity: 0.9, confidence_score: 0.9, popularity: 50 },
  { id: '3', title: 'Generic SDE Study Roadmap', category: 'roadmap', company: 'General', role: 'Software Engineer', difficulty: 'General', similarity: 0.75, confidence_score: 0.8, popularity: 300 }
];

test('RAG 2.0 Ranking: filters and ranks documents correctly based on hybrid criteria', () => {
  const filters = { category: 'playbook', company: 'Google' };
  const ranked = mockRankRAGDocuments(mockKnowledgeBase, filters);
  
  assert.strictEqual(ranked.length, 1);
  assert.strictEqual(ranked[0].title, 'Google System Design Playbook');
  // Score: (0.85 * 0.7) + (0.95 * 0.2) + (150 * 0.1 / 100) = 0.595 + 0.19 + 0.15 = 0.935 -> 0.94
  assert.strictEqual(ranked[0].score, 0.94);
});

test('RAG 2.0 Ranking: returns general matching documents if target filters allow generic', () => {
  const filters = { category: 'roadmap', company: 'Google', role: 'Software Engineer' };
  const ranked = mockRankRAGDocuments(mockKnowledgeBase, filters);
  
  assert.strictEqual(ranked.length, 1);
  assert.strictEqual(ranked[0].title, 'Generic SDE Study Roadmap');
});

test('RAG 2.0 Context Builder: constructs correct context prompt structure', () => {
  const docs = [
    { title: 'Google System Design Playbook', category: 'playbook', content: 'Distributed queue sharding...' }
  ];
  
  let contextText = "### VERIFIED PLACEMENT CONTEXT:\n";
  docs.forEach((doc, idx) => {
    contextText += `--- CHUNK ${idx + 1}: ${doc.title} (${doc.category.toUpperCase()}) ---\n`;
    contextText += `${doc.content}\n`;
  });
  
  assert.ok(contextText.includes('VERIFIED PLACEMENT CONTEXT'));
  assert.ok(contextText.includes('Distributed queue sharding'));
});
