export interface RecruiterDetails {
  name: string;
  email: string;
  phone?: string;
  linkedIn?: string;
}

export interface InterviewSchedule {
  id: string;
  type: "Online Assessment" | "Technical Interview" | "Managerial Round" | "HR Round" | "Final Round";
  date: string;
  time: string;
  platform: string;
  notes?: string;
}

export interface OfferDetails {
  ctc: string;
  baseSalary?: string;
  joiningBonus?: string;
  location: string;
  joiningDate: string;
  growthRating: number; // 1-5
  exposureRating: number; // 1-5
  brandValueRating: number; // 1-5
  potentialRating: number; // 1-5
  offerLetterUrl?: string;
}

export interface OARecord {
  id: string;
  oaDate: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topicsAsked: string[];
  score: number;
  result: "Cleared" | "Failed" | "Pending";
  prepNotes: string;
}

export interface InterviewRoundRecord {
  id: string;
  roundName: string;
  questionsAsked: string[];
  feedback: string;
  performanceRating: number; // 1-5
  weakAreas: string[];
  improvementAreas: string[];
  outcome: "Cleared" | "Rejected" | "Pending";
}

export interface PlacementApplication {
  id: string;
  companyName: string;
  role: string;
  location: string;
  package: string; // CTC (e.g., "12 LPA")
  applicationDate: string;
  jobUrl?: string;
  referralStatus: "None" | "Requested" | "Applied" | "Referred";
  status: "Saved" | "Applied" | "Assessment Scheduled" | "Assessment Completed" | "Technical Interview" | "HR Interview" | "Offer Received" | "Joined" | "Rejected" | "Withdrawn";
  notes?: string;
  recruiter?: RecruiterDetails;
  schedules: InterviewSchedule[];
  offer?: OfferDetails;
  oas?: OARecord[];
  interviews?: InterviewRoundRecord[];
  matchScore: {
    resumeMatch: number; // %
    interviewReadiness: number; // %
    overallProbability: number; // %
    missingSkills?: string[];
    strengths?: string[];
  };
  deadline?: string; // YYYY-MM-DD
  assessmentDate?: string; // YYYY-MM-DD
  interviewDate?: string; // YYYY-MM-DD
  offerExpiry?: string; // YYYY-MM-DD
}

export interface CrmDocument {
  id: string;
  title: string;
  type: "Resume" | "Offer Letter" | "Certificate" | "Assessment Result" | "Notes";
  fileName: string;
  uploadDate: string;
  notes?: string;
}

