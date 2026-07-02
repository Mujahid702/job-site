import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

export interface LearningCertificate {
  id?: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  credential_id?: string;
  verification_url?: string;
  pdf_url?: string;
  status: 'Pending' | 'Verified' | 'Rejected' | 'Under Review';
  confidence_score?: number;
  created_at?: string;
}

const HIGH_VALUE_PROVIDERS = [
  "Google",
  "AWS",
  "Microsoft",
  "Cisco",
  "Oracle",
  "Meta",
  "IBM",
  "NPTEL",
  "Coursera",
  "Udemy Business"
];

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

// Simulated AI Verification scanner
export function runSimulatedAiValidation(
  name: string,
  issuer: string,
  credentialId?: string,
  verificationUrl?: string
): { confidenceScore: number; status: 'Pending' | 'Verified' | 'Rejected' | 'Under Review' } {
  let score = 55; // Baseline confidence

  // Credential ID checking
  if (credentialId && credentialId.trim().length > 5) {
    score += 15;
  }
  
  // Verification URL presence checks
  if (verificationUrl && verificationUrl.startsWith("http")) {
    score += 15;
  }

  // Name checking matching certificate patterns
  const normalized = name.toLowerCase();
  if (normalized.includes("cert") || normalized.includes("dsa") || normalized.includes("cloud") || normalized.includes("sql") || normalized.includes("specialization")) {
    score += 10;
  }

  // Introduce small realistic variation
  score += Math.floor(Math.random() * 9) - 4; // +/- 4 points
  score = Math.min(Math.max(score, 30), 98);

  // Status mapping
  const isHighValue = HIGH_VALUE_PROVIDERS.some(p => issuer.toLowerCase().includes(p.toLowerCase()));
  
  let status: 'Pending' | 'Verified' | 'Rejected' | 'Under Review' = 'Under Review';
  if (score >= 80 && isHighValue) {
    status = 'Verified';
  } else if (score >= 70) {
    status = 'Under Review';
  } else {
    status = 'Rejected';
  }

  return { confidenceScore: score, status };
}

// Saves a certificate to the vault and schedules simulated verification scan
export async function addCertificateToVault(
  userId: string,
  name: string,
  issuer: string,
  issueDate?: string,
  credentialId?: string,
  verificationUrl?: string,
  pdfUrl?: string,
  supabaseClient?: any
): Promise<{ success: boolean; certificate?: LearningCertificate; error?: string }> {
  const isGuest = !userId || userId === "guest-user";
  const db = await getDb(supabaseClient);

  // AI Validation calculations
  const { confidenceScore, status } = runSimulatedAiValidation(name, issuer, credentialId, verificationUrl);

  const payload: LearningCertificate = {
    user_id: userId || "guest-user",
    name,
    issuer,
    issue_date: issueDate || new Date().toISOString().split("T")[0],
    credential_id: credentialId || null as any,
    verification_url: verificationUrl || null as any,
    pdf_url: pdfUrl || "https://example.com/certificate.pdf",
    status,
    confidence_score: confidenceScore,
    created_at: new Date().toISOString()
  };

  if (isGuest) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("buggedbrain_guest_certificates");
      const list: LearningCertificate[] = stored ? JSON.parse(stored) : [];
      
      // Abuse prevention: Check duplicate credential id for guest
      if (credentialId && list.some(c => c.credential_id === credentialId)) {
        return { success: false, error: "This certificate credential has already been uploaded." };
      }

      const newCert = { ...payload, id: `cert-${Date.now()}` };
      list.unshift(newCert);
      localStorage.setItem("buggedbrain_guest_certificates", JSON.stringify(list));

      // Auto update learning missions inside checkAndVerifyMissions loop
      return { success: true, certificate: newCert };
    }
    return { success: false, error: "Window object not found." };
  }

  try {
    // Abuse prevention check in DB
    if (credentialId) {
      const { data: duplicate } = await db
        .from("learning_vault")
        .select("id")
        .eq("user_id", userId)
        .eq("credential_id", credentialId)
        .maybeSingle();

      if (duplicate) {
        return { success: false, error: "This certificate credential has already been uploaded." };
      }
    }

    // Save using executeWrite
    await executeWrite("learning_vault", "insert", payload, undefined, db);

    return { success: true, certificate: payload };
  } catch (err: any) {
    console.error("Failed to add certificate:", err);
    return { success: false, error: err?.message || "Database write failed." };
  }
}

// Retrieves all certificates registered in the vault for a student
export async function getCertificatesFromVault(
  userId: string,
  supabaseClient?: any
): Promise<LearningCertificate[]> {
  const isGuest = !userId || userId === "guest-user";
  if (isGuest) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("buggedbrain_guest_certificates");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db
      .from("learning_vault")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to query certificates, returning mock fallback:", err);
    return [];
  }
}
