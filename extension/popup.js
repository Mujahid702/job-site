document.addEventListener("DOMContentLoaded", () => {
  const inputToken = document.getElementById("inputToken");
  const btnSaveConfig = document.getElementById("btnSaveConfig");
  const toggleAutoAdd = document.getElementById("toggleAutoAdd");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const alertBanner = document.getElementById("alertBanner");
  
  const noJobView = document.getElementById("noJobView");
  const jobView = document.getElementById("jobView");
  const jobTitle = document.getElementById("jobTitle");
  const jobCompany = document.getElementById("jobCompany");
  const jobLoc = document.getElementById("jobLoc");
  const jobSrc = document.getElementById("jobSrc");
  const btnAddToCRM = document.getElementById("btnAddToCRM");

  let activeScrapedDetails = null;

  // 1. Initial State Sync from storage
  chrome.storage.local.get(["extensionToken", "autoAddEnabled"], (result) => {
    if (result.extensionToken) {
      inputToken.value = result.extensionToken;
      setAuthStatus(true);
    } else {
      setAuthStatus(false);
    }
    
    if (result.autoAddEnabled !== undefined) {
      toggleAutoAdd.checked = result.autoAddEnabled;
    }
  });

  function setAuthStatus(isActive) {
    if (isActive) {
      statusDot.className = "status-dot bg-green";
      statusText.textContent = "API Connector Active";
      statusText.style.color = "#10b981";
    } else {
      statusDot.className = "status-dot bg-red";
      statusText.textContent = "Enter Token Key";
      statusText.style.color = "#ef4444";
    }
  }

  // 2. Save Key Handler
  btnSaveConfig.addEventListener("click", () => {
    const token = inputToken.value.trim();
    if (!token) {
      alert("Please paste a valid token before saving.");
      return;
    }
    
    chrome.storage.local.set({ extensionToken: token }, () => {
      setAuthStatus(true);
      showAlert("Configuration Saved ✓");
    });
  });

  // 3. Auto Sync Toggle Handler
  toggleAutoAdd.addEventListener("change", () => {
    chrome.storage.local.set({ autoAddEnabled: toggleAutoAdd.checked });
  });

  // 4. Request Active Tab Scraper Data
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    const tab = tabs[0];

    // Query active tab content script
    chrome.tabs.sendMessage(tab.id, { action: "get_job_details" }, (response) => {
      // Check for errors or lack of response (e.g. extension loaded after page load)
      if (chrome.runtime.lastError || !response || !response.success) {
        console.log("Could not pull job context or tab is unsupported.");
        noJobView.style.display = "block";
        jobView.style.display = "none";
        return;
      }

      // Display job details
      activeScrapedDetails = response.details;
      jobTitle.textContent = response.details.jobTitle || "Job Role";
      jobCompany.textContent = response.details.company || "Company";
      jobLoc.textContent = response.details.location || "Open Location";
      jobSrc.textContent = response.details.source || "Web Listing";

      noJobView.style.display = "none";
      jobView.style.display = "flex";
    });
  });

  // 5. Save Button Ingest trigger
  btnAddToCRM.addEventListener("click", () => {
    if (!activeScrapedDetails) return;

    btnAddToCRM.disabled = true;
    btnAddToCRM.textContent = "Syncing with Placement CRM...";
    btnAddToCRM.style.backgroundColor = "#4b5563";

    chrome.runtime.sendMessage({
      action: "submit_application",
      data: {
        ...activeScrapedDetails,
        appliedDate: new Date().toISOString().split("T")[0]
      }
    }, (response) => {
      btnAddToCRM.disabled = false;
      btnAddToCRM.textContent = "Add to CRM Ingestion";
      btnAddToCRM.style.backgroundColor = "var(--primary)";

      if (response && response.success) {
        showAlert("Synced Successfully ✓");
      } else {
        alert("Failed to sync application: " + (response?.error || "Connection timed out"));
      }
    });
  });

  function showAlert(msg) {
    alertBanner.textContent = msg;
    alertBanner.style.display = "block";
    setTimeout(() => {
      alertBanner.style.display = "none";
    }, 2500);
  }
});
