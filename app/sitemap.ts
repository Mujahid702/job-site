import { supabase } from "@/lib/supabase";

export default async function sitemap() {
  const { data: jobs } = await supabase.from("jobs").select("slug");

  const baseUrl = "https://your-vercel-domain.vercel.app"; // change later

  const jobUrls = jobs?.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug}`,
    lastModified: new Date(),
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...jobUrls,
  ];
}