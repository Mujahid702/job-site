import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    // 1. Fetch all user applications, recruiters, and profile details
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id);

    const { data: recruiters } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const applicationList = apps || [];
    const recruiterList = recruiters || [];
    const targetRole = profile?.target_role || "Software Engineer";
    const dreamCompanies = profile?.dream_companies || [];

    // --- METRIC 1: CONVERSION FUNNEL ---
    // Funnel stages: Applied -> Assessment -> Technical Interview -> HR Interview -> Offer -> Joined
    let countApplied = 0;
    let countAssessment = 0;
    let countTech = 0;
    let countHR = 0;
    let countOffer = 0;
    let countJoined = 0;

    applicationList.forEach(a => {
      const status = a.status;
      if (status !== "Saved") countApplied++;
      
      if (["Assessment Scheduled", "Assessment Completed", "Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(status)) {
        countAssessment++;
      }
      if (["Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(status)) {
        countTech++;
      }
      if (["HR Interview", "Offer Received", "Joined"].includes(status)) {
        countHR++;
      }
      if (["Offer Received", "Joined"].includes(status)) {
        countOffer++;
      }
      if (status === "Joined") {
        countJoined++;
      }
    });

    const funnel = {
      applied: countApplied,
      assessment: countAssessment,
      technical: countTech,
      hr: countHR,
      offer: countOffer,
      joined: countJoined
    };

    // --- METRIC 2: PIPELINE ACTIVE SUCCESS PROBABILITY ---
    const activePipelines = applicationList
      .filter(a => !["Saved", "Rejected", "Withdrawn", "Joined"].includes(a.status))
      .map(a => {
        const details = a.details || {};
        const resumeMatch = details.matchScore?.resumeMatch || 75;
        const readiness = details.matchScore?.interviewReadiness || 65;
        
        // Match linked recruiter to find strength
        const recInfo = recruiterList.find(r => r.application_id === a.id || r.company.toLowerCase().trim() === a.company.toLowerCase().trim());
        let relationshipBonus = 0;
        if (recInfo) {
          const strength = recInfo.relationship_strength;
          if (strength === "Strong Connection") relationshipBonus = 15;
          else if (strength === "Referral Possible") relationshipBonus = 12;
          else if (strength === "Responded") relationshipBonus = 8;
          else if (strength === "Connected") relationshipBonus = 5;
        }

        // Status bonus
        let statusBonus = 0;
        if (a.status === "Offer Received") statusBonus = 50;
        else if (a.status === "HR Interview") statusBonus = 35;
        else if (a.status === "Technical Interview") statusBonus = 20;
        else if (a.status === "Assessment Completed") statusBonus = 10;

        const rawProb = (resumeMatch * 0.3) + (readiness * 0.4) + relationshipBonus + statusBonus;
        const successProbability = Math.min(99, Math.max(15, Math.round(rawProb)));

        return {
          id: a.id,
          company: a.company,
          role: a.job_title,
          status: a.status,
          successProbability
        };
      })
      .sort((a, b) => b.successProbability - a.successProbability);

    // --- METRIC 3: ROLE & COMPANY FIT SCORES ---
    // Compute aggregate company and role fit rating arrays
    const fitScores = applicationList.map(a => {
      let companyFit = 70;
      const isDreamCompany = dreamCompanies.some((c: string) => c.toLowerCase().trim() === a.company.toLowerCase().trim());
      if (isDreamCompany) companyFit = 95;

      let roleFit = 65;
      const matchRole = a.job_title.toLowerCase();
      if (matchRole.includes(targetRole.toLowerCase()) || targetRole.toLowerCase().includes(matchRole)) {
        roleFit = 92;
      } else if (matchRole.includes("sde") || matchRole.includes("software") || matchRole.includes("developer")) {
        roleFit = 85;
      }

      return {
        id: a.id,
        company: a.company,
        role: a.job_title,
        companyFit,
        roleFit,
        overallFit: Math.round((companyFit + roleFit) / 2)
      };
    });

    // --- METRIC 4: DATA-BACKED TIMING & CONVERSIONS ---
    // Heuristic: Tuesday applications have a 1.8x higher response rate
    const weekdayMapping: Record<string, { total: number; advanced: number }> = {
      "Monday": { total: 0, advanced: 0 },
      "Tuesday": { total: 0, advanced: 0 },
      "Wednesday": { total: 0, advanced: 0 },
      "Thursday": { total: 0, advanced: 0 },
      "Friday": { total: 0, advanced: 0 },
      "Saturday": { total: 0, advanced: 0 },
      "Sunday": { total: 0, advanced: 0 }
    };

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    applicationList.forEach(a => {
      if (a.status === "Saved") return;
      const d = new Date(a.applied_date || a.created_at);
      const dayName = daysOfWeek[d.getDay()];
      if (weekdayMapping[dayName]) {
        weekdayMapping[dayName].total++;
        if (a.status !== "Applied") {
          weekdayMapping[dayName].advanced++;
        }
      }
    });

    // ATS screening pass rate
    const totalAppliedOrSaved = applicationList.length;
    const passedResumeScreen = applicationList.filter(a => !["Saved", "Applied"].includes(a.status)).length;
    const atsPassRate = totalAppliedOrSaved > 0 ? Math.round((passedResumeScreen / totalAppliedOrSaved) * 100) : 0;

    // Interview conversion trends
    const interviewCount = applicationList.filter(a => ["Technical Interview", "HR Interview", "Offer Received", "Joined"].includes(a.status)).length;
    const interviewToOfferRate = interviewCount > 0 ? Math.round((countOffer / interviewCount) * 100) : 0;

    // Best performing timing
    let bestDay = "Tuesday";
    let maxRatio = 0;
    Object.entries(weekdayMapping).forEach(([day, data]) => {
      if (data.total > 0) {
        const ratio = data.advanced / data.total;
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestDay = day;
        }
      }
    });

    // --- METRIC 5: DYNAMIC DATA-BACKED AI RECOMMENDATIONS ---
    const recommendations = [];

    if (atsPassRate < 40 && totalAppliedOrSaved > 3) {
      recommendations.push({
        id: "rec-ats",
        category: "ATS Optimization",
        title: "Align Resume to Target Job Descriptions",
        suggestion: `Your ATS screening pass rate is currently ${atsPassRate}%. Try generating targeted keywords matching ${targetRole} positions and use the JD Match tool before applying.`,
        priority: "High"
      });
    } else {
      recommendations.push({
        id: "rec-ats-good",
        category: "Resume Health",
        title: "Maintain Current Resume Keyword Match",
        suggestion: `Your ATS screening rate is high (${atsPassRate}%). Continue tailoring keywords specifically around your core stacks.`,
        priority: "Medium"
      });
    }

    if (weekdayMapping["Tuesday"].total > 0 || weekdayMapping["Wednesday"].total > 0) {
      recommendations.push({
        id: "rec-timing",
        category: "Application Timing",
        title: `Submit Applications on ${bestDay}s`,
        suggestion: `Data analysis reveals applications submitted on ${bestDay}s have the highest response rate. Batch and release submissions on ${bestDay} mornings.`,
        priority: "Medium"
      });
    }

    const unlinkedApps = applicationList.filter(a => !recruiterList.some(r => r.company.toLowerCase().trim() === a.company.toLowerCase().trim()));
    if (unlinkedApps.length > 0) {
      recommendations.push({
        id: "rec-networking",
        category: "Networking Strategy",
        title: `Find Recruiters at ${unlinkedApps[0].company}`,
        suggestion: `You have active applications at ${unlinkedApps[0].company} but no connected recruiter records. Reach out to HR personnel on LinkedIn using the LinkedIn Request outreach template.`,
        priority: "High"
      });
    }

    if (interviewToOfferRate < 30 && countAssessment > 0) {
      recommendations.push({
        id: "rec-interview",
        category: "Interview Readiness",
        title: "Focus on Technical Deep-dives",
        suggestion: `Your Assessment to Interview conversion rate is low. Practice LeetCode mediums and focus on system scalability for SDE roles.`,
        priority: "High"
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        activePipelines,
        fitScores,
        insights: {
          atsPassRate,
          interviewToOfferRate,
          bestDay,
          timingAnalytics: weekdayMapping
        },
        recommendations
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
