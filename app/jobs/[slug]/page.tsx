export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!job) return {};

  return {
    title: `${job.title} | Apply Now`,
    description: job.description.slice(0, 150),
  };
}

import { supabase } from "@/lib/supabase";

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!job) return <div className="p-6">Job not found</div>;

  const jobUrl = `https://BuggedBrain.vercel.app/jobs/${job.slug}`;;

  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            title: job.title,
            description: job.description,
            datePosted: new Date().toISOString(),
            employmentType: "FULL_TIME",
            hiringOrganization: {
              "@type": "Organization",
              name: job.company,
            },
          }),
        }}
      />

      <h1 className="text-2xl font-bold mb-4">{job.title}</h1>

      <div className="mb-4 text-gray-600">
        {job.company} | {job.salary} | {job.location}
      </div>

      <a href={job.apply_link} target="_blank">
        <button className="bg-blue-600 text-white px-6 py-3 rounded mb-6">
          Apply Now
        </button>
      </a>

      <div className="bg-gray-200 h-24 flex items-center justify-center mb-6">
        Ad Slot
      </div>

      <h2 className="text-xl font-semibold mb-2">Job Description</h2>
      <p className="mb-6">{job.description}</p>

      <h2 className="text-xl font-semibold mb-2">Eligibility</h2>
      <p className="mb-6">{job.eligibility}</p>

      <h2 className="text-xl font-semibold mb-2">Resume Tips</h2>
      <p className="mb-6">{job.resume_tips}</p>

      <div className="bg-gray-200 h-24 flex items-center justify-center mb-6">
        Ad Slot
      </div>

      <h2 className="text-xl font-semibold mb-2">Interview Tips</h2>
      <p className="mb-6">{job.interview_tips}</p>

      <h2 className="text-xl font-semibold mb-2">How to Apply</h2>
      <p className="mb-6">
        Click the apply button above and complete your application.
      </p>

      <a href={job.apply_link} target="_blank">
        <button className="bg-blue-600 text-white px-6 py-3 rounded mb-6">
          Apply Now
        </button>
      </a>

      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(
          `Check this job: ${job.title} ${jobUrl}`
        )}`}
        target="_blank"
      >
        <button className="bg-green-500 text-white px-4 py-2 mt-4">
          Share on WhatsApp
        </button>
      </a>

    </div>
  );
}