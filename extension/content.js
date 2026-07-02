// Content script to detect job application context and submissions
console.log("[Placement OS] Content script active.");

// Helper to get text from selectors
function getElementText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      return el.textContent.trim();
    }
  }
  return "";
}

// Scrape active job page information based on site
function scrapeJobDetails() {
  const url = window.location.href;
  let jobData = {
    company: "",
    jobTitle: "",
    location: "Remote / Open Location",
    jobUrl: url,
    source: "Careers Portal"
  };

  if (url.includes("linkedin.com")) {
    jobData.source = "LinkedIn";
    jobData.jobTitle = getElementText([
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title",
      "h1.t-24",
      "h2.t-24"
    ]);
    
    // Scrape company name
    const compEl = document.querySelector(".job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name");
    if (compEl) {
      jobData.company = compEl.textContent.replace(/•.*/, "").trim();
    } else {
      jobData.company = getElementText([".topcard__org-name-link", ".jobs-top-card__company-url"]);
    }

    // Scrape location
    jobData.location = getElementText([
      ".job-details-jobs-unified-top-card__primary-description-container span",
      ".jobs-unified-top-card__bullet",
      ".topcard__flavor-row span:nth-child(2)"
    ]) || "Remote / Open Location";

  } else if (url.includes("indeed.com")) {
    jobData.source = "Indeed";
    jobData.jobTitle = getElementText([
      "h1.jobsearch-JobInfoHeader-title",
      "[data-testid='jobsearch-JobInfoHeader-title']",
      ".jobsearch-JobInfoHeader-title-container h1"
    ]);
    jobData.company = getElementText([
      "[data-company-name='true'] a",
      "[data-company-name='true']",
      ".jobsearch-CompanyInfoWithoutHeaderImageLink a",
      ".jobsearch-CompanyInfoContainer"
    ]);
    jobData.location = getElementText([
      "[data-testid='jobsearch-JobInfoHeader-subtitle']",
      ".jobsearch-JobInfoHeader-subtitle"
    ]) || "Remote / Open Location";

  } else if (url.includes("naukri.com")) {
    jobData.source = "Naukri";
    jobData.jobTitle = getElementText([
      ".jd-header-title",
      ".npl-title",
      ".job-desc h1",
      "h1.title"
    ]);
    jobData.company = getElementText([
      ".jd-header-comp-name a",
      ".npl-company-name",
      ".job-desc .company-name",
      ".company-info a"
    ]);
    jobData.location = getElementText([
      ".location span",
      ".npl-loc",
      ".exp"
    ]) || "Remote / Open Location";

  } else if (url.includes("foundit.in")) {
    jobData.source = "Foundit";
    jobData.jobTitle = getElementText([
      ".title-details h1",
      "h1.job-title",
      ".jd-title"
    ]);
    jobData.company = getElementText([
      ".company-name a",
      ".jd-company-name",
      ".company-title"
    ]);
    jobData.location = getElementText([
      ".location span",
      ".jd-loc"
    ]) || "Remote / Open Location";

  } else {
    // Generic ATS detection (Lever / Greenhouse / Workday)
    jobData.jobTitle = getElementText(["h1", "h2", ".job-title", ".posting-header h2"]);
    
    // Try to guess company from title or domain
    const titleText = document.title || "";
    if (titleText.includes("at ")) {
      jobData.company = titleText.split("at ").pop().split("|")[0].trim();
    } else if (titleText.includes(" - ")) {
      jobData.company = titleText.split(" - ").shift().trim();
    } else {
      jobData.company = window.location.hostname.replace("www.", "").split(".")[0];
    }
  }

  // Clean values
  jobData.company = jobData.company.replace(/[\n\t]/g, "").trim();
  jobData.jobTitle = jobData.jobTitle.replace(/[\n\t]/g, "").trim();
  jobData.location = jobData.location.replace(/[\n\t]/g, "").replace(/•.*/, "").trim();

  return jobData;
}

// Check if we are currently looking at a job posting page
function isJobPostingPage() {
  const url = window.location.href;
  return (
    url.includes("/jobs/") ||
    url.includes("/view/") ||
    url.includes("jobid=") ||
    url.includes("/rc/clk") ||
    url.includes("/posting") ||
    url.includes("/careers") ||
    url.includes("greenhouse.io/") ||
    url.includes("lever.co/")
  );
}

// Track application submit actions
function initializeSubmissionTracker() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target) return;

    const url = window.location.href;
    
    // 1. LinkedIn Easy Apply Success Detection
    if (url.includes("linkedin.com")) {
      const isEasyApplySubmit = target.closest('button[aria-label="Submit application"]');
      if (isEasyApplySubmit) {
        console.log("[Placement OS] LinkedIn Easy Apply submission detected!");
        const details = scrapeJobDetails();
        sendApplicationToCRM(details);
      }
    }

    // 2. Indeed Apply Success
    if (url.includes("indeed.com")) {
      const isIndeedSubmit = target.closest('button.ia-continueButton, button[type="submit"]');
      if (isIndeedSubmit && document.body.textContent.includes("Application sent")) {
        console.log("[Placement OS] Indeed application submission detected!");
        const details = scrapeJobDetails();
        sendApplicationToCRM(details);
      }
    }

    // 3. Generic Form Submissions (Lever, Greenhouse)
    const isSubmitButton = target.closest('button[type="submit"], input[type="submit"]');
    if (isSubmitButton) {
      const form = target.closest("form");
      if (form) {
        const formAction = form.getAttribute("action") || "";
        const id = form.getAttribute("id") || "";
        
        if (
          url.includes("greenhouse.io") || 
          url.includes("lever.co") || 
          formAction.includes("apply") || 
          id.includes("apply") ||
          id.includes("application-form")
        ) {
          console.log("[Placement OS] Generic ATS application submission detected!");
          const details = scrapeJobDetails();
          // Delay briefly to allow successful submission redirects
          setTimeout(() => {
            sendApplicationToCRM(details);
          }, 1500);
        }
      }
    }
  });

  // Watch for page redirects containing success patterns
  watchRedirects();
}

let lastReportedUrl = "";
function watchRedirects() {
  const url = window.location.href;
  const successPatterns = ["/thank-you", "/thanks", "/success", "/applied", "/confirmation"];
  
  if (successPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
    if (lastReportedUrl !== url) {
      lastReportedUrl = url;
      console.log("[Placement OS] Success redirection page detected!");
      const details = scrapeJobDetails();
      sendApplicationToCRM(details);
    }
  }

  // Poll URL change for SPA pages
  setTimeout(watchRedirects, 3000);
}

// Forward to background script
function sendApplicationToCRM(details) {
  if (!details.company || !details.jobTitle) {
    console.warn("[Placement OS] Missing job title or company. Ingestion skipped.");
    return;
  }
  
  chrome.runtime.sendMessage({
    action: "submit_application",
    data: {
      ...details,
      appliedDate: new Date().toISOString().split("T")[0]
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Placement OS] Message sending error:", chrome.runtime.lastError);
    } else {
      console.log("[Placement OS] Application sync response:", response);
    }
  });
}

// Listen for popup requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get_job_details") {
    if (isJobPostingPage()) {
      const details = scrapeJobDetails();
      sendResponse({ success: true, details });
    } else {
      sendResponse({ success: false, error: "Not a job description page." });
    }
  }
  return true;
});

function isAssessmentPage() {
  const url = window.location.href;
  return (
    url.includes("hackerrank.com") ||
    url.includes("codesignal.com") ||
    url.includes("codility.com") ||
    url.includes("codility.net") ||
    url.includes("shl.com") ||
    url.includes("aspiringminds.com") ||
    url.includes("mettl.com") ||
    url.includes("myamcat.com") ||
    url.includes("elitmus.com")
  );
}

// Detect assessment platform and attempt to scrape details (Company, Duration, Platform, etc.)
function scrapeAssessmentDetails() {
  const url = window.location.href;
  const pageText = document.body ? document.body.innerText : "";
  let platform = "";
  
  if (url.includes("hackerrank.com")) {
    platform = "HackerRank";
  } else if (url.includes("codesignal.com")) {
    platform = "CodeSignal";
  } else if (url.includes("codility.com") || url.includes("codility.net")) {
    platform = "Codility";
  } else if (url.includes("shl.com") || url.includes("aspiringminds.com")) {
    platform = "SHL";
  } else if (url.includes("mettl.com")) {
    platform = "Mercer Mettl";
  } else if (url.includes("myamcat.com") || url.includes("amcat")) {
    platform = "AMCAT";
  } else if (url.includes("elitmus.com")) {
    platform = "eLitmus";
  }
  
  if (!platform) return null;
  
  // Try to find company name on the page
  let company = "";
  const titleText = document.title || "";
  
  // Match common patterns
  const companyPatterns = [
    /test for\s+([A-Za-z0-9\s]+)/i,
    /([A-Za-z0-9\s]+)\s+coding\s+test/i,
    /([A-Za-z0-9\s]+)\s+assessment/i,
    /welcome to\s+([A-Za-z0-9\s]+)/i
  ];
  
  for (const regex of companyPatterns) {
    const match = regex.exec(pageText) || regex.exec(titleText);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.toLowerCase() !== "the" && candidate.length > 2 && candidate.length < 30) {
        company = candidate;
        break;
      }
    }
  }
  
  if (!company) {
    const headers = document.querySelectorAll("h1, h2, h3, .test-title, .company-name");
    for (const h of headers) {
      const text = h.textContent.trim();
      if (text && text.length > 2 && text.length < 40 && !text.includes("Welcome") && !text.includes("Instructions")) {
        company = text;
        break;
      }
    }
  }
  
  if (!company) {
    const searchParams = new URLSearchParams(window.location.search);
    company = searchParams.get("company") || searchParams.get("c") || "";
  }
  
  if (!company) {
    company = "Unknown Company";
  }
  
  // Attempt to parse duration
  let duration = 90;
  const durationMatch = pageText.match(/(\d+)\s*(?:min|minute)/i);
  if (durationMatch && durationMatch[1]) {
    duration = parseInt(durationMatch[1], 10);
  }
  
  // Create deadline (default 3 days)
  let deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);
  
  const datePattern = /(?:deadline|before|by)\s*:\s*([A-Za-z]+\s+\d+,\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i;
  const dateMatch = pageText.match(datePattern);
  if (dateMatch && dateMatch[1]) {
    const parsedDate = new Date(dateMatch[1]);
    if (!isNaN(parsedDate.getTime())) {
      deadline = parsedDate;
    }
  }
  
  return {
    type: "oa",
    platform,
    company: company.replace(/[\n\t]/g, "").trim(),
    deadline: deadline.toISOString().split("T")[0],
    duration,
    status: "Pending",
    source: platform
  };
}

function sendOAtoCRM(oaDetails) {
  if (!oaDetails.company || oaDetails.company === "Unknown Company" || !oaDetails.platform) {
    return;
  }
  
  chrome.runtime.sendMessage({
    action: "submit_oa",
    data: oaDetails
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Placement OS] Message sending error:", chrome.runtime.lastError);
    } else {
      console.log("[Placement OS] OA sync response:", response);
    }
  });
}

// Run
if (isJobPostingPage() || window.location.href.includes("thank") || window.location.href.includes("success")) {
  initializeSubmissionTracker();
}

if (isAssessmentPage()) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const oaDetails = scrapeAssessmentDetails();
      if (oaDetails && oaDetails.company && oaDetails.company !== "Unknown Company") {
        console.log("[Placement OS] Assessment page detected:", oaDetails);
        sendOAtoCRM(oaDetails);
      }
    }, 2000);
  });
}
