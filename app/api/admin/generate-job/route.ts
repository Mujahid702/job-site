import { NextResponse } from "next/server";
import { getCompanyProfile, saveCompanyProfile, generateSlug, autoTag } from "@/lib/automation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawText, apiKey: bodyApiKey, sourceUrl } = body;

    if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
      return NextResponse.json(
        { error: { message: "Raw job description text is required." } },
        { status: 400 }
      );
    }

    // Get API Key
    const headerApiKey = request.headers.get("x-gemini-api-key");
    const apiKey = headerApiKey || bodyApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message:
              "Gemini API Key is missing. Please configure it in your environment variables as GEMINI_API_KEY or provide it in the Autopilot settings panel.",
            needsKey: true,
          },
        },
        { status: 401 }
      );
    }

    // 1. Extract raw company name to check in local knowledge base
    // We do a simple pre-scan of the text to find known brands
    let knownCompanyContext = "";
    let lookupName = "";
    const lowerRaw = rawText.toLowerCase();
    if (lowerRaw.includes("ibm")) {
      lookupName = "IBM";
    } else if (lowerRaw.includes("tcs") || lowerRaw.includes("tata consultancy")) {
      lookupName = "TCS";
    } else if (lowerRaw.includes("infosys")) {
      lookupName = "Infosys";
    } else if (lowerRaw.includes("wipro")) {
      lookupName = "Wipro";
    }

    let existingProfile = null;
    if (lookupName) {
      existingProfile = getCompanyProfile(lookupName);
      if (existingProfile) {
        knownCompanyContext = `
REUSABLE COMPANY PROFILE (KNOWLEDGE BASE):
Company: ${lookupName}
Overview: ${existingProfile.company_overview}
Hiring Process: ${existingProfile.hiring_process}
Interview Process: ${existingProfile.interview_process}
Work Culture: ${existingProfile.work_culture}
Salary Trends: ${existingProfile.salary_trends}

INSTRUCTION: Reuse these details exactly for any company overview, culture, hiring and interview process descriptions to maintain brand consistency. Do not generate alternative versions.
`;
        console.log(`Knowledge Base Hit: Injected pre-defined profile for ${lookupName}`);
      }
    }

    const prompt = `You are an expert ATS copywriter, technical recruiter, and SEO specialist. Analyze the following raw job description text and write a highly detailed, professional, and SEO-optimized job posting.
The output MUST be extensive, targetting **800-1200 words** of extremely high-value, comprehensive content. Format rich text sections using clean bullet points and professional paragraphs (HTML lists, subheadings, or plain linebreaks are acceptable).

You must generate detailed information for all 10 required sections:
1. **Recruitment Overview**: Introduction to the company, their mission, operations, and what makes this specific role exciting (min 150 words).
2. **Eligibility Section**: Clear requirements on degrees, graduation batches (e.g. 2026, 2025, 2024), branches, CGPA, and backlog rules.
3. **Salary Insights**: Breakdown of the salary package, stipends (if internship), bonuses, or benchmark trends.
4. **Selection Process**: Step-by-step breakdown of the hiring rounds (assessments, technical rounds, managerial/HR panel).
5. **Key Responsibilities**: Deep list of day-to-day duties, tech stacks, and team interactions.
6. **Required Skills**: Comprehensive list of required technical skills, optional tools, soft skills, and academic competencies.
7. **Resume Tips**: Tailored advice on how to customize an ATS-friendly resume specifically for this job description, highlighting keywords.
8. **Interview Questions/Tips**: 3-5 realistic technical/HR questions candidates might face for this role, complete with model answers.
9. **How To Apply**: A structured step-by-step walkthrough explaining how to complete the application process successfully.
10. **Company Insights & Work Culture**: Deep-dive into company core values, learning environment, work-life balance, and employee perks.

${knownCompanyContext}

RAW JOB DESCRIPTION TEXT:
${rawText}

INSTRUCTIONS FOR METADATA GENERATION:
- **meta_title**: Highly compelling, high-CTR meta title (max 60 chars) including company, role, year, and "Apply Now".
- **meta_description**: Catchy SEO summary including company, role, stipend/salary, and basic eligibility (max 160 chars).
- **keywords**: Comma-separated list of high-traffic keywords (e.g. "IBM hiring, IBM 2026 drive, Associate Engineer jobs").
- **company_profile**: If the company was NOT in the provided knowledge base, extract its profile (overview, hiring process, interview process, work culture, salary trends) so it can be cached in our system.`;

    const schema = {
      type: "OBJECT",
      properties: {
        drive_title: { type: "STRING" },
        company_name: { type: "STRING" },
        company_website: { type: "STRING" },
        company_logo: { type: "STRING" },
        apply_link: { type: "STRING" },
        location: { type: "STRING" },
        salary_range: { type: "STRING" },
        job_type: { type: "STRING" },
        experience_level: { type: "STRING" },
        category: { type: "STRING" },
        expiry_date: { type: "STRING" },
        
        // 10 Detailed Content Fields mapped to DB columns
        drive_description: { type: "STRING", description: "Detailed 150+ words Recruitment Overview, including How to Apply and Company Insights." },
        eligibility_criteria: { type: "STRING", description: "Bullet points detailing graduation years, degrees, branches, and GPA." },
        key_responsibilities: { type: "STRING", description: "Comprehensive bullet points of responsibilities." },
        required_skills: { type: "STRING", description: "Bullet points of required technologies and soft skills." },
        selection_process: { type: "STRING", description: "Detailed steps of the selection rounds." },
        resume_tips: { type: "STRING", description: "Custom ATS resume optimization and formatting advice." },
        interview_questions_tips: { type: "STRING", description: "3-5 specific practice questions and expert model answers." },
        
        // SEO Fields
        meta_title: { type: "STRING" },
        meta_description: { type: "STRING" },
        keywords: { type: "STRING" },
        
        // Extract New Company Profile if not exists
        company_profile: {
          type: "OBJECT",
          properties: {
            company_overview: { type: "STRING" },
            hiring_process: { type: "STRING" },
            interview_process: { type: "STRING" },
            work_culture: { type: "STRING" },
            salary_trends: { type: "STRING" }
          },
          required: ["company_overview", "hiring_process", "interview_process", "work_culture", "salary_trends"]
        }
      },
      required: [
        "drive_title",
        "company_name",
        "company_website",
        "company_logo",
        "apply_link",
        "location",
        "salary_range",
        "job_type",
        "experience_level",
        "category",
        "expiry_date",
        "drive_description",
        "eligibility_criteria",
        "key_responsibilities",
        "required_skills",
        "selection_process",
        "resume_tips",
        "interview_questions_tips",
        "meta_title",
        "meta_description",
        "keywords"
      ]
    };

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.15,
      }
    };

    const models = ["gemini-3.5-flash", "gemini-2.5-flash"];
    let lastErrorMsg = "";
    let lastStatus = 500;
    let response = null;

    for (const model of models) {
      console.log(`[AI Autopilot] Attempting content generation with model: ${model}`);
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
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
            console.log(`[AI Autopilot] Generation successful using model: ${model}`);
            break;
          }

          // If request was not ok, capture status and error details
          lastStatus = res.status;
          const errorData = await res.json().catch(() => ({}));
          lastErrorMsg = errorData?.error?.message || `Gemini API returned status ${res.status}`;
          
          console.warn(`[AI Autopilot] Model ${model} (attempt ${attempts}/${maxAttempts}) failed with status ${res.status}: ${lastErrorMsg}`);

          // Fail fast on credential errors
          if (res.status === 401 || res.status === 403) {
            return NextResponse.json(
              { error: { message: lastErrorMsg } },
              { status: res.status }
            );
          }

          // Backoff on transient / overloaded errors before retrying
          if (attempts < maxAttempts) {
            const backoffTime = attempts * 3000;
            console.log(`[AI Autopilot] Retrying model ${model} in ${backoffTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          lastErrorMsg = errorMessage;
          lastStatus = 500;
          console.error(`[AI Autopilot] Network error on model ${model} (attempt ${attempts}/${maxAttempts}):`, err);
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }

      if (response && response.ok) {
        break;
      }
    }

    if (!response || !response.ok) {
      let friendlyMessage = `AI Content Ingestion failed. Last error: ${lastErrorMsg}`;
      
      const isQuotaError = lastStatus === 429 || 
                           lastErrorMsg.toLowerCase().includes("quota") || 
                           lastErrorMsg.toLowerCase().includes("rate limit") || 
                           lastErrorMsg.toLowerCase().includes("exhausted") ||
                           lastErrorMsg.toLowerCase().includes("exceeded");

      if (isQuotaError) {
        // Try to extract exact wait time if present (e.g. Please retry in 42.931330458s)
        const retryMatch = lastErrorMsg.match(/retry in ([\d\.]+\w*)/i);
        if (retryMatch && retryMatch[1]) {
          friendlyMessage = `Gemini API Rate Limit Exceeded: Please wait ${retryMatch[1]} before retrying this operation. Your free tier API key allows up to 15 Requests Per Minute. To remove this limit, consider upgrading to a pay-as-you-go plan in Google AI Studio (https://aistudio.google.com/).`;
        } else {
          friendlyMessage = `Gemini API Rate Limit Exceeded: You have temporarily reached your free tier limits (15 Requests Per Minute / 1M Tokens Per Minute). Please wait 45-60 seconds before trying again, or configure a paid billing plan in Google AI Studio.`;
        }
      } else if (lastStatus === 503 || lastErrorMsg.toLowerCase().includes("demand") || lastErrorMsg.toLowerCase().includes("temporary")) {
        friendlyMessage = `Gemini API is currently experiencing extremely high demand. Please try again in 10-15 seconds.`;
      }

      return NextResponse.json(
        { error: { message: friendlyMessage } },
        { status: lastStatus }
      );
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return NextResponse.json(
        { error: { message: "Invalid response structure from Gemini API." } },
        { status: 500 }
      );
    }

    const result = JSON.parse(textResponse.trim());

    // --- Programmatic Post-Processing & Normalization ---

    // 1. Cleanbit logo lookup fallback
    if (!result.company_logo && result.company_website) {
      try {
        const urlStr = result.company_website.startsWith("http")
          ? result.company_website
          : `https://${result.company_website}`;
        const cleanUrl = new URL(urlStr);
        const domain = cleanUrl.hostname.replace("www.", "");
        result.company_logo = `https://logo.clearbit.com/${domain}`;
      } catch {
        // ignore fallback error
      }
    }

    // 2. Validate/Normalize Job Type
    const validJobTypes = ["Full Time", "Internship", "Remote", "Hybrid", "Contract"];
    if (result.job_type) {
      const matchedType = validJobTypes.find(
        (t) => t.toLowerCase() === result.job_type.toLowerCase()
      );
      result.job_type = matchedType || "Full Time";
    } else {
      result.job_type = "Full Time";
    }

    // 3. Validate/Normalize Experience Level
    const validExpLevels = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5+ Years"];
    if (result.experience_level) {
      const matchedExp = validExpLevels.find(
        (e) => e.toLowerCase() === result.experience_level.toLowerCase()
      );
      result.experience_level = matchedExp || "Fresher";
    } else {
      result.experience_level = "Fresher";
    }

    // 4. Validate/Normalize Category
    const validCategories = [
      "Software",
      "Core",
      "Finance",
      "AI",
      "Marketing",
      "Sales",
      "Design",
      "Management",
    ];
    if (result.category) {
      const matchedCat = validCategories.find(
        (c) => c.toLowerCase() === result.category.toLowerCase()
      );
      result.category = matchedCat || "Software";
    } else {
      result.category = "Software";
    }

    // 5. Expiry Date sanitize
    if (result.expiry_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(result.expiry_date)) {
        result.expiry_date = "";
      }
    } else {
      result.expiry_date = "";
    }

    // 6. Programmatic Slug Generation (Automation Level 4)
    result.drive_slug = generateSlug(result.company_name, result.drive_title);

    // 7. Programmatic Tag Assignment (Automation Level 6)
    result.tags = autoTag(
      result.drive_title,
      `${result.drive_description} ${result.eligibility_criteria} ${result.required_skills}`,
      result.category,
      result.job_type,
      result.experience_level
    );

    // 8. Self-Learning Knowledge Base Update (Automation Level 3)
    // If the company is not already cached, and the AI extracted a new profile, we save it!
    const companyKey = normalizeCompanyName(result.company_name);
    const existingCache = getCompanyProfile(companyKey);
    if (!existingCache && result.company_profile) {
      saveCompanyProfile(result.company_name, result.company_profile);
      console.log(`Saved new company knowledge profile for: ${result.company_name}`);
    }

    // Remove the temporary company_profile block from final response object so it fits standard DB schema
    delete result.company_profile;

    // 9. Source Tracking & Draft Workflow Metadata (Automation Level 7 & 10)
    const nowIso = new Date().toISOString();
    const metadata = {
      status: "draft",
      source_url: sourceUrl || "",
      extraction_date: nowIso,
      publish_date: null,
      last_updated_date: nowIso
    };
    
    // Serialize metadata into the approval_status column
    result.approval_status = JSON.stringify(metadata);
    result.is_active = false; // Saved as draft automatically!
    result.is_featured = false;

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process JD.";
    console.error("Gemini API handler error:", err);
    return NextResponse.json(
      { error: { message: errorMsg } },
      { status: 500 }
    );
  }
}

// Simple name helper for cache checking
function normalizeCompanyName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("ibm")) return "IBM";
  if (normalized.includes("tcs") || normalized.includes("tata consultancy")) return "TCS";
  if (normalized.includes("infosys")) return "Infosys";
  if (normalized.includes("wipro")) return "Wipro";
  return name.split(/[\s,]+/)[0];
}
