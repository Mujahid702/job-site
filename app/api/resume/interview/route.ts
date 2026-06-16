import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

// Helper to call Gemini API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callGemini(payload: Record<string, any>, apiKey: string, taskType: string): Promise<any> {
  const prompt = payload.contents?.[0]?.parts?.[0]?.text || "";
  const systemInstruction = payload.systemInstruction?.parts?.[0]?.text;
  const config = payload.generationConfig || {};

  const gatewayResponse = await generateResponse({
    provider: 'gemini',
    prompt,
    systemInstruction,
    apiKey,
    responseMimeType: config.responseMimeType,
    responseSchema: config.responseSchema,
    temperature: config.temperature,
    taskType: `resume_interview:${taskType}`,
  });

  if (!gatewayResponse.success) {
    throw new Error(`AI generation failed: ${gatewayResponse.error}`);
  }

  const textResponse = gatewayResponse.text;

  if (!textResponse) {
    throw new Error("Invalid response structure from Gemini API.");
  }

  return JSON.parse(textResponse.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, company, role, type, mode, limit, question, userAnswer, interviewType, targetRole, resumeText } = body;

    if (!action) {
      return NextResponse.json({ error: "Action field is required." }, { status: 400 });
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

    // Load company profiles if available
    let companyProfileContext = "";
    if (company && company !== "Other") {
      try {
        const filePath = path.join(process.cwd(), "lib", "company-profiles.json");
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, "utf8");
          const companyProfiles = JSON.parse(fileData);
          const profile = companyProfiles[company];
          if (profile) {
            companyProfileContext = `
COMPANY PROFILE FOR ${company}:
- Overview: ${profile.company_overview || ""}
- Hiring Process: ${profile.hiring_process || ""}
- Interview Style/Focus: ${profile.interview_process || ""}
- Culture: ${profile.work_culture || ""}
`;
          }
        }
      } catch (err) {
        console.error("Failed to load company profile:", err);
      }
    }

    // Action: Generate Interview Questions
    if (action === "generate") {
      const qLimit = limit || 5;
      const selectRole = role || "Software Engineer";
      const selectType = type || "Technical";

      const systemPrompt = `You are a professional corporate interviewer and technical screener. 
Generate exactly ${qLimit} unique, high-quality, non-repetitive interview questions for a candidate.

INTERVIEW CONFIGURATION:
- Company Focus: ${company || "General Tech Company"}
- Target Role: ${selectRole}
- Interview Round Type: ${selectType}
- Simulation Mode: ${mode || "Practice"}
${companyProfileContext}
${resumeText ? `\nCANDIDATE RESUME TEXT:\n${resumeText}\n` : ""}

CRITICAL DIRECTIONS:
1. Dynamically tailor the questions to test skills relevant to the target role "${selectRole}".
${resumeText ? `2. Proactively tailor questions to probe the candidate's specific background, projects, accomplishments, and tech stack details mentioned in their resume to see how deep their hands-on knowledge goes.` : ""}
3. Align question complexity and style with the interview type "${selectType}". 
   - If HR: ask about motivations, goals, behavioral scenarios, and company alignment.
   - If Technical: ask about algorithms, coding paradigms, databases, system constraints, or language specifics depending on the role.
   - If Behavioral: ask situational questions requiring STAR responses (e.g. "Tell me about a time...").
   - If System Design: ask architectural scaling questions (e.g. "How would you design a live chat backend?").
   - If Managerial: focus on conflict resolution, leadership, timeline pressures.
   - If Aptitude/Group Discussion: focus on analytical reasoning, problem framing, and presentation dynamics.
4. For each question, provide:
   - A short, helpful 'hint' to guide the candidate.
   - An 'explanation' detailing what core competency or signal the interviewer is seeking.
5. Ensure questions are diverse and avoid repeats. Do NOT output markdown code blocks outside of the JSON representation.`;

      const schema = {
        type: "OBJECT",
        properties: {
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                question: { type: "STRING" },
                hint: { type: "STRING" },
                explanation: { type: "STRING" }
              },
              required: ["id", "question", "hint", "explanation"]
            }
          }
        },
        required: ["questions"]
      };

      const payload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.7, // Add a bit of variety to avoid repeat questions
        }
      };

      const res = await callGemini(payload, apiKey, "generate_questions");
      return NextResponse.json(res, { status: 200 });
    }

    // Action: Evaluate Candidate Answer
    if (action === "evaluate") {
      if (!question || !userAnswer) {
        return NextResponse.json({ error: "Missing required fields: question and userAnswer are required." }, { status: 400 });
      }

      const currentRole = targetRole || "Software Engineer";
      const currentType = interviewType || "Technical";

      const systemPrompt = `You are an expert recruiter and hiring manager. Evaluate the user's answer to the interview question below.

CONTEXT:
- Target Role: ${currentRole}
- Interview Round Type: ${currentType}
- Target Company: ${company || "General"}
- Question Asked: "${question}"
- Candidate Answer: "${userAnswer}"
${companyProfileContext}

EVALUATION DIRECTIONS:
1. Score the answer out of 10 across these five categories:
   - Technical Accuracy: Core correctness of definitions, syntax, logic, or processes.
   - Communication: Professionalism, tone, vocabulary, and flow.
   - Clarity: Conciseness, directness, and structure.
   - Completeness: Whether all parts of the question were answered.
   - Confidence: Assertiveness, clear positioning, and lack of hesitation markers.
2. Calculate an Overall Score out of 100 based on these criteria.
3. If the interview type is "Behavioral" (or the question asks for past experience), analyze the answer specifically against the STAR method (Situation, Task, Action, Result). Check if each element is present, and provide constructive feedback on how well it was addressed. If the interview type is not behavioral, you can set the star fields to false/empty.
4. Detail exactly "What went well", "What was missing" (crucial missing keywords, concepts, or metrics), and the "Recruiter Perspective" (how a panel would perceive the response).
5. Outline the "Ideal Answer Structure" (e.g. STAR, state-claim-example) and generate a perfect, recruiter-grade "Model Answer" the candidate can study.`;

      const schema = {
        type: "OBJECT",
        properties: {
          scores: {
            type: "OBJECT",
            properties: {
              technicalAccuracy: { type: "INTEGER" },
              communication: { type: "INTEGER" },
              clarity: { type: "INTEGER" },
              completeness: { type: "INTEGER" },
              confidence: { type: "INTEGER" },
              overall: { type: "INTEGER" }
            },
            required: ["technicalAccuracy", "communication", "clarity", "completeness", "confidence", "overall"]
          },
          starAnalysis: {
            type: "OBJECT",
            properties: {
              hasSituation: { type: "BOOLEAN" },
              hasTask: { type: "BOOLEAN" },
              hasAction: { type: "BOOLEAN" },
              hasResult: { type: "BOOLEAN" },
              situationFeedback: { type: "STRING" },
              taskFeedback: { type: "STRING" },
              actionFeedback: { type: "STRING" },
              resultFeedback: { type: "STRING" }
            },
            required: ["hasSituation", "hasTask", "hasAction", "hasResult", "situationFeedback", "taskFeedback", "actionFeedback", "resultFeedback"]
          },
          whatWentWell: { type: "STRING" },
          whatWasMissing: { type: "STRING" },
          recruiterPerspective: { type: "STRING" },
          idealStructure: { type: "STRING" },
          idealAnswer: { type: "STRING" }
        },
        required: ["scores", "starAnalysis", "whatWentWell", "whatWasMissing", "recruiterPerspective", "idealStructure", "idealAnswer"]
      };

      const payload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        }
      };

      const res = await callGemini(payload, apiKey, "evaluate_answer");
      return NextResponse.json(res, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to run AI Interview Preparation API.";
    console.error("Interview API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
