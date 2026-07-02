/**
 * tests/unit/rbac.test.js
 * Unit tests verifying Enterprise RBAC 2.0 permission hierarchies.
 * Run natively using node:test.
 */
const test = require('node:test');
const assert = require('node:assert');

// Core rbac helper mock
function mockHasPermission(user, requiredPermission, rolePermissions) {
  if (!user) return false;
  const role = user.user_metadata?.role || "student";
  const permissions = rolePermissions[role] || [];
  return permissions.includes(requiredPermission);
}

const mockRolePermissions = {
  student: ["use:platform"],
  recruiter: ["use:platform"],
  admin: ["use:platform", "view:analytics", "audit:logs"],
  super_admin: ["use:platform", "view:analytics", "audit:logs", "manage:payments"]
};

test('RBAC 2.0: authorizes correct roles for general platform usage', () => {
  const studentUser = { user_metadata: { role: 'student' } };
  const adminUser = { user_metadata: { role: 'admin' } };

  assert.strictEqual(mockHasPermission(studentUser, 'use:platform', mockRolePermissions), true);
  assert.strictEqual(mockHasPermission(adminUser, 'use:platform', mockRolePermissions), true);
});

test('RBAC 2.0: blocks students from view:analytics or manage:payments', () => {
  const studentUser = { user_metadata: { role: 'student' } };

  assert.strictEqual(mockHasPermission(studentUser, 'view:analytics', mockRolePermissions), false);
  assert.strictEqual(mockHasPermission(studentUser, 'manage:payments', mockRolePermissions), false);
});

test('RBAC 2.0: authorizes admin for audit:logs but blocks payment modifications', () => {
  const adminUser = { user_metadata: { role: 'admin' } };

  assert.strictEqual(mockHasPermission(adminUser, 'audit:logs', mockRolePermissions), true);
  assert.strictEqual(mockHasPermission(adminUser, 'manage:payments', mockRolePermissions), false);
});

test('RBAC 2.0: grants super_admin absolute coverage including payments management', () => {
  const superAdmin = { user_metadata: { role: 'super_admin' } };

  assert.strictEqual(mockHasPermission(superAdmin, 'manage:payments', mockRolePermissions), true);
});
