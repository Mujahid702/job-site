import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateResponse } from "@/lib/ai/router";
import { invalidateUserCache } from "@/lib/redis";
import { triggerMissionProgress } from "@/lib/db/missions";

export const dynamic = "force-dynamic";

function getEmailBody(payload: any): string {
  if (!payload) return "";
  
  const decodeGmailBase64 = (data: string) => {
    try {
      const cleaned = data.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(cleaned, "base64").toString("utf-8");
    } catch {
      return "";
    }
  };

  if (payload.mimeType === "text/plain" && payload.body && payload.body.data) {
    return decodeGmailBase64(payload.body.data);
  }
  if (payload.mimeType === "text/html" && payload.body && payload.body.data) {
    const text = decodeGmailBase64(payload.body.data);
    return text.replace(/<[^>]*>/g, " "); // Basic HTML strip
  }
  if (payload.parts) {
    let body = "";
    for (const part of payload.parts) {
      body += getEmailBody(part) + "\n";
    }
    return body;
  }
  if (payload.body && payload.body.data) {
    return decodeGmailBase64(payload.body.data);
  }
  return "";
}

export function generateInterviewPrepMaterial(company: string, role: string, roundType: string) {
  const checklist = [
    "Review your resume projects and be ready to explain architectural choices",
    "Research the company values, culture, and recent news",
    "Prepare 3-5 thoughtful questions to ask the interviewer",
    "Test your meeting setup (camera, microphone, internet speed, quiet space)",
    "Prepare clean attire and check meeting software (Google Meet / Zoom)"
  ];

  let companyTasks = [
    `Study ${company}'s core business model and products`,
    `Review past interview experiences at ${company} on Glassdoor/GeeksforGeeks`,
    `Check standard interview structure for ${company}`
  ];

  if (company.toLowerCase().includes("google")) {
    companyTasks = [
      "Review Google's 3-step coding review rubric (Googley/Leadership, DSA, System Design)",
      "Focus heavily on clean coding, time/space complexity optimization",
      "Read about Google's culture of 'Googliness' and leadership principles",
      "Solve Google-tagged LeetCode mediums and hard questions"
    ];
  } else if (company.toLowerCase().includes("amazon")) {
    companyTasks = [
      "Study Amazon's 16 Leadership Principles (LPs) and prepare STAR stories for each",
      "Amazon LP answers count for 50%+ of the total round score. Practice telling stories concisely",
      "Be prepared for deep system scalability questions (for Software roles)",
      "Practice writeups for coding logic questions with test cases"
    ];
  } else if (company.toLowerCase().includes("tcs") || company.toLowerCase().includes("tata consultancy")) {
    companyTasks = [
      "Revise basic concepts of Java, OOPs, DBMS, and SQL queries",
      "Prepare to talk about final year college project details",
      "Review basic HR questions (Why TCS, relocation preference, night shifts)",
      "Practice basic aptitude coding questions (TCS NQT style)"
    ];
  } else if (company.toLowerCase().includes("deloitte")) {
    companyTasks = [
      "Revise Case Interview framework and business technology problems",
      "Prepare explanation of technical stacks used in resume projects",
      "Deloitte values consulting presence. Practice professional speaking and clarity",
      "Review SQL joins and basic databases concept"
    ];
  }

  let roleTasks = [
    `Review core technical stacks related to ${role}`,
    "Prepare project deep-dives detailing challenges faced and metrics achieved",
    "Review basic data structures & algorithms (DSA) concepts"
  ];

  const lowerRole = role.toLowerCase();
  const lowerRound = roundType.toLowerCase();

  if (lowerRole.includes("software") || lowerRole.includes("developer") || lowerRole.includes("backend") || lowerRole.includes("frontend") || lowerRole.includes("sde")) {
    roleTasks = [
      "Revise key Data Structures (Arrays, Strings, Trees, Graphs, HashMaps)",
      "Practice coding syntax in your primary language on a clean canvas",
      "Review core CS fundamentals (OS, Computer Networks, DBMS)",
      "Solve 2-3 medium complexity questions on recursion/dynamic programming"
    ];
    if (lowerRole.includes("frontend") || lowerRole.includes("web")) {
      roleTasks.push(
        "Brush up on JS concepts (closures, event loop, promises, scoping)",
        "Review React/Next.js lifecycle, state management, and DOM optimization",
        "Practice building UI layouts using CSS Flexbox/Grid under 30 mins"
      );
    } else if (lowerRole.includes("backend")) {
      roleTasks.push(
        "Review REST API designs, status codes, and server performance optimizations",
        "Review database design patterns, normalization, indexes, and caching (Redis)",
        "Review concurrency, multithreading, and message queues (Kafka)"
      );
    }
  } else if (lowerRole.includes("analyst") || lowerRole.includes("data")) {
    roleTasks = [
      "Review advanced SQL queries (Window functions, CTEs, Joins, Group By)",
      "Revise probability, statistics, and hypothesis testing concepts",
      "Be ready to explain ML models (regression, classification) if on resume",
      "Practice mock business scenarios to extract metric gains from data tables"
    ];
  }

  if (lowerRound.includes("managerial") || lowerRound.includes("system design")) {
    roleTasks.push(
      "Review System Design core principles (scaling, load balancers, caching, databases)",
      "Practice whiteboarding clean component layout structure designs",
      "Prepare answers around engineering leadership, conflict resolution, and timelines"
    );
  } else if (lowerRound.includes("hr") || lowerRound.includes("behavioral")) {
    roleTasks.push(
      "Prepare answers for: Tell me about yourself, Why did you apply, Where do you see yourself in 5 years",
      "Be ready to discuss salary expectations and relocation parameters",
      "Prepare stories demonstrating team collaborations and handling mistakes"
    );
  }

  return {
    checklist,
    companyTasks,
    roleTasks
  };
}

async function syncCalendarEvents(accessToken: string, userId: string, supabase: any) {
  try {
    const now = new Date().toISOString();
    const calendarRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=15&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calendarRes.ok) {
      console.warn("[Calendar Sync] Failed to fetch events:", calendarRes.statusText);
      return { success: false, countCreated: 0, countUpdated: 0 };
    }

    const calendarData = await calendarRes.json();
    const events = calendarData.items || [];
    let countCreated = 0;
    let countUpdated = 0;

    const { data: userApps } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId);

    for (const event of events) {
      const summary = event.summary || "";
      const description = event.description || "";
      const location = event.location || "";
      const combinedText = `${summary} ${description}`.toLowerCase();

      const isInterview = 
        combinedText.includes("interview") || 
        combinedText.includes("technical round") || 
        combinedText.includes("managerial round") || 
        combinedText.includes("hr round") || 
        combinedText.includes("final round") ||
        combinedText.includes("coding test") ||
        combinedText.includes("technical discussion");

      if (!isInterview) continue;

      let company = "";
      const companyMatches = [
        /interview\s+with\s+([A-Za-z0-9\s]+)/i,
        /interview\s+@\s+([A-Za-z0-9\s]+)/i,
        /([A-Za-z0-9\s]+)\s+interview/i,
        /([A-Za-z0-9\s]+)\s+technical/i
      ];

      for (const regex of companyMatches) {
        const match = regex.exec(summary);
        if (match && match[1]) {
          const candidate = match[1].trim();
          if (candidate.toLowerCase() !== "the" && candidate.length > 2 && candidate.length < 30) {
            company = candidate;
            break;
          }
        }
      }

      if (!company) {
        for (const regex of companyMatches) {
          const match = regex.exec(description);
          if (match && match[1]) {
            const candidate = match[1].trim();
            if (candidate.toLowerCase() !== "the" && candidate.length > 2 && candidate.length < 30) {
              company = candidate;
              break;
            }
          }
        }
      }

      if (!company) {
        const organizerEmail = event.organizer?.email || "";
        if (organizerEmail && organizerEmail.includes("@") && !organizerEmail.endsWith(".com") && !organizerEmail.includes("google.com")) {
          const domain = organizerEmail.split("@")[1].split(".")[0];
          company = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }

      if (!company) {
        company = "Unknown Company";
      }

      let type: "Online Assessment" | "Technical Interview" | "Managerial Round" | "HR Round" | "Final Round" = "Technical Interview";
      if (combinedText.includes("hr") || combinedText.includes("behavioral") || combinedText.includes("human resources")) {
        type = "HR Round";
      } else if (combinedText.includes("managerial") || combinedText.includes("manager") || combinedText.includes("system design")) {
        type = "Managerial Round";
      } else if (combinedText.includes("final") || combinedText.includes("partner")) {
        type = "Final Round";
      } else if (combinedText.includes("assessment") || combinedText.includes("coding test") || combinedText.includes("oa")) {
        type = "Online Assessment";
      }

      const startDateTimeStr = event.start?.dateTime || event.start?.date || "";
      if (!startDateTimeStr) continue;

      const date = startDateTimeStr.split("T")[0];
      const time = startDateTimeStr.includes("T")
        ? startDateTimeStr.split("T")[1].substring(0, 5)
        : "10:00";

      const meetingLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || "";
      const mode = meetingLink || location.includes("http") ? "Online" : location || "Online";

      const recruiterName = event.organizer?.displayName || "";
      const recruiterEmail = event.organizer?.email || "";

      const prepMaterials = generateInterviewPrepMaterial(company, "Software Engineer", type);

      const newSchedule = {
        id: `sch-${event.id || Date.now()}`,
        type,
        date,
        time,
        platform: meetingLink ? (meetingLink.includes("zoom") ? "Zoom" : meetingLink.includes("teams") ? "Microsoft Teams" : "Google Meet") : "Online",
        notes: `Imported automatically from Google Calendar: ${summary}`,
        mode,
        meetingLink,
        recruiterName,
        recruiterEmail,
        checklist: prepMaterials.checklist,
        companyTasks: prepMaterials.companyTasks,
        roleTasks: prepMaterials.roleTasks
      };

      const matchedApp = (userApps || []).find((a: any) => 
        a.company.toLowerCase().trim() === company.toLowerCase().trim()
      );

      if (matchedApp) {
        const details = matchedApp.details || {};
        if (!details.schedules) details.schedules = [];

        const exists = details.schedules.some((s: any) => s.id === newSchedule.id || (s.date === date && s.time === time));
        if (!exists) {
          details.schedules.push(newSchedule);

          const newStatus = type === "HR Round" ? "HR Interview" : "Technical Interview";

          await supabase
            .from("applications")
            .update({
              status: newStatus,
              details,
              last_updated: new Date().toISOString()
            })
            .eq("id", matchedApp.id);

          await supabase
            .from("application_history")
            .insert({
              application_id: matchedApp.id,
              status: newStatus,
              changed_at: new Date().toISOString(),
              notes: `Status updated to ${newStatus} from Google Calendar sync: "${summary}"`
            });

          countUpdated++;
        }
      } else {
        const details: any = {
          referralStatus: "None",
          schedules: [newSchedule],
          oas: [],
          interviews: [],
          matchScore: {
            resumeMatch: 75,
            interviewReadiness: 65,
            overallProbability: 70
          }
        };

        const newStatus = type === "HR Round" ? "HR Interview" : "Technical Interview";

        const { data: newApp } = await supabase
          .from("applications")
          .insert({
            user_id: userId,
            company,
            job_title: "Software Engineer",
            location: location || "Remote / Open Location",
            salary: "TBD",
            status: newStatus,
            applied_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            details,
            source: "Google Calendar Sync"
          })
          .select()
          .single();

        if (newApp) {
          await supabase
            .from("application_history")
            .insert({
              application_id: newApp.id,
              status: newStatus,
              changed_at: new Date().toISOString(),
              notes: `Application created automatically with status ${newStatus} via Google Calendar sync: "${summary}"`
            });
          
          triggerMissionProgress(userId, "applications", 1, undefined, supabase).catch(console.error);
        }

        countCreated++;
      }
    }

    return { success: true, countCreated, countUpdated };
  } catch (err) {
    console.error("[Calendar Sync Error]", err);
    return { success: false, countCreated: 0, countUpdated: 0 };
  }
}

async function getOrRefreshAccessToken(connection: any, supabase: any) {
  const testRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${connection.access_token}` }
  });
  
  if (testRes.ok) {
    return connection.access_token;
  }
  
  if (!connection.refresh_token) {
    throw new Error("Access token expired and no refresh token is stored. Please reconnect Gmail.");
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token"
    })
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || "Token refresh failed");
  }
  
  const { access_token } = data;
  
  await supabase
    .from("gmail_connections")
    .update({ access_token, last_sync: new Date().toISOString() })
    .eq("user_id", connection.user_id);
    
  return access_token;
}

// GET: connection status & ingestion logs list
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("gmail_email, connected_at, last_sync, sync_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ 
        success: true, 
        connected: false, 
        gmailEmail: null, 
        lastSync: null,
        syncEnabled: false,
        logs: [] 
      });
    }

    const { data: logs } = await supabase
      .from("email_ingestion_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      connected: true,
      gmailEmail: connection.gmail_email,
      lastSync: connection.last_sync,
      syncEnabled: connection.sync_enabled,
      logs: logs || []
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: fetch emails, parse with AI, and create/update CRM records
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ 
        success: false, 
        message: "Gmail not connected. Please connect via OAuth." 
      }, { status: 400 });
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!openrouterApiKey && !geminiApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: "AI keys missing. Auto parsing offline." 
      }, { status: 500 });
    }

    let accessToken: string;
    try {
      accessToken = await getOrRefreshAccessToken(connection, supabase);
    } catch (tokenErr: any) {
      return NextResponse.json({ 
        success: false, 
        message: `Token refresh failed: ${tokenErr.message}` 
      }, { status: 400 });
    }

    // Fetch matching emails
    const query = "subject:(application OR assessment OR \"online test\" OR interview OR offer OR reject OR \"hiring\")";
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=15`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errData = await listRes.json();
      return NextResponse.json({ 
        success: false, 
        message: `Failed to fetch messages from Gmail API: ${errData.error?.message || listRes.statusText}` 
      }, { status: 400 });
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    let countCreated = 0;
    let countUpdated = 0;
    const processedEmails = [];

    const { data: userApps } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id);

    for (const msg of messages) {
      const { data: isParsed } = await supabase
        .from("email_ingestion_logs")
        .select("id")
        .eq("gmail_message_id", msg.id)
        .maybeSingle();

      if (isParsed) continue;

      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
      const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
      const snippet = msgData.snippet || "";
      const rawBody = getEmailBody(msgData.payload) || snippet;
      const cleanedBody = rawBody.slice(0, 4000);

      // Run trust engine verification
      const { runEmailVerification, extractSenderDetails } = await import("@/lib/recruitment-trust");
      const trustResult = await runEmailVerification(
        user.id,
        {
          sender: from,
          subject,
          body: cleanedBody,
          headers
        },
        supabase
      );

      // If Potential Scam, block automated entry, log it as blocked, and skip further parsing
      if (trustResult.decision === "Potential Scam") {
        await supabase
          .from("email_ingestion_logs")
          .insert({
            user_id: user.id,
            gmail_message_id: msg.id,
            company: trustResult.company || "Unknown (Scam Blocked)",
            role: trustResult.role || "Unknown",
            detected_status: "Scam Blocked",
            confidence_score: trustResult.confidence,
            processed: true, // Mark true so we don't scan it again
            ai_reasoning: `Blocked by Recruitment Trust Engine: ${trustResult.reasons.join(", ")}`,
            extracted_entities: {
              trustScore: trustResult.trustScore,
              trustDecision: trustResult.decision,
              scamProbability: trustResult.scamProbability,
              verificationReasons: trustResult.reasons
            },
            email_subject: subject,
            sender: from,
            provider_used: "trust_engine"
          });
        continue;
      }

      const isSuspicious = trustResult.decision === "Suspicious";

      const systemPrompt = `You are an AI placement coach and automated CRM parser.
Analyze the following recruitment email subject and body, and extract details about the application stage.

Email Subject: ${subject}
Email From: ${from}
Email Content:
${cleanedBody}

Format your response as a valid JSON object matching this schema:
- "company": string (The name of the company, e.g., "Google", "IBM", "TCS", "Accenture")
- "role": string (The job title, e.g., "Software Engineer", "Data Analyst")
- "status": string (Must be EXACTLY one of: "Application Received", "Assessment Scheduled", "Assessment Completed", "Technical Interview", "HR Interview", "Rejected", "Offer Received")
- "interviewDate": string | null (Interview date in YYYY-MM-DD format if scheduled/provided, otherwise null)
- "oaDeadline": string | null (OA assessment deadline date in YYYY-MM-DD format if scheduled/provided, otherwise null)
- "offerInfo": string | null (CTC, location, joining date, or package details if offer received, otherwise null)
- "ctc": string | null (CTC package details like 12 LPA, $100k, etc., or null if not an offer)
- "baseSalary": string | null (Base salary component if mentioned, e.g., 10 LPA, $90k, otherwise null)
- "bonus": string | null (Joining/sign-on bonus or performance bonus, e.g., 2 Lakhs, $10k, otherwise null)
- "joiningDate": string | null (Expected joining date in YYYY-MM-DD format if mentioned, otherwise null)
- "location": string | null (Job location like Bengaluru, Remote, Seattle, otherwise null)
- "time": string | null (An interview or assessment time in HH:MM format if scheduled/provided, otherwise null)
- "assessmentPlatform": string | null (The coding test platform used for the assessment if it is an assessment email: HackerRank, CodeSignal, Codility, SHL, Mercer Mettl, AMCAT, eLitmus. Select exactly one of these or null if not mentioned or different)
- "assessmentDuration": number | null (Duration in minutes of the coding test if mentioned in the email, otherwise null)
- "recruiterName": string | null (Extract recruiter name if mentioned in the email, e.g., "John Doe", otherwise null)
- "recruiterEmail": string | null (Extract recruiter email address if mentioned in the email, otherwise null)
- "recruiterDesignation": string | null (Extract recruiter title/designation if mentioned, e.g., "Talent Acquisition Specialist", otherwise null)
- "meetingLink": string | null (Extract interview/meeting URL like Zoom, Google Meet, Teams, otherwise null)
- "mode": string | null (Mode of interview: "Online", "In-Person", "Phone Call", otherwise null)
- "confidence": number (Confidence score between 0 and 100 based on how certain you are of the status extraction)
- "reasoning": string (Short explanation of how you parsed the status and determined the confidence score)

Return ONLY valid JSON. Do not write markdown tags or preambles.`;

      const schema = {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          role: { type: "STRING" },
          status: { 
            type: "STRING", 
            enum: [
              "Application Received",
              "Assessment Scheduled",
              "Assessment Completed",
              "Technical Interview",
              "HR Interview",
              "Rejected",
              "Offer Received"
            ] 
          },
          interviewDate: { type: "STRING" },
          oaDeadline: { type: "STRING" },
          offerInfo: { type: "STRING" },
          ctc: { type: "STRING" },
          baseSalary: { type: "STRING" },
          bonus: { type: "STRING" },
          joiningDate: { type: "STRING" },
          location: { type: "STRING" },
          time: { type: "STRING" },
          assessmentPlatform: { type: "STRING" },
          assessmentDuration: { type: "NUMBER" },
          recruiterName: { type: "STRING" },
          recruiterEmail: { type: "STRING" },
          recruiterDesignation: { type: "STRING" },
          meetingLink: { type: "STRING" },
          mode: { type: "STRING" },
          confidence: { type: "NUMBER" },
          reasoning: { type: "STRING" }
        },
        required: ["company", "role", "status", "confidence", "reasoning"]
      };

      let parsedInfo: any = null;
      let usedProvider: "openrouter" | "gemini" = "openrouter";
      let gatewayResponse: any = null;

      // 1. Call Qwen (OpenRouter) as primary
      if (openrouterApiKey) {
        try {
          gatewayResponse = await generateResponse({
            provider: "openrouter",
            model: "qwen/qwen-2.5-7b-instruct",
            prompt: systemPrompt,
            apiKey: openrouterApiKey,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.1,
            taskType: "gmail-email-parse"
          });

          if (gatewayResponse.success && gatewayResponse.text) {
            const rawText = gatewayResponse.text.trim();
            const cleanText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
            parsedInfo = JSON.parse(cleanText);
            usedProvider = "openrouter";
          }
        } catch (err) {
          console.warn(`[AI Ingestion] Qwen parsing failed for message ${msg.id}:`, err);
        }
      }

      // 2. Fallback to Gemini if Qwen failed, output is invalid, or confidence is < 80
      if ((!parsedInfo || !parsedInfo.confidence || parsedInfo.confidence < 80) && geminiApiKey) {
        console.log(`[AI Ingestion] Qwen confidence is ${parsedInfo?.confidence ?? 'N/A'} (< 80) or call failed. Requesting Gemini fallback...`);
        try {
          const fallbackResponse = await generateResponse({
            provider: "gemini",
            prompt: systemPrompt,
            apiKey: geminiApiKey,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.1,
            taskType: "gmail-email-parse"
          });

          if (fallbackResponse.success && fallbackResponse.text) {
            const rawText = fallbackResponse.text.trim();
            const cleanText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
            const fallbackParsed = JSON.parse(cleanText);
            
            if (fallbackParsed && fallbackParsed.confidence !== undefined) {
              parsedInfo = fallbackParsed;
              usedProvider = "gemini";
              gatewayResponse = fallbackResponse;
            }
          }
        } catch (err) {
          console.error(`[AI Ingestion] Gemini fallback parsing failed for message ${msg.id}:`, err);
        }
      }

      const isSuccessful = parsedInfo && parsedInfo.confidence >= 80;

      const statusMap: Record<string, string> = {
        "Application Received": "Applied",
        "Assessment Scheduled": "Assessment Scheduled",
        "Assessment Completed": "Assessment Completed",
        "Technical Interview": "Technical Interview",
        "HR Interview": "HR Interview",
        "Rejected": "Rejected",
        "Offer Received": "Offer Received"
      };

      const crmStatus = parsedInfo ? (statusMap[parsedInfo.status] || "Applied") : "Applied";

      if (isSuccessful && parsedInfo && !isSuspicious) {
        // Match existing application
        const matchedApp = (userApps || []).find((a: any) => 
          a.company.toLowerCase().trim() === parsedInfo.company.toLowerCase().trim()
        );

        // 1. Sync Recruiter details
        let recEmail = parsedInfo.recruiterEmail || "";
        let recName = parsedInfo.recruiterName || "";
        let recDesignation = parsedInfo.recruiterDesignation || "Recruiter";
        let recruiterId: string | null = null;

        if (!recEmail || !recEmail.includes("@")) {
          const parsedSender = extractSenderDetails(from);
          recEmail = parsedSender.email;
          if (!recName) {
            recName = parsedSender.name || recEmail.split("@")[0];
          }
        }

        if (recEmail && recName) {
          try {
            const { data: existingRec } = await supabase
              .from("recruiters")
              .select("id")
              .eq("user_id", user.id)
              .eq("email", recEmail)
              .maybeSingle();

            const recruiterPayload: any = {
              user_id: user.id,
              name: recName,
              company: parsedInfo.company,
              designation: recDesignation,
              email: recEmail,
              last_interaction: new Date().toISOString(),
              pipeline_stage: crmStatus === "HR Interview" ? "Interview Opportunity" : "Conversation Started",
              updated_at: new Date().toISOString()
            };

            if (existingRec) {
              recruiterId = existingRec.id;
              await supabase
                .from("recruiters")
                .update(recruiterPayload)
                .eq("id", existingRec.id);
            } else {
              const { data: newRec } = await supabase
                .from("recruiters")
                .insert({
                  ...recruiterPayload,
                  relationship_strength: "Connected",
                  created_at: new Date().toISOString()
                })
                .select("id")
                .single();
              if (newRec) {
                recruiterId = newRec.id;
              }
            }

            // Log communication in recruiter_conversations
            if (recruiterId) {
              const { data: existingConv } = await supabase
                .from("recruiter_conversations")
                .select("id")
                .eq("message_id", msg.id)
                .maybeSingle();

              if (!existingConv) {
                const emailDateStr = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || new Date().toISOString();
                const emailDate = new Date(emailDateStr).toISOString();

                await supabase
                  .from("recruiter_conversations")
                  .insert({
                    recruiter_id: recruiterId,
                    user_id: user.id,
                    message_id: msg.id,
                    direction: "incoming",
                    subject: subject,
                    body: cleanedBody,
                    sent_at: emailDate
                  });
              }
            }
          } catch (recErr) {
            console.error("Recruiter CRM sync failed:", recErr);
          }
        }

        if (matchedApp) {
          const details = matchedApp.details || {};
          
          details.recruiter = {
            name: recName,
            email: recEmail,
            designation: recDesignation,
            id: recruiterId || undefined
          };

          if (crmStatus === "Assessment Scheduled" && (parsedInfo.oaDeadline || parsedInfo.interviewDate)) {
            const dateToUse = parsedInfo.oaDeadline || parsedInfo.interviewDate;
            details.assessmentDate = dateToUse;
            if (!details.oas) details.oas = [];
            
            const exists = details.oas.some((o: any) => o.oaDate === dateToUse);
            if (!exists) {
              details.oas.push({
                id: `oa-${Date.now()}`,
                oaDate: dateToUse,
                difficulty: "Medium",
                topicsAsked: [],
                score: 0,
                result: "Pending",
                prepNotes: "Detected automatically from recruitment email.",
                platform: parsedInfo.assessmentPlatform || "HackerRank",
                duration: parsedInfo.assessmentDuration || 90,
                deadline: dateToUse,
                status: "Pending"
              });
            }
          } else if ((crmStatus === "Technical Interview" || crmStatus === "HR Interview") && (parsedInfo.interviewDate || parsedInfo.oaDeadline)) {
            const dateToUse = parsedInfo.interviewDate || parsedInfo.oaDeadline;
            details.interviewDate = dateToUse;
            if (!details.schedules) details.schedules = [];
            
            const timeToUse = parsedInfo.time || "10:00";
            const exists = details.schedules.some((s: any) => s.date === dateToUse && s.time === timeToUse);
            if (!exists) {
              const prep = generateInterviewPrepMaterial(parsedInfo.company, parsedInfo.role || "Software Engineer", crmStatus);
              details.schedules.push({
                id: `sch-${Date.now()}`,
                type: crmStatus === "HR Interview" ? "HR Round" : "Technical Interview",
                date: dateToUse,
                time: timeToUse,
                platform: parsedInfo.meetingLink ? (parsedInfo.meetingLink.includes("zoom") ? "Zoom" : parsedInfo.meetingLink.includes("teams") ? "Microsoft Teams" : "Google Meet") : "Online / See Email",
                notes: "Scheduled via automated email sync.",
                mode: parsedInfo.mode || "Online",
                meetingLink: parsedInfo.meetingLink || undefined,
                recruiterName: parsedInfo.recruiterName || undefined,
                recruiterEmail: parsedInfo.recruiterEmail || undefined,
                checklist: prep.checklist,
                companyTasks: prep.companyTasks,
                roleTasks: prep.roleTasks
              });
            }
          } else if (crmStatus === "Offer Received") {
            const offerExpiryDate = parsedInfo.interviewDate || parsedInfo.oaDeadline;
            const ctc = parsedInfo.ctc || parsedInfo.offerInfo || "TBD";
            const baseSalary = parsedInfo.baseSalary || null;
            const bonus = parsedInfo.bonus || null;
            const offerLocation = parsedInfo.location || matchedApp.location || "Remote / Open Location";
            const joiningDate = parsedInfo.joiningDate || offerExpiryDate || null;
            
            let targetCtc = "10 LPA";
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("target_ctc")
                .eq("user_id", user.id)
                .maybeSingle();
              if (profile?.target_ctc) {
                targetCtc = profile.target_ctc;
              }
            } catch (pErr) {}

            const parseNumber = (val: string | null | undefined): number => {
              if (!val) return 0;
              const matches = val.match(/[\d.]+/);
              return matches ? parseFloat(matches[0]) : 0;
            };
            
            const targetVal = parseNumber(targetCtc);
            const offerCtcVal = parseNumber(ctc);
            
            let strengthScore = 70;
            if (targetVal > 0 && offerCtcVal > 0) {
              strengthScore = Math.min(100, Math.max(40, Math.round((offerCtcVal / targetVal) * 80)));
            }
            
            const marketBenchmarkScore = Math.min(100, Math.max(50, 75 + Math.round((Math.random() - 0.5) * 15)));
            
            const negotiationSuggestions = [
              `Highlight your specific skills matching the ${parsedInfo.role || "Software Engineer"} role to request a review of the base salary component.`,
              `Request clarification on the performance bonus structures and annual cycles.`,
              `Given market standard benchmarks, inquire about potential sign-on bonuses to align with target expectations.`
            ];

            details.offerExpiry = joiningDate || undefined;
            details.offer = {
              ctc: ctc,
              baseSalary: baseSalary || undefined,
              joiningBonus: bonus || undefined,
              location: offerLocation,
              joiningDate: joiningDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              growthRating: 4,
              exposureRating: 4,
              brandValueRating: 4,
              potentialRating: 4,
              strengthScore,
              marketBenchmarkScore,
              negotiationSuggestions
            };

            // Upsert into offers table
            try {
              await supabase
                .from("offers")
                .upsert({
                  user_id: user.id,
                  application_id: matchedApp.id,
                  company: parsedInfo.company,
                  role: parsedInfo.role || "Software Engineer",
                  ctc: ctc,
                  base_salary: baseSalary || undefined,
                  bonus: bonus || undefined,
                  location: offerLocation,
                  joining_date: joiningDate ? new Date(joiningDate).toISOString().split("T")[0] : undefined,
                  status: "Pending",
                  strength_score: strengthScore,
                  market_benchmark_score: marketBenchmarkScore,
                  negotiation_suggestions: negotiationSuggestions
                }, { onConflict: "application_id" });
            } catch (offErr) {
              console.error("Offers db sync failed:", offErr);
            }
          }

          await supabase
            .from("applications")
            .update({
              status: crmStatus,
              details,
              last_updated: new Date().toISOString()
            })
            .eq("id", matchedApp.id);

          await supabase
            .from("application_history")
            .insert({
              application_id: matchedApp.id,
              status: crmStatus,
              changed_at: new Date().toISOString(),
              notes: `Status updated automatically to ${crmStatus} via AI Gmail parsing (${usedProvider}).`
            });

          // Link recruiter application_id
          if (recruiterId) {
            await supabase
              .from("recruiters")
              .update({ application_id: matchedApp.id })
              .eq("id", recruiterId);
          }

          countUpdated++;
        } else {
          // Create new application
          const details: any = {
            referralStatus: "None",
            schedules: [],
            oas: [],
            interviews: [],
            matchScore: {
              resumeMatch: 75,
              interviewReadiness: 65,
              overallProbability: 70
            }
          };

          details.recruiter = {
            name: recName,
            email: recEmail,
            designation: recDesignation,
            id: recruiterId || undefined
          };

          if (crmStatus === "Assessment Scheduled" && (parsedInfo.oaDeadline || parsedInfo.interviewDate)) {
            const dateToUse = parsedInfo.oaDeadline || parsedInfo.interviewDate;
            details.assessmentDate = dateToUse;
            details.oas.push({
              id: `oa-${Date.now()}`,
              oaDate: dateToUse,
              difficulty: "Medium",
              topicsAsked: [],
              score: 0,
              result: "Pending",
              prepNotes: "Detected automatically from recruitment email.",
              platform: parsedInfo.assessmentPlatform || "HackerRank",
              duration: parsedInfo.assessmentDuration || 90,
              deadline: dateToUse,
              status: "Pending"
            });
          } else if ((crmStatus === "Technical Interview" || crmStatus === "HR Interview") && (parsedInfo.interviewDate || parsedInfo.oaDeadline)) {
            const dateToUse = parsedInfo.interviewDate || parsedInfo.oaDeadline;
            details.interviewDate = dateToUse;
            const prep = generateInterviewPrepMaterial(parsedInfo.company, parsedInfo.role || "Software Engineer", crmStatus);
            details.schedules.push({
              id: `sch-${Date.now()}`,
              type: crmStatus === "HR Interview" ? "HR Round" : "Technical Interview",
              date: dateToUse,
              time: parsedInfo.time || "10:00",
              platform: parsedInfo.meetingLink ? (parsedInfo.meetingLink.includes("zoom") ? "Zoom" : parsedInfo.meetingLink.includes("teams") ? "Microsoft Teams" : "Google Meet") : "Online / See Email",
              notes: "Scheduled via automated email sync.",
              mode: parsedInfo.mode || "Online",
              meetingLink: parsedInfo.meetingLink || undefined,
              recruiterName: parsedInfo.recruiterName || undefined,
              recruiterEmail: parsedInfo.recruiterEmail || undefined,
              checklist: prep.checklist,
              companyTasks: prep.companyTasks,
              roleTasks: prep.roleTasks
            });
          } else if (crmStatus === "Offer Received") {
            const offerExpiryDate = parsedInfo.interviewDate || parsedInfo.oaDeadline;
            const ctc = parsedInfo.ctc || parsedInfo.offerInfo || "TBD";
            const baseSalary = parsedInfo.baseSalary || null;
            const bonus = parsedInfo.bonus || null;
            const offerLocation = parsedInfo.location || "Remote / Open Location";
            const joiningDate = parsedInfo.joiningDate || offerExpiryDate || null;
            
            let targetCtc = "10 LPA";
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("target_ctc")
                .eq("user_id", user.id)
                .maybeSingle();
              if (profile?.target_ctc) {
                targetCtc = profile.target_ctc;
              }
            } catch (pErr) {}

            const parseNumber = (val: string | null | undefined): number => {
              if (!val) return 0;
              const matches = val.match(/[\d.]+/);
              return matches ? parseFloat(matches[0]) : 0;
            };
            
            const targetVal = parseNumber(targetCtc);
            const offerCtcVal = parseNumber(ctc);
            
            let strengthScore = 70;
            if (targetVal > 0 && offerCtcVal > 0) {
              strengthScore = Math.min(100, Math.max(40, Math.round((offerCtcVal / targetVal) * 80)));
            }
            
            const marketBenchmarkScore = Math.min(100, Math.max(50, 75 + Math.round((Math.random() - 0.5) * 15)));
            
            const negotiationSuggestions = [
              `Highlight your specific skills matching the ${parsedInfo.role || "Software Engineer"} role to request a review of the base salary component.`,
              `Request clarification on the performance bonus structures and annual cycles.`,
              `Given market standard benchmarks, inquire about potential sign-on bonuses to align with target expectations.`
            ];

            details.offerExpiry = joiningDate || undefined;
            details.offer = {
              ctc: ctc,
              baseSalary: baseSalary || undefined,
              joiningBonus: bonus || undefined,
              location: offerLocation,
              joiningDate: joiningDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              growthRating: 4,
              exposureRating: 4,
              brandValueRating: 4,
              potentialRating: 4,
              strengthScore,
              marketBenchmarkScore,
              negotiationSuggestions
            };
          }

          const { data: newApp } = await supabase
            .from("applications")
            .insert({
              user_id: user.id,
              company: parsedInfo.company,
              job_title: parsedInfo.role || "Software Engineer",
              location: "Remote / Open Location",
              salary: parsedInfo.offerInfo || "TBD",
              status: crmStatus,
              applied_date: new Date().toISOString(),
              last_updated: new Date().toISOString(),
              details,
              source: "Gmail Integration"
            })
            .select()
            .single();

          if (newApp) {
            await supabase
              .from("application_history")
              .insert({
                application_id: newApp.id,
                status: crmStatus,
                changed_at: new Date().toISOString(),
                notes: `Application created automatically with status ${crmStatus} via AI Gmail parsing (${usedProvider}).`
              });

            if (crmStatus !== "Saved") {
              triggerMissionProgress(user.id, "applications", 1).catch(console.error);
            }

            // Link recruiter application_id
            if (recruiterId) {
              await supabase
                .from("recruiters")
                .update({ application_id: newApp.id })
                .eq("id", recruiterId);
            }

            // Insert offer into database if Offer Received
            if (crmStatus === "Offer Received" && details.offer) {
              try {
                await supabase
                  .from("offers")
                  .insert({
                    user_id: user.id,
                    application_id: newApp.id,
                    company: parsedInfo.company,
                    role: parsedInfo.role || "Software Engineer",
                    ctc: details.offer.ctc,
                    base_salary: details.offer.baseSalary || undefined,
                    bonus: details.offer.joiningBonus || undefined,
                    location: details.offer.location,
                    joining_date: details.offer.joiningDate ? new Date(details.offer.joiningDate).toISOString().split("T")[0] : undefined,
                    status: "Pending",
                    strength_score: details.offer.strengthScore,
                    market_benchmark_score: details.offer.marketBenchmarkScore,
                    negotiation_suggestions: details.offer.negotiationSuggestions
                  });
              } catch (offErr) {
                console.error("Offers db sync failed:", offErr);
              }
            }
          }

          countCreated++;
        }
      }

      // Log to database (processed is true if success, false if failed/low confidence)
      await supabase
        .from("email_ingestion_logs")
        .insert({
          user_id: user.id,
          gmail_message_id: msg.id,
          company: parsedInfo ? parsedInfo.company : (trustResult.company || "Unknown"),
          role: parsedInfo ? (parsedInfo.role || "Software Engineer") : (trustResult.role || "Unknown"),
          detected_status: isSuspicious ? "Suspicious (Needs Review)" : crmStatus,
          confidence_score: parsedInfo ? parsedInfo.confidence : 0,
          processed: isSuccessful && !isSuspicious,
          ai_reasoning: parsedInfo 
            ? `${parsedInfo.reasoning} | Trust score: ${trustResult.trustScore} (${trustResult.decision})`
            : `Parsing failed or timed out | Trust score: ${trustResult.trustScore}`,
          extracted_entities: {
            ...(parsedInfo || {}),
            trustScore: trustResult.trustScore,
            trustDecision: trustResult.decision,
            scamProbability: trustResult.scamProbability,
            verificationReasons: trustResult.reasons
          },
          email_subject: subject,
          sender: from,
          provider_used: usedProvider
        });

      processedEmails.push({
        messageId: msg.id,
        company: parsedInfo ? parsedInfo.company : (trustResult.company || "Unknown"),
        role: parsedInfo ? parsedInfo.role : (trustResult.role || "Unknown"),
        status: isSuspicious ? "Suspicious (Needs Review)" : crmStatus,
        confidence: parsedInfo ? parsedInfo.confidence : 0,
        processed: isSuccessful && !isSuspicious,
        provider: usedProvider
      });
    }

    let calendarCountCreated = 0;
    let calendarCountUpdated = 0;
    try {
      const calSync = await syncCalendarEvents(accessToken, user.id, supabase);
      if (calSync.success) {
        calendarCountCreated = calSync.countCreated || 0;
        calendarCountUpdated = calSync.countUpdated || 0;
      }
    } catch (calErr) {
      console.error("Calendar sync failure:", calErr);
    }

    await supabase
      .from("gmail_connections")
      .update({ last_sync: new Date().toISOString() })
      .eq("user_id", user.id);

    await invalidateUserCache(user.id);

    return NextResponse.json({
      success: true,
      countCreated: countCreated + calendarCountCreated,
      countUpdated: countUpdated + calendarCountUpdated,
      processed: processedEmails,
      calendarSync: {
        created: calendarCountCreated,
        updated: calendarCountUpdated
      }
    });

  } catch (err: any) {
    console.error("Gmail sync exception:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
