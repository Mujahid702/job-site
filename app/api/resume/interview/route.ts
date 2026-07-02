import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generateResponse } from "@/lib/ai/router";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Standard Question Bank Fallbacks in case database query is empty or api key is unconfigured
const FALLBACK_QUESTIONS: Record<string, { question: string; hint: string; explanation: string }[]> = {
  "Data Analyst:Beginner:Technical": [
    { question: "What is the difference between WHERE and HAVING clauses in SQL?", hint: "WHERE filters before group aggregation; HAVING filters after group aggregation.", explanation: "Tests foundational understanding of SQL query execution order." },
    { question: "What is Excel and how does it differ from a database?", hint: "Excel is grid-based and local; databases are relational, queryable, and handle atomic transactions.", explanation: "Checks foundational understanding of database scaling vs spreadsheets." },
    { question: "What is a Primary Key in a database table?", hint: "It is a unique identifier constraint that cannot contain null values.", explanation: "Evaluates database integrity rules knowledge." },
    { question: "Difference between INNER JOIN and LEFT JOIN?", hint: "INNER returns matches; LEFT returns all left rows plus right matches.", explanation: "Checks join logics fundamentals." }
  ],
  "Data Analyst:Intermediate:Technical": [
    { question: "Explain your dashboard data pipeline architecture and how you handle data cleaning.", hint: "Discuss ETL, ingestion, cleaning rules, and target visualizations.", explanation: "Tests real project workflows capabilities." },
    { question: "How would you optimize a slow running join query in SQL?", hint: "Discuss indexes, filtering columns, and query execution plans.", explanation: "Tests query performance tuning skills." }
  ],
  "Data Analyst:Advanced:Technical": [
    { question: "How would you optimize a Power BI dashboard handling 20 million rows with complex DAX measures?", hint: "Discuss DirectQuery vs Import models, removing column aggregates, and filter contexts.", explanation: "Tests advanced enterprise data diagnostics." },
    { question: "Design an ingestion pipeline tracking real-time clickstream data.", hint: "Think of event streaming (Kafka) and warehousing (BigQuery/Snowflake).", explanation: "Tests big data system architectures design." }
  ],
  "Software Engineer:Beginner:Technical": [
    { question: "What is the difference between an Array and a Linked List?", hint: "Contiguous memory allocation vs pointer nodes.", explanation: "Tests core Data Structures concepts." },
    { question: "Explain the four pillars of Object-Oriented Programming (OOP).", hint: "Encapsulation, Inheritance, Polymorphism, Abstraction.", explanation: "Tests standard system programming principles." },
    { question: "What is a deadlock in concurrent programming?", hint: "A state where two threads are blocked forever, each waiting for the other's lock.", explanation: "Checks multithreading basics." }
  ],
  "Software Engineer:Intermediate:Technical": [
    { question: "Explain how database indexes speed up lookups, and why they slow down updates.", hint: "Think of B-Tree balanced searches vs index restructuring logs.", explanation: "Tests database design tradeoffs." },
    { question: "Compare REST APIs vs GraphQL in system integration projects.", hint: "Discuss under-fetching payload overheads vs single endpoint resolvers.", explanation: "Evaluates API architectural conventions." }
  ],
  "Software Engineer:Advanced:Technical": [
    { question: "How would you troubleshoot memory leak alerts in a production microservice?", hint: "Discuss profile dumps, garbage collection diagnostics, and connection pools leaks.", explanation: "Tests enterprise debugging capabilities." },
    { question: "Design a rate limiter for a public-facing API gateway.", hint: "Discuss token bucket algorithms, Redis caches, and lock synchronization.", explanation: "Evaluates systems scaling design." }
  ],
  "HR Round:Beginner": [
    { question: "Why do you want to work at this company?", hint: "Align your career goals with the company's projects and engineering culture.", explanation: "Evaluates candidate interest and motivation levels." },
    { question: "Where do you see yourself in five years?", hint: "Discuss professional skill mastery and contributions to technical pipelines.", explanation: "Checks career goals and alignment." }
  ]
};

// General MNC Fallback if specific search fails
const GENERAL_FALLBACKS = [
  { question: "What is the difference between Git merge and Git rebase?", hint: "Think of commit histories structures.", explanation: "Tests Git revision controls." },
  { question: "Explain what an index is in a relational database database.", hint: "Think of book index searches vs table lookups.", explanation: "Tests basic DB logic." }
];

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
    const { 
      action, 
      company, 
      role, 
      type, 
      mode, 
      question, 
      userAnswer, 
      interviewType, 
      targetRole, 
      resumeText, 
      difficulty, 
      excludeQuestions,
      previousQuestion,
      previousAnswer
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Action field is required." }, { status: 400 });
    }

    const selectRole = role || targetRole || "Software Engineer";
    const selectType = type || interviewType || "Technical";
    const currentDifficulty = difficulty || "Beginner";
    const excludes = Array.isArray(excludeQuestions) ? excludeQuestions : [];

    // Retrieve Gemini API Key from environment directly
    const apiKey = process.env.GEMINI_API_KEY;

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

    // ACTION: GENERATE QUESTION
    if (action === "generate") {
      // 1. Check if we should fetch from DB Question Bank
      let selectedQuestionItem: any = null;
      try {
        const { data: dbQuestions } = await supabase
          .from("interview_question_bank")
          .select("*")
          .eq("role", selectRole)
          .eq("difficulty", currentDifficulty)
          .eq("round_type", selectType);

        if (dbQuestions && dbQuestions.length > 0) {
          // Filter out excluded questions
          const filtered = dbQuestions.filter((q: any) => !excludes.includes(q.question));
          const list = filtered.length > 0 ? filtered : dbQuestions;
          selectedQuestionItem = list[Math.floor(Math.random() * list.length)];
        }
      } catch (dbErr) {
        console.error("Database query to question bank failed, falling back to static lists", dbErr);
      }

      // 2. Fallback to local static arrays if DB returns empty
      if (!selectedQuestionItem) {
        const fallbackKey = `${selectRole}:${currentDifficulty}:${selectType}`;
        const defaultKey = `${selectRole}:${currentDifficulty}:Technical`;
        const hrKey = `HR Round:Beginner`;
        
        let localList = FALLBACK_QUESTIONS[fallbackKey] || 
                        FALLBACK_QUESTIONS[defaultKey] || 
                        FALLBACK_QUESTIONS[hrKey] || 
                        GENERAL_FALLBACKS;

        const filtered = localList.filter(q => !excludes.includes(q.question));
        const list = filtered.length > 0 ? filtered : localList;
        selectedQuestionItem = list[Math.floor(Math.random() * list.length)];
      }

      // 3. Evaluate Hybrid Mode Paths
      // Beginner: 100% DB Question Bank
      if (currentDifficulty === "Beginner" || !apiKey) {
        return NextResponse.json({
          questions: [{
            id: selectedQuestionItem.id || "static-q",
            question: selectedQuestionItem.question,
            hint: selectedQuestionItem.hint,
            explanation: selectedQuestionItem.explanation
          }]
        });
      }

      // Intermediate: 70% Bank, 30% Gemini Personalization
      if (currentDifficulty === "Intermediate") {
        const triggerPersonalization = Math.random() < 0.3 && resumeText;
        if (!triggerPersonalization) {
          return NextResponse.json({
            questions: [{
              id: selectedQuestionItem.id || "static-q",
              question: selectedQuestionItem.question,
              hint: selectedQuestionItem.hint,
              explanation: selectedQuestionItem.explanation
            }]
          });
        }

        // Gemini Personalization Prompt
        try {
          const systemPrompt = `You are a professional corporate recruiter. Customize the following base interview question to weave in projects, skills, or achievements mentioned in the candidate's resume.
          
          Base Question: "${selectedQuestionItem.question}"
          Target Role: "${selectRole}"
          Round Type: "${selectType}"
          Candidate Resume Context:
          ${resumeText}

          DIRECTIONS:
          1. Retain the core technical focus of the base question.
          2. Personalize it naturally (e.g. "In your resume you worked on [ProjectName]. How would you apply [BaseConcept] there?").
          3. Deliver the question, a guiding hint, and interviewer focus.
          4. Do NOT output markdown code blocks outside of the JSON representation.`;

          const schema = {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              hint: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["question", "hint", "explanation"]
          };

          const payload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.6,
            }
          };

          const personalized = await callGemini(payload, apiKey, "personalize_question");
          return NextResponse.json({
            questions: [{
              id: selectedQuestionItem.id || "static-q",
              ...personalized
            }]
          });
        } catch (apiErr) {
          console.error("Gemini personalization failed, falling back to static question", apiErr);
          return NextResponse.json({
            questions: [{
              id: selectedQuestionItem.id || "static-q",
              question: selectedQuestionItem.question,
              hint: selectedQuestionItem.hint,
              explanation: selectedQuestionItem.explanation
            }]
          });
        }
      }

      // Advanced: 100% Gemini Follow-Ups (if previous question exists)
      if (currentDifficulty === "Advanced" && previousQuestion && previousAnswer) {
        try {
          const systemPrompt = `You are a tough technical interviewer at a tier-1 technology company. 
          The candidate is interviewing for target role "${selectRole}" (${selectType} round).
          
          Previous Question Asked: "${previousQuestion}"
          Candidate's Response: "${previousAnswer}"
          
          DIRECTIONS:
          1. Ask an organic, challenging follow-up question digging deeper into their previous answer (e.g., questioning trade-offs, scaling limitations, lock safety, or security details).
          2. Make it realistic, matching advanced recruiter standard loops.
          3. Output a guiding hint and interviewer explanation.
          4. Do NOT output markdown outside of the JSON.`;

          const schema = {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              hint: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["question", "hint", "explanation"]
          };

          const payload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.7,
            }
          };

          const followUp = await callGemini(payload, apiKey, "advanced_followup");
          return NextResponse.json({
            questions: [{
              id: "advanced-followup",
              ...followUp
            }]
          });
        } catch (apiErr) {
          console.error("Advanced follow-up generation failed, falling back to static question", apiErr);
        }
      }

      // Return static advanced question as fallback
      return NextResponse.json({
        questions: [{
          id: selectedQuestionItem.id || "static-q",
          question: selectedQuestionItem.question,
          hint: selectedQuestionItem.hint,
          explanation: selectedQuestionItem.explanation
        }]
      });
    }

    // ACTION: EVALUATE CANDIDATE ANSWER
    if (action === "evaluate") {
      if (!question || !userAnswer) {
        return NextResponse.json({ error: "Missing required fields: question and userAnswer are required." }, { status: 400 });
      }

      if (!apiKey) {
        // Fallback Heuristics Evaluation if API key is unconfigured (Zero API key safety fallback)
        const wordCount = userAnswer.split(/\s+/).filter(Boolean).length;
        let mockScore = 55;
        if (wordCount > 40) mockScore = 85;
        else if (wordCount > 20) mockScore = 72;

        return NextResponse.json({
          scores: {
            technicalAccuracy: Math.round(mockScore / 10),
            communication: Math.round((mockScore - 5) / 10),
            clarity: Math.round(mockScore / 10),
            completeness: Math.round((mockScore + 5) / 10),
            confidence: Math.round(mockScore / 10),
            problemSolving: Math.round((mockScore - 2) / 10),
            overall: mockScore
          },
          starAnalysis: {
            hasSituation: wordCount > 25,
            hasTask: wordCount > 35,
            hasAction: wordCount > 45,
            hasResult: wordCount > 55,
            situationFeedback: "Context details present.",
            taskFeedback: "Identified milestones.",
            actionFeedback: "Discussed execution steps.",
            resultFeedback: "Metrics specified."
          },
          whatWentWell: "Articulated response length is good. Basic structure was followed.",
          whatWasMissing: "Profound technical depth or architectural trade-offs could be improved. AI services are temporarily running in fallback mode.",
          recruiterPerspective: "The panel would see you as cooperative, but requiring deeper practice on advanced scaling parameters.",
          idealStructure: "Situation -> Task -> Action -> Result (STAR)",
          idealAnswer: "In our project, when scaling the API pipeline (Situation), I was tasked with latency tuning (Task). I built a Redis cache (Action) resulting in a 40% query latency drop (Result)."
        });
      }

      // Standard Gemini API Evaluation
      const systemPrompt = `You are an expert recruiter and hiring manager. Evaluate the user's answer to the interview question below.
 
      CONTEXT:
      - Target Role: ${selectRole}
      - Interview Round Type: ${selectType}
      - Target Company: ${company || "General"}
      - Question Asked: "${question}"
      - Candidate Answer: "${userAnswer}"
      ${companyProfileContext}
      
      EVALUATION DIRECTIONS:
      1. Score the answer out of 10 across these six categories:
         - Technical Accuracy: Core correctness of definitions, syntax, logic, or processes.
         - Communication: Professionalism, tone, vocabulary, and flow.
         - Clarity: Conciseness, directness, and structure.
         - Completeness: Whether all parts of the question were answered.
         - Confidence: Assertiveness, clear positioning, and lack of hesitation markers.
         - Problem Solving: Analytical approach, STAR structure details, or scenario analysis.
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
              problemSolving: { type: "INTEGER" },
              overall: { type: "INTEGER" }
            },
            required: ["technicalAccuracy", "communication", "clarity", "completeness", "confidence", "problemSolving", "overall"]
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
    return NextResponse.json({ error: "AI Services Temporarily Unavailable" }, { status: 500 });
  }
}
