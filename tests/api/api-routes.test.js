/**
 * tests/api/api-routes.test.js
 * API validation and mock route test cases.
 */
const test = require('node:test');
const assert = require('node:assert');

// Mock request handler validator
function mockValidateRouteRequest(req) {
  if (!req.headers || !req.headers['authorization']) {
    return { status: 401, error: 'Unauthorized' };
  }
  if (req.method !== 'POST') {
    return { status: 405, error: 'Method Not Allowed' };
  }
  if (!req.body || !req.body.resumeText) {
    return { status: 400, error: 'Bad Request: Missing resumeText' };
  }
  return { status: 200, success: true };
}

test('API Route Validator: returns 401 if authorization header is absent', () => {
  const req = { method: 'POST', headers: {}, body: { resumeText: 'hello' } };
  const res = mockValidateRouteRequest(req);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.error, 'Unauthorized');
});

test('API Route Validator: returns 400 if resumeText parameter is missing', () => {
  const req = { 
    method: 'POST', 
    headers: { 'authorization': 'Bearer token' }, 
    body: { targetRole: 'Backend Engineer' } 
  };
  const res = mockValidateRouteRequest(req);
  assert.strictEqual(res.status, 400);
  assert.ok(res.error.includes('Missing resumeText'));
});

test('API Route Validator: returns 200 on correct auth and body parameters', () => {
  const req = { 
    method: 'POST', 
    headers: { 'authorization': 'Bearer token' }, 
    body: { resumeText: 'Developer experience text...' } 
  };
  const res = mockValidateRouteRequest(req);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.success, true);
});
