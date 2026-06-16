import { NextResponse } from "next/server";
import { getCompanyProfile, saveCompanyProfile, generateSlug, autoTag } from "@/lib/automation";
import { verifyAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { generateResponse } from "@/lib/ai/router";

const generateJobSchema = z.object({
  rawText: z.string().trim().min(1, "Raw text is required").max(100000, "Raw text is too long"),
  apiKey: z.string().optional().nullable(),
  sourceUrl: z.string().url("Invalid source URL").or(z.string().length(0)).optional().nullable()
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate server-side admin role
    const authResult = await verifyAdmin();
    if (!authResult.authorized) {
      return authResult.response || NextResponse.json(
        { success: false, message: "Forbidden. Admin role required." },
        { status: 403 }
      );
    }

    // 2. Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitResult = await rateLimit(ip, "scrape");
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: limitResult.headers }
      );
    }

    // 3. Zod input validation
    const body = await request.json().catch(() => ({}));
    const validation = generateJobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input fields.", errors: validation.error.flatten() },
        { status: 400, headers: limitResult.headers }
      );
    }

    const { rawText, apiKey: bodyApiKey, sourceUrl } = validation.data;

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

    const prompt = `You are an expert ATS copywriter, technical recruiter, and SEO specialist. Analyze the following raw job description text and write a highly professional, well-structured, and SEO-optimized job posting.
The output must have high readability, clear visual hierarchy, and use whitespace effectively. Every single section must be easy to scan.
Follow these strict content formatting rules:
- Avoid long paragraphs. The maximum length of any paragraph is 3-4 lines. Never generate huge blocks of text.
- Use clean headings, bullet points, and numbered lists as requested for each section.
- Incorporate appropriate professional emojis to enhance readability.

Generate detailed information for the following fields and sections in the schema:

1. **drive_description** (Strictly follow this internal sub-structure, using subheadings and double newlines for spacing):
   ### Recruitment Overview
   A short, engaging introduction to the company, their mission, operations, and what makes this specific role exciting (100–150 words). Break it into short paragraphs (3-4 lines max).
   
   ### Job Highlights
   Format exactly as bullet points with emojis:
   ✅ **Company:** [Insert Company Name]
   ✅ **Role:** [Insert Job Title]
   ✅ **Salary:** [Insert Salary Range / CTC]
   ✅ **Location:** [Insert Location / Remote / Hybrid]
   ✅ **Job Type:** [Insert Job Type, e.g., Full Time, Internship]
   ✅ **Batch Eligible:** [Insert Eligible Graduation Batches, e.g., 2024/2025/2026]
   ✅ **Experience Required:** [Insert Experience Level, e.g., Freshers / 0-1 Years]
   
   ### Salary Details
   A short, clean paragraph (3-4 lines max) describing the salary package/CTC, expected compensation or stipend details, bonuses, and potential growth opportunities in the role.
   
   ### Company Insights
   A short, clean paragraph (3-4 lines max) describing the company's background, work culture, learning environment, perks, and hiring trends.
   
   ### How To Apply
   Format exactly as a numbered list:
   1. Click on the official apply link below to access the career portal.
   2. Create or sign in to your applicant account.
   3. Complete the application form with accurate personal and professional details.
   4. Upload your optimized resume and submit your application.

2. **eligibility_criteria**:
   Must format as a clean list of bullet points starting with the '•' character. DO NOT use paragraphs.
   Example structure:
   • Any Bachelor's Degree in [relevant fields]
   • [Eligible Batches, e.g., 2024/2025/2026 Batch]
   • [Minimum CGPA or Percentage requirements, or no active backlogs]
   • [Additional requirements / prerequisites]

3. **key_responsibilities**:
   Must format as bullet points starting with '•' only. NO paragraphs. Keep each point short, punchy, and highly descriptive.
   Example structure:
   • Develop and maintain software applications using modern tech stacks
   • Collaborate with cross-functional teams to define and design new features
   • Participate in code reviews and troubleshoot engineering issues

4. **required_skills**:
   Must format as categorized bullet points starting with '•' with clear headers.
   Example structure:
   Technical Skills:
   • [Tech Skill 1]
   • [Tech Skill 2]
   
   Soft Skills:
   • [Soft Skill A]
   • [Soft Skill B]

5. **selection_process**:
   Must format strictly as a numbered list showing the stages of recruitment. Keep it very concise.
   Example structure:
   1. Resume Screening & Shortlisting
   2. Online Aptitude / Technical Assessment
   3. Technical Interview Rounds
   4. Managerial / HR Panel Discussion

6. **resume_tips**:
   Must format as a bulleted list starting with '•'.
   Provide exactly 5–7 highly actionable, customized tips on tailoring a resume specifically for this job description (e.g., highlighting key ATS keywords, tech stack, and layout formatting).

7. **interview_questions_tips**:
   Must format as a bulleted list starting with '•'.
   Provide exactly 5–7 practical, actionable interview preparation tips, including 3-5 specific questions candidates might face for this role along with brief model answers.

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
        
        // Detailed Content Fields mapped to DB columns with strict formatting instructions
        drive_description: { 
          type: "STRING", 
          description: "Recruitment Overview, Job Highlights, Salary Details, Company Insights, and How to Apply. Must be divided into clear sections with subheadings like '### Recruitment Overview', '### Job Highlights' (with ✅ bullet points), '### Salary Details', '### Company Insights', and '### How to Apply'. Keep all paragraphs under 3-4 lines max. Use whitespace." 
        },
        eligibility_criteria: { 
          type: "STRING", 
          description: "List of eligibility criteria starting with • bullet points. Include degree, graduation batches, CGPA, and backlog details." 
        },
        key_responsibilities: { 
          type: "STRING", 
          description: "List of key job responsibilities using ONLY bullet points starting with •. Keep items concise and punchy. No long paragraphs." 
        },
        required_skills: { 
          type: "STRING", 
          description: "Categorized list of skills with 'Technical Skills:' and 'Soft Skills:' sub-headers. Use • bullet points." 
        },
        selection_process: { 
          type: "STRING", 
          description: "Concise recruitment rounds structured as a numbered list (1., 2., 3., 4.)." 
        },
        resume_tips: { 
          type: "STRING", 
          description: "Exactly 5-7 customized ATS resume tips using • bullet points." 
        },
        interview_questions_tips: { 
          type: "STRING", 
          description: "Exactly 5-7 actionable interview prep tips and practice questions with model answers, using • bullet points." 
        },
        
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

    const gatewayResponse = await generateResponse({
      provider: "gemini",
      prompt,
      apiKey,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.15,
      taskType: "admin_generate_job",
    });

    if (!gatewayResponse.success) {
      const errorMsg = gatewayResponse.error || "Unknown error";
      let friendlyMessage = `AI Content Ingestion failed. Last error: ${errorMsg}`;
      
      const isQuotaError = errorMsg.toLowerCase().includes("quota") || 
                           errorMsg.toLowerCase().includes("rate limit") || 
                           errorMsg.toLowerCase().includes("exhausted") ||
                           errorMsg.toLowerCase().includes("exceeded");

      if (isQuotaError) {
        const retryMatch = errorMsg.match(/retry in ([\d\.]+\w*)/i);
        if (retryMatch && retryMatch[1]) {
          friendlyMessage = `Gemini API Rate Limit Exceeded: Please wait ${retryMatch[1]} before retrying this operation. Your free tier API key allows up to 15 Requests Per Minute. To remove this limit, consider upgrading to a pay-as-you-go plan in Google AI Studio (https://aistudio.google.com/).`;
        } else {
          friendlyMessage = `Gemini API Rate Limit Exceeded: You have temporarily reached your free tier limits (15 Requests Per Minute / 1M Tokens Per Minute). Please wait 45-60 seconds before trying again, or configure a paid billing plan in Google AI Studio.`;
        }
      } else if (errorMsg.toLowerCase().includes("demand") || errorMsg.toLowerCase().includes("temporary") || errorMsg.includes("503")) {
        friendlyMessage = `Gemini API is currently experiencing extremely high demand. Please try again in 10-15 seconds.`;
      }

      return NextResponse.json(
        { error: { message: friendlyMessage } },
        { status: 500 }
      );
    }

    const textResponse = gatewayResponse.text;

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
