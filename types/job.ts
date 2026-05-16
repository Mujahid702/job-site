export interface Job {
  id: string;
  
  // Basic Job Details
  drive_title: string;
  drive_slug: string;
  company_name: string;
  company_logo?: string;
  company_website?: string;

  // Job Information
  location?: string;
  job_type?: string; // Full Time, Internship, Remote, Hybrid etc.
  experience_level?: string; // Fresher, 0-1 Years etc.
  salary_range?: string;
  apply_link: string;

  // Content Sections
  drive_description?: string;
  eligibility_criteria?: string;
  key_responsibilities?: string;
  required_skills?: string;
  selection_process?: string;
  resume_tips?: string;
  interview_questions_tips?: string;

  // Additional SEO & Metadata
  meta_title?: string;
  meta_description?: string;
  keywords?: string;

  // Categorization
  category?: string; // Software, Core, Finance, AI etc.
  tags?: string[]; // Array of tags

  // Status Management
  is_featured: boolean;
  is_active: boolean;
  approval_status?: string;

  // Analytics
  views_count: number;
  applications_count: number;

  // Dates
  posted_date?: string;
  expiry_date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}
