import { supabase } from "@/lib/supabase";

export default async function sitemap() {
  const { data: jobs } = await supabase.from("jobs").select("slug, company");

  const baseUrl = "https://BuggedBrain.vercel.app";

  const jobUrls = jobs?.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug}`,
    lastModified: new Date(),
  })) || [];

  const companies = Array.from(new Set(jobs?.map(job => job.company).filter(Boolean) || []));
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