export function getScopedKey(key: string, userId: string | null): string {
  if (!userId || userId === "guest-user") return `${key}_guest`;
  return `${key}_${userId}`;
}

export function getScopedItem(key: string, userId: string | null): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getScopedKey(key, userId));
}

export function setScopedItem(key: string, value: string, userId: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getScopedKey(key, userId), value);
}

export function removeScopedItem(key: string, userId: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getScopedKey(key, userId));
}

export function clearUserSessionCache(userId: string | null): void {
  if (typeof window === "undefined") return;
  if (!userId) return;
  
  const prefix = `_${userId}`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.endsWith(prefix) || key.includes(userId))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function purgeAllScopedData(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      UUID_REGEX.test(key) || 
      key.endsWith("_guest") || 
      key.startsWith("resume_os_snapshots") ||
      key.startsWith("completed_daily_goals") ||
      key.startsWith("completed_roadmap_steps") ||
      key.startsWith("interview_history") ||
      key.startsWith("ats_score") ||
      key.startsWith("placement_readiness")
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function migrateOrCleanupLegacyKeys(userId: string | null): void {
  if (typeof window === "undefined" || !userId || userId === "guest-user") return;

  const migrationKey = `migration_done_${userId}`;
  if (localStorage.getItem(migrationKey) === "true") return;

  const keysToMigrate = [
    "ats_score",
    "last_analyzed_resume_text",
    "last_analyzed_resume_name",
    "last_analyzed_resume_timestamp",
    "jd_match_history",
    "resume_enhance_result",
    "resume_builder_cache",
    "linkedin_profile_os",
    "linkedin_oauth_connected",
    "linkedin_completed_tasks",
    "resume_builder_profile",
    "portfolio_profile_os",
    "portfolio_profile_os_theme",
    "resume_os_snapshots",
    "gemini_api_key",
    "cover_letter_os_profile",
    "roadmap_progress_states",
    "completed_daily_goals",
    "interview_history",
    "placement_copilot_chat_history",
    "placement_crm_applications",
    "placement_community_blocked_users",
    "placement_success_tracking_applications",
    "pri_readiness",
    "placement_readiness_score",
    "placement_readiness_prev_score",
    "placement_readiness_alerts",
    "buggedbrain_saved_jobs",
    "ats_scan_history",
    "onboarding_guest_state",
    "resume_builder_name",
    "placement_target_role",
    "resume_builder_skills"
  ];

  keysToMigrate.forEach(key => {
    const unscopedVal = localStorage.getItem(key);
    const guestKey = `${key}_guest`;
    const guestVal = localStorage.getItem(guestKey);

    const valToMigrate = guestVal !== null ? guestVal : unscopedVal;

    if (valToMigrate !== null) {
      localStorage.setItem(`${key}_${userId}`, valToMigrate);
    }

    localStorage.removeItem(key);
    localStorage.removeItem(guestKey);
  });

  localStorage.setItem(migrationKey, "true");
}
