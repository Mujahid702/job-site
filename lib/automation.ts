import fs from "fs";
import path from "path";

// Helper to normalize company names for knowledge base lookup
export function normalizeCompanyName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("ibm")) return "IBM";
  if (normalized.includes("tcs") || normalized.includes("tata consultancy")) return "TCS";
  if (normalized.includes("infosys")) return "Infosys";
  if (normalized.includes("wipro")) return "Wipro";
  
  // Return capitalize first word as default
  return name.split(/[\s,]+/)[0];
}

// Generate an SEO-friendly URL slug
export function generateSlug(companyName: string, title: string): string {
  const currentYear = new Date().getFullYear();
  const yearSuffix = title.includes(String(currentYear)) || title.includes(String(currentYear + 1)) ? "" : ` ${currentYear}`;
  
  const text = `${companyName} ${title}${yearSuffix}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/[\s_-]+/g, "-")      // replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "");      // trim leading/trailing hyphens
    
  return text;
}

// Automatic tagging based on job title, description, category, and type
export function autoTag(
  title: string,
  description: string = "",
  category: string = "",
  jobType: string = "",
  experienceLevel: string = ""
): string[] {
  const tagsSet = new Set<string>();
  const textToScan = `${title} ${description} ${category}`.toLowerCase();

  // 1. Remote Tag
  if (
    jobType.toLowerCase() === "remote" ||
    textToScan.includes("work from home") ||
    textToScan.includes("remote job") ||
    textToScan.includes("wfh")
  ) {
    tagsSet.add("Remote");
  }

  // 2. Internship Tag
  if (
    jobType.toLowerCase() === "internship" ||
    textToScan.includes("internship") ||
    textToScan.includes("intern")
  ) {
    tagsSet.add("Internship");
  }

  // 3. Software Tag
  if (
    category.toLowerCase() === "software" ||
    textToScan.includes("software") ||
    textToScan.includes("developer") ||
    textToScan.includes("frontend") ||
    textToScan.includes("backend") ||
    textToScan.includes("fullstack") ||
    textToScan.includes("web dev") ||
    textToScan.includes("react") ||
    textToScan.includes("node")
  ) {
    tagsSet.add("Software");
  }

  // 4. Data Science Tag
  if (
    textToScan.includes("data science") ||
    textToScan.includes("machine learning") ||
    textToScan.includes("deep learning") ||
    textToScan.includes("python programmer") ||
    textToScan.includes("data scientist") ||
    textToScan.includes("pytorch") ||
    textToScan.includes("tensorflow")
  ) {
    tagsSet.add("Data Science");
  }

  // 5. Analyst Tag
  if (
    textToScan.includes("analyst") ||
    textToScan.includes("business analyst") ||
    textToScan.includes("data analyst") ||
    textToScan.includes("risk analyst")
  ) {
    tagsSet.add("Analyst");
  }

  // 6. Fresher Tag
  if (
    experienceLevel.toLowerCase() === "fresher" ||
    experienceLevel.toLowerCase() === "0-1 years" ||
    textToScan.includes("fresher") ||
    textToScan.includes("2026 batch") ||
    textToScan.includes("2025 batch") ||
    textToScan.includes("recent graduate") ||
    textToScan.includes("entry level")
  ) {
    tagsSet.add("Fresher");
  }

  // 7. Technology Tags from context
  const commonTechs = ["React", "Node.js", "Python", "Java", "SQL", "TypeScript", "AWS", "Docker", "Next.js", "C++"];
  commonTechs.forEach(tech => {
    // Escape special characters in tech name
    const escaped = tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(textToScan)) {
      tagsSet.add(tech);
    }
  });

  return Array.from(tagsSet);
}

// Retrieve company profile from local knowledge base
export function getCompanyProfile(companyName: string) {
  const profilePath = path.join(process.cwd(), "lib", "company-profiles.json");
  try {
    if (!fs.existsSync(profilePath)) {
      return null;
    }
    const rawData = fs.readFileSync(profilePath, "utf8");
    const profiles = JSON.parse(rawData);
    
    const key = normalizeCompanyName(companyName);
    return profiles[key] || null;
  } catch (err) {
    console.error("Error reading company profiles:", err);
    return null;
  }
}

// Save or update a company profile in the knowledge base
export function saveCompanyProfile(companyName: string, profile: {
  company_overview: string;
  hiring_process: string;
  interview_process: string;
  work_culture: string;
  salary_trends: string;
}) {
  const profilePath = path.join(process.cwd(), "lib", "company-profiles.json");
  try {
    let profiles: Record<string, typeof profile> = {};
    if (fs.existsSync(profilePath)) {
      const rawData = fs.readFileSync(profilePath, "utf8");
      profiles = JSON.parse(rawData);
    }
    
    const key = normalizeCompanyName(companyName);
    profiles[key] = {
      ...profiles[key],
      ...profile
    };
    
    fs.writeFileSync(profilePath, JSON.stringify(profiles, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error saving company profile:", err);
    return false;
  }
}
