import { User } from "@supabase/supabase-js";
import { getUserRole } from "./auth";

/**
 * lib/rbac.ts
 * Enterprise Role-Based Access Control (RBAC 2.0)
 * Multi-role mappings, action permission structures, and session authorization gates.
 */

export type AppRole =
  | "student"
  | "recruiter"
  | "mentor"
  | "moderator"
  | "content_manager"
  | "assessment_manager"
  | "placement_coordinator"
  | "support_executive"
  | "admin"
  | "super_admin";

export type Permission =
  | "view:analytics"
  | "manage:ai"
  | "manage:payments"
  | "impersonate:user"
  | "audit:logs"
  | "verify:recruiters"
  | "edit:assessments"
  | "edit:jobs"
  | "use:platform";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  student: ["use:platform"],
  recruiter: ["use:platform"],
  mentor: ["use:platform"],
  moderator: ["use:platform", "edit:jobs"],
  content_manager: ["use:platform", "edit:jobs"],
  assessment_manager: ["use:platform", "edit:assessments"],
  placement_coordinator: ["use:platform", "view:analytics", "verify:recruiters"],
  support_executive: ["use:platform", "view:analytics"],
  admin: [
    "use:platform",
    "view:analytics",
    "manage:ai",
    "verify:recruiters",
    "edit:assessments",
    "edit:jobs",
    "audit:logs"
  ],
  super_admin: [
    "use:platform",
    "view:analytics",
    "manage:ai",
    "manage:payments",
    "impersonate:user",
    "verify:recruiters",
    "edit:assessments",
    "edit:jobs",
    "audit:logs"
  ]
};

/**
 * Validates if the given user holds the required permissions parameters.
 */
export function hasPermission(user: User | null, requiredPermission: Permission): boolean {
  if (!user) return false;

  // Resolve user role mapping using basic auth definitions
  const authRole = getUserRole(user);
  let resolvedRole: AppRole = "student";

  if (authRole === "super_admin") {
    resolvedRole = "super_admin";
  } else if (authRole === "admin") {
    resolvedRole = "admin";
  } else {
    // Check specific user metadata roles overrides
    const metaRole = user.user_metadata?.role as AppRole;
    if (metaRole && Object.keys(ROLE_PERMISSIONS).includes(metaRole)) {
      resolvedRole = metaRole;
    }
  }

  const permissions = ROLE_PERMISSIONS[resolvedRole] || [];
  return permissions.includes(requiredPermission);
}
