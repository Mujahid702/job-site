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
