/**
 * lib/ai/resume-scorer.ts
 * Resume Scorer algorithm.
 */

export interface ResumeScoreResult {
  score: number;
  grammarPenalty: number;
  formattingPenalty: number;
}

export function calculateResumeScore(text: string): ResumeScoreResult {
  if (!text) return { score: 0, grammarPenalty: 0, formattingPenalty: 0 };
  
  // Calculate keyword matches
  const keywords = ["React", "Node.js", "TypeScript", "SQL", "Git", "Docker"];
  let matches = 0;
  keywords.forEach(kw => {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      matches++;
    }
  });

  const baseScore = Math.round((matches / keywords.length) * 100);

  // Formatting checklist penalties
  let formattingPenalty = 0;
  if (text.includes("Table") || text.includes("Column")) {
    formattingPenalty += 10;
  }
  if (!text.includes("Education") || !text.includes("Experience")) {
    formattingPenalty += 15;
  }

  // Grammar penalties
  let grammarPenalty = 0;
  if (text.includes("recieve") || text.includes("accomodate")) {
    grammarPenalty += 5;
  }

  const finalScore = Math.max(0, Math.min(100, baseScore - formattingPenalty - grammarPenalty));

  return {
    score: finalScore,
    grammarPenalty,
    formattingPenalty
  };
}
