import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/redis";
import { logInfo, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface MatchDetails {
  matchScore: number;
  missingSkills: string[];
  strengths: string[];
}

function calculateJobMatch(job: any, profile: any, latestAts: number, priScore: number): MatchDetails {
  let skillsScore = 0;
  let roleScore = 0;
  let locationScore = 0;

  const profileSkills = (profile?.skills || []).map((s: string) => s.toLowerCase().trim());
  const jobSkillsStr = job.required_skills || "";
  const jobSkills = jobSkillsStr
    .split(",")
    .map((s: string) => s.toLowerCase().trim())
    .filter(Boolean);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (jobSkills.length > 0) {
    jobSkills.forEach((skill: string) => {
      // Direct substring match or inclusion match
      const isMatched = profileSkills.some((ps: string) => ps.includes(skill) || skill.includes(ps));
      if (isMatched) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
    skillsScore = (matchedSkills.length / jobSkills.length) * 40; // Max 40
  } else {
    skillsScore = 40; // Default if no skills defined
  }

  // 2. Role Match (20% weight)
  const targetRole = (profile?.target_role || "Software Engineer").toLowerCase();
  const jobTitle = (job.drive_title || "").toLowerCase();
  if (jobTitle.includes(targetRole) || targetRole.includes(jobTitle)) {
    roleScore = 20;
  } else {
    // Partial fuzziness
    const titleWords = jobTitle.split(/\s+/);
    const matchedWords = titleWords.filter((w: string) => targetRole.includes(w));
    roleScore = matchedWords.length > 0 ? 12 : 5;
  }

  // 3. Location Match (10% weight)
  const preferredLocations = (profile?.preferred_locations || []).map((l: string) => l.toLowerCase().trim());
  const jobLocation = (job.location || "").toLowerCase().trim();
  if (preferredLocations.length === 0 || preferredLocations.includes("any") || preferredLocations.includes("remote")) {
    locationScore = 10;
  } else {
    const isLocMatched = preferredLocations.some((pl: string) => jobLocation.includes(pl) || pl.includes(jobLocation));
    locationScore = isLocMatched ? 10 : 3;
  }

  // 4. ATS strength (10% weight)
  const atsScore = (latestAts / 100) * 10;

  // 5. Resume / Profile Quality (10% weight)
  const profileCompletenessVal = profile?.profile_completion || 60;
  const resumeQualityScore = (profileCompletenessVal / 100) * 10;

  // 6. Readiness Score (10% weight)
  const readinessScoreVal = (priScore / 100) * 10;

  const totalScore = Math.min(
    Math.round(skillsScore + roleScore + locationScore + atsScore + resumeQualityScore + readinessScoreVal),
    100
  );

  // Map strengths (matched profile skills in title-case)
  const strengths = matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1));
  const missing = missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1));

  return {
    matchScore: totalScore,
    missingSkills: missing.slice(0, 5),
    strengths: strengths.slice(0, 5)
  };
}

// Helper to parse salary ranges for ordering
function parseSalaryMax(salaryStr: string): number {
  if (!salaryStr) return 0;
  // Parse ranges like "12 LPA", "8 - 14 LPA", "₹6,00,000"
  const clean = salaryStr.toLowerCase().replace(/[^0-9.-]/g, "");
  const parts = clean.split("-");
  const maxVal = parseFloat(parts[parts.length - 1]);
  if (isNaN(maxVal)) return 0;
  // Handle LPA scaling vs flat
  return salaryStr.toLowerCase().includes("lpa") ? maxVal * 100000 : maxVal;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const userId = user?.id || "guest-user";
    const cacheKey = `user_recommendations:${userId}`;

    if (!refresh) {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        logInfo(`Cache hit for recommendations: ${userId}`);
        return NextResponse.json({ success: true, ...cached });
      }
    }

    logInfo(`Cache miss or refresh. Generating recommendations for: ${userId}`);

    // Load active jobs
    const { data: jobPostings, error: jobsErr } = await supabase
      .from("job_postings")
      .select("*")
      .eq("is_active", true);

    if (jobsErr) {
      logError("Failed to fetch jobs for recommendations", jobsErr);
      return NextResponse.json({ success: false, message: "Database error fetching drives" }, { status: 500 });
    }

    // Load profile
    let profile: any = null;
    let latestAts = 70;
    let priScore = 60;

    if (user) {
      const { data: profRecord } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      profile = profRecord;

      const { data: scanRecord } = await supabase
        .from("resume_scans")
        .select("ats_score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (scanRecord && scanRecord.length > 0) {
        latestAts = scanRecord[0].ats_score || 70;
      }

      const { data: readRecord } = await supabase.from("placement_readiness").select("pri_score").eq("user_id", user.id).maybeSingle();
      if (readRecord) {
        priScore = readRecord.pri_score || 60;
      }
    } else {
      // Fallback for guest based on query parameters or defaults
      const paramRole = searchParams.get("target_role") || "Software Developer";
      const paramSkills = searchParams.get("skills") ? searchParams.get("skills")!.split(",") : ["React", "JavaScript"];
      profile = {
        target_role: paramRole,
        skills: paramSkills,
        preferred_locations: ["any"],
        profile_completion: 70
      };
    }

    // Calculate match scores for all active jobs
    const evaluatedJobs = (jobPostings || []).map(job => {
      const matchDetails = calculateJobMatch(job, profile, latestAts, priScore);
      return {
        ...job,
        matchDetails
      };
    });

    // Grouping
    // 1. 🔥 Best Match Jobs (matchScore >= 70, sorted descending)
    const bestMatches = [...evaluatedJobs]
      .filter(j => j.matchDetails.matchScore >= 70)
      .sort((a, b) => b.matchDetails.matchScore - a.matchDetails.matchScore);

    // 2. 🚀 High Salary Opportunities (sorted by salary descending)
    const highSalary = [...evaluatedJobs]
      .sort((a, b) => parseSalaryMax(b.salary_range) - parseSalaryMax(a.salary_range));

    // 3. 🎯 Apply Immediately Opportunities (either has direct apply tag or direct link, sorted by score)
    const fastApplying = [...evaluatedJobs]
      .filter(j => j.apply_link && !j.apply_link.includes("linkedin.com/jobs"))
      .sort((a, b) => b.matchDetails.matchScore - a.matchDetails.matchScore);

    // 4. 📈 Recently Added (created_at descending)
    const recentlyAdded = [...evaluatedJobs]
      .sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());

    const resultPayload = {
      bestMatches: bestMatches.slice(0, 10),
      highSalary: highSalary.slice(0, 10),
      fastApplying: fastApplying.slice(0, 10),
      recentlyAdded: recentlyAdded.slice(0, 10)
    };

    // Cache in Redis (15 minutes TTL)
    await setCache(cacheKey, resultPayload, 900);

    return NextResponse.json({ success: true, ...resultPayload });
  } catch (err: any) {
    logError("Recommendations api handler failed", err);
    return NextResponse.json({ success: false, message: "Server error generating suggestions" }, { status: 500 });
  }
}
