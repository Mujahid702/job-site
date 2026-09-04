import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Parse query params (optional filtering)
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill") || "";
    const minPri = parseInt(searchParams.get("minPri") || "0", 10);

    // Dynamic Seed Candidate list matching recruitment drives
    const allCandidates = [
      { id: "c1", name: "Rohan Sharma", college: "VIT University", targetRole: "Full Stack Engineer", skills: ["React", "Node.js", "TypeScript", "Redis"], priScore: 84, portfolioUrl: "#", verification: "Verified Badge" },
      { id: "c2", name: "Ananya Goel", college: "BMS College", targetRole: "Backend Engineer", skills: ["Python", "Docker", "SQL", "Kubernetes"], priScore: 78, portfolioUrl: "#", verification: "Verified Badge" },
      { id: "c3", name: "Vikram Malhotra", college: "PES University", targetRole: "Cloud Architect", skills: ["AWS", "Terraform", "Java", "Docker"], priScore: 82, portfolioUrl: "#", verification: "Verified Badge" },
      { id: "c4", name: "Sneha Patel", college: "IIT Madras", targetRole: "Data Scientist", skills: ["Python", "Pandas", "Scikit-Learn", "SQL"], priScore: 91, portfolioUrl: "#", verification: "Trust Seal Elite" },
      { id: "c5", name: "Aditya Verma", college: "BITS Pilani", targetRole: "DevOps Engineer", skills: ["AWS", "Kubernetes", "CI/CD", "Linux"], priScore: 88, portfolioUrl: "#", verification: "Trust Seal Elite" }
    ];

    // Apply filtering
    const filtered = allCandidates.filter(c => {
      const matchSkill = !skill || c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()));
      const matchPri = c.priScore >= minPri;
      return matchSkill && matchPri;
    });

    // Generate structured CSV
    const csvHeaders = "Candidate ID,Full Name,College/University,Target Role,Skills,Readiness Score (PRI),Portfolio URL,Verification Status\n";
    const csvRows = filtered.map(c => 
      `"${c.id}","${c.name}","${c.college}","${c.targetRole}","${c.skills.join(", ")}",${c.priScore},"${c.portfolioUrl}","${c.verification}"`
    ).join("\n");

    const csvContent = csvHeaders + csvRows;

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qualified_candidates_${Date.now()}.csv"`,
      },
    });

  } catch (err: any) {
    console.error("Failed to generate CSV export:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
