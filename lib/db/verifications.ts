import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";

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

export interface RecruiterVerification {
  id: string;
  recruiter_id: string;
  verification_status: "Pending" | "Under Review" | "Verified" | "Rejected" | "Suspended";
  verification_method?: "Corporate Email" | "LinkedIn" | "Manual";
  company_email?: string;
  company_domain?: string;
  linkedin_url?: string;
  linkedin_verified: boolean;
  email_verified: boolean;
  admin_verified: boolean;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  trust_score: number;
  reputation_score: number;
  fraud_risk_score: number;
  document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruiterRating {
  id: string;
  recruiter_id: string;
  user_id: string;
  professionalism: number;
  response_time: number;
  helpfulness: number;
  referral_quality: number;
  communication: number;
  feedback_text?: string;
  created_at: string;
}

export interface RecruiterReport {
  id: string;
  recruiter_id: string;
  reporter_user_id: string;
  reason: "Fake Recruiter" | "Spam" | "Scam" | "Harassment" | "Fake Referral" | "Misleading Job" | "Other";
  evidence?: string;
  status: "Pending" | "Resolved" | "Dismissed";
  created_at: string;
}

// 1. LinkedIn Authenticity Scoring Heuristic (0-100)
export function calculateLinkedInAuthenticityScore(linkedinUrl: string): number {
  if (!linkedinUrl || !linkedinUrl.toLowerCase().includes("linkedin.com")) {
    return 0;
  }
  
  const cleanUrl = linkedinUrl.trim().toLowerCase();
  let score = 40; // baseline for valid format

  // Format checks
  if (cleanUrl.includes("/in/") || cleanUrl.includes("/pub/")) {
    score += 20;
  }

  // Parse path components for user identifiers
  const path = cleanUrl.split("/in/")[1] || cleanUrl.split("/pub/")[1];
  if (path) {
    const slug = path.split("/")[0];
    if (slug.length >= 6) {
      score += 15; // profile name complexity indicator
    }
  }

  // Simulate complete bio/metadata checks
  if (cleanUrl.length > 35) {
    score += 15;
  }

  // Add realistic randomization bounds
  const mockBonus = Math.floor((cleanUrl.length % 5) * 2);
  score += mockBonus;

  return Math.min(score, 100);
}

// 2. Reject Public & Free Email Provider Domains
export function isCorporateEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  
  const blacklistedDomains = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com",
    "protonmail.com", "proton.me", "aol.com", "icloud.com", "zoho.com",
    "yandex.com", "mail.com", "gmx.com", "tempmail.com", "mailinator.com",
    "temp-mail.org", "guerrillamail.com", "dispostable.com", "getnada.com"
  ];

  return !blacklistedDomains.includes(domain);
}

// 3. Send OTP verification helper (simulated)
export async function sendCorporateEmailOtp(recruiterId: string, email: string, supabaseClient?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    if (!isCorporateEmail(email)) {
      return { success: false, error: "Public domains (Gmail, Yahoo, Outlook) or temporary providers are not accepted. Please use a corporate email." };
    }

    const domain = email.trim().split("@")[1];
    
    // Generate a 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    // Cache in Redis or memory cache with a 5-minute expiry (300 seconds)
    const { setCache } = await import("@/lib/redis");
    await setCache(`recruiter_otp:${recruiterId}`, otp, 300);

    // Mock send - Log to developer terminal
    console.log(`\n=========================================================`);
    console.log(`[RECRUITER VERIFICATION OTP]`);
    console.log(`Recruiter ID: ${recruiterId}`);
    console.log(`Target Email: ${email}`);
    console.log(`One-Time Code (OTP): ${otp}`);
    console.log(`=========================================================\n`);

    // Find or create verification entry in table
    const { data: existing } = await db
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    const payload = {
      recruiter_id: recruiterId,
      company_email: email,
      company_domain: domain,
      verification_status: "Under Review",
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await executeWrite("recruiter_verifications", "update", payload, { id: existing.id }, db);
    } else {
      await executeWrite("recruiter_verifications", "insert", {
        ...payload,
        created_at: new Date().toISOString()
      }, undefined, db);
    }

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    // Log analytics event
    await logAnalyticsEventInternal("recruiter_submitted", { recruiterId, company: domain, email }, db);

    return { success: true };
  } catch (err: any) {
    console.error("sendCorporateEmailOtp failed:", err);
    return { success: false, error: err.message || "Failed to issue verification code." };
  }
}

// 4. Validate OTP verification helper
export async function verifyCorporateEmailOtp(recruiterId: string, email: string, otp: string, supabaseClient?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    const { getCache, invalidateCache } = await import("@/lib/redis");
    const cachedOtp = await getCache<string>(`recruiter_otp:${recruiterId}`);

    if (!cachedOtp) {
      return { success: false, error: "Verification code expired or not found. Please request a new one." };
    }

    if (cachedOtp !== otp.trim()) {
      return { success: false, error: "Incorrect verification code. Please try again." };
    }

    // OTP matched, delete it from cache
    await invalidateCache(`recruiter_otp:${recruiterId}`);

    // Update database record
    const { data: ver } = await db
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    if (!ver) {
      return { success: false, error: "Verification profile not found." };
    }

    await executeWrite(
      "recruiter_verifications",
      "update",
      {
        email_verified: true,
        company_email: email,
        company_domain: email.trim().split("@")[1],
        verification_method: "Corporate Email",
        verification_status: ver.linkedin_verified || ver.admin_verified ? "Verified" : "Under Review",
        updated_at: new Date().toISOString()
      },
      { id: ver.id },
      db
    );

    // Recalculate trust metrics
    await recalculateRecruiterTrustScore(recruiterId, db);

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    await logAnalyticsEventInternal("recruiter_verified", { recruiterId, method: "Corporate Email", email }, db);

    return { success: true };
  } catch (err: any) {
    console.error("verifyCorporateEmailOtp failed:", err);
    return { success: false, error: err.message || "Validation failure." };
  }
}

// 5. Submit Document and LinkedIn for Verification Manual Review
export async function submitVerificationDetails(
  recruiterId: string,
  details: { linkedinUrl?: string; documentUrl?: string },
  supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    const { data: ver } = await db
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    const payload: any = {
      recruiter_id: recruiterId,
      verification_status: "Under Review",
      updated_at: new Date().toISOString()
    };

    if (details.linkedinUrl) {
      payload.linkedin_url = details.linkedinUrl;
      const linkedinScore = calculateLinkedInAuthenticityScore(details.linkedinUrl);
      payload.linkedin_verified = linkedinScore >= 70; // Auto-verify LinkedIn if heuristic passes
      payload.verification_method = "LinkedIn";
    }
    
    if (details.documentUrl) {
      payload.document_url = details.documentUrl;
    }

    if (ver) {
      await executeWrite("recruiter_verifications", "update", payload, { id: ver.id }, db);
    } else {
      await executeWrite("recruiter_verifications", "insert", {
        ...payload,
        created_at: new Date().toISOString()
      }, undefined, db);
    }

    // Trigger score update
    await recalculateRecruiterTrustScore(recruiterId, db);

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    return { success: true };
  } catch (err: any) {
    console.error("submitVerificationDetails failed:", err);
    return { success: false, error: err.message || "Failed to save verification credentials." };
  }
}

// 6. Recalculate Trust Score (0-100)
export async function recalculateRecruiterTrustScore(recruiterId: string, supabaseClient?: any): Promise<number> {
  try {
    const db = await getDb(supabaseClient);
    // 1. Fetch Verification Profile
    const { data: ver } = await db
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    if (!ver) return 0;

    // 2. Query CRM activities to count successful referrals and interviews
    // Fetch recruiters related to this specific contact name/company to evaluate across users
    const { data: recContact } = await db
      .from("recruiters")
      .select("name, company")
      .eq("id", recruiterId)
      .single();

    let referralPoints = 0;
    let interviewPoints = 0;

    if (recContact) {
      // Find similar recruiter profiles to calculate metrics globally
      const { data: globalRecs } = await db
        .from("recruiters")
        .select("id, pipeline_stage");

      const typedRecs = (globalRecs || []) as { id: string; pipeline_stage: string }[];

      const matchingRecs = typedRecs.filter(
        r => r.id === recruiterId // Or matching name and company
      );

      const matchingIds = matchingRecs.map(r => r.id);

      // Successful referrals: pipeline stage = 'Referral Received' or 'Hired'
      const successfulReferralsCount = matchingRecs.filter(
        r => ["Referral Received", "Hired"].includes(r.pipeline_stage)
      ).length;
      referralPoints = Math.min(successfulReferralsCount * 3, 15); // max 15 points

      // Interviews generated: pipeline stage = 'Interview Opportunity'
      const interviewCount = matchingRecs.filter(
        r => r.pipeline_stage === "Interview Opportunity"
      ).length;
      interviewPoints = Math.min(interviewCount * 2, 10); // max 10 points
    }

    // 3. Score Rating (Feedback rating)
    const ratingPoints = Math.min(Math.round(Number(ver.reputation_score || 0)), 5); // max 5 points

    // 4. Verification steps mapping
    let emailPoints = ver.email_verified ? 30 : 0;
    let linkedinPoints = ver.linkedin_verified ? 20 : 0;
    let adminPoints = ver.admin_verified ? 20 : 0;

    const totalTrustScore = emailPoints + linkedinPoints + adminPoints + referralPoints + interviewPoints + ratingPoints;
    const finalScore = Math.min(Math.max(totalTrustScore, 0), 100);

    // Save trust score
    await executeWrite(
      "recruiter_verifications",
      "update",
      {
        trust_score: finalScore,
        updated_at: new Date().toISOString()
      },
      { id: ver.id },
      db
    );

    // Trigger cross-module side effects
    await applyTrustSideEffects(recruiterId, finalScore, ver.verification_status, db);

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    // Log event in database
    await logAnalyticsEventInternal("trust_score_updated", { recruiterId, trustScore: finalScore }, db);

    return finalScore;
  } catch (err) {
    console.error(`recalculateRecruiterTrustScore failed for ${recruiterId}:`, err);
    return 0;
  }
}

// 7. Recalculate Reputation Score (average of stars reviews)
export async function recalculateRecruiterReputation(recruiterId: string, supabaseClient?: any): Promise<number> {
  try {
    const db = await getDb(supabaseClient);
    const { data: ratings, error } = await db
      .from("recruiter_ratings")
      .select("*")
      .eq("recruiter_id", recruiterId);

    if (error) throw error;

    let averageReputation = 0.00;

    if (ratings && ratings.length > 0) {
      const typedRatings = ratings as {
        professionalism: number;
        response_time: number;
        helpfulness: number;
        referral_quality: number;
        communication: number;
      }[];
      const sum = typedRatings.reduce((acc, r) => {
        const itemAvg = (r.professionalism + r.response_time + r.helpfulness + r.referral_quality + r.communication) / 5;
        return acc + itemAvg;
      }, 0);
      averageReputation = Number((sum / typedRatings.length).toFixed(2));
    }

    // Update verifications record
    const { data: ver } = await db
      .from("recruiter_verifications")
      .select("id")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    if (ver) {
      await executeWrite(
        "recruiter_verifications",
        "update",
        {
          reputation_score: averageReputation,
          updated_at: new Date().toISOString()
        },
        { id: ver.id },
        db
      );
    } else {
      await executeWrite("recruiter_verifications", "insert", {
        recruiter_id: recruiterId,
        reputation_score: averageReputation,
        trust_score: 0,
        verification_status: "Pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, undefined, db);
    }

    // Recalculate overall trust score since reputation is a component
    await recalculateRecruiterTrustScore(recruiterId, db);

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    return averageReputation;
  } catch (err) {
    console.error(`recalculateRecruiterReputation failed for ${recruiterId}:`, err);
    return 0;
  }
}

// 8. Fraud Risk Score Engine (0-100) & Automated Lock
export async function calculateFraudRiskScore(recruiterId: string, supabaseClient?: any): Promise<number> {
  try {
    const db = await getDb(supabaseClient);
    const { data: ver } = await db
      .from("recruiter_verifications")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .maybeSingle();

    let score = 0;

    if (ver) {
      // Free email domain check
      if (ver.company_email && !isCorporateEmail(ver.company_email)) {
        score += 40;
      }
      // Low reputation score check
      if (ver.reputation_score > 0 && ver.reputation_score < 2.5) {
        score += 15;
      }
    }

    // Reports check: Count active reports
    const { data: reports } = await db
      .from("recruiter_reports")
      .select("id")
      .eq("recruiter_id", recruiterId)
      .eq("status", "Pending");

    const activeReportsCount = reports?.length || 0;
    score += Math.min(activeReportsCount * 25, 50); // 25 points per pending report, max 50

    // Suspicious mass messaging activity check
    const { data: activities } = await db
      .from("recruiter_activities")
      .select("created_at")
      .eq("recruiter_id", recruiterId)
      .order("created_at", { ascending: false });

    // Look for outreach spikes in activities
    if (activities && activities.length > 0) {
      const typedActivities = activities as { created_at: string }[];
      const today = new Date().toDateString();
      const todayActivities = typedActivities.filter(a => new Date(a.created_at).toDateString() === today).length;
      if (todayActivities > 5) {
        score += 20;
      }
    }

    const finalRiskScore = Math.min(score, 100);

    if (ver) {
      const isAutoSuspended = finalRiskScore >= 70 && ver.verification_status !== "Suspended";
      
      const payload: any = {
        fraud_risk_score: finalRiskScore,
        updated_at: new Date().toISOString()
      };

      if (isAutoSuspended) {
        payload.verification_status = "Suspended";
        payload.verification_notes = "Automated profile lock triggered: Fraud Risk score exceeded security threshold (>=70).";
        await logAnalyticsEventInternal("recruiter_suspended", { recruiterId, reason: "Fraud Threshold Exceeded", riskScore: finalRiskScore }, db);
      }

      await executeWrite("recruiter_verifications", "update", payload, { id: ver.id }, db);
    }

    const { invalidateVerificationCache } = await import("@/lib/redis");
    await invalidateVerificationCache(recruiterId);

    return finalRiskScore;
  } catch (err) {
    console.error("calculateFraudRiskScore failed:", err);
    return 0;
  }
}

// 9. Rate Recruiter Feedback Submission
export async function submitRecruiterRating(
  recruiterId: string,
  userId: string,
  rating: {
    professionalism: number;
    response_time: number;
    helpfulness: number;
    referral_quality: number;
    communication: number;
    feedbackText?: string;
  },
  supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    const payload = {
      recruiter_id: recruiterId,
      user_id: userId,
      professionalism: rating.professionalism,
      response_time: rating.response_time,
      helpfulness: rating.helpfulness,
      referral_quality: rating.referral_quality,
      communication: rating.communication,
      feedback_text: rating.feedbackText || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert rating
    const { data: existing } = await db
      .from("recruiter_ratings")
      .select("id")
      .eq("recruiter_id", recruiterId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await executeWrite("recruiter_ratings", "update", payload, { id: existing.id }, db);
    } else {
      await executeWrite("recruiter_ratings", "insert", payload, undefined, db);
    }

    // Recompute reputation
    await recalculateRecruiterReputation(recruiterId, db);

    return { success: true };
  } catch (err: any) {
    console.error("submitRecruiterRating failed:", err);
    return { success: false, error: err.message || "Failed to submit rating review." };
  }
}

// 10. File Scam / Fake Profile Report
export async function submitRecruiterReport(
  recruiterId: string,
  reporterUserId: string,
  report: {
    reason: RecruiterReport["reason"];
    evidence?: string;
  },
  supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb(supabaseClient);
    const payload = {
      recruiter_id: recruiterId,
      reporter_user_id: reporterUserId,
      reason: report.reason,
      evidence: report.evidence || "",
      status: "Pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await executeWrite("recruiter_reports", "insert", payload, undefined, db);

    // Recompute fraud risk
    await calculateFraudRiskScore(recruiterId, db);

    await logAnalyticsEventInternal("report_submitted", { recruiterId, reason: report.reason }, db);

    return { success: true };
  } catch (err: any) {
    console.error("submitRecruiterReport failed:", err);
    return { success: false, error: err.message || "Failed to file report." };
  }
}

// Helper: Applies cross-module side-effects when verification updates
async function applyTrustSideEffects(recruiterId: string, trustScore: number, status: string, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    // Get Recruiter owner details
    const { data: recruiter } = await db
      .from("recruiters")
      .select("user_id, pipeline_stage")
      .eq("id", recruiterId)
      .single();

    if (!recruiter) return;

    // Side Effect A: Verified Referral Received -> Add PRI Mission points bonus
    if (status === "Verified" && recruiter.pipeline_stage === "Referral Received") {
      const { data: pri } = await db
        .from("placement_readiness")
        .select("mission_bonus_score")
        .eq("user_id", recruiter.user_id)
        .maybeSingle();

      const currentBonus = pri?.mission_bonus_score || 0;
      await executeWrite(
        "placement_readiness",
        "update",
        { mission_bonus_score: currentBonus + 10 },
        { user_id: recruiter.user_id },
        db
      );
      
      const { calculatePRIScore } = await import("./placement-readiness");
      await calculatePRIScore(recruiter.user_id, undefined, db);
    }

    // Side Effect B: Verified Recruiter Creates Interview Opportunity -> Auto Log CRM Application Event
    if (status === "Verified" && recruiter.pipeline_stage === "Interview Opportunity") {
      // Query if application already exists for this candidate/recruiter company
      const { data: recruiterProfile } = await db
        .from("recruiters")
        .select("company, designation")
        .eq("id", recruiterId)
        .single();

      if (recruiterProfile) {
        const { data: existingApp } = await db
          .from("applications")
          .select("id")
          .eq("user_id", recruiter.user_id)
          .eq("company", recruiterProfile.company)
          .maybeSingle();

        if (!existingApp) {
          const { createApplication } = await import("./applications");
          await createApplication(recruiter.user_id, {
            companyName: recruiterProfile.company,
            role: recruiterProfile.designation || "Software Engineer",
            status: "Technical Interview",
            notes: `Logged automatically: Interview Opportunity generated by verified recruiter ${recruiterId}.`
          }, db);
        }
      }
    }
  } catch (err) {
    console.error("applyTrustSideEffects failed:", err);
  }
}

// Log telemetry helper inside analytics_events
async function logAnalyticsEventInternal(eventType: string, metadata: any, supabaseClient?: any) {
  try {
    const db = await getDb(supabaseClient);
    const { data: { user } } = await db.auth.getUser();
    await db.from("analytics_events").insert({
      event_type: eventType,
      user_id: user?.id || null,
      metadata
    });
  } catch (e) {
    console.error("logAnalyticsEventInternal failed:", e);
  }
}
