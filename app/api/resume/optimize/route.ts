import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { resumeText, jdText } = body;

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Missing required field: resumeText is required." },
        { status: 400 }
      );
    }

    if (!jdText || !jdText.trim()) {
      return NextResponse.json(
        { error: "Missing required field: jdText is required." },
        { status: 400 }
      );
    }

    // Retrieve Gemini API Key from headers or environment
    const headerApiKey = request.headers.get("x-gemini-api-key");
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini API Key is missing. Please configure it in your environment variables as GEMINI_API_KEY.",
          needsKey: true,
        },
        { status: 401 }
      );
    }

    const systemPrompt = `You are a premium AI Resume Optimizer and career advisor.
Analyze the provided resume text and the job description (JD) text, and generate custom, tailored modifications to optimize this resume for this specific job application.

CRITICAL INSTRUCTIONS:
1. Identify 5-10 missing keywords/skills from the JD that are not present in the resume but are critical.
2. Select 3-4 weak or generic bullet points/phrases from the resume, and rewrite them into high-impact, results-oriented achievements tailored directly to the requirements in the JD. For each, explain why the optimized version stands out.
3. Draft a tailored, highly compelling 3-4 sentence professional summary statement for the top of the resume, showcasing the candidate's fit for this specific job description.
4. List 3-4 ATS-specific recommendations (e.g. section headers, technology grouping, phrasing adjustments) to maximize score potential.

RESUME TEXT:
"""
${resumeText}
"""

JOB DESCRIPTION TEXT:
"""
${jdText}
"""`;

    const schema = {
      type: "OBJECT",
      properties: {
        missingKeywords: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        optimizedBullets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              before: { type: "STRING" },
              after: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["before", "after", "explanation"]
          }
        },
        tailoredSummary: { type: "STRING" },
        atsRecommendations: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["missingKeywords", "optimizedBullets", "tailoredSummary", "atsRecommendations"]
    };

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
      taskType: "resume_optimizer",
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: `AI Resume optimization failed: ${gatewayResponse.error}` },
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
    const errorMsg = err instanceof Error ? err.message : "Failed to optimize resume.";
    console.error("Resume Optimizer API error:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
