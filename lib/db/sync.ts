import { supabase } from "@/lib/supabase";

export interface SyncItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  key?: { [key: string]: any };
  timestamp: number;
}

const QUEUE_KEY = "buggedbrain_sync_queue";

// Visual offline toast
export function showSyncNotification(message: string, isSuccess: boolean = false) {
  if (typeof window === 'undefined') return;
  const existing = document.getElementById('buggedbrain-sync-notification');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'buggedbrain-sync-notification';
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style.right = '24px';
  container.style.zIndex = '99999';
  container.style.padding = '14px 20px';
  container.style.borderRadius = '16px';
  container.style.background = isSuccess 
    ? 'rgba(16, 185, 129, 0.95)' // Emerald green
    : 'rgba(245, 158, 11, 0.95)'; // Amber/yellow
  container.style.color = '#ffffff';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = '13px';
  container.style.fontWeight = '800';
  container.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
  container.style.backdropFilter = 'blur(12px)';
  container.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '10px';
  container.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  container.style.transform = 'translateY(100px)';
  container.style.opacity = '0';
  container.style.textTransform = 'uppercase';
  container.style.letterSpacing = '0.05em';

  const icon = document.createElement('span');
  icon.style.display = 'inline-flex';
  icon.style.alignItems = 'center';
  icon.innerHTML = isSuccess
    ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`
    : `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18M4 4V12H12"/></svg>`;
  container.appendChild(icon);

  const textNode = document.createElement('span');
  textNode.innerText = message;
  container.appendChild(textNode);

  document.body.appendChild(container);

  // Force reflow
  container.offsetHeight;
  container.style.transform = 'translateY(0)';
  container.style.opacity = '1';

  setTimeout(() => {
    container.style.transform = 'translateY(100px)';
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 400);
  }, 4500);
}

export function getSyncQueue(): SyncItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse sync queue", e);
    return [];
  }
}

export function saveSyncQueue(queue: SyncItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function syncQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  console.log(`[Offline Sync] Attempting to sync ${queue.length} write operations...`);
  const remaining: SyncItem[] = [];
  let successfulSyncs = 0;

  const db = await getDb();

  for (const item of queue) {
    try {
      let query = db.from(item.table);
      let error: any = null;

      if (item.action === 'insert') {
        const { error: err } = await query.insert(item.payload);
        error = err;
      } else if (item.action === 'update') {
        if (!item.key) throw new Error("Update operation missing lookup keys");
        const { error: err } = await query.update(item.payload).match(item.key);
        error = err;
      } else if (item.action === 'upsert') {
        const { error: err } = await query.upsert(item.payload);
        error = err;
      } else if (item.action === 'delete') {
        if (!item.key) throw new Error("Delete operation missing lookup keys");
        const { error: err } = await query.delete().match(item.key);
        error = err;
      }

      if (error) {
        console.error(`[Offline Sync] Failed for table ${item.table}:`, error);
        remaining.push(item);
      } else {
        successfulSyncs++;
      }
    } catch (err) {
      console.error(`[Offline Sync] Exception syncing ${item.table}:`, err);
      remaining.push(item);
    }
  }

  saveSyncQueue(remaining);

  if (successfulSyncs > 0) {
    showSyncNotification(`Synced ${successfulSyncs} changes with Supabase!`, true);
  }
}

async function getDb(supabaseClient?: any) {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== "undefined") {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      return createClient();
    } catch {
      return supabase;
    }
  }
  return supabase;
}

export async function executeWrite(
  table: string,
  action: 'insert' | 'update' | 'upsert' | 'delete',
  payload: any,
  key?: { [key: string]: any },
  supabaseClient?: any
): Promise<{ success: boolean; error?: any }> {
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    // Enqueue
    const queue = getSyncQueue();
    const newItem: SyncItem = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      action,
      payload,
      key,
      timestamp: Date.now()
    };
    queue.push(newItem);
    saveSyncQueue(queue);

    showSyncNotification("Unable to save right now. Changes will be synced automatically.");
    return { success: false, error: new Error("Offline. Action queued.") };
  }

  try {
    const db = await getDb(supabaseClient);
    let query = db.from(table);
    let resultError: any = null;

    if (action === 'insert') {
      const { error } = await query.insert(payload);
      resultError = error;
    } else if (action === 'update') {
      if (!key) throw new Error("Missing query filters for update");
      const { error } = await query.update(payload).match(key);
      resultError = error;
    } else if (action === 'upsert') {
      const onConflict = key ? Object.keys(key).join(',') : undefined;
      const { error } = await query.upsert(payload, onConflict ? { onConflict } : undefined);
      resultError = error;
    } else if (action === 'delete') {
      if (!key) throw new Error("Missing query filters for delete");
      const { error } = await query.delete().match(key);
      resultError = error;
    }

    if (resultError) {
      // If network failure / connection timed out, enqueue too
      if (resultError.message?.includes("fetch") || resultError.status === 0 || resultError.code === "PGRST301") {
        const queue = getSyncQueue();
        queue.push({
          id: Math.random().toString(36).substring(2, 9),
          table,
          action,
          payload,
          key,
          timestamp: Date.now()
        });
        saveSyncQueue(queue);
        showSyncNotification("Connection failure. Changes will be synced automatically.");
        return { success: false, error: resultError };
      }
      return { success: false, error: resultError };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Write error: ", err);
    // Queue on any network exception
    const queue = getSyncQueue();
    queue.push({
      id: Math.random().toString(36).substring(2, 9),
      table,
      action,
      payload,
      key,
      timestamp: Date.now()
    });
    saveSyncQueue(queue);
    showSyncNotification("Sync deferred. Saved locally.");
    return { success: false, error: err };
  }
}

// Global window event listener initialization
export function initOfflineSyncListeners() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    syncQueue();
  });
}

export function generateUUID() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ (typeof crypto !== "undefined" ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.round(Math.random() * 256)) & 15 >> +c / 4).toString(16)
  );
}
