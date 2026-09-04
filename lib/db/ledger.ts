import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export interface CareerLedgerEntry {
  id?: string;
  user_id: string;
  action: string;
  xp_earned: number;
  pri_increase: number;
  badge_unlocked?: string | null;
  idempotency_key?: string | null;
  created_at?: string;
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

function getLocalLedger(): CareerLedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("buggedbrain_guest_ledger");
    return stored ? JSON.parse(stored) : [
      {
        id: "l-init",
        user_id: "guest-user",
        action: "Initiated Placement Gamification System",
        xp_earned: 0,
        pri_increase: 0,
        badge_unlocked: null,
        idempotency_key: null,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
  } catch {
    return [];
  }
}

function saveLocalLedger(ledger: CareerLedgerEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("buggedbrain_guest_ledger", JSON.stringify(ledger));
  } catch (err) {
    console.error("Local storage ledger save failure:", err);
  }
}

// Logs an XP/PRI career reward entry in the ledger
export async function addLedgerEntry(
  userId: string,
  action: string,
  xpEarned: number,
  priIncrease: number,
  badgeUnlocked?: string | null,
  supabaseClient?: any,
  idempotencyKey?: string | null
): Promise<{ success: boolean; entry?: CareerLedgerEntry; alreadyAwarded?: boolean }> {
  const isGuest = !userId || userId === "guest-user";
  
  const entry: CareerLedgerEntry = {
    user_id: userId || "guest-user",
    action,
    xp_earned: xpEarned,
    pri_increase: priIncrease,
    badge_unlocked: badgeUnlocked || null,
    idempotency_key: idempotencyKey || null,
    created_at: new Date().toISOString()
  };

  if (isGuest) {
    const ledger = getLocalLedger();
    const guestEntry = { ...entry, id: `l-${Date.now()}` };
    ledger.unshift(guestEntry); // Add to top (newest first)
    saveLocalLedger(ledger);
    return { success: true, entry: guestEntry };
  }

  try {
    const db = await getDb(supabaseClient);

    // 1. Enforce Idempotency: check if key was already claimed
    if (idempotencyKey) {
      const { data: existing } = await db
        .from("career_ledger")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        console.warn(`[Ledger] Action "${action}" already rewarded with idempotency key "${idempotencyKey}". Bypassing duplicate XP allocation.`);
        return { success: true, entry: existing, alreadyAwarded: true };
      }
    }
    
    // 2. Save to Supabase using executeWrite helper
    await executeWrite("career_ledger", "insert", entry, undefined, db);
    
    return { success: true, entry };
  } catch (err) {
    console.error("Failed to add ledger entry:", err);
    return { success: false };
  }
}

// Retrieves all ledger progress records chronologically (newest first)
export async function getLedgerEntries(
  userId: string,
  supabaseClient?: any
): Promise<CareerLedgerEntry[]> {
  const isGuest = !userId || userId === "guest-user";
  if (isGuest) {
    return getLocalLedger();
  }

  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("career_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to load ledger records, returning local fallback:", err);
    return getLocalLedger();
  }
}
