/**
 * lib/ai/placement-probability.ts
 * Placement Probability algorithm.
 */

export interface PlacementProbInput {
  atsScore: number;
  mockInterviewsAvg: number;
  projectsCount: number;
  applicationsCount: number;
}

export interface PlacementProbResult {
  score: number;
  bounds: {
    lower: number;
    upper: number;
  };
  readinessTimelineDays: number;
}

export function calculatePlacementProbability(input: PlacementProbInput): PlacementProbResult {
  const { atsScore, mockInterviewsAvg, projectsCount, applicationsCount } = input;

  const resumeQualityWeight = atsScore * 0.35;
  const interviewWeight = mockInterviewsAvg * 0.35;
  const projectsWeight = Math.min(projectsCount * 5, 15);
  const crmWeight = Math.min(applicationsCount * 1.5, 15);

  const rawScore = resumeQualityWeight + interviewWeight + projectsWeight + crmWeight;
  const score = Math.max(10, Math.min(98, Math.round(rawScore)));

  const lower = Math.max(10, score - 8);
  const upper = Math.min(99, score + 6);

  // Compute readiness timeline days based on consistency
  let baseDays = 90;
  if (score > 80) baseDays = 30;
  else if (score > 60) baseDays = 60;

  return {
    score,
    bounds: { lower, upper },
    readinessTimelineDays: baseDays
  };
}
