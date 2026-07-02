import { generateResponse } from "./ai/router";

const FALLBACK_TRUSTED_DOMAINS: Record<string, number> = {
  "google.com": 100,
  "amazon.com": 100,
  "amazon.jobs": 100,
  "microsoft.com": 100,
  "deloitte.com": 100,
  "accenture.com": 100,
  "tcs.com": 95,
  "infosys.com": 95,
  "wipro.com": 95,
  "ibm.com": 100,
  "nvidia.com": 100,
  "hackerrank.com": 95,
  "codesignal.com": 95,
  "codility.com": 95
};

const FALLBACK_VERIFIED_COMPANIES = new Set([
  "google",
  "amazon",
  "microsoft",
  "deloitte",
  "accenture",
  "tcs",
  "infosys",
  "wipro",
  "ibm",
  "nvidia",
  "oracle",
  "sap",
  "adobe",
  "hackerrank",
  "codesignal",
  "codility",
  "shl",
  "mettl",
  "mercer mettl",
  "amcat",
  "elitmus"
]);

export interface EmailVerificationDetails {
  sender: string; // e.g. "Deloitte Careers <jobs@deloitte.com>"
  subject: string;
  body: string;
  headers?: Array<{ name: string; value: string }>;
  spf?: boolean; // explicit override
  dkim?: boolean; // explicit override
  dmarc?: boolean; // explicit override
}

export interface VerificationResult {
  decision: "Verified Recruitment Email" | "Likely Recruitment Email" | "Suspicious" | "Potential Scam";
  trustScore: number;
  classification: string;
  company: string;
  role: string;
  confidence: number;
  scamProbability: number;
  reasons: string[];
}

/**
 * Extracts sender name, email and domain from "From" header
 */
export function extractSenderDetails(fromHeader: string): { name: string; email: string; domain: string } {
  let name = "";
  let email = "";
  
  const bracketMatch = fromHeader.match(/^(.*?)\s*<(.*?)>/);
  if (bracketMatch) {
    name = bracketMatch[1] ? bracketMatch[1].replace(/['"]/g, "").trim() : "";
    email = bracketMatch[2] ? bracketMatch[2].trim() : "";
  } else {
    email = fromHeader.trim();
    name = email.split("@")[0] || "";
  }
  
  const domain = email.includes("@") ? email.split("@")[1]?.toLowerCase() || "" : "";
  return { name, email, domain };
}

/**
 * Parses email headers for Authentication results
 */
export function parseAuthenticationHeaders(headers: Array<{ name: string; value: string }>): { spf: boolean; dkim: boolean; dmarc: boolean } {
  let spf = false;
  let dkim = false;
  let dmarc = false;

  const authHeader = headers.find(h => h.name.toLowerCase() === "authentication-results")?.value || "";
  const spfHeader = headers.find(h => h.name.toLowerCase() === "received-spf")?.value || "";

  if (authHeader) {
    const authLower = authHeader.toLowerCase();
    if (authLower.includes("spf=pass")) spf = true;
    if (authLower.includes("dkim=pass")) dkim = true;
    if (authLower.includes("dmarc=pass")) dmarc = true;
  }
  
  if (!spf && spfHeader) {
    const spfLower = spfHeader.toLowerCase();
    if (spfLower.includes("pass")) spf = true;
  }

  return { spf, dkim, dmarc };
}

/**
 * Scans email for scam indicator keywords (payments, deposits, upi, registration fee)
 */
export function checkScamKeywords(subject: string, body: string): { isScam: boolean; probability: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const content = `${subject} \n ${body}`.toLowerCase();

  const scamIndicators = [
    { pattern: /registration fee|training fee|processing fee|interview fee|fee/i, weight: 40, reason: "Hiring fee demand detected" },
    { pattern: /security deposit|refundable deposit|deposit/i, weight: 40, reason: "Security deposit request detected" },
    { pattern: /upi payment|upi transfer|gpay|paytm|phonepe/i, weight: 35, reason: "Mobile payment service mention detected" },
    { pattern: /crypto|bitcoin|tether|usdt|wallet transfer/i, weight: 45, reason: "Cryptocurrency payment request detected" },
    { pattern: /pay ₹\d+|pay rs|pay \$|charge rs/i, weight: 50, reason: "Explicit cash payment amount requested" },
    { pattern: /urgent payment|immediate payment/i, weight: 30, reason: "Urgent payment demand detected" },
    { pattern: /work from home fee|laptop deposit/i, weight: 40, reason: "Asset deposit request detected" }
  ];

  for (const indicator of scamIndicators) {
    if (indicator.pattern.test(content)) {
      score += indicator.weight;
      reasons.push(indicator.reason);
    }
  }

  const probability = Math.min(99, score);
  return {
    isScam: probability >= 60,
    probability,
    reasons
  };
}

/**
 * Core central scoring algorithm
 */
export function calculateEmailTrustScore(details: {
  domainVerified: boolean;
  domainScore: number;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  recruiterVerified: boolean;
  companyVerified: boolean;
  aiConfidence: number;
  communityScore: number;
}): number {
  let score = 0;

  // 1. Domain Verification = 30
  if (details.domainVerified) {
    score += (details.domainScore / 100) * 30;
  }

  // 2. SPF Validation = 10
  if (details.spf) score += 10;

  // 3. DKIM Validation = 10
  if (details.dkim) score += 10;

  // 4. DMARC Validation = 10
  if (details.dmarc) score += 10;

  // 5. Verified Recruiter = 15
  if (details.recruiterVerified) score += 15;

  // 6. Verified Company = 10
  if (details.companyVerified) score += 10;

  // 7. AI Classification Confidence = 10
  score += (details.aiConfidence / 100) * 10;

  // 8. Community Trust = 5
  score += details.communityScore;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Entry point to verify email
 */
export async function runEmailVerification(
  userId: string,
  emailDetails: EmailVerificationDetails,
  supabase: any
): Promise<VerificationResult> {
  const reasons: string[] = [];
  
  // 1. Parse sender details
  const { name, email, domain } = extractSenderDetails(emailDetails.sender);

  // 2. Domain verification check
  let domainVerified = false;
  let domainScore = 0;
  
  try {
    const { data: matchedDomain } = await supabase
      .from("trusted_domains")
      .select("trust_score, verified")
      .eq("domain", domain)
      .maybeSingle();

    if (matchedDomain && matchedDomain.verified) {
      domainVerified = true;
      domainScore = matchedDomain.trust_score || 100;
    }
  } catch (err) {
    console.warn("DB Domain query failed, using trust engine fallbacks");
  }

  if (!domainVerified && FALLBACK_TRUSTED_DOMAINS[domain] !== undefined) {
    domainVerified = true;
    domainScore = FALLBACK_TRUSTED_DOMAINS[domain];
  }

  // 3. Email Authentication Check
  let spf = emailDetails.spf ?? false;
  let dkim = emailDetails.dkim ?? false;
  let dmarc = emailDetails.dmarc ?? false;

  if (emailDetails.headers) {
    const authResults = parseAuthenticationHeaders(emailDetails.headers);
    spf = emailDetails.spf ?? authResults.spf;
    dkim = emailDetails.dkim ?? authResults.dkim;
    dmarc = emailDetails.dmarc ?? authResults.dmarc;
  } else {
    // Fallback: if domain is highly trusted and no headers are passed, default to passing authentication
    if (domainVerified && domainScore >= 95) {
      spf = true;
      dkim = true;
      dmarc = true;
    }
  }

  // 4. Recruiter Verification Check
  let recruiterVerified = false;
  let recruiter: any = null;
  try {
    const { data: matchedRecruiter } = await supabase
      .from("verified_recruiters")
      .select("trust_score, verification_status")
      .eq("recruiter_email", email)
      .maybeSingle();

    recruiter = matchedRecruiter;
    if (recruiter && recruiter.verification_status === "Verified") {
      recruiterVerified = true;
    }
  } catch (err) {
    console.warn("DB Recruiter query failed");
  }

  // 5. AI Classification
  const systemInstruction = `You are a staff recruitment email analyzer.
Analyze the subject, sender, and content of the incoming email.
Classify it into exactly one of these stages:
- "Application Confirmation"
- "Assessment Invitation"
- "Assessment Completion"
- "Technical Interview"
- "HR Interview"
- "Offer Letter"
- "Recruiter Outreach"
- "Marketing Email"
- "Spam"
- "Scam"
- "Unknown"

Provide your analysis in JSON format conforming to this schema:
{
  "classification": string,
  "company": string,
  "role": string,
  "confidence": number
}`;

  const prompt = `Email Sender: ${emailDetails.sender}
Subject: ${emailDetails.subject}
Body Snippet:
${emailDetails.body.slice(0, 3000)}`;

  let aiClassification = "Unknown";
  let aiCompany = "";
  let aiRole = "Software Engineer";
  let aiConfidence = 50;

  try {
    const aiRes = await generateResponse({
      provider: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.1
    });

    if (aiRes.success && aiRes.text) {
      const parsed = JSON.parse(aiRes.text.trim());
      aiClassification = parsed.classification || "Unknown";
      aiCompany = parsed.company || "";
      aiRole = parsed.role || "Software Engineer";
      aiConfidence = parsed.confidence || 50;
      if (aiConfidence > 0 && aiConfidence <= 1) {
        aiConfidence *= 100;
      }
    }
  } catch (err) {
    console.error("AI trust classification error:", err);
  }

  // 5.5 Local Heuristic Fallback
  if (aiClassification === "Unknown" || !aiCompany) {
    const subjectLower = emailDetails.subject.toLowerCase();
    const bodyLower = emailDetails.body.toLowerCase();
    const fromLower = emailDetails.sender.toLowerCase();

    // 1. Company Name extraction fallback
    let detectedCompany = "";
    const knownCompanies = ["google", "amazon", "microsoft", "deloitte", "accenture", "tcs", "infosys", "wipro", "ibm", "nvidia", "oracle", "sap", "adobe", "hackerrank", "codesignal", "codility"];
    for (const c of knownCompanies) {
      if (domain.includes(c) || fromLower.includes(c) || subjectLower.includes(c)) {
        detectedCompany = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }
    if (detectedCompany) {
      aiCompany = detectedCompany;
    }

    // 2. Classification Mapping fallback
    if (subjectLower.includes("interview") || bodyLower.includes("interview schedule") || bodyLower.includes("technical round")) {
      aiClassification = "Technical Interview";
      aiConfidence = 95;
    } else if (subjectLower.includes("assessment") || subjectLower.includes("test invitation") || subjectLower.includes("coding test") || bodyLower.includes("invited to complete the online assessment")) {
      aiClassification = "Assessment Invitation";
      aiConfidence = 95;
    } else if (subjectLower.includes("offer") || bodyLower.includes("pleased to extend an offer") || bodyLower.includes("offer letter")) {
      aiClassification = "Offer Letter";
      aiConfidence = 95;
    } else if (subjectLower.includes("hiring") || subjectLower.includes("outreach") || bodyLower.includes("recruiter")) {
      aiClassification = "Recruiter Outreach";
      aiConfidence = 85;
    }
  }

  // 6. Company Verification Check
  let companyVerified = false;
  if (aiCompany) {
    try {
      const { data: company } = await supabase
        .from("verified_companies")
        .select("verified")
        .ilike("company_name", aiCompany)
        .maybeSingle();

      if (company && company.verified) {
        companyVerified = true;
      }
    } catch (err) {
      console.warn("DB Company query failed");
    }

    if (!companyVerified) {
      const companyClean = aiCompany.toLowerCase().trim();
      const isFallbackVerified = Array.from(FALLBACK_VERIFIED_COMPANIES).some(c => 
        companyClean.includes(c) || c.includes(companyClean)
      );
      if (isFallbackVerified) {
        companyVerified = true;
      }
    }
  }

  // 7. Scam Check
  const { isScam: keywordScam, probability: keywordProb, reasons: keywordReasons } = checkScamKeywords(emailDetails.subject, emailDetails.body);
  let scamProbability = keywordProb;
  
  if (aiClassification === "Scam") {
    scamProbability = Math.max(scamProbability, 96);
    reasons.push("AI classified email as recruitment scam");
  }
  
  reasons.push(...keywordReasons);

  // 8. Community Trust Check
  let communityScore = 0;
  try {
    const { count } = await supabase
      .from("email_trust_logs")
      .select("*", { count: "exact", head: true })
      .eq("sender_domain", domain)
      .eq("decision", "Verified Recruitment Email");

    if (count && count > 0) {
      communityScore = Math.min(5, Math.floor(count / 2) + 1);
    }
  } catch (err) {
    console.warn("DB Community query failed");
  }

  // 9. Calculate Final Score
  let trustScore = calculateEmailTrustScore({
    domainVerified,
    domainScore,
    spf,
    dkim,
    dmarc,
    recruiterVerified,
    companyVerified,
    aiConfidence,
    communityScore
  });



  // Strict scan overrides: if SPF, DKIM, or DMARC failed on verified domains, downgrade score
  if (domainVerified && (!spf || !dkim)) {
    trustScore = Math.max(0, trustScore - 30);
    reasons.push("Authentication failed on highly trusted domain (possible spoofing)");
  }

  // Override: If scam probability is high, force Potential Scam decision
  if (scamProbability > 75) {
    trustScore = Math.min(trustScore, 35);
  }

  // 10. Determine Decision
  let decision: VerificationResult["decision"] = "Suspicious";
  if (trustScore >= 90) {
    decision = "Verified Recruitment Email";
  } else if (trustScore >= 70) {
    decision = "Likely Recruitment Email";
  } else if (trustScore >= 40) {
    decision = "Suspicious";
  } else {
    decision = "Potential Scam";
  }

  // 11. Write Logs
  if (userId && userId !== "guest-user") {
    try {
      await supabase
        .from("email_trust_logs")
        .insert({
          user_id: userId,
          sender_email: email,
          sender_domain: domain,
          subject: emailDetails.subject,
          classification: aiClassification,
          confidence: aiConfidence,
          trust_score: trustScore,
          decision
        });

      if (scamProbability >= 75 || decision === "Potential Scam") {
        await supabase
          .from("scam_detection_logs")
          .insert({
            user_id: userId,
            sender_email: email,
            scam_probability: scamProbability,
            reasons: reasons.length > 0 ? reasons : ["Flagged by low verification trust score"]
          });
      }

      // Auto-discover recruiters: if email has verified decision, automatically add to verified recruiters!
      if (decision === "Verified Recruitment Email" && !recruiter) {
        await supabase
          .from("verified_recruiters")
          .insert({
            recruiter_name: name || email.split("@")[0],
            recruiter_email: email,
            company: aiCompany || domain.split(".")[0],
            verification_status: "Verified",
            trust_score: 95
          });
      }
    } catch (err) {
      console.warn("Failed to write trust logs to DB:", err);
    }
  }

  return {
    decision,
    trustScore,
    classification: aiClassification,
    company: aiCompany,
    role: aiRole,
    confidence: aiConfidence,
    scamProbability,
    reasons
  };
}
