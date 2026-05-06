import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function FresherJobs() {
  const { data: jobs } = await supabase.from("jobs").select("*");

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Fresher Jobs 2026
      </h1>

      {jobs?.map((job) => (
        <Link key={job.id} href={`/jobs/${job.slug}`}>
          <div className="border p-4 mb-4">{job.title}</div>
        </Link>
      ))}
    </div>
  );
}