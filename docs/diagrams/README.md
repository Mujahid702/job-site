# Platform Visual Architectures & Life Cycles

This document visually maps the operations of BuggedBrain using Mermaid flowcharts.

---

## 1. Overall Platform Architecture Block Diagram

```mermaid
graph TD
    Client[Candidate / Recruiter UI] --> NextJS[Next.js App Server]
    NextJS --> Auth[NextAuth / Supabase Auth]
    NextJS --> DB[Supabase PostgreSQL]
    NextJS --> Redis[Upstash Redis Caching Proxy]
    NextJS --> AI[AI Gateway Router]
    
    AI --> Gemini[Google Gemini Adapter]
    AI --> Groq[Groq LLaMA Adapter]
    AI --> OpenRouter[OpenRouter Failover]
    
    DB --> Triggers[Audit Triggers & functions]
```

---

## 2. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User as Candidate / Recruiter
    participant UI as Next.js UI Frontend
    participant Auth as Supabase Auth Server
    participant DB as public.profiles
    
    User->>UI: Enter email / credentials
    UI->>Auth: Initiate Authentication Request
    Auth-->>UI: Return JWT access token
    UI->>DB: Query profile context using JWT UID
    alt Profile Exists
        DB-->>UI: Return user profile data
        UI-->>User: Route to Candidate Dashboard
    else Profile Missing
        DB-->>UI: Return null
        UI-->>User: Route to Onboarding Flow
    end
```

---

## 3. Resume OS Evaluation Pipeline

```mermaid
graph LR
    Upload[Resume Upload (PDF/Docx)] --> Parser[Resume Parser Service]
    Parser --> Clean[Clean Raw Text]
    Clean --> Router[AI Gateway Router]
    Router --> CacheCheck{Redis Cache Lookup}
    
    CacheCheck -- Hit (Cost 0) --> Return[Display ATS & Gaps Score]
    CacheCheck -- Miss --> Gemini[Google Gemini-3.5-Pro]
    Gemini --> Cost[Log usage to public.analytics_events]
    Cost --> Save[Save to Redis Cache (TTL 24h)]
    Save --> Return
```

---

## 4. Career Roadmap Navigator Sync

```mermaid
graph TD
    UserChange[User Profile Updates / Activities] --> ScoreCalc[calculatePRIScore Trigger]
    ScoreCalc --> SyncHook[Automatic Verification useEffect Hook]
    
    SyncHook --> ATSCheck{Is ATS Score >= 70?}
    ATSCheck -- Yes --> CheckResume[Mark Resume-related tasks Completed]
    ATSCheck -- No --> KeepResume[Keep Resume tasks Pending]
    
    SyncHook --> InterviewCheck{Is Avg Interview >= 60?}
    InterviewCheck -- Yes --> CheckMock[Mark Interview tasks Completed]
    InterviewCheck -- No --> KeepMock[Keep Interview tasks Pending]
    
    SyncHook --> ProjectCheck{Is Registered Projects >= 2?}
    ProjectCheck -- Yes --> CheckProj[Mark Project tasks Completed]
    ProjectCheck -- No --> KeepProj[Keep Project tasks Pending]
    
    CheckResume & CheckMock & CheckProj --> ReCalc[Re-calculate Stage Completion %]
    ReCalc --> UnlockCheck{Is Completion 100%?}
    UnlockCheck -- Yes --> Rewards[Unlock Celebration: +500 XP, +25 PRI, Badge, CV tips]
```

---

## 5. Project Advisor OS & FAANG Mock Interview Engine

```mermaid
sequenceDiagram
    participant User as Student
    participant OS as ProjectOS UI Panel
    participant API as /api/placement/projects/generate
    participant AI as AI Gateway Router
    
    User->>OS: Select stack, target role & interest area
    OS->>API: Send generation POST request
    API->>AI: Dispatch request with target prompt schema
    AI-->>API: Return Level 1-5 progressive technical questions
    API-->>OS: Render progressive Mock rounds panel
    
    loop Level 1 to Level 5 tabs
        User->>OS: Read interview question
        OS->>User: Display CONCEPT, EXPLANATION, PITFALLS & TIPS
    end
```

---

## 6. AI Router Caching & Failover Pipeline

```mermaid
graph TD
    Request[Incoming LLM prompt Request] --> Hash[Generate SHA-256 Hash of parameters]
    Hash --> Redis{Check Redis Cache Key}
    
    Redis -- Hit --> Return[Return cached response (Latency ~100ms, Cost $0)]
    Redis -- Miss --> Primary[Call Primary Google Gemini adapter]
    
    Primary -- Success --> CacheSave[Save response to Redis (TTL 24h)]
    CacheSave --> Return
    
    Primary -- Fail (429/503) --> FallbackGroq[Failover to Groq LLaMA provider]
    FallbackGroq -- Success --> Return
    FallbackGroq -- Fail --> FallbackOR[Failover to OpenRouter API provider]
    FallbackOR -- Success --> Return
    FallbackOR -- Fail --> Offline[Serve offline fallback template]
```

---

## 7. Recruiter CRM & Trust Portal

```mermaid
sequenceDiagram
    participant Recruiter
    participant CRM as Recruiter CRM Interface
    participant OTP as /api/recruiter-verifications/otp/send
    participant DB as public.recruiter_verifications
    
    Recruiter->>CRM: Enter email and LinkedIn profile URL
    CRM->>OTP: Request verification code dispatch
    OTP->>DB: Log pending code request
    OTP-->>Recruiter: Send secure OTP to email inbox
    Recruiter->>CRM: Enter OTP code to verify identity
    CRM->>DB: Assert OTP code match
    DB-->>CRM: Verify OK & update status to 'Approved'
    CRM-->>Recruiter: Grant access to Student Portfolios
```
