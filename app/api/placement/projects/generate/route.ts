import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetRole, targetCompany, difficulty, interestArea, resumeText } = body;

    if (!targetRole || !targetCompany || !difficulty) {
      return NextResponse.json(
        { error: "targetRole, targetCompany, and difficulty are required." },
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

    const systemPrompt = `You are a Senior Product Architect and Hiring Manager Simulation Engineer.
Generate a production-grade, highly sophisticated project blueprint tailored specifically for a candidate targeting a role.

Analyze the user's career context:
- Target Role: ${targetRole}
- Target Company: ${targetCompany}
- Selected Difficulty: ${difficulty}
- Interest Theme: ${interestArea || "General scalability and performance"}
- Resume Text Context:
"""
${resumeText || "No resume uploaded yet."}
"""

MANDATORY AI REASONING CHAIN:
You must perform a detailed engineering analysis before writing anything. Walk through:
1. Candidate's active resume details (existing skills, strengths, project experience).
2. The target role requirements and matching gaps in the candidate's profile.
3. Industry standards for the selected difficulty level.
4. Construct a comprehensive technology stack and system architecture to bridge identified gaps.
5. Create interview questions that specifically test the target skills, architecture trade-offs, database optimization, and behavioral situations.

CRITICAL INSTRUCTIONS:
1. You MUST generate a "thinking" property first showing this detailed reasoning chain.
2. ENFORCE DIFFICULTY GUIDELINES STRICTLY:
   - **Beginner**: Focus on fundamentals. CRUD actions, basic REST APIs, token validation, simple dashboards, SQLite/SQL tables.
   - **Intermediate**: Real-time features (WebSockets/SSE), role-based auth, file uploads, Redis caching layers, PostgreSQL schemas.
   - **Advanced**: Decoupled microservices, sharding, concurrency locks, message brokers (Kafka/RabbitMQ), Prometheus metrics, automated CI/CD.
3. SYSTEM ARCHITECTURE STUDIO DETAILS:
   - **architecture.systemOverview** must outline how modules interact.
   - **architecture.majorComponents** must list name, purpose, responsibilities, inputs, outputs, tech, and communications.
   - **architecture.databaseDesign** must define table structures (columns, relationships, indexes, constraints) and a detailed dataFlow.
   - **architecture.apiDesign** must list REST endpoints, request/response payload structures, auth rules, and error handling.
   - **architecture.folderStructure** must map the directory layout.
   - **architecture.deploymentOverview** must cover hosting platforms, envVars, CI/CD pipelines, and monitoring.
   - **architecture.securityConsiderations** and **architecture.scalabilityConsiderations** must detail security measures and horizontal scaling strategies.
   - **architecture.technologyJustification** must justify selections.
4. 12-PHASE ENGINEERING DEVELOPMENT TRACKER:
   - **roadmap** array must contain exactly 12 phases representing:
     - Phase 1: Requirement Analysis
     - Phase 2: System Design
     - Phase 3: Database Design
     - Phase 4: Backend APIs
     - Phase 5: Authentication
     - Phase 6: Caching Layer
     - Phase 7: Frontend UI
     - Phase 8: Testing
     - Phase 9: Deployment
     - Phase 10: Monitoring
     - Phase 11: Documentation
     - Phase 12: Resume Optimization
   - Each phase must list title, status ("Pending"), tasks (array of 3-5 sub-tasks), estimatedEffort, difficulty, dependencies, learningResources, bestPractices, recruiterExpectation, and the unlocked resumeBullet.
5. 5-LEVEL PROGRESSIVE MOCK INTERVIEWS:
    - **interviewQuestions** object must generate:
      - *level1*: Project Explanation Round (10-15 beginner-friendly questions: overview, problem, users, frontend/backend/database workflows).
      - *level2*: Technology Understanding (15-20 questions about specific frameworks/libraries/languages in the stack. E.g. React hooks, SQL indices, Python classes).
      - *level3*: Project Implementation (authentication, API communication, caching, schema design, error boundaries, security parameters).
      - *level4*: Optimization Round (scaling, load balancing, Redis caching, DB queries profiling, Docker size reduction, latency monitoring).
      - *level5*: Advanced Discussion (optional/simplified for beginners; microservices separation, distributed consensus, sharding, consensus protocols).
    - Every Q&A item in all levels MUST contain:
      - *q*: The question.
      - *a*: Short ideal answer summary.
      - *concept*: Core concept definition.
      - *explanation*: Technical explanation of how it works.
      - *realExample*: Code snippet or trace of how it applies to this project codebase.
      - *productionPerspective*: Real-world scaling, failure modes, data consistency, or security considerations.
      - *mistakes*: Common mistakes to avoid.
      - *tips*: Career interview delivery tip.
      - *followUps*: Array of 2-3 logical follow-up questions.

Output ONLY pure, valid JSON matching the schema. No markdown formatting blocks around it.`;

    const schema = {
      type: "OBJECT",
      properties: {
        thinking: { type: "STRING" },
        title: { type: "STRING" },
        problem: { type: "STRING" },
        solution: { type: "STRING" },
        features: { type: "ARRAY", items: { type: "STRING" } },
        executiveSummary: { type: "STRING" },
        businessImpact: { type: "STRING" },
        userPersonas: { type: "ARRAY", items: { type: "STRING" } },
        functionalRequirements: { type: "ARRAY", items: { type: "STRING" } },
        nonFunctionalRequirements: { type: "ARRAY", items: { type: "STRING" } },
        technicalChallenges: { type: "ARRAY", items: { type: "STRING" } },
        successMetrics: { type: "ARRAY", items: { type: "STRING" } },
        recruiterAppealAnalysis: { type: "STRING" },
        atsImpactAnalysis: { type: "STRING" },
        techStack: {
          type: "OBJECT",
          properties: {
            frontend: { type: "STRING" },
            backend: { type: "STRING" },
            database: { type: "STRING" },
            cloud: { type: "STRING" },
            monitoring: { type: "STRING" }
          },
          required: ["frontend", "backend", "database", "cloud", "monitoring"]
        },
        databaseSchema: { type: "STRING" },
        apiStructure: { type: "ARRAY", items: { type: "STRING" } },
        architecture: {
          type: "OBJECT",
          properties: {
            highLevel: { type: "STRING" },
            frontend: { type: "STRING" },
            backend: { type: "STRING" },
            database: { type: "STRING" },
            authentication: { type: "STRING" },
            apiFlow: { type: "STRING" },
            caching: { type: "STRING" },
            messageQueue: { type: "STRING" },
            cloudDeployment: { type: "STRING" },
            monitoring: { type: "STRING" },
            cicd: { type: "STRING" },
            security: { type: "STRING" },
            systemOverview: { type: "STRING" },
            architectureFlow: { type: "STRING" },
            folderStructure: { type: "STRING" },
            majorComponents: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  purpose: { type: "STRING" },
                  responsibilities: { type: "ARRAY", items: { type: "STRING" } },
                  inputs: { type: "ARRAY", items: { type: "STRING" } },
                  outputs: { type: "ARRAY", items: { type: "STRING" } },
                  technologies: { type: "ARRAY", items: { type: "STRING" } },
                  communicatesWith: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["name", "purpose", "responsibilities", "inputs", "outputs", "technologies", "communicatesWith"]
              }
            },
            databaseDesign: {
              type: "OBJECT",
              properties: {
                tables: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      purpose: { type: "STRING" },
                      columns: { type: "ARRAY", items: { type: "STRING" } },
                      relationships: { type: "ARRAY", items: { type: "STRING" } },
                      indexes: { type: "ARRAY", items: { type: "STRING" } },
                      constraints: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["name", "purpose", "columns", "relationships", "indexes", "constraints"]
                  }
                },
                dataFlow: { type: "STRING" }
              },
              required: ["tables", "dataFlow"]
            },
            apiDesign: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  endpoint: { type: "STRING" },
                  method: { type: "STRING" },
                  purpose: { type: "STRING" },
                  requestPayload: { type: "STRING" },
                  responseStructure: { type: "STRING" },
                  authentication: { type: "STRING" },
                  errorHandling: { type: "STRING" }
                },
                required: ["endpoint", "method", "purpose", "requestPayload", "responseStructure", "authentication", "errorHandling"]
              }
            },
            deploymentOverview: {
              type: "OBJECT",
              properties: {
                frontend: { type: "STRING" },
                backend: { type: "STRING" },
                database: { type: "STRING" },
                envVars: { type: "STRING" },
                cicd: { type: "STRING" },
                monitoring: { type: "STRING" }
              },
              required: ["frontend", "backend", "database", "envVars", "cicd", "monitoring"]
            },
            securityConsiderations: {
              type: "OBJECT",
              properties: {
                authentication: { type: "STRING" },
                authorization: { type: "STRING" },
                inputValidation: { type: "STRING" },
                sqlInjection: { type: "STRING" },
                xssProtection: { type: "STRING" },
                csrfProtection: { type: "STRING" },
                rateLimiting: { type: "STRING" },
                secretsManagement: { type: "STRING" },
                fileUploads: { type: "STRING" }
              },
              required: ["authentication", "authorization", "inputValidation", "sqlInjection", "xssProtection", "csrfProtection", "rateLimiting", "secretsManagement", "fileUploads"]
            },
            scalabilityConsiderations: {
              type: "OBJECT",
              properties: {
                horizontalScaling: { type: "STRING" },
                caching: { type: "STRING" },
                loadBalancing: { type: "STRING" },
                databaseOptimization: { type: "STRING" },
                messageQueues: { type: "STRING" },
                futureExpansion: { type: "STRING" }
              },
              required: ["horizontalScaling", "caching", "loadBalancing", "databaseOptimization", "messageQueues", "futureExpansion"]
            },
            technologyJustification: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  technology: { type: "STRING" },
                  reason: { type: "STRING" },
                  advantages: { type: "ARRAY", items: { type: "STRING" } },
                  limitations: { type: "ARRAY", items: { type: "STRING" } },
                  alternatives: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["technology", "reason", "advantages", "limitations", "alternatives"]
              }
            }
          },
          required: [
            "highLevel", "frontend", "backend", "database", "authentication", "apiFlow", "caching", "messageQueue", "cloudDeployment", "monitoring", "cicd", "security",
            "systemOverview", "architectureFlow", "folderStructure", "majorComponents", "databaseDesign", "apiDesign", "deploymentOverview", "securityConsiderations",
            "scalabilityConsiderations", "technologyJustification"
          ]
        },
        roadmap: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              phase: { type: "INTEGER" },
              title: { type: "STRING" },
              status: { type: "STRING" },
              tasks: { type: "ARRAY", items: { type: "STRING" } },
              estimatedEffort: { type: "STRING" },
              difficulty: { type: "STRING" },
              dependencies: { type: "STRING" },
              learningResources: { type: "ARRAY", items: { type: "STRING" } },
              bestPractices: { type: "ARRAY", items: { type: "STRING" } },
              recruiterExpectation: { type: "STRING" },
              resumeBullet: { type: "STRING" }
            },
            required: ["phase", "title", "status", "tasks", "estimatedEffort", "difficulty", "dependencies", "learningResources", "bestPractices", "recruiterExpectation", "resumeBullet"]
          }
        },
        documentation: {
          type: "OBJECT",
          properties: {
            readme: { type: "STRING" },
            resume: { type: "STRING" },
            linkedin: { type: "STRING" },
            interview: { type: "STRING" }
          },
          required: ["readme", "resume", "linkedin", "interview"]
        },
        interviewQuestions: {
          type: "OBJECT",
          properties: {
            level1: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  q: { type: "STRING" },
                  a: { type: "STRING" },
                  concept: { type: "STRING" },
                  explanation: { type: "STRING" },
                  realExample: { type: "STRING" },
                  productionPerspective: { type: "STRING" },
                  mistakes: { type: "STRING" },
                  tips: { type: "STRING" },
                  followUps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["q", "a", "concept", "explanation", "realExample", "productionPerspective", "mistakes", "tips", "followUps"]
              }
            },
            level2: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  q: { type: "STRING" },
                  a: { type: "STRING" },
                  concept: { type: "STRING" },
                  explanation: { type: "STRING" },
                  realExample: { type: "STRING" },
                  productionPerspective: { type: "STRING" },
                  mistakes: { type: "STRING" },
                  tips: { type: "STRING" },
                  followUps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["q", "a", "concept", "explanation", "realExample", "productionPerspective", "mistakes", "tips", "followUps"]
              }
            },
            level3: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  q: { type: "STRING" },
                  a: { type: "STRING" },
                  concept: { type: "STRING" },
                  explanation: { type: "STRING" },
                  realExample: { type: "STRING" },
                  productionPerspective: { type: "STRING" },
                  mistakes: { type: "STRING" },
                  tips: { type: "STRING" },
                  followUps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["q", "a", "concept", "explanation", "realExample", "productionPerspective", "mistakes", "tips", "followUps"]
              }
            },
            level4: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  q: { type: "STRING" },
                  a: { type: "STRING" },
                  concept: { type: "STRING" },
                  explanation: { type: "STRING" },
                  realExample: { type: "STRING" },
                  productionPerspective: { type: "STRING" },
                  mistakes: { type: "STRING" },
                  tips: { type: "STRING" },
                  followUps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["q", "a", "concept", "explanation", "realExample", "productionPerspective", "mistakes", "tips", "followUps"]
              }
            },
            level5: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  q: { type: "STRING" },
                  a: { type: "STRING" },
                  concept: { type: "STRING" },
                  explanation: { type: "STRING" },
                  realExample: { type: "STRING" },
                  productionPerspective: { type: "STRING" },
                  mistakes: { type: "STRING" },
                  tips: { type: "STRING" },
                  followUps: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["q", "a", "concept", "explanation", "realExample", "productionPerspective", "mistakes", "tips", "followUps"]
              }
            }
          },
          required: ["level1", "level2", "level3", "level4", "level5"]
        },
        recruiterReasoning: {
          type: "OBJECT",
          properties: {
            whyThisProject: { type: "STRING" },
            whyCompanyValuesIt: { type: "STRING" },
            hiringSignals: { type: "STRING" },
            interviewTopics: { type: "STRING" }
          },
          required: ["whyThisProject", "whyCompanyValuesIt", "hiringSignals", "interviewTopics"]
        },
        costEstimator: {
          type: "OBJECT",
          properties: {
            compute: { type: "STRING" },
            database: { type: "STRING" },
            cache: { type: "STRING" },
            storage: { type: "STRING" }
          },
          required: ["compute", "database", "cache", "storage"]
        },
        readyMeter: {
          type: "OBJECT",
          properties: {
            completion: { type: "INTEGER" },
            portfolio: { type: "INTEGER" },
            interview: { type: "INTEGER" },
            recruiter: { type: "INTEGER" }
          },
          required: ["completion", "portfolio", "interview", "recruiter"]
        },
        recruiterScore: { type: "INTEGER" },
        resumeScore: { type: "INTEGER" },
        portfolioScore: { type: "INTEGER" }
      },
      required: [
        "thinking", "title", "problem", "solution", "features", "executiveSummary", "businessImpact", "userPersonas",
        "functionalRequirements", "nonFunctionalRequirements", "technicalChallenges", "successMetrics", "recruiterAppealAnalysis", "atsImpactAnalysis",
        "techStack", "databaseSchema", "apiStructure", "architecture", "roadmap", "documentation", "interviewQuestions", "recruiterReasoning", "costEstimator", "readyMeter",
        "recruiterScore", "resumeScore", "portfolioScore"
      ]
    };

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt: systemPrompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.35,
      taskType: "project_generation"
    });

    if (!gatewayResponse.success) {
      return NextResponse.json(
        { error: `AI project compilation failed: ${gatewayResponse.error}` },
        { status: 500 }
      );
    }

    const textResponse = gatewayResponse.text;

    if (!textResponse) {
      return NextResponse.json(
        { error: "Invalid response layout from Gemini API." },
        { status: 500 }
      );
    }

    const result = JSON.parse(textResponse.trim());
    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to compile AI project blueprint.";
    console.error("AI Project Generation error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
