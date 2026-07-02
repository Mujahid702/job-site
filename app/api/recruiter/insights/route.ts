import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCache, setCache } from "@/lib/redis";
import { calculateRelationshipScore, calculateOpportunityScore } from "@/lib/db/recruiters";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";
    const cacheKey = `recruiter_insights:${user.id}`;

    if (!refresh) {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, ...cached });
      }
    }

    // Fetch database recruiters and activities
    const { data: recruiters } = await supabase
      .from("recruiters")
      .select("*")
      .eq("user_id", user.id);

    const { data: activities } = await supabase
      .from("recruiter_activities")
      .select("*")
      .eq("user_id", user.id);

    const rawRecList = recruiters || [];
    const actList = activities || [];

    // Fallback mapper for 12 metadata columns (in case DB schema changes haven't been applied yet)
    const mappedRecruiters = rawRecList.map(r => {
      const trustScore = r.trust_score !== undefined ? r.trust_score : (r.verification?.trust_score ?? 100);
      const verificationStatus = r.verification_status || r.verification?.verification_status || 'Verified';
      const referralSent = r.referral_sent_count ?? 0;
      const referralAccepted = r.referral_accepted_count ?? 0;
      const referralRejected = r.referral_rejected_count ?? 0;
      const interviewCount = r.interview_count ?? 0;
      const offerCount = r.offer_count ?? 0;
      const oppScore = r.opportunity_score !== undefined ? r.opportunity_score : calculateOpportunityScore(r);
      const oppLevel = r.opportunity_level || (oppScore >= 75 ? 'High Opportunity' : oppScore >= 40 ? 'Medium Opportunity' : 'Low Opportunity');

      return {
        ...r,
        trust_score: trustScore,
        verification_status: verificationStatus,
        referral_sent_count: referralSent,
        referral_accepted_count: referralAccepted,
        referral_rejected_count: referralRejected,
        interview_count: interviewCount,
        offer_count: offerCount,
        opportunity_score: oppScore,
        opportunity_level: oppLevel,
        department: r.department || "",
        company_domain: r.company_domain || "",
        recruiter_type: r.recruiter_type || null
      };
    });

    const totalRecruiters = mappedRecruiters.length;

    // Active conversation stages
    const activeConversations = mappedRecruiters.filter(r => 
      ['Connected', 'Conversation Started', 'Relationship Building', 'Referral Requested', 'Referral Received', 'Application Submitted', 'Interview Opportunity', 'Offer Pipeline'].includes(r.pipeline_stage)
    ).length;

    const verifiedRecruitersCount = mappedRecruiters.filter(r => r.verification_status === "Verified").length;
    const suspiciousRecruitersCount = mappedRecruiters.filter(r => ["Suspicious", "Potential Scam"].includes(r.verification_status)).length;

    // Response rate: recruiters who progressed past Prospecting/Lead Found/Connection Sent
    const respondedRecs = mappedRecruiters.filter(r => 
      !['Prospecting', 'Lead Found', 'Connection Sent', 'Lost'].includes(r.pipeline_stage)
    ).length;
    const responseRate = totalRecruiters > 0 ? Math.round((respondedRecs / totalRecruiters) * 100) : 0;

    // Referral Success rate
    let totalReferralsSent = mappedRecruiters.reduce((acc, r) => acc + (r.referral_sent_count || 0), 0);
    let totalReferralsAccepted = mappedRecruiters.reduce((acc, r) => acc + (r.referral_accepted_count || 0), 0);

    // If counts are 0, fallback to stage analysis
    if (totalReferralsSent === 0) {
      totalReferralsSent = mappedRecruiters.filter(r => 
        ["Referral Requested", "Referral Received", "Interview Opportunity", "Hired", "Offer Pipeline"].includes(r.pipeline_stage)
      ).length;
      totalReferralsAccepted = mappedRecruiters.filter(r => 
        ["Referral Received", "Interview Opportunity", "Hired", "Offer Pipeline"].includes(r.pipeline_stage)
      ).length;
    }
    const referralSuccessRate = totalReferralsSent > 0 ? Math.round((totalReferralsAccepted / totalReferralsSent) * 100) : 0;

    // Scores
    const relationScores = mappedRecruiters.map(r => {
      const recActs = actList.filter(a => a.recruiter_id === r.id);
      return calculateRelationshipScore(r, recActs);
    });
    const averageRelationshipScore = relationScores.length > 0 ? Math.round(relationScores.reduce((a, b) => a + b, 0) / relationScores.length) : 0;

    const oppScores = mappedRecruiters.map(r => r.opportunity_score);
    const averageOpportunityScore = oppScores.length > 0 ? Math.round(oppScores.reduce((a, b) => a + b, 0) / oppScores.length) : 0;

    const highOpportunityCount = mappedRecruiters.filter(r => r.opportunity_level === "High Opportunity").length;

    // Pending followups
    const { count: pendingFollowupsCount } = await supabase
      .from("recruiter_followups")
      .select("id", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("completed", false);

    // Funnel construction for 10 key stages
    const funnelStages = [
      "Prospecting",
      "Connected",
      "Conversation Started",
      "Relationship Building",
      "Referral Requested",
      "Referral Received",
      "Application Submitted",
      "Interview Opportunity",
      "Offer Pipeline",
      "Long-Term Network"
    ];

    const funnel = funnelStages.map(stage => {
      const count = mappedRecruiters.filter(r => r.pipeline_stage === stage).length;
      return {
        stage,
        count,
        percentage: totalRecruiters > 0 ? Math.round((count / totalRecruiters) * 100) : 0
      };
    });

    // Monthly Activity Chart Data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const activityCounts: Record<string, number> = {};
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      activityCounts[label] = 0;
    }

    actList.forEach(act => {
      const actDate = new Date(act.created_at);
      const label = `${monthNames[actDate.getMonth()]} ${actDate.getFullYear().toString().slice(-2)}`;
      if (activityCounts[label] !== undefined) {
        activityCounts[label]++;
      }
    });

    const monthlyActivities = Object.keys(activityCounts).map(month => ({
      month,
      count: activityCounts[month]
    }));

    // Group outreach response rates by Recruiter Type
    const typeGroups: Record<string, { total: number; responded: number }> = {};
    mappedRecruiters.forEach(r => {
      const type = r.recruiter_type || "Other";
      if (!typeGroups[type]) {
        typeGroups[type] = { total: 0, responded: 0 };
      }
      typeGroups[type].total++;
      if (!['Prospecting', 'Lead Found', 'Connection Sent', 'Lost'].includes(r.pipeline_stage)) {
        typeGroups[type].responded++;
      }
    });

    const successRateByType = Object.keys(typeGroups).map(type => ({
      type,
      successRate: Math.round((typeGroups[type].responded / typeGroups[type].total) * 100),
      count: typeGroups[type].total
    })).sort((a, b) => b.successRate - a.successRate);

    // Group outreach response rates by Company Category (Tier)
    const companyGroups: Record<string, { total: number; responded: number }> = {
      "FAANG & Tier 1": { total: 0, responded: 0 },
      "Growth/Mid-Market": { total: 0, responded: 0 },
      "Early-Stage Startups": { total: 0, responded: 0 },
      "Other": { total: 0, responded: 0 }
    };

    mappedRecruiters.forEach(r => {
      const company = (r.company || "").toLowerCase();
      const tags = Array.isArray(r.tags) ? r.tags.map((t: string) => t.toLowerCase()) : [];
      let category = "Other";

      const FAANG_TIER1 = ["google", "amazon", "microsoft", "apple", "meta", "nvidia", "netflix", "stripe", "uber", "airbnb"];
      if (FAANG_TIER1.some(c => company.includes(c))) {
        category = "FAANG & Tier 1";
      } else if (tags.includes("startup") || tags.includes("early-stage") || company.includes("founder") || company.includes("startup")) {
        category = "Early-Stage Startups";
      } else if (company.length > 0) {
        category = "Growth/Mid-Market";
      }

      companyGroups[category].total++;
      if (!['Prospecting', 'Lead Found', 'Connection Sent', 'Lost'].includes(r.pipeline_stage)) {
        companyGroups[category].responded++;
      }
    });

    const successRateByCompany = Object.keys(companyGroups).map(category => ({
      category,
      successRate: companyGroups[category].total > 0 ? Math.round((companyGroups[category].responded / companyGroups[category].total) * 100) : 0,
      count: companyGroups[category].total
    }));

    // High Opportunity Profiles
    const highOpportunityProfiles = [...mappedRecruiters]
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        name: r.name,
        company: r.company,
        recruiter_type: r.recruiter_type,
        opportunity_score: r.opportunity_score,
        opportunity_level: r.opportunity_level,
        verification_status: r.verification_status
      }));

    // 4. Generate Outreach Insights
    const insights: string[] = [];

    // Rule 1: High Response Rate on Recruiter Type
    const topType = successRateByType[0];
    if (topType && topType.successRate >= 50 && topType.count >= 2) {
      insights.push(`Your highest response rates come from ${topType.type} profiles (${topType.successRate}% conversion).`);
    } else {
      insights.push("Targeting Hiring Managers directly increases response rates by 2.5x compared to standard talent acquisition.");
    }

    // Rule 2: Company categories response rate
    const topComp = successRateByCompany.sort((a, b) => b.successRate - a.successRate)[0];
    if (topComp && topComp.successRate >= 40 && topComp.count >= 2) {
      insights.push(`Outreach to ${topComp.category} is highly effective, yielding a ${topComp.successRate}% connection success rate.`);
    } else {
      insights.push("Startups and early-stage firms yield higher response margins for engineering referrals.");
    }

    // Rule 3: Referral check
    if (referralSuccessRate > 60) {
      insights.push(`Your referral conversion rate is exceptional at ${referralSuccessRate}%. Keep leveraging your active network!`);
    } else {
      insights.push("Follow up on requested referrals within 3 days to increase conversion probability by 40%.");
    }

    // Rule 4: Trust levels
    if (suspiciousRecruitersCount > 0) {
      insights.push(`Warning: You have ${suspiciousRecruitersCount} profile(s) flagged as suspicious/unverified. Review details in Verification tab.`);
    } else {
      insights.push("Trust score monitoring active. Verified recruiters ensure secure conversation endpoints.");
    }

    const payload = {
      insights,
      referralSuccessRate,
      funnel,
      averageRelationshipScore,
      averageOpportunityScore,
      totalRecruiters,
      activeConversations,
      verifiedRecruitersCount,
      suspiciousRecruitersCount,
      responseRate,
      highOpportunityCount,
      pendingFollowups: pendingFollowupsCount || 0,
      monthlyActivities,
      successRateByType,
      successRateByCompany,
      highOpportunityProfiles
    };

    // Cache insights in Redis for 15 minutes
    await setCache(cacheKey, payload, 900);

    return NextResponse.json({ success: true, ...payload });

  } catch (err: any) {
    console.error("API recruiter insights GET failed:", err);
    return NextResponse.json({ success: false, message: "Server error compiling insights" }, { status: 500 });
  }
}
