import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScoringEngine } from "@/lib/services/scoringEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized credentials required" }, { status: 401 });
    }

    const userId = user.id;
    const { attemptId } = await req.json().catch(() => ({}));

    if (!attemptId) {
      return NextResponse.json({ success: false, message: "Missing attemptId parameter" }, { status: 400 });
    }

    // 2. Validate attempt and active session
    const { data: attempt, error: attErr } = await supabase
      .from("assessment_attempts")
      .select(`
        *,
        session:assessment_sessions(*)
      `)
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attErr || !attempt) {
      return NextResponse.json({ success: false, message: "Assessment attempt not found" }, { status: 404 });
    }

    const session = attempt.session;
    if (!session) {
      return NextResponse.json({ success: false, message: "Session record not found" }, { status: 404 });
    }

    // If session is already finalized, skip duplicate write logic
    if (session.status !== "Active") {
      const { data: existingScore } = await supabase
        .from("assessment_scores")
        .select("*")
        .eq("attempt_id", attemptId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        alreadyFinalized: true,
        score: existingScore || null
      });
    }

    // 3. Fetch all logged answers for this attempt
    const { data: answers, error: ansErr } = await supabase
      .from("assessment_answers")
      .select(`
        *,
        question:assessment_questions(*)
      `)
      .eq("attempt_id", attemptId);

    if (ansErr) throw ansErr;

    const loggedAnswers = answers || [];

    // Calculate passing threshold percentage
    let passingPercentage = 60;
    if (session.template_id) {
      const { data: template } = await supabase
        .from("assessment_templates")
        .select("passing_percentage")
        .eq("id", session.template_id)
        .maybeSingle();
      if (template) {
        passingPercentage = template.passing_percentage;
      }
    }

    // Get list of all questions in this exam session
    // For practice sessions, the total is the number of solved questions.
    // For template exam sessions, we match all questions linked to the template.
    let totalQuestionsCount = loggedAnswers.length;
    let templateQuestionsList: any[] = [];

    if (session.template_id) {
      const { data: tempQs } = await supabase
        .from("assessment_template_questions")
        .select("question_id, points")
        .eq("template_id", session.template_id);
      if (tempQs) {
        totalQuestionsCount = tempQs.length;
        templateQuestionsList = tempQs;
      }
    }

    // 4. Map questions to compute metrics
    const mappedAnswers = loggedAnswers.map(ans => ({
      question_id: ans.question_id,
      is_correct: ans.is_correct,
      marks: ans.question?.marks || 4,
      points_earned: ans.is_correct ? (ans.question?.marks || 4) : 0,
      skipped: false
    }));

    // If session had uncompleted questions in a template-driven exam, log them as skipped
    if (session.template_id && templateQuestionsList.length > mappedAnswers.length) {
      templateQuestionsList.forEach(tq => {
        const solved = mappedAnswers.some(ma => ma.question_id === tq.question_id);
        if (!solved) {
          mappedAnswers.push({
            question_id: tq.question_id,
            is_correct: false,
            marks: tq.points || 4,
            points_earned: 0,
            skipped: true
          });
        }
      });
    }

    // Compile outcomes using Centralized Scoring Engine
    const aggregationResult = ScoringEngine.aggregateSession({
      answers: mappedAnswers,
      passingPercentage
    });

    const now = new Date().toISOString();

    // 5. Save/Log Assessment Scores
    const { data: scoreRecord, error: scoreErr } = await supabase
      .from("assessment_scores")
      .insert({
        attempt_id: attemptId,
        user_id: userId,
        total_questions: totalQuestionsCount,
        correct_answers: aggregationResult.correctCount,
        score_percentage: aggregationResult.scorePercentage,
        passed: aggregationResult.passed
      })
      .select()
      .single();

    if (scoreErr) throw scoreErr;

    // 6. Update Attempt status
    await supabase
      .from("assessment_attempts")
      .update({
        is_completed: true,
        completed_at: now
      })
      .eq("id", attemptId);

    // 7. Update Session status
    await supabase
      .from("assessment_sessions")
      .update({
        status: "Completed",
        completed_at: now,
        score_percentage: aggregationResult.scorePercentage,
        passed: aggregationResult.passed
      })
      .eq("id", session.id);

    // 8. Roll up aggregate topic scores (assessment_topic_scores)
    let weakestTopicId: string | null = null;
    let weakestTopicAccuracy = 100.0;

    for (const ans of loggedAnswers) {
      if (ans.question?.topic_id) {
        const topicId = ans.question.topic_id;
        const { data: currentTopicScore } = await supabase
          .from("assessment_topic_scores")
          .select("*")
          .eq("user_id", userId)
          .eq("topic_id", topicId)
          .maybeSingle();

        const prevSolved = currentTopicScore?.total_solved || 0;
        const prevCorrect = currentTopicScore?.correct_solved || 0;

        const newSolved = prevSolved + 1;
        const newCorrect = prevCorrect + (ans.is_correct ? 1 : 0);
        const newAccuracy = Number(((newCorrect / newSolved) * 100).toFixed(2));

        await supabase
          .from("assessment_topic_scores")
          .upsert({
            user_id: userId,
            topic_id: topicId,
            total_solved: newSolved,
            correct_solved: newCorrect,
            accuracy_percentage: newAccuracy
          }, { onConflict: "user_id,topic_id" });

        if (newAccuracy < weakestTopicAccuracy) {
          weakestTopicAccuracy = newAccuracy;
          weakestTopicId = topicId;
        }
      }
    }

    // 9. Update day performance aggregates (assessment_performance)
    const todayDate = now.split("T")[0];
    const totalTimeSpent = loggedAnswers.reduce((acc, curr) => acc + curr.time_spent_seconds, 0);

    const { data: existingPerformance } = await supabase
      .from("assessment_performance")
      .select("*")
      .eq("user_id", userId)
      .eq("date", todayDate)
      .maybeSingle();

    if (existingPerformance) {
      const timeTotal = existingPerformance.total_time_spent_seconds + totalTimeSpent;
      const averageAcc = Number(((existingPerformance.average_accuracy_percentage + aggregationResult.scorePercentage) / 2).toFixed(2));
      await supabase
        .from("assessment_performance")
        .update({
          total_time_spent_seconds: timeTotal,
          average_accuracy_percentage: averageAcc
        })
        .eq("id", existingPerformance.id);
    } else {
      await supabase
        .from("assessment_performance")
        .insert({
          user_id: userId,
          date: todayDate,
          total_time_spent_seconds: totalTimeSpent,
          average_accuracy_percentage: aggregationResult.scorePercentage
        });
    }

    // 10. Generate AI recommendations based on weakest topic solved in session
    if (weakestTopicId) {
      const { data: topicDetails } = await supabase
        .from("assessment_topics")
        .select("name")
        .eq("id", weakestTopicId)
        .maybeSingle();

      if (topicDetails) {
        await supabase
          .from("assessment_recommendations")
          .insert({
            user_id: userId,
            recommended_topic_id: weakestTopicId,
            priority: weakestTopicAccuracy < 50 ? "High" : "Medium",
            reason: `Targeted review is recommended: accuracy in '${topicDetails.name}' is currently at ${weakestTopicAccuracy}%.`
          });
      }
    }

    return NextResponse.json({
      success: true,
      score: scoreRecord,
      metrics: aggregationResult
    });

  } catch (err: any) {
    console.error("[Session Finish POST] Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to finalize session" }, { status: 500 });
  }
}
