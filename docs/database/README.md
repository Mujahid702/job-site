# Database Relationship & Security Diagrams

This directory visualizes database tables schemas, relational entities mapping, custom RPC functions, and database triggers.

---

## 1. Relational Entities Map (ER Diagram)

```mermaid
erDiagram
    auth_users ||--|| profiles : "has profile credentials"
    auth_users ||--o{ saved_jobs : "saves postings"
    auth_users ||--o{ roadmap_progress : "completes tasks steps"
    auth_users ||--|| placement_scores : "has indexes rating"
    auth_users ||--o{ resume_scans : "has ATS history scans"
    auth_users ||--o{ jd_matches : "has comparison evaluations"
    auth_users ||--o{ student_projects : "registers projects blueprints"
    auth_users ||--o{ applications : "tracks pipelines"
    auth_users ||--o{ user_missions : "completes goals"
    auth_users ||--|| user_xp : "accumulates XP"
    
    profiles {
        uuid id PK
        uuid user_id FK
        text full_name
        text email
        text target_role
        text skills
        jsonb raw_profile_data
    }
    
    student_projects {
        uuid id PK
        uuid user_id FK
        text title
        text company
        jsonb blueprint
        jsonb readiness_checklist
    }
    
    applications {
        uuid id PK
        uuid user_id FK
        text job_title
        text company
        text status
        jsonb details
    }
```

---

## 2. Trigger Flow Lifecycle

Database operations automatically propagate updates to telemetry and progress tables:

```mermaid
graph TD
    UpdateScore[Insert/Update to public.profiles] --> TriggerProfile[set_timestamp Trigger]
    TriggerProfile --> UpdateTimestamp[Update profiles.updated_at automatically]
    
    CheckMission[Candidate marks task completed] --> MissionTrigger[Check mission progress]
    MissionTrigger --> UserMissions[Increment progress count in public.user_missions]
    UserMissions --> CompleteCheck{Progress == Target?}
    CompleteCheck -- Yes --> Complete[Mark user_missions.completed = true]
    Complete --> GrantXP[Add XP to public.user_xp]
    Complete --> GrantPRI[Add PRI score to public.placement_readiness]
```

---

## 3. RPC & Database Function Flow

Custom SQL functions handle administrative overrides and security context validation:

```mermaid
graph TD
    Request[Database query execution] --> RLSCheck{Check Table RLS Policies}
    RLSCheck -- Standard User --> ValidateUID[Match auth.uid == user_id]
    RLSCheck -- Admin bypass --> CallRPC[Call public.is_admin RPC function]
    
    CallRPC --> VerifyRole{Check raw_user_meta_data role}
    VerifyRole -- 'admin' OR 'super_admin' --> GrantAccess[Allow full read/write bypass]
    VerifyRole -- Other --> DenyBypass[Enforce user isolation bounds check]
```

---

## 4. Database Storage Buckets Security Map

-   **`resumes`**:
    - Folder: `resumes/`
    - Structure: `resumes/{user_id}/[filename].pdf`
    - RLS: Only user with `auth.uid() = user_id` can upload, modify, or read.
-   **`portfolio_assets`**:
    - Folder: `assets/`
    - Structure: `assets/{user_id}/[asset_id].png`
    - RLS: Authenticated users can insert; anyone can read to display UI images.
