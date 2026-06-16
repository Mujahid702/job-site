import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { olderResumeText, newerResumeText } = body;

    if (!olderResumeText || !newerResumeText) {
      return NextResponse.json(
        { error: "Both olderResumeText and newerResumeText are required in the request body." },
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

    const systemPrompt = `You are a premium career development coordinator and CV audit consultant.
Compare two versions of a candidate's resume (Older vs Newer) and analyze the exact changes made.

OLDER VERSION TEXT:
"""
${olderResumeText}
"""

NEWER VERSION TEXT:
"""
${newerResumeText}
"""

CRITICAL DIRECTIONS:
1. Provide a detailed audit of changes from the Older version to the Newer version.
2. In the "improvements" array, detail specific positive modifications: e.g. added quantified achievements (e.g. percentages, metrics), added GitHub projects, improved project architectures, or added technical keywords.
3. In the "regressions" array, detect any negative changes: e.g. dropped technical keywords, removed key technologies (e.g. Spring Boot, REST APIs), shortened experience sections, or lost quantified details.
4. If there are no regressions, leave the array empty or add a positive placeholder.
5. In the "summary" field, write an overview explaining how much better or worse the newer version is, along with clear directions for further improvement.
6. Provide an "atsScoreDelta" representing the estimated points change in ATS compatibility (positive if improved, negative if decreased).
7. Do NOT output markdown code blocks outside of the JSON representation.`;

    const schema = {
      type: "OBJECT",
      properties: {
        atsScoreDelta: { type: "INTEGER" },
        improvements: { type: "ARRAY", items: { type: "STRING" } },
        regressions: { type: "ARRAY", items: { type: "STRING" } },
        summary: { type: "STRING" }
      },
      required: ["atsScoreDelta", "improvements", "regressions", "summary"]
    };

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
      taskType: "resume_compare",
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: `AI Resume comparison failed: ${gatewayResponse.error}` },
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
    const errorMsg = err instanceof Error ? err.message : "Failed to compare resume versions.";
    console.error("Resume Comparer API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
