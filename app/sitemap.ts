import { supabase } from "@/lib/supabase";

export default async function sitemap() {
  const { data: jobs } = await supabase.from("job_postings").select("drive_slug, company_name");

  const baseUrl = "https://BuggedBrain.vercel.app";

  const jobUrls = jobs?.map((job) => ({
    url: `${baseUrl}/jobs/${job.drive_slug}`,
    lastModified: new Date(),
  })) || [];

  const companies = Array.from(new Set(jobs?.map(job => job.company_name).filter(Boolean) || []));
  const companyUrls = companies.map(company => ({
    url: `${baseUrl}/company/${(company as string).toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...jobUrls,
    ...companyUrls,
  ];
}