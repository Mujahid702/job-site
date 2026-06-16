import { notFound } from "next/navigation";
import { Metadata } from "next";
import { COMPANY_PREP_LIST } from "@/lib/company-prep-data";
import CompanyPrepDashboard from "@/components/CompanyPrepDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return COMPANY_PREP_LIST.map(company => ({
    slug: company.slug
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = COMPANY_PREP_LIST.find(c => c.slug === slug);
  
  if (!company) {
    return {
      title: "Company Not Found | BuggedBrain",
      description: "Hiring company preparation details could not be found."
    };
  }

  const capitalizedName = company.name;
  
  // Dynamic SEO terms based on target requirements
  const title = `${capitalizedName} Interview Questions 2026 | Hiring Process & OA Pattern`;
  const description = `Practice latest ${capitalizedName} recruitment questions, dry-run Online Assessment (OA) coding and aptitude tests, view hiring rounds, and check candidate selection stories.`;
  
  return {
    title,
    description,
    keywords: [
      `${capitalizedName} Interview Questions`,
      `${capitalizedName} Hiring Process`,
      `${capitalizedName} OA Pattern`,
      `${capitalizedName} Placement Guide`,
      `BuggedBrain Placement OS`
    ]
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const company = COMPANY_PREP_LIST.find(c => c.slug === slug);

  if (!company) {
    return notFound();
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": company.questionBank.slice(0, 3).map(qb => ({
      "@type": "Question",
      "name": qb.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": qb.answer
      }
    }))
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex-grow">
        <CompanyPrepDashboard slug={slug} companyData={company} />
      </div>
    </div>
  );
}
