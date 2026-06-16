import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getAdminAnalyticsDashboardData } from "@/lib/db/admin-analytics";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Validate Admin credentials server-side
    const authResult = await verifyAdmin();
    if (!authResult.authorized || authResult.response) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    // 2. Fetch current statistics to feed into the prompt
    const dashboardData = await getAdminAnalyticsDashboardData();

    // 3. Retrieve Gemini API key
    const headerApiKey = request.headers.get("x-gemini-api-key");
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini API Key is missing. Please configure it in your settings or server environment.",
          needsKey: true
        },
        { status: 401 }
      );
    }

    // 4. Construct AI prompt feeding metrics
    const statsContext = {
      totalUsers: dashboardData.summary.totalUsers,
      totalApplications: dashboardData.summary.totalApplications,
      totalJobsPosted: dashboardData.summary.totalJobsPosted,
      communityMembers: dashboardData.summary.communityMembers,
      dau: dashboardData.activeUsers.dau,
      wau: dashboardData.activeUsers.wau,
      mau: dashboardData.activeUsers.mau,
      averagePri: dashboardData.placementReadiness.averagePri,
      distributionPri: dashboardData.placementReadiness.distribution,
      averageAts: dashboardData.resumeOs.averageAtsScore,
      atsScans: dashboardData.resumeOs.totalAtsScans,
      offerRate: dashboardData.applicationTracker.offerRate,
      interviewRate: dashboardData.applicationTracker.interviewRate,
      mostCommonSkills: dashboardData.skills.mostCommon.map(s => s.skill).join(", "),
      mostMissingSkills: dashboardData.skills.mostMissing.map(s => s.skill).join(", ")
    };

    const prompt = `You are a premium AI Platform Consultant and Strategic Business Analyst for BuggedBrain Placement OS.
Analyze the following platform analytics metrics and produce high-value, actionable placement insights and administrative recommendations.

PLATFORM STATS SUMMARY:
- Total Users registered: ${statsContext.totalUsers}
- Active Users: DAU=${statsContext.dau}, WAU=${statsContext.wau}, MAU=${statsContext.mau}
- Placement Readiness Index (PRI) Average: ${statsContext.averagePri}/100
- PRI Distribution counts: ${JSON.stringify(statsContext.distributionPri)}
- Resume OS Scans: Total=${statsContext.atsScans}, Avg ATS Score=${statsContext.averageAts}/100
- Applications Tracked: Total=${statsContext.totalApplications}, Interview Rate=${statsContext.interviewRate}%, Offer Rate=${statsContext.offerRate}%
- Job Board Postings: ${statsContext.totalJobsPosted}
- Community Members: ${statsContext.communityMembers}
- Most Common Student Skills: ${statsContext.mostCommonSkills}
- Most Missing Industry Skills: ${statsContext.mostMissingSkills}

CRITICAL INSTRUCTIONS:
1. Generate exactly 4 high-fidelity platform trends based on this data. These trends must highlight correlations between user actions and outcomes (e.g. "Students with ATS scores above 80 have 3.4x better interview rates" or "Karnataka represents 62% of user growth; recommend targeting local engineering colleges like RVCE and PESU").
2. Generate exactly 4 strategic recommendations for the platform admins (e.g. "Promote Resume Builder usage", "Increase Cloud Roadmap content", "Add more Data Analytics mock questions to balance the skill gaps").
3. Your response MUST be valid JSON conforming to the schema below.

JSON SCHEMA:
{
  "trends": [
    "string detail of trend 1",
    "string detail of trend 2",
    "string detail of trend 3",
    "string detail of trend 4"
  ],
  "recommendations": [
    "string recommendation 1",
    "string recommendation 2",
    "string recommendation 3",
    "string recommendation 4"
  ]
}`;

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          trends: { type: "ARRAY", items: { type: "STRING" } },
          recommendations: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["trends", "recommendations"]
      },
      temperature: 0.2,
      taskType: "admin_insights",
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { success: false, message: `Failed to compile AI insights: ${gatewayResponse.error}` },
        { status: 500 }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      return NextResponse.json(
        { success: false, message: "Invalid response structure from Gemini API." },
        { status: 500 }
      )
    }

    const result = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, ...result });

  } catch (err: any) {
    console.error("AI Insights API error:", err);
    return NextResponse.json(
      { success: false, message: "Temporary issue compiling platform insights." },
      { status: 500 }
    );
  }
}
