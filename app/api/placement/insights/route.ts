import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { task, offers, applications, targetRole, averageInterviewScore, atsScore } = body;

    if (!task) {
      return NextResponse.json(
        { error: "task parameter is required ('compare-offers' or 'application-insights')." },
        { status: 400 }
      );
    }

    // Retrieve Gemini API Key
    const headerApiKey = request.headers.get("x-gemini-api-key");
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini API Key is missing. Please configure it in your settings or environment variables.",
          needsKey: true,
        },
        { status: 401 }
      );
    }

    let systemPrompt = "";
    let schema: Record<string, unknown> = {};

    if (task === "compare-offers") {
      if (!offers || !Array.isArray(offers) || offers.length === 0) {
        return NextResponse.json({ error: "offers array is required for compare-offers task." }, { status: 400 });
      }

      systemPrompt = `You are a senior career consultant and compensation negotiator.
Compare the following job offers side-by-side:
${JSON.stringify(offers, null, 2)}

Provide a detailed, professional, and objective comparison evaluating:
1. Salary & Total Compensation (CTC)
2. Career Growth & Role Potential
3. Location & Cost of Living implications
4. Skills Exposure & Tech Stack depth
5. Corporate Brand Value & Market Prestige

Format your answer as a structured JSON object containing a single key "aiRecommendation" that holds a detailed, markdown-formatted summary of the comparison, highlighting pros and cons of each, and providing a definitive, actionable choice recommendation based on maximizing professional trajectory.

Do NOT include any surrounding markdown code blocks (like \`\`\`json) in the response. Output ONLY pure, valid JSON.`;

      schema = {
        type: "OBJECT",
        properties: {
          aiRecommendation: { type: "STRING" }
        },
        required: ["aiRecommendation"]
      };

    } else if (task === "application-insights") {
      systemPrompt = `You are a high-level placement director and student career coach.
Analyze the candidate's placement application history and diagnostic scores:
- Target Career Track: ${targetRole || "Software Engineer"}
- ATS Resume Score: ${atsScore || "Unknown / Not scanned"}%
- Mock Interview Rating: ${averageInterviewScore || "Unknown / Not practiced"}%
- CRM Applications History:
${JSON.stringify(applications || [], null, 2)}

Look for patterns in outcomes (e.g., high failure rates at OAs, interviews scheduled but dropped, low resume match ratios for specific roles, etc.).
Formulate a diagnostic report indicating:
1. 3 clear Strengths (e.g. "Excellent Technical Interview conversion", "Strong initial ATS resume matches").
2. 3 critical Weaknesses (e.g. "Low Online Assessment clear-rate", "Lack of referral requesting", "Stagnant application activity").
3. 3 specific Actionable Recommendations to plug the gaps (e.g. "Register for the HR Interview Simulator", "Take mock OAs on HackerRank", "Tailor CV keywords for IBM").

Format your response as a structured JSON object with keys "strengths" (array of strings), "weaknesses" (array of strings), and "recommendations" (array of strings).

Do NOT include any surrounding markdown code blocks (like \`\`\`json) in the response. Output ONLY pure, valid JSON.`;

      schema = {
        type: "OBJECT",
        properties: {
          strengths: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          weaknesses: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          recommendations: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["strengths", "weaknesses", "recommendations"]
      };

    } else if (task === "placement-readiness") {
      const { 
        priScore,
        resumeScore,
        applicationScore,
        skillsScore,
        portfolioScore,
        linkedinScore,
        interviewScore,
        communityScore,
        consistencyScore,
        targetRole,
        skills
      } = body;

      systemPrompt = `You are a professional university placement officer and student career director.
Analyze the candidate's career parameters and Placement Readiness Index (PRI) sub-scores:
- Target Career Track: ${targetRole || "Software Engineer"}
- Overall PRI Score: ${priScore || 50} / 100
- Skills listed: ${JSON.stringify(skills || [])}

Sub-Scores Breakdown (weighted):
- Resume Readiness: ${resumeScore || 0} / 20
- Job Application Activity: ${applicationScore || 0} / 15
- Technical Skills Readiness: ${skillsScore || 0} / 20
- Portfolio Strength (Projects): ${portfolioScore || 0} / 10
- LinkedIn Optimization: ${linkedinScore || 0} / 10
- Interview Prep Simulation: ${interviewScore || 0} / 15
- Community Hub Engagement: ${communityScore || 0} / 5
- Preparation Consistency: ${consistencyScore || 0} / 5

Please construct:
1. 3 clear Strengths (e.g. "Excellent ATS Resume Score", "High LinkedIn Profile Completeness").
2. 3 critical Weaknesses (e.g. "Stagnant application tracking pipelines", "Lack of mock interview practice").
3. 3 Recommended Actions to increase PRI score (e.g. "Apply to 5 high-match full stack jobs", "Complete 2 timed mock interviews").
4. 5 dynamic, personalized roadmap steps to achieve a target score of 85+ (e.g. "Step 1: Increase resume keywords matching targeted jobs", "Step 2: Add live links to portfolio projects").

Format your response as a structured JSON object with keys:
- "strengths" (array of strings)
- "weaknesses" (array of strings)
- "recommendations" (array of strings)
- "roadmapSteps" (array of strings)

Do NOT include any surrounding markdown code blocks (like \`\`\`json) in the response. Output ONLY pure, valid JSON.`;

      schema = {
        type: "OBJECT",
        properties: {
          strengths: { type: "ARRAY", items: { type: "STRING" } },
          weaknesses: { type: "ARRAY", items: { type: "STRING" } },
          recommendations: { type: "ARRAY", items: { type: "STRING" } },
          roadmapSteps: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["strengths", "weaknesses", "recommendations", "roadmapSteps"]
      };

    } else {
      return NextResponse.json({ error: `Invalid task type: ${task}` }, { status: 400 });
    }

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
      taskType: task,
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: `AI CRM analytics generation failed: ${gatewayResponse.error}` },
        { status: 500 }
      )
    }

    const textResponse = gatewayResponse.text

    if (!textResponse) {
      return NextResponse.json(
        { error: "Invalid response structure from Gemini API." },
        { status: 500 }
      )
    }

    const result = JSON.parse(textResponse.trim());
    return NextResponse.json({ data: result }, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to run AI CRM analytics.";
    console.error("AI CRM API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
