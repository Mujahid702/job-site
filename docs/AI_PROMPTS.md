# System AI Prompt Library Reference

This library documents prompt structures, reasoning guidelines, target models, cache categories, and fallbacks.

---

## 1. Resume OS Prompts

### 1. ATS scanner & Keyword Auditor Prompt
-   **Purpose**: Scans raw resume text to calculate formatting ratings and extract keywords gaps.
-   **Target Model**: `gemini-3.5-pro` (primary) / `groq-llama-3-70b` (fallback)
-   **Caching**: 24-hour cacheable index (`ats:*`)
-   **Prompt Schema**:
    ```text
    System: You are an expert ATS (Applicant Tracking System) scan filter. Analyze the user's raw resume text against industry standards for the target role: {{targetRole}}.
    
    Format requirements: Return a JSON object matching this schema:
    {
      "atsScore": number (0-100),
      "roleFitScore": number (0-100),
      "feedback": {
        "missedKeywords": string[],
        "formatIssues": string[],
        "readabilityScore": number
      }
    }
    ```
-   **Reasoning Style**: Critical, analytical, focusing on recruitment-friendly ATS format structures.
-   **Fallback**: Serves standard formatting feedback with a default score of 70 if connection times out.

---

## 2. Project Advisor OS Prompts

### 1. Progressive Blueprint Generator
-   **Purpose**: Creates advanced portfolio project designs mapping targeted interview prep rounds.
-   **Target Model**: `gemini-3.5-pro`
-   **Caching**: Disabled (customized to active user profile metrics)
-   **Prompt Schema**:
    ```text
    System: You are a Google/Netflix Principal Engineer. Design a portfolio project blueprint for a student targeting a {{targetRole}} role at {{company}}. Focus on {{interestArea}}.
    
    Enforce 5 progressive mock interview levels. Return JSON only matching the schema:
    {
      "title": string,
      "recommendedStack": { "frontend": string, "backend": string, "database": string },
      "architecture": { "systemOverview": string, "flowDiagram": string },
      "learningOutcomes": string[],
      "mockInterviewRounds": {
        "level1": [{"q": string, "a": string, "concept": string, "explanation": string, "realExample": string, "productionPerspective": string, "mistakes": string, "tips": string, "followUps": string[]}],
        "level2": [...],
        "level3": [...],
        "level4": [...],
        "level5": [...]
      }
    }
    ```
-   **Reasoning Style**: High-complexity systems, strict schema adherence, trade-offs considerations, and detailed code skeletons design.
-   **Fallback**: Serves Expense Tracker blueprint from fallback presets.

---

## 3. Career Navigator Prompts

### 1. 5-Stage Roadmap & Verification Checkpoints Prompt
-   **Purpose**: Compiles a stage-by-stage learning roadmap containing checkpoints.
-   **Target Model**: `gemini-3.5-flash`
-   **Caching**: 24-hour cacheable index (`roadmap:*`)
-   **Prompt Schema**:
    ```text
    System: Create a 5-stage career progression roadmap for a candidate aiming to clear interviews for {{targetRole}}.
    
    Structure actionChecklist items containing taskName, status, verificationStatus, and xpReward. Output JSON:
    {
      "stages": [
        {
          "stageIndex": number,
          "stageName": string,
          "estimatedDuration": string,
          "difficulty": string,
          "expectedOutcome": string,
          "skillsCovered": string[],
          "learningResources": [{"title": string, "url": string, "type": string}],
          "actionChecklist": [{"taskName": string, "status": string, "verificationStatus": string, "xpReward": number}]
        }
      ],
      "plan306090": {
        "plan30Day": { "dailyTasks": string[], "monthlyGoals": string[] },
        "plan60Day": { "dailyTasks": string[], "monthlyGoals": string[] },
        "plan90Day": { "dailyTasks": string[], "monthlyGoals": string[] }
      }
    }
    ```
-   **Reasoning Style**: Educational, sequential, structured, with verifiable checkpoint definitions.
-   **Fallback**: Loads default role presets templates from `lib/career-roadmap-presets.ts`.
