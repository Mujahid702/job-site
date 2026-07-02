import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllMentors } from "@/lib/db/mentor";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company") || "all";
    const role = searchParams.get("role") || "all";
    const pricing = searchParams.get("pricing") || "all";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const query = searchParams.get("query") || "";

    // 1. Fetch active mentors
    const rawMentors = await getAllMentors({
      company,
      role,
      pricing,
      verifiedOnly
    });

    // 2. Perform textual client search filter if query is provided
    let mentors = rawMentors;
    if (query.trim()) {
      const q = query.toLowerCase();
      mentors = rawMentors.filter(m => 
        m.full_name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.job_title.toLowerCase().includes(q) ||
        m.skills.some(s => s.toLowerCase().includes(q)) ||
        m.specializations.some(s => s.toLowerCase().includes(q))
      );
    }

    // 3. AI Matcher calculations: if user is logged in, pull profile data to score
    let matchedMentors = [];
    if (user) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_role, skills")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch ATS Score
      const { data: readiness } = await supabase
        .from("placement_readiness")
        .select("pri_score, resume_score, interview_score")
        .eq("user_id", user.id)
        .maybeSingle();

      const userTargetRole = profile?.target_role || "Software Developer";
      const userSkills = (profile?.skills as string[]) || [];
      const userAtsScore = readiness?.resume_score || 75;

      matchedMentors = rawMentors.map(m => {
        let score = 50;

        // Target Role alignment
        const cleanRole = userTargetRole.toLowerCase();
        const cleanMentorRole = m.job_title.toLowerCase();
        if (cleanMentorRole.includes(cleanRole) || m.skills.some(s => cleanRole.includes(s.toLowerCase()))) {
          score += 20;
        }

        // Target Company alignment (Check if user has dream companies and matches mentor's company)
        // Assume Google/Amazon/Meta matches
        if (cleanRole.includes(m.company.toLowerCase())) {
          score += 15;
        }

        // Specializations matching resume check
        if (m.specializations.some(spec => spec.toLowerCase().includes("resume") || spec.toLowerCase().includes("ats"))) {
          score += 5;
        }

        // Skills match
        const matchingSkills = m.skills.filter(s => 
          userSkills.some(us => us.toLowerCase() === s.toLowerCase())
        );
        score += matchingSkills.length * 3;

        // ATS check contribution
        if (userAtsScore > 80) {
          score += 5;
        }

        const finalScore = Math.min(score, 100);

        // Formulate Reasoning text
        let reasoning = "";
        if (finalScore >= 85) {
          reasoning = `Outstanding match! ${m.full_name} is a ${m.job_title} at ${m.company}. They specialize in ${m.specializations[0] || "Placement Roadmap"}, which directly maps to your goals for landing a role at ${m.company}.`;
        } else if (finalScore >= 70) {
          reasoning = `Good alignment. Matches skills in ${m.skills.slice(0, 2).join(", ")}. Can help you optimize projects and prepare behavioral answers.`;
        } else {
          reasoning = `General career guidance candidate. Highly rated for generic interviews preps and coding tests setup.`;
        }

        return {
          mentor: m,
          score: finalScore,
          reasoning
        };
      }).sort((a, b) => b.score - a.score);
    } else {
      // Fallback matching
      matchedMentors = rawMentors.map(m => ({
        mentor: m,
        score: 60,
        reasoning: "Log in to compute a custom placement alignment index."
      }));
    }

    return NextResponse.json({
      success: true,
      mentors,
      matches: matchedMentors
    });

  } catch (err: any) {
    console.error("GET /api/mentorship/mentors error:", err);
    return NextResponse.json({ success: false, message: err?.message || "Server Error" }, { status: 500 });
  }
}
