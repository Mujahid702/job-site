import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetRole, resumeText, averageInterviewScore, atsScore, completedProjects } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: "targetRole is required." },
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

    const systemPrompt = `You are a premium AI Career Navigator and senior technical recruiter.
Generate a personalized, highly structured career roadmap and readiness report for a candidate aiming to become a "${targetRole}".

CANDIDATE PROFILE DATA:
- Target Role: ${targetRole}
- Current Resume Text:
"""
${resumeText || "No resume uploaded yet."}
"""
- Average Mock Interview Performance: ${averageInterviewScore || "No interview history"}%
- Latest ATS Resume Scan Score: ${atsScore || "No ATS scan run"}%
- Completed Projects list: ${completedProjects ? JSON.stringify(completedProjects) : "None registered"}

CRITICAL REQUIREMENTS:
1. Generate an explainable, personalized Career Readiness Report detailing target role alignment.
2. Formulate a comprehensive Skill Gap Analysis mapping the candidate's current skills (derived from the resume) against the target role requirements. Categorize them into Strong (already has), Missing (relevant but lacking), and Critical Missing (urgent blockades).
3. Create 5 progressive roadmap stages: "Stage 1: Foundation", "Stage 2: Core Skills", "Stage 3: Projects", "Stage 4: Interview Prep", "Stage 5: Placement Ready". Populate each stage with 2-3 specific learning steps containingEstimated Time, Difficulty ("Beginner" | "Intermediate" | "Advanced"), and Priority ("High" | "Medium" | "Low").
4. Provide a Resource Library recommending practical documentation, courses, YouTube guides, or practice sites. Group them into levels (Beginner, Intermediate, Advanced).
5. Suggest 3 premium project recommendations specific to the target role. Provide Resume Impact (%), Recruiter Attraction (%), Difficulty, and Portfolio Value ratings for each.
6. Provide a Company Readiness analysis for: IBM, TCS, Infosys, Accenture, Deloitte, Capgemini, Cognizant, Wipro, and HCLTech. Estimate a match percentage (%) and list exact improvement areas for each company based on their standard recruitment benchmarks.
7. Generate a 30/60/90 Day action plan containing daily tasks, weekly tasks, and monthly goals.
8. Set up the Achievements badges system with unlock states: "Roadmap Starter", "Skill Master", "Project Builder", "Interview Ready", "Placement Ready" based on the candidate's profile metrics.

Do NOT include any surrounding markdown code blocks in the API response. Output ONLY pure, valid JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        careerReadinessReport: {
          type: "OBJECT",
          properties: {
            overview: { type: "STRING" },
            resumeDiagnostics: { type: "STRING" },
            interviewFeedback: { type: "STRING" },
            portfolioFeedback: { type: "STRING" }
          },
          required: ["overview", "resumeDiagnostics", "interviewFeedback", "portfolioFeedback"]
        },
        readinessPredictions: {
          type: "OBJECT",
          properties: {
            interviewReadiness: { type: "INTEGER" },
            placementReadiness: { type: "INTEGER" },
            industryReadiness: { type: "INTEGER" }
          },
          required: ["interviewReadiness", "placementReadiness", "industryReadiness"]
        },
        skillGap: {
          type: "OBJECT",
          properties: {
            strong: { type: "ARRAY", items: { type: "STRING" } },
            missing: { type: "ARRAY", items: { type: "STRING" } },
            critical: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["strong", "missing", "critical"]
        },
        stages: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              stageName: { type: "STRING" },
              stageIndex: { type: "INTEGER" },
              steps: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    skillName: { type: "STRING" },
                    whyItMatters: { type: "STRING" },
                    estimatedTime: { type: "STRING" },
                    difficulty: { type: "STRING" },
                    priority: { type: "STRING" }
                  },
                  required: ["skillName", "whyItMatters", "estimatedTime", "difficulty", "priority"]
                }
              }
            },
            required: ["stageName", "stageIndex", "steps"]
          }
        },
        resources: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              url: { type: "STRING" },
              type: { type: "STRING" },
              difficulty: { type: "STRING" }
            },
            required: ["title", "url", "type", "difficulty"]
          }
        },
        projects: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              desc: { type: "STRING" },
              impactScore: { type: "INTEGER" },
              recruiterAttractionScore: { type: "INTEGER" },
              difficulty: { type: "STRING" },
              portfolioValue: { type: "STRING" }
            },
            required: ["title", "desc", "impactScore", "recruiterAttractionScore", "difficulty", "portfolioValue"]
          }
        },
        companyRoadmaps: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              companyName: { type: "STRING" },
              matchPercentage: { type: "INTEGER" },
              needImprovementIn: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["companyName", "matchPercentage", "needImprovementIn"]
          }
        },
        plan306090: {
          type: "OBJECT",
          properties: {
            plan30Day: {
              type: "OBJECT",
              properties: {
                dailyTasks: { type: "ARRAY", items: { type: "STRING" } },
                weeklyTasks: { type: "ARRAY", items: { type: "STRING" } },
                monthlyGoals: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["dailyTasks", "weeklyTasks", "monthlyGoals"]
            },
            plan60Day: {
              type: "OBJECT",
              properties: {
                dailyTasks: { type: "ARRAY", items: { type: "STRING" } },
                weeklyTasks: { type: "ARRAY", items: { type: "STRING" } },
                monthlyGoals: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["dailyTasks", "weeklyTasks", "monthlyGoals"]
            },
            plan90Day: {
              type: "OBJECT",
              properties: {
                dailyTasks: { type: "ARRAY", items: { type: "STRING" } },
                weeklyTasks: { type: "ARRAY", items: { type: "STRING" } },
                monthlyGoals: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["dailyTasks", "weeklyTasks", "monthlyGoals"]
            }
          },
          required: ["plan30Day", "plan60Day", "plan90Day"]
        },
        achievements: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              unlocked: { type: "BOOLEAN" }
            },
            required: ["title", "description", "unlocked"]
          }
        }
      },
      required: [
        "careerReadinessReport",
        "readinessPredictions",
        "skillGap",
        "stages",
        "resources",
        "projects",
        "companyRoadmaps",
        "plan306090",
        "achievements"
      ]
    };

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.3,
      taskType: "resume_roadmap",
    })

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: `AI Roadmap generation failed: ${gatewayResponse.error}` },
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
    const errorMsg = err instanceof Error ? err.message : "Failed to generate AI career roadmap.";
    console.error("AI Roadmap API error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
