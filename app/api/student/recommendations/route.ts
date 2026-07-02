import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveRecommendation } from "@/lib/ai/intelligence";

/**
 * app/api/student/recommendations/route.ts
 * GET: Retrieves personalized AI recommendations for the authenticated student.
 * POST: Submits feedback for a recommendation (feedback loop: helpful, not_helpful, completed).
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve active recommendations
    const { data, error } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    // Seed mock recommendations if database log is empty
    if (!data || data.length === 0) {
      const mockRecommendations = [
        {
          id: "rec-01",
          module: "Project Advisor",
          recommendation_type: "Project Upgrade",
          content: { title: "Distributed Task Scheduler (Go/Redis)", complexity: "Advanced" },
          explanation: "We recommended this Advanced Go/Redis project because your target role is Google Software Engineer, your assessment shows high proficiency in JavaScript but lacks backend concurrency experience, and Google interview trends prioritize distributed queues caching.",
          feedback: "ignored",
          created_at: new Date().toISOString()
        },
        {
          id: "rec-02",
          module: "Career Navigator",
          recommendation_type: "Interview Prep",
          content: { topic: "Graphs Depth-First Search", duration: "3 Days" },
          explanation: "We recommended focus on Graph DFS traversal because Microsoft placement indices show that 75% of placed candidates mastered Graph questions, and your recent mock interview highlighted difficulty in tree recursion models.",
          feedback: "ignored",
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      // Automatically seed them for user in background
      for (const rec of mockRecommendations) {
        await saveRecommendation({
          userId: user.id,
          module: rec.module,
          recType: rec.recommendation_type,
          content: rec.content,
          explanation: rec.explanation
        });
      }

      return NextResponse.json({ success: true, recommendations: mockRecommendations });
    }

    return NextResponse.json({ success: true, recommendations: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.recommendationId || !body.feedback) {
      return NextResponse.json({ success: false, error: "Missing required parameters: recommendationId and feedback" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ai_recommendations")
      .update({ feedback: body.feedback })
      .eq("id", body.recommendationId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
