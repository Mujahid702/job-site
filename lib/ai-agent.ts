import { StudentFullContext } from "./db/copilot-engine";

/**
 * lib/ai-agent.ts
 * AI Career Agent, Placement Coach, and Learning Planner.
 * Generates proactive insights, daily/weekly plans, and explainable recommendations.
 */

export interface ProactiveInsight {
  type: "warning" | "tip" | "info";
  message: string;
}

export interface CoachPlan {
  dailyPlan: string[];
  weeklyGoals: string[];
  monthlyObjectives: string[];
  riskAlerts: string[];
}

/**
 * Part 1: Proactively generates notifications/insights based on candidate context history.
 */
export function generateProactiveInsights(context: StudentFullContext): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];

  // Resume ATS notifications
  if (context.atsScore < 70) {
    insights.push({
      type: "warning",
      message: "Your resume ATS score is currently below 70%. Focus on adding action verbs and matching key job description terms."
    });
  }

  // Activity tracking / Assessment alerts
  if (context.assessmentAccuracy < 60) {
    insights.push({
      type: "warning",
      message: "Your assessment accuracy is low. Attempt a timed SQL drill or coding assessment today to reinforce fundamentals."
    });
  }

  // Weak areas focus
  if (context.weaknesses.length > 0) {
    insights.push({
      type: "info",
      message: `Your strongest development area is ${context.weaknesses[0]}. Practice custom projects on this to improve placement chances.`
    });
  }

  // Consistent preparation feedback
  if (context.mockInterviewsAvg >= 80) {
    insights.push({
      type: "tip",
      message: "Excellent! Your mock interview performance is strong. Keep refining behavior questions with the AI coach."
    });
  }

  return insights;
}

/**
 * Part 2 & 3: Creates adaptive daily planner and structured objectives.
 */
export function generateCoachPlan(context: StudentFullContext): CoachPlan {
  const dailyPlan: string[] = [];
  const weeklyGoals: string[] = [];
  const monthlyObjectives: string[] = [];
  const riskAlerts: string[] = [];

  // 1. Daily plans
  if (context.atsScore < 85) {
    dailyPlan.push(`Update 2 project descriptions on your resume to increase ATS score above 85%.`);
  }
  const mainWeakness = context.weaknesses[0] || "General DSA";
  dailyPlan.push(`Solve 1 topic challenge on ${mainWeakness}.`);
  dailyPlan.push(`Track at least 1 job application status change on your CRM board.`);

  // 2. Weekly goals
  weeklyGoals.push(`Complete 1 mock technical interview simulation.`);
  weeklyGoals.push(`Achieve a minimum of 75% accuracy in assessments this week.`);

  // 3. Monthly objectives
  monthlyObjectives.push(`Increase overall PRI readiness score above 80.`);
  monthlyObjectives.push(`Optimize GitHub integration and verify portfolio URL.`);

  // 4. Burnout detection / Risk alerts
  if (context.applicationsCount > 20 && context.mockInterviewsAvg < 65) {
    riskAlerts.push("High application volume with lower mock scores detected. Focus on mock prep before submitting further resumes.");
  }
  if (context.priScore < 50) {
    riskAlerts.push("Priority recommendation: Complete baseline placement drills to build initial momentum.");
  }

  return { dailyPlan, weeklyGoals, monthlyObjectives, riskAlerts };
}
