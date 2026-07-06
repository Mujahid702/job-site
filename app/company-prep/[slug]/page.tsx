import { notFound } from "next/navigation";
import { Metadata } from "next";
import { COMPANY_PREP_LIST } from "@/lib/company-prep-data";
import CompanyPrepDashboard from "@/components/CompanyPrepDashboard";
import { getCompanyPrepBySlug, incrementCompanyPrepView } from "@/lib/db/company-prep";
import { createClient } from "@/lib/supabase/server";
import { isFeatureVisible } from "@/lib/featureFlags";
import FeatureUnavailable from "@/components/FeatureUnavailable";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  let company = await getCompanyPrepBySlug(slug, supabase);
  let name = "";
  
  if (company) {
    name = company.name;
  } else {
    const staticComp = COMPANY_PREP_LIST.find(c => c.slug === slug);
    if (staticComp) {
      name = staticComp.name;
    }
  }

  if (!name) {
    return {
      title: "Company Not Found | BuggedBrain",
      description: "Hiring company preparation details could not be found."
    };
  }

  const title = `${name} Interview Questions 2026 | Hiring Process & OA Pattern`;
  const description = `Practice latest ${name} recruitment questions, dry-run Online Assessment (OA) coding and aptitude tests, view hiring rounds, and check candidate selection stories.`;
  
  return {
    title,
    description,
    keywords: [
      `${name} Interview Questions`,
      `${name} Hiring Process`,
      `${name} OA Pattern`,
      `${name} Placement Guide`,
      `BuggedBrain Placement OS`
    ]
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!isFeatureVisible("company", user)) {
    return <FeatureUnavailable />;
  }
  
  let company = await getCompanyPrepBySlug(slug, supabase);
  let isFallback = false;

  // Fallback to static list if database is unseeded
  if (!company) {
    const staticComp = COMPANY_PREP_LIST.find(c => c.slug === slug);
    if (staticComp) {
      isFallback = true;
      company = {
        id: staticComp.slug, // Mock UUID
        slug: staticComp.slug,
        name: staticComp.name,
        overview: staticComp.overview,
        difficulty: staticComp.difficulty,
        salary_range: staticComp.salaryRange,
        eligibility_cgpa: staticComp.eligibility.includes('CGPA') ? parseFloat(staticComp.eligibility.match(/\d+\.\d+/)?.[0] || '6.0') : 6.0,
        eligibility_branches: staticComp.eligibility.includes('BTech') ? ['Computer Science', 'Information Technology', 'Software Engineering'] : [],
        eligibility_criteria: staticComp.eligibility,
        hiring_frequency: 'Annual',
        roles_hired: staticComp.rolesHired,
        must_have_skills: staticComp.mustHaveSkills,
        good_to_have_skills: staticComp.goodToHaveSkills,
        bonus_skills: staticComp.bonusSkills,
        package_value: staticComp.packageValue,
        active_rounds: staticComp.activeRounds,
        role_details: staticComp.roleDetails || {},
        is_active: true,
        rounds: staticComp.hiringProcess.map((r, idx) => ({
          id: `round-${idx}`,
          round_number: idx + 1,
          name: r.name,
          duration: r.duration,
          difficulty: r.difficulty,
          tips: r.tips
        })),
        resources: [
          { id: 'res-1', name: `${staticComp.name} Placement Playbook 2026.pdf`, type: 'pdf', url: 'https://example.com/playbook.pdf', description: 'Comprehensive review of patterns.', round_number: 1 },
          { id: 'res-2', name: `${staticComp.name} OA Practice Sheet.xlsx`, type: 'sheet', url: 'https://example.com/sheet.xlsx', description: 'Solved quantitative questions.', round_number: 1 },
          { id: 'res-3', name: `${staticComp.name} DSA Coding Questions.pdf`, type: 'pdf', url: 'https://example.com/dsa.pdf', description: 'Algorithmic dynamic codes.', round_number: 2 },
          { id: 'res-4', name: `${staticComp.name} HR Behavioral STAR Bank.pdf`, type: 'pdf', url: 'https://example.com/star.pdf', description: 'Behavioral responses.', round_number: 3 }
        ]
      };
    }
  }

  if (!company) {
    return notFound();
  }

  // Increment views analytics in database if not fallback
  if (!isFallback && company.id) {
    incrementCompanyPrepView(company.id).catch(console.error);
  }

  // Generate SEO Structured Data JSON-LD
  const breadcrumbListSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://buggedbrain.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Company Prep",
        "item": `https://buggedbrain.com/company-prep/${slug}`
      }
    ]
  };

  // Safe fallback metadata questions
  const qaSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": company.rounds?.slice(0, 3).map((r: any) => ({
      "@type": "Question",
      "name": `What is ${company.name} Round ${r.round_number}: ${r.name}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": r.tips
      }
    })) || []
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Inject Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
      />

      <div className="flex-grow">
        <CompanyPrepDashboard slug={slug} companyData={company} />
      </div>
    </div>
  );
}
