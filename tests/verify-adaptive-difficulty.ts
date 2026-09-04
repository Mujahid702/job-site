import { AdaptiveDifficultyEngine, AdaptiveMetrics } from "../lib/services/scoringEngine";

console.log("🚀 Starting Adaptive Difficulty Engine Unit Tests...\n");

// Case 1: Empty state / no history
const metrics1: AdaptiveMetrics = {
  topic: "Binary Search",
  attemptsCount: 0,
  easyAccuracy: 0,
  mediumAccuracy: 0,
  hardAccuracy: 0,
  averageTimeSpentSeconds: 0,
  repeatedMistakesCount: 0,
  consistencyScore: 0
};
const rec1 = AdaptiveDifficultyEngine.calculateRecommendation(metrics1);
console.log("📊 Case 1: New Student");
console.log(`   - Recommended: ${rec1.recommendedDifficulty}`);
console.log(`   - Plan: "${rec1.actionablePlan}"`);
console.log(`   - Focus Areas: ${JSON.stringify(rec1.focusAreas)}`);
if (rec1.recommendedDifficulty !== "Easy" || !rec1.actionablePlan.toLowerCase().includes("start with easy")) {
  console.error("❌ Case 1 validation failed!");
  process.exit(1);
}
console.log("✅ Case 1 Passed.\n");

// Case 2: Intermediate state matching user example: Easy 90%, Medium 70%, Hard 30%
const metrics2: AdaptiveMetrics = {
  topic: "SQL Joins",
  attemptsCount: 15,
  easyAccuracy: 90,
  mediumAccuracy: 70, // >= 70
  hardAccuracy: 30,   // < 60
  averageTimeSpentSeconds: 95,
  repeatedMistakesCount: 0,
  consistencyScore: 80
};
const rec2 = AdaptiveDifficultyEngine.calculateRecommendation(metrics2);
console.log("📊 Case 2: Intermediate student (Easy 90%, Medium 70%, Hard 30%)");
console.log(`   - Recommended: ${rec2.recommendedDifficulty}`);
console.log(`   - Plan: "${rec2.actionablePlan}"`);
console.log(`   - Focus Areas: ${JSON.stringify(rec2.focusAreas)}`);
if (rec2.recommendedDifficulty !== "Medium" || !rec2.actionablePlan.toLowerCase().includes("blend of medium with selective hard")) {
  console.error("❌ Case 2 validation failed!");
  process.exit(1);
}
console.log("✅ Case 2 Passed.\n");

// Case 3: Needs easy reviews due to low accuracy
const metrics3: AdaptiveMetrics = {
  topic: "Recursion",
  attemptsCount: 8,
  easyAccuracy: 50, // < 70
  mediumAccuracy: 10,
  hardAccuracy: 0,
  averageTimeSpentSeconds: 150, // slow speed trigger
  repeatedMistakesCount: 4, // mistakes trigger
  consistencyScore: 40
};
const rec3 = AdaptiveDifficultyEngine.calculateRecommendation(metrics3);
console.log("📊 Case 3: Struggling student with speed/error alerts");
console.log(`   - Recommended: ${rec3.recommendedDifficulty}`);
console.log(`   - Plan: "${rec3.actionablePlan}"`);
console.log(`   - Focus Areas: ${JSON.stringify(rec3.focusAreas)}`);
if (rec3.recommendedDifficulty !== "Easy" || !rec3.focusAreas.includes("Speed-based time checks") || !rec3.focusAreas.includes("Common error corrections review")) {
  console.error("❌ Case 3 validation failed!");
  process.exit(1);
}
console.log("✅ Case 3 Passed.\n");

console.log("✨ All Adaptive Difficulty Engine tests completed successfully!");
process.exit(0);
