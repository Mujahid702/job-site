import { User } from "@supabase/supabase-js";

export interface FeatureFlag {
  enabled: boolean;
  productionVisible: boolean;
  developmentVisible: boolean;
  metadata?: {
    moduleName: string;
    releaseVersion: string;
    estimatedLaunch: string;
    status: string;
    internalNotes: string;
  };
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  dashboard: { enabled: true, productionVisible: true, developmentVisible: true },
  "resume-os": { enabled: true, productionVisible: true, developmentVisible: true },
  "assessment-os": { enabled: true, productionVisible: true, developmentVisible: true },
  "projects-os": { enabled: true, productionVisible: true, developmentVisible: true },
  "recommended": { enabled: true, productionVisible: true, developmentVisible: true },
  "placement-missions": { enabled: true, productionVisible: true, developmentVisible: true },
  "actions": { enabled: true, productionVisible: true, developmentVisible: true },
  "cover-letter-os": { enabled: true, productionVisible: true, developmentVisible: true },
  "community": { enabled: true, productionVisible: true, developmentVisible: true },
  "community-hub": { enabled: true, productionVisible: true, developmentVisible: true },

  // Hidden Modules
  "placement-readiness": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Placement Readiness Index (PRI)",
      releaseVersion: "v2.5.0",
      estimatedLaunch: "2026-09-01",
      status: "under enhancement",
      internalNotes: "Refining PRI calculation logic and adding cohort comparison matrices."
    }
  },
  "roadmap": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Career Roadmaps",
      releaseVersion: "v3.0.0",
      estimatedLaunch: "2026-10-15",
      status: "under enhancement",
      internalNotes: "Upgrading visual interactive flowcharts with real-time roadmap synchronization."
    }
  },
  "company": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Company Preparation",
      releaseVersion: "v2.2.0",
      estimatedLaunch: "2026-08-30",
      status: "under enhancement",
      internalNotes: "Adding Adobe, Oracle, Salesforce specific prep playbooks."
    }
  },
  "placement-tracker": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Placement Tracker OS",
      releaseVersion: "v2.3.0",
      estimatedLaunch: "2026-09-15",
      status: "under enhancement",
      internalNotes: "Optimizing application Kanban board visual styles and performance."
    }
  },
  "recruiters": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Recruiter CRM",
      releaseVersion: "v2.4.0",
      estimatedLaunch: "2026-09-30",
      status: "under enhancement",
      internalNotes: "Upgrading recruiter contact management sync with Outlook/Gmail."
    }
  },
  "portfolio-os": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Portfolio OS",
      releaseVersion: "v2.0.0",
      estimatedLaunch: "2026-08-15",
      status: "under enhancement",
      internalNotes: "Redesigning dynamic template rendering engine for student portfolios."
    }
  },
  "linkedin-os": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "LinkedIn OS",
      releaseVersion: "v2.1.0",
      estimatedLaunch: "2026-08-20",
      status: "under enhancement",
      internalNotes: "Integrating automated profile analyzer and copywriter improvements."
    }
  },
  "placement-copilot": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "AI Placement Copilot",
      releaseVersion: "v2.6.0",
      estimatedLaunch: "2026-10-01",
      status: "under enhancement",
      internalNotes: "Fine-tuning custom LLM models for customized career advice output."
    }
  },
  "interview-prep": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "AI Interview Prep",
      releaseVersion: "v3.1.0",
      estimatedLaunch: "2026-11-01",
      status: "under enhancement",
      internalNotes: "Integrating real-time speech analysis and confidence feedback score gauges."
    }
  },
  "mentorship-os": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Mentorship OS",
      releaseVersion: "v2.7.0",
      estimatedLaunch: "2026-10-10",
      status: "under enhancement",
      internalNotes: "Adding video calling slots integration with Zoom and Google Meet."
    }
  },
  "membership": {
    enabled: true,
    productionVisible: false,
    developmentVisible: true,
    metadata: {
      moduleName: "Premium Plans",
      releaseVersion: "v2.0.0",
      estimatedLaunch: "2026-08-01",
      status: "under enhancement",
      internalNotes: "Upgrading checkout experience with Stripe elements overlay."
    }
  }
};

// Toggle this to true to force production-like feature gating locally in development
const FORCE_PRODUCTION_GATE = false;

export function isFeatureVisible(featureId: string, user: User | null): boolean {
  // Check if disabled globally first
  const flag = FEATURE_FLAGS[featureId];
  if (!flag) return true; // default to true if not flagged
  if (!flag.enabled) return false;

  // Bypass for admins in any environment (unless ignore_admin is forced)
  let ignoreAdmin = false;
  if (typeof window !== "undefined") {
    if (window.location.search.includes("ignore_admin=true") || localStorage.getItem("ignore_admin") === "true") {
      ignoreAdmin = true;
    }
  }

  if (user && !ignoreAdmin) {
    const email = user.email || "";
    const role = user.user_metadata?.role || "";
    const isAdminUser = 
      email === "admin@example.com" ||
      email === "buggedbrain2026@gmail.com" ||
      email === "mujjumujahid1992@gmail.com" ||
      role === "admin" ||
      role === "super_admin";
      
    if (isAdminUser) return true;
  }

  // Environment checks
  let isDev = process.env.NODE_ENV === "development";
  
  // Developer simulation triggers
  if (FORCE_PRODUCTION_GATE) {
    isDev = false;
  } else if (typeof window !== "undefined") {
    if (window.location.search.includes("simulate_production=true") || localStorage.getItem("simulate_production") === "true") {
      isDev = false;
    }
  }

  if (isDev) {
    return flag.developmentVisible;
  } else {
    return flag.productionVisible;
  }
}
