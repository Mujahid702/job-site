import { createClient } from "@/lib/supabase/server";

export interface TopicMetrics {
  topicId: string;
  topicName: string;
  categorySlug: string;
  attemptsCount: number;
  correctCount: number;
  accuracyPercentage: number;
  status: "Strong" | "Developing" | "Needs Practice";
  recommendation: string;
}

export interface AnalyticsReport {
  overallAccuracy: number;
  averageResponseTimeSeconds: number;
  codingSuccessRate: number;
  sqlSuccessRate: number;
  examSuccessRate: number;
  consistencyScore: number; // 0 - 100 (attempt active days)
  difficultyAccuracy: { Easy: number; Medium: number; Hard: number };
  categoryAccuracy: Record<string, number>;
  topicMetrics: TopicMetrics[];
  weakTopics: TopicMetrics[];
}

export class AnalyticsIntelligenceService {
  /**
   * Deterministically analyze student answers history and compile a Performance Intelligence Report
   */
  static async getPerformanceReport(userId: string): Promise<AnalyticsReport> {
    const supabase = await createClient();

    // 1. Fetch all logged answers with question properties
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select(`
        *,
        question:assessment_questions(*, topic:assessment_topics(name, category_slug))
      `)
      .eq("attempt_id", (
        // Resolve attempts owned by the user
        supabase.from("assessment_attempts").select("id").eq("user_id", userId)
      ) as any);

    const loggedAnswers = answers || [];

    // Calculate core metrics variables
    let totalAnswers = loggedAnswers.length;
    let correctAnswers = 0;
    let totalResponseTime = 0;

    let codingTotal = 0;
    let codingCorrect = 0;
    let sqlTotal = 0;
    let sqlCorrect = 0;

    const diffTotals = { Easy: 0, Medium: 0, Hard: 0 };
    const diffCorrect = { Easy: 0, Medium: 0, Hard: 0 };

    const catTotals: Record<string, number> = {};
    const catCorrect: Record<string, number> = {};

    const topicStats: Record<string, { name: string; category: string; total: number; correct: number }> = {};

    // Group answers
    loggedAnswers.forEach(ans => {
      const q = ans.question;
      if (!q) return;

      if (ans.is_correct) correctAnswers++;
      totalResponseTime += ans.time_spent_seconds || 0;

      // Difficulty rollup
      const diff = q.difficulty as "Easy" | "Medium" | "Hard";
      if (diffTotals[diff] !== undefined) {
        diffTotals[diff]++;
        if (ans.is_correct) diffCorrect[diff]++;
      }

      // Type-specific rollup
      if (q.type === "Coding") {
        codingTotal++;
        if (ans.is_correct) codingCorrect++;
      } else if (q.type === "SQL") {
        sqlTotal++;
        if (ans.is_correct) sqlCorrect++;
      }

      // Category & Topic mappings
      const topicId = q.topic_id;
      const topicName = q.topic?.name || "Concept";
      const catSlug = q.topic?.category_slug || "aptitude";

      if (!catTotals[catSlug]) {
        catTotals[catSlug] = 0;
        catCorrect[catSlug] = 0;
      }
      catTotals[catSlug]++;
      if (ans.is_correct) catCorrect[catSlug]++;

      if (!topicStats[topicId]) {
        topicStats[topicId] = { name: topicName, category: catSlug, total: 0, correct: 0 };
      }
      topicStats[topicId].total++;
      if (ans.is_correct) topicStats[topicId].correct++;
    });

    // 2. Compute category accuracies
    const categoryAccuracy: Record<string, number> = {};
    Object.keys(catTotals).forEach(slug => {
      categoryAccuracy[slug] = Number(((catCorrect[slug] / catTotals[slug]) * 100).toFixed(2));
    });

    // 3. Compute topic masteries with thresholds (Needs Practice requires >= 3 attempts)
    const topicMetrics: TopicMetrics[] = [];
    Object.keys(topicStats).forEach(topicId => {
      const ts = topicStats[topicId];
      const acc = Number(((ts.correct / ts.total) * 100).toFixed(2));
      let status: "Strong" | "Developing" | "Needs Practice" = "Developing";

      if (acc >= 80) {
        status = "Strong";
      } else if (acc < 50 && ts.total >= 3) {
        status = "Needs Practice";
      }

      // Actionable recommendation details
      let rec = `Keep practicing ${ts.name} sets to improve your score.`;
      if (status === "Needs Practice") {
        if (ts.category === "sql") {
          rec = `Your SQL ${ts.name} accuracy is ${acc}% across ${ts.total} attempts. Practice simple SELECT and WHERE filters before advanced queries.`;
        } else if (ts.category === "coding") {
          rec = `Your Coding ${ts.name} accuracy is ${acc}% across ${ts.total} attempts. Trace starter templates and debug complexity errors locally.`;
        } else {
          rec = `Your ${ts.name} accuracy is ${acc}% across ${ts.total} attempts. Solve easier diagnostic quizzes to strengthen fundamentals.`;
        }
      } else if (status === "Strong") {
        rec = `Mastery achieved in ${ts.name}! Practice Hard problems under exam conditions to lock in performance.`;
      }

      topicMetrics.push({
        topicId,
        topicName: ts.name,
        categorySlug: ts.category,
        attemptsCount: ts.total,
        correctCount: ts.correct,
        accuracyPercentage: acc,
        status,
        recommendation: rec
      });
    });

    // 4. Calculate consistency metrics
    const { data: attempts } = await supabase
      .from("assessment_attempts")
      .select("started_at")
      .eq("user_id", userId);

    const activeDays = new Set((attempts || []).map(a => a.started_at.split("T")[0]));
    const consistencyScore = Math.min(100, activeDays.size * 10); // 10 points per active day up to 100

    // Calculate exam metrics
    const { data: sessions } = await supabase
      .from("assessment_sessions")
      .select("passed")
      .eq("session_type", "Exam");
    const passedExams = (sessions || []).filter(s => s.passed).length;
    const examSuccessRate = sessions && sessions.length > 0 ? (passedExams / sessions.length) * 100 : 0;

    return {
      overallAccuracy: totalAnswers > 0 ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0,
      averageResponseTimeSeconds: totalAnswers > 0 ? Number((totalResponseTime / totalAnswers).toFixed(1)) : 0,
      codingSuccessRate: codingTotal > 0 ? Number(((codingCorrect / codingTotal) * 100).toFixed(2)) : 0,
      sqlSuccessRate: sqlTotal > 0 ? Number(((sqlCorrect / sqlTotal) * 100).toFixed(2)) : 0,
      examSuccessRate: Number(examSuccessRate.toFixed(2)),
      consistencyScore,
      difficultyAccuracy: {
        Easy: diffTotals.Easy > 0 ? Number(((diffCorrect.Easy / diffTotals.Easy) * 100).toFixed(2)) : 0,
        Medium: diffTotals.Medium > 0 ? Number(((diffCorrect.Medium / diffTotals.Medium) * 100).toFixed(2)) : 0,
        Hard: diffTotals.Hard > 0 ? Number(((diffCorrect.Hard / diffTotals.Hard) * 100).toFixed(2)) : 0
      },
      categoryAccuracy,
      topicMetrics,
      weakTopics: topicMetrics.filter(t => t.status === "Needs Practice")
    };
  }
}
