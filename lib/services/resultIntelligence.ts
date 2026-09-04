import { createClient } from "@/lib/supabase/server";

export interface ResultReport {
  percentile: number | null;
  timeEfficiency: {
    totalTimeSpentSeconds: number;
    averageTimePerQuestion: number;
    speedRating: "Fast" | "Moderate" | "Slow";
  };
  topicAnalysis: { topicName: string; accuracy: number; total: number }[];
  difficultyAnalysis: {
    Easy: { accuracy: number; total: number };
    Medium: { accuracy: number; total: number };
    Hard: { accuracy: number; total: number };
  };
  recommendation: string;
}

export class ResultIntelligenceService {
  /**
   * Generates a comprehensive Result Intelligence Report for a completed attempt.
   * Restricts percentile comparisons to templates with >= 10 distinct student completions.
   */
  static async getResultReport(attemptId: string, userId: string): Promise<ResultReport> {
    const supabase = await createClient();

    // 1. Fetch score and attempt details
    const { data: score } = await supabase
      .from("assessment_scores")
      .select(`
        *,
        attempt:assessment_attempts(*, session:assessment_sessions(*))
      `)
      .eq("attempt_id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!score) {
      throw new Error("Score details not found for this attempt ID.");
    }

    const templateId = score.attempt?.template_id;
    let percentile: number | null = null;

    // 2. Compute percentile if template completed by >= 10 distinct users
    if (templateId) {
      const { data: allScores } = await supabase
        .from("assessment_scores")
        .select("user_id, score_percentage")
        .eq("attempt_id", (
          supabase.from("assessment_attempts").select("id").eq("template_id", templateId)
        ) as any);

      const completions = allScores || [];

      // Filter distinct users
      const distinctUsers = new Set(completions.map(c => c.user_id));

      if (distinctUsers.size >= 10) {
        // Find best score per user
        const bestScores: Record<string, number> = {};
        completions.forEach(c => {
          if (bestScores[c.user_id] === undefined || c.score_percentage > bestScores[c.user_id]) {
            bestScores[c.user_id] = c.score_percentage;
          }
        });

        const studentScore = score.score_percentage;
        const allBestScores = Object.values(bestScores);
        const lowerScores = allBestScores.filter(s => s < studentScore).length;

        percentile = Number(((lowerScores / allBestScores.length) * 100).toFixed(1));
      }
    }

    // 3. Fetch answered logs details
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select(`
        *,
        question:assessment_questions(*, topic:assessment_topics(name))
      `)
      .eq("attempt_id", attemptId);

    const loggedAnswers = answers || [];

    // 4. Calculate Time Efficiency
    const totalTimeSpent = loggedAnswers.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0);
    const averageTime = loggedAnswers.length > 0 ? (totalTimeSpent / loggedAnswers.length) : 0;
    let speedRating: "Fast" | "Moderate" | "Slow" = "Moderate";
    if (averageTime < 30) {
      speedRating = "Fast";
    } else if (averageTime > 90) {
      speedRating = "Slow";
    }

    // 5. Calculate difficulty and topic aggregates
    const diffTotals = { Easy: 0, Medium: 0, Hard: 0 };
    const diffCorrect = { Easy: 0, Medium: 0, Hard: 0 };

    const topicStats: Record<string, { name: string; total: number; correct: number }> = {};

    loggedAnswers.forEach(ans => {
      const q = ans.question;
      if (!q) return;

      const diff = q.difficulty as "Easy" | "Medium" | "Hard";
      if (diffTotals[diff] !== undefined) {
        diffTotals[diff]++;
        if (ans.is_correct) diffCorrect[diff]++;
      }

      const topicId = q.topic_id;
      const topicName = q.topic?.name || "Concept";
      if (!topicStats[topicId]) {
        topicStats[topicId] = { name: topicName, total: 0, correct: 0 };
      }
      topicStats[topicId].total++;
      if (ans.is_correct) topicStats[topicId].correct++;
    });

    const topicAnalysis = Object.keys(topicStats).map(tId => {
      const ts = topicStats[tId];
      return {
        topicName: ts.name,
        accuracy: Number(((ts.correct / ts.total) * 100).toFixed(2)),
        total: ts.total
      };
    });

    // Sort to find weakest topic
    const sortedTopics = [...topicAnalysis].sort((a, b) => a.accuracy - b.accuracy);
    let recommendation = "Excellent work! Keep practicing to maintain your diagnostics consistency.";
    if (sortedTopics.length > 0 && sortedTopics[0].accuracy < 80) {
      recommendation = `Targeted practice recommended: Your lowest score in this attempt was in '${sortedTopics[0].topicName}' (${sortedTopics[0].accuracy}%). Focus on solving Easy and Medium sets for this topic.`;
    }

    return {
      percentile,
      timeEfficiency: {
        totalTimeSpentSeconds: totalTimeSpent,
        averageTimePerQuestion: Number(averageTime.toFixed(1)),
        speedRating
      },
      topicAnalysis,
      difficultyAnalysis: {
        Easy: {
          accuracy: diffTotals.Easy > 0 ? Number(((diffCorrect.Easy / diffTotals.Easy) * 100).toFixed(2)) : 0,
          total: diffTotals.Easy
        },
        Medium: {
          accuracy: diffTotals.Medium > 0 ? Number(((diffCorrect.Medium / diffTotals.Medium) * 100).toFixed(2)) : 0,
          total: diffTotals.Medium
        },
        Hard: {
          accuracy: diffTotals.Hard > 0 ? Number(((diffCorrect.Hard / diffTotals.Hard) * 100).toFixed(2)) : 0,
          total: diffTotals.Hard
        }
      },
      recommendation
    };
  }
}
