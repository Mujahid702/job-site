import { NextResponse } from "next/server";
import { parsePdf, parseDocx } from "@/lib/resume-parser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;
    const targetRole = formData.get("targetRole") as string | null;

    let resumeText = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
        resumeText = await parsePdf(buffer);
      } else if (
        fileName.endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        resumeText = await parseDocx(buffer);
      } else {
        return NextResponse.json(
          { error: "Unsupported file format. Please upload a PDF or DOCX file." },
          { status: 400 }
        );
      }
    } else if (pastedText && pastedText.trim() !== "") {
      resumeText = pastedText;
    } else {
      return NextResponse.json(
        { error: "Please upload a resume file or paste your resume text." },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.trim() === "") {
      return NextResponse.json(
        { error: "Could not extract text from the provided resume. Make sure it is not empty or an image-only scanned PDF." },
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

    const systemPrompt = `You are a premium explainable ATS evaluation engine, expert recruiter, and CV consultant.
Analyze the following resume text and provide a highly detailed, explainable, and role-specific ATS evaluation.
Your evaluation must be grounded in actual layout, format, and content analysis of the provided text.

CRITICAL INSTRUCTIONS:
1. Do NOT generate fake scores, random percentages, or generic templates.
2. In the "overallExplanation", you MUST explicitly explain the ATS score, explaining exactly why the candidate received that score (e.g. "Your ATS score is 78 because the resume has strong project content and relevant technical skills, but lacks several important keywords, quantified achievements, and role-specific technologies.").
3. For category scores, use the following points scale exactly:
   - **Resume Structure** (max 20)
   - **ATS Compatibility** (max 15)
   - **Skills Relevance** (max 15)
   - **Project Quality** (max 15)
   - **Experience Quality** (max 10)
   - **Keyword Coverage** (max 10)
   - **Readability** (max 10)
   - **Professional Presentation** (max 5)
   Total Score is the sum of these category scores (max 100).
4. For every single category, provide reasons (green checks, e.g. "✓ Includes clear GitHub link") and deductions (red crosses, e.g. "✗ Missing a dedicated Certifications section"). For deductions, explicitly justify why points were lost.
5. If the target role is specified as "${targetRole || 'not specified'}", evaluate the candidate's match percentage, status ("Excellent Match", "Good Match", "Needs Improvement", "Weak Match"), strong areas (green checks ✓), and weak areas (red crosses ✗). If no target role was specified, infer the candidate's natural career path and evaluate against that inferred role, while notifying them of it in the explanation.
6. Provide a natural role match breakdown (percentage and status) for all of the following 11 roles:
   - Software Engineer
   - Full Stack Developer
   - Frontend Developer
   - Backend Developer
   - Data Analyst
   - Data Scientist
   - AI/ML Engineer
   - Cloud Engineer
   - DevOps Engineer
   - Cyber Security Analyst
   - Business Analyst
7. Analyze each project individually. Provide a title, strength score (out of 10), strengths, weaknesses, and a recruiter impact assessment (High/Medium/Low).
8. Scan for ATS layout risks in the text (e.g., detected multi-column layout indicators, tables, graphs, graphics, missing headings, missing contact details) and output clear warning items with severity (High/Medium/Low) and why it hurts parsing.
9. Generate a prioritized Top 10 Improvement Roadmap, ranked from 1 to 10 by impact, detailing what to change and why.

RESUME RAW TEXT:
"""
${resumeText}
"""

TARGET ROLE:
"${targetRole || 'Not specified'}"`;

    const schema = {
      type: "OBJECT",
      properties: {
        parsedInfo: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            education: { type: "ARRAY", items: { type: "STRING" } },
            skills: { type: "ARRAY", items: { type: "STRING" } },
            projects: { type: "ARRAY", items: { type: "STRING" } },
            experience: { type: "ARRAY", items: { type: "STRING" } },
            certifications: { type: "ARRAY", items: { type: "STRING" } },
            achievements: { type: "ARRAY", items: { type: "STRING" } },
            contactInformation: {
              type: "OBJECT",
              properties: {
                email: { type: "STRING" },
                phone: { type: "STRING" },
                linkedin: { type: "STRING" },
                github: { type: "STRING" },
                portfolio: { type: "STRING" }
              },
              required: ["email", "phone"]
            }
          },
          required: ["name", "education", "skills", "projects", "experience", "contactInformation"]
        },
        overallExplanation: { type: "STRING" },
        atsScore: { type: "INTEGER" },
        categories: {
          type: "OBJECT",
          properties: {
            resumeStructure: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            atsCompatibility: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            skillsRelevance: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            projectQuality: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            experienceQuality: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            keywordCoverage: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            readability: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            },
            professionalPresentation: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                maxScore: { type: "INTEGER" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                deductions: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["score", "maxScore", "reasons", "deductions"]
            }
          },
          required: [
            "resumeStructure",
            "atsCompatibility",
            "skillsRelevance",
            "projectQuality",
            "experienceQuality",
            "keywordCoverage",
            "readability",
            "professionalPresentation"
          ]
        },
        roleMatch: {
          type: "OBJECT",
          properties: {
            matchPercentage: { type: "INTEGER" },
            targetRole: { type: "STRING" },
            status: { type: "STRING" },
            reasoning: { type: "STRING" },
            strongAreas: { type: "ARRAY", items: { type: "STRING" } },
            weakAreas: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["matchPercentage", "targetRole", "status", "reasoning", "strongAreas", "weakAreas"]
        },
        roleFitBreakdown: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              role: { type: "STRING" },
              percentage: { type: "INTEGER" },
              status: { type: "STRING" }
            },
            required: ["role", "percentage", "status"]
          }
        },
        projectsEvaluation: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              score: { type: "NUMBER" },
              maxScore: { type: "NUMBER" },
              strengths: { type: "ARRAY", items: { type: "STRING" } },
              weaknesses: { type: "ARRAY", items: { type: "STRING" } },
              recruiterImpact: { type: "STRING" }
            },
            required: ["title", "score", "maxScore", "strengths", "weaknesses", "recruiterImpact"]
          }
        },
        missingSkillsDetector: {
          type: "OBJECT",
          properties: {
            detected: { type: "ARRAY", items: { type: "STRING" } },
            missing: { type: "ARRAY", items: { type: "STRING" } },
            suggestions: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["detected", "missing", "suggestions"]
        },
        atsRisks: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              risk: { type: "STRING" },
              severity: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["risk", "severity", "explanation"]
          }
        },
        improvementRoadmap: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "INTEGER" },
              improvement: { type: "STRING" },
              impact: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["id", "improvement", "impact", "explanation"]
          }
        }
      },
      required: [
        "parsedInfo",
        "overallExplanation",
        "atsScore",
        "categories",
        "roleMatch",
        "roleFitBreakdown",
        "projectsEvaluation",
        "missingSkillsDetector",
        "atsRisks",
        "improvementRoadmap"
      ]
    };

    const payload = {
      contents: [
        {
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      }
    };

    const models = ["gemini-3.5-flash", "gemini-2.5-flash"];
    let lastErrorMsg = "";
    let lastStatus = 500;
    let response = null;

    for (const model of models) {
      console.log(`[Resume Evaluator] Calling model: ${model}`);
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          response = res;
          break;
        }

        lastStatus = res.status;
        const errorData = await res.json().catch(() => ({}));
        lastErrorMsg = errorData?.error?.message || `Gemini API returned status ${res.status}`;
        console.warn(`[Resume Evaluator] Model ${model} failed: ${lastErrorMsg}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        lastErrorMsg = errorMessage;
        lastStatus = 500;
        console.error(`[Resume Evaluator] Network error on model ${model}:`, err);
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: `AI Resume evaluation failed: ${lastErrorMsg}` },
        { status: lastStatus }
      );
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return NextResponse.json(
        { error: "Invalid response structure from Gemini API." },
        { status: 500 }
      );
    }

    const result = JSON.parse(textResponse.trim());
    return NextResponse.json({ data: result }, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to evaluate resume.";
    console.error("Resume Evaluator API error:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
