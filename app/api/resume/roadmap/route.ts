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
1. You MUST generate a "thinking" property first. In this section, perform a rigorous step-by-step chain of thought:
   - Identify the user's current background, strengths, weaknesses, and targets.
   - Outline the genuine skills and certifications required for a high-performing candidate in the target role.
   - Map a logical, customized roadmap stage progression to close key skill gaps.
   - Ground all recommendations, resource links, project suggestions, and company matching scores directly in this reasoning steps block.
2. Generate an explainable, personalized Career Readiness Report detailing target role alignment.
3. Formulate a comprehensive Skill Gap Analysis mapping the candidate's current skills (derived from the resume) against the target role requirements. Categorize them into Strong (already has), Missing (relevant but lacking), and Critical Missing (urgent blockades).
4. Create 5 progressive roadmap stages: "Stage 1: Foundation", "Stage 2: Core Skills", "Stage 3: Projects", "Stage 4: Interview Prep", "Stage 5: Placement Ready". Populate each stage with:
      - *estimatedDuration*: Time required (e.g. "10 Days", "2 Weeks").
      - *difficulty*: Stage complexity ("Beginner" | "Intermediate" | "Advanced").
      - *expectedOutcome*: Clear description of what the candidate will achieve.
      - *skillsCovered*: Array of specific skills learned in this stage.
      - *recruiterImportance*: How much recruiters prioritize this stage ("High" | "Medium" | "Low").
      - *learningResources*: Curated links specific to this stage (Official Documentation, YouTube Playlists, Practice Websites, etc.).
      - *actionChecklist*: Array of 3-5 trackable tasks (e.g. "Learn SQL Joins", "Complete 20 LeetCode SQL challenges") with status "Pending", a verification status (e.g. "Verifies via Assessment OS score", "Verifies via Project OS upload", "Self-Reported"), and an xpReward (between 100-300).
5. Provide a Resource Library recommending practical documentation, courses, YouTube guides, or practice sites. Group them into levels (Beginner, Intermediate, Advanced).
6. Suggest 3 premium project recommendations specific to the target role. Provide Resume Impact (%), Recruiter Attraction (%), Difficulty, and Portfolio Value ratings for each.
7. Provide a Company Readiness analysis for: IBM, TCS, Infosys, Accenture, Deloitte, Capgemini, Cognizant, Wipro, and HCLTech. Estimate a match percentage (%) and list exact improvement areas for each company based on their standard recruitment benchmarks.
8. Generate a 30/60/90 Day action plan containing daily tasks, weekly tasks, and monthly goals.
9. Set up the Achievements badges system with unlock states: "Roadmap Starter", "Skill Master", "Project Builder", "Interview Ready", "Placement Ready" based on the candidate's profile metrics.

Do NOT include any surrounding markdown code blocks in the API response. Output ONLY pure, valid JSON matching the schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        thinking: {
          type: "STRING",
          description: "Step-by-step reasoning chain about candidate profile analysis, target role requirements, and customization plans. Generated first."
        },
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
              estimatedDuration: { type: "STRING" },
              difficulty: { type: "STRING" },
              expectedOutcome: { type: "STRING" },
              skillsCovered: { type: "ARRAY", items: { type: "STRING" } },
              recruiterImportance: { type: "STRING" },
              learningResources: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    url: { type: "STRING" },
                    type: { type: "STRING" }
                  },
                  required: ["title", "url", "type"]
                }
              },
              actionChecklist: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    taskName: { type: "STRING" },
                    status: { type: "STRING" },
                    verificationStatus: { type: "STRING" },
                    xpReward: { type: "INTEGER" }
                  },
                  required: ["taskName", "status", "verificationStatus", "xpReward"]
                }
              }
            },
            required: ["stageName", "stageIndex", "estimatedDuration", "difficulty", "expectedOutcome", "skillsCovered", "recruiterImportance", "learningResources", "actionChecklist"]
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
        "thinking",
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
