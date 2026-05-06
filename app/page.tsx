import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function Home() {
  const { data: jobs } = await supabase.from("jobs").select("*");

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Fresher Jobs 2026 🚀
      </h1>

      <div className="space-y-4">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.slug}`} className="block p-4 border rounded-lg">
            {job.title}
          </Link>
        ))}
      </div>
    </main>
  );
}