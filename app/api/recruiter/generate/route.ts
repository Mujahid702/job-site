import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAnalyticsEvent } from "@/lib/db/admin-analytics";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    // Retrieve Gemini API Key
    const headerApiKey = request.headers.get("x-gemini-api-key");
    const apiKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini API Key is missing. Please configure it in your settings or environment variables.",
          needsKey: true
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      recruiterName,
      company,
      designation,
      hiringRoles,
      messageType,
      interactionHistory,
      userName,
      skills,
      targetRole,
      college
    } = body;

    if (!company || !messageType) {
      return NextResponse.json({ success: false, message: "company and messageType are required." }, { status: 400 });
    }

    const isLinkedIn = messageType.toLowerCase().includes("linkedin") || messageType === "Connection Request";

    const systemPrompt = `You are a professional career networking consultant. Write a highly personalized, human-sounding, short, and professional outreach message from a candidate to a recruiter.

Recruiter Profile:
- Name: ${recruiterName || "Recruiter"}
- Company: ${company}
- Designation: ${designation || "Talent Acquisition"}
- Hiring For: ${hiringRoles || "Relevant Opportunities"}

Candidate Details:
- Name: ${userName || "Candidate"}
- Skills: ${Array.isArray(skills) ? skills.join(", ") : (skills || "Software Development")}
- Target Role: ${targetRole || "Software Engineer"}
- College: ${college || "Engineering College"}

Outreach Context:
- Message Type: ${messageType}
- Interaction Log: ${interactionHistory || "No previous interactions."}

Rules:
1. Tone must be warm, professional, authentic, and direct. Avoid generic marketing AI clichés like "I hope this email finds you well" unless appropriate, and avoid verbose intros.
2. Conciseness is CRITICAL:
   - For LinkedIn Connection Request: Under 280 characters.
   - For Emails (e.g. Cold Outreach, Referral Request): Under 150 words.
3. Highlight matching skills and candidate qualifications naturally.
4. Output a JSON object containing EXACTLY:
   - "subject": string (null if LinkedIn request)
   - "body": string
5. Do NOT include any markdown code blocks (e.g., \`\`\`json) in the response. Output ONLY pure, valid JSON.`;

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          subject: { type: "STRING" },
          body: { type: "STRING" }
        },
        required: ["body"]
      },
      temperature: 0.3,
      taskType: "recruiter_outreach",
      userId: user?.id,
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { success: false, message: `AI outreach generation failed: ${gatewayResponse.error}` },
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

    // Track outreach event
    await logAnalyticsEvent("message_generated", user.id, {
      company,
      messageType,
      recruiterName
    });

    return NextResponse.json({
      success: true,
      subject: result.subject || null,
      body: result.body
    });

  } catch (err: any) {
    console.error("Outreach generation API error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to generate outreach message" }, { status: 500 });
  }
}
