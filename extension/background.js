// Background script for Placement OS Extension
console.log("[Placement OS] Background service worker initialized.");

const DEFAULT_BACKEND_URL = "http://localhost:3000";

// Show notification helper
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='7' width='20' height='14' rx='2' ry='2'/><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/></svg>",
    title: title,
    message: message,
    priority: 2
  });
}

// Ingest application details to Next.js backend API
async function uploadApplication(jobData) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extensionToken", "customBackendUrl"], async (result) => {
      const token = result.extensionToken;
      const backendUrl = result.customBackendUrl || DEFAULT_BACKEND_URL;

      if (!token) {
        console.warn("[Placement OS] Missing extension token. Sync aborted.");
        showNotification(
          "Sync Blocked", 
          "Extension API Key missing. Please paste your token into the extension settings."
        );
        resolve({ success: false, error: "Missing API Token" });
        return;
      }

      try {
        console.log(`[Placement OS] Sending job data to ${backendUrl}/api/placement/extension...`);
        const response = await fetch(`${backendUrl}/api/placement/extension`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(jobData)
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          console.log("[Placement OS] Sync success:", resData);
          showNotification(
            "Application Synced ✓", 
            `Successfully logged ${jobData.jobTitle} at ${jobData.company} into your Placement CRM.`
          );
          resolve({ success: true });
        } else {
          console.error("[Placement OS] Sync rejected by server:", resData);
          showNotification(
            "Sync Failure", 
            resData.message || "Failed to sync application to CRM."
          );
          resolve({ success: false, error: resData.message });
        }
      } catch (err) {
        console.error("[Placement OS] Server request exception:", err);
        showNotification(
          "Network Error", 
          "Unable to communicate with Placement OS server."
        );
        resolve({ success: false, error: "Network connection refused" });
      }
    });
  });
}

async function uploadOA(oaData) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extensionToken", "customBackendUrl"], async (result) => {
      const token = result.extensionToken;
      const backendUrl = result.customBackendUrl || DEFAULT_BACKEND_URL;

      if (!token) {
        console.warn("[Placement OS] Missing extension token. OA Sync aborted.");
        resolve({ success: false, error: "Missing API Token" });
        return;
      }

      try {
        console.log(`[Placement OS] Sending OA data to ${backendUrl}/api/placement/extension...`);
        const response = await fetch(`${backendUrl}/api/placement/extension`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(oaData)
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          console.log("[Placement OS] OA Sync success:", resData);
          showNotification(
            "Assessment Logged ✓", 
            `Successfully logged ${oaData.platform} OA deadline for ${oaData.company} into your CRM.`
          );
          resolve({ success: true });
        } else {
          console.error("[Placement OS] OA Sync rejected by server:", resData);
          resolve({ success: false, error: resData.message });
        }
      } catch (err) {
        console.error("[Placement OS] Server OA request exception:", err);
        resolve({ success: false, error: "Network connection refused" });
      }
    });
  });
}

// Listen to message pipelines from content.js and popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "submit_application") {
    // Deduplicate rapid triggers using a short lock check
    chrome.storage.local.get("lastIngestedId", async (stored) => {
      const matchKey = `${message.data.company}-${message.data.jobTitle}`;
      if (stored.lastIngestedId === matchKey) {
        console.log("[Placement OS] Ingestion deduplicated.");
        sendResponse({ success: true, message: "Duplicate query blocked" });
        return;
      }
      
      // Save last ID to avoid duplicate events
      chrome.storage.local.set({ lastIngestedId: matchKey });
      
      const result = await uploadApplication(message.data);
      sendResponse(result);
    });
    return true; // async resolution
  }
  
  if (message.action === "submit_oa") {
    chrome.storage.local.get("lastIngestedOaId", async (stored) => {
      const matchKey = `${message.data.company}-${message.data.platform}`;
      if (stored.lastIngestedOaId === matchKey) {
        console.log("[Placement OS] OA ingestion deduplicated.");
        sendResponse({ success: true, message: "Duplicate OA blocked" });
        return;
      }
      
      chrome.storage.local.set({ lastIngestedOaId: matchKey });
      
      const result = await uploadOA(message.data);
      sendResponse(result);
    });
    return true;
  }
  
  return true;
});
