export interface MCQEvaluationRequest {
  selectedOptionId: string;
  options: { id: string; is_correct: boolean; option_text: string }[];
  marks: number;
  negativeMarks?: number;
}

export interface MCQEvaluationResult {
  isCorrect: boolean;
  scorePercentage: number;
  pointsEarned: number;
}

export interface CodingEvaluationRequest {
  passedCount: number;
  totalCount: number;
  marks: number;
}

export interface CodingEvaluationResult {
  isCorrect: boolean;
  scorePercentage: number;
  pointsEarned: number;
}

export interface SQLEvaluationRequest {
  match: boolean;
  marks: number;
}

export interface SQLEvaluationResult {
  isCorrect: boolean;
  scorePercentage: number;
  pointsEarned: number;
}

export interface SessionAggregationRequest {
  answers: {
    question_id: string;
    is_correct: boolean;
    marks: number;
    points_earned: number;
    skipped?: boolean;
  }[];
  passingPercentage: number;
}

export interface SessionAggregationResult {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scorePercentage: number;
  passed: boolean;
}

export class ScoringEngine {
  /**
   * Evaluate multiple-choice question answers
   */
  static evaluateMCQ(req: MCQEvaluationRequest): MCQEvaluationResult {
    const option = req.options.find(o => o.id === req.selectedOptionId);
    const isCorrect = option ? option.is_correct : false;

    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = req.marks;
    } else if (req.negativeMarks !== undefined) {
      pointsEarned = -Math.abs(req.negativeMarks);
    }

    const scorePercentage = isCorrect ? 100 : 0;

    return {
      isCorrect,
      scorePercentage,
      pointsEarned
    };
  }

  /**
   * Evaluate Coding submissions based on test cases ratio
   */
  static evaluateCoding(req: CodingEvaluationRequest): CodingEvaluationResult {
    if (req.totalCount <= 0) {
      return { isCorrect: false, scorePercentage: 0, pointsEarned: 0 };
    }

    const ratio = req.passedCount / req.totalCount;
    const isCorrect = req.passedCount === req.totalCount;
    const scorePercentage = Math.round(ratio * 10000) / 100; // 2 decimal precision
    const pointsEarned = Math.round(ratio * req.marks * 100) / 100;

    return {
      isCorrect,
      scorePercentage,
      pointsEarned
    };
  }

  /**
   * Evaluate SQL Sandbox run verdicts
   */
  static evaluateSQL(req: SQLEvaluationRequest): SQLEvaluationResult {
    const isCorrect = req.match;
    const scorePercentage = isCorrect ? 100 : 0;
    const pointsEarned = isCorrect ? req.marks : 0;

    return {
      isCorrect,
      scorePercentage,
      pointsEarned
    };
  }

  /**
   * Aggregate overall session outcomes and determine passing thresholds
   */
  static aggregateSession(req: SessionAggregationRequest): SessionAggregationResult {
    let totalPossibleMarks = 0;
    let totalEarnedMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    req.answers.forEach(ans => {
      totalPossibleMarks += ans.marks;
      totalEarnedMarks += ans.points_earned;

      if (ans.skipped) {
        skippedCount++;
      } else if (ans.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    // Prevent divide by zero if list is empty
    const scorePercentage = totalPossibleMarks > 0 
      ? Math.max(0, Math.min(100, Math.round((totalEarnedMarks / totalPossibleMarks) * 10000) / 100))
      : 0;

    const passed = scorePercentage >= req.passingPercentage;

    return {
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      passed
    };
  }
}

export interface AdaptiveMetrics {
  topic: string;
  attemptsCount: number;
  easyAccuracy: number; // 0 - 100
  mediumAccuracy: number; // 0 - 100
  hardAccuracy: number; // 0 - 100
  averageTimeSpentSeconds: number;
  repeatedMistakesCount: number;
  consistencyScore: number; // 0 - 100
}

export interface DifficultyRecommendation {
  recommendedDifficulty: "Easy" | "Medium" | "Hard";
  actionablePlan: string;
  focusAreas: string[];
}

export class AdaptiveDifficultyEngine {
  /**
   * Deterministically analyze student metrics and recommend next-step difficulties.
   * Prevents sudden difficulty hikes and guides topic mastery systematically.
   */
  static calculateRecommendation(metrics: AdaptiveMetrics): DifficultyRecommendation {
    const focusAreas: string[] = [];
    let recommendedDifficulty: "Easy" | "Medium" | "Hard" = "Medium";
    let actionablePlan = "";

    // 1. Diagnose Easy milestones
    if (metrics.attemptsCount === 0) {
      recommendedDifficulty = "Easy";
      actionablePlan = "Start with Easy questions to build initial diagnostics benchmarks.";
      focusAreas.push("Fundamentals check");
      return { recommendedDifficulty, actionablePlan, focusAreas };
    }

    if (metrics.easyAccuracy < 70) {
      recommendedDifficulty = "Easy";
      actionablePlan = "Focus primarily on Easy questions. Review weak concepts and step-by-step solutions.";
      focusAreas.push("Basic concepts review", "Prerequisite topics verification");
    }
    // 2. Diagnose Medium milestones
    else if (metrics.easyAccuracy >= 70 && metrics.mediumAccuracy < 70) {
      recommendedDifficulty = "Medium";
      actionablePlan = "Recommend: More Medium, Limited Hard. Review weak concepts before advancing.";
      focusAreas.push("Medium-level logic", "Accuracy stabilization");
    }
    // 3. Diagnose Hard mastery
    else if (metrics.mediumAccuracy >= 70 && metrics.hardAccuracy < 60) {
      recommendedDifficulty = "Medium";
      actionablePlan = "Recommend: Blend of Medium with selective Hard questions. Target core details.";
      focusAreas.push("Edge-cases optimization", "Speed improvements");
    }
    // 4. Full Mastered tier
    else {
      recommendedDifficulty = "Hard";
      actionablePlan = "High mastery level detected. Predominantly solve Hard assessments to optimize performance.";
      focusAreas.push("Advanced problem-solving", "Optimal query/compilation constraints");
    }

    // Adjust based on speed and mistakes
    if (metrics.averageTimeSpentSeconds > 120) {
      focusAreas.push("Speed-based time checks");
    }
    if (metrics.repeatedMistakesCount > 2) {
      focusAreas.push("Common error corrections review");
    }

    return {
      recommendedDifficulty,
      actionablePlan,
      focusAreas
    };
  }
}

