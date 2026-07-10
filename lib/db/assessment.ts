import { supabase } from "@/lib/supabase";
import { executeWrite } from "./sync";
import { calculatePRIScore } from "./placement-readiness";

// ==========================================
// RELATION INTERFACES & TYPES
// ==========================================

export interface AssessmentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface AssessmentTopic {
  id: string;
  category_slug: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface AssessmentOption {
  id?: string;
  question_id?: string;
  option_text: string;
  is_correct: boolean;
}

export interface AssessmentQuestion {
  id: string;
  topic_id: string;
  question_text: string;
  correct_answer_text: string;
  explanation?: string;
  hints?: string[];
  solution_code?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  expected_time_seconds?: number;
  marks?: number;
  negative_marks?: number;
  company_tags?: string[];
  role_tags?: string[];
  is_published?: boolean;
  created_at?: string;
  
  // Joined Fields
  options?: AssessmentOption[];
  topic_name?: string;
  category_slug?: string;

  // Sandbox Coding & SQL properties
  type?: "MCQ" | "Coding" | "SQL";
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sample_test_cases?: { input: string; expected_output: string; explanation?: string }[];
  sql_schema_seed?: string;
  starter_codes?: Record<string, string>;
}

export interface AssessmentSection {
  id?: string;
  template_id?: string;
  name: string;
  duration_minutes: number;
  question_count: number;
}

export interface AssessmentCompanyTest {
  id: string;
  title: string;
  company: string;
  role: string;
  duration_minutes: number;
  passing_percentage: number;
  instructions?: string;
  randomize_questions?: boolean;
  shuffle_options?: boolean;
  visibility: "Free" | "Premium";
  attempt_limit?: number;
  start_date?: string;
  end_date?: string;
  has_certificate?: boolean;
  status: "Active" | "Archived" | "Draft";
  created_at?: string;

  // Joined Fields
  sections?: AssessmentSection[];
  questions?: string[]; // Question IDs associated with this template
  resources?: string[];
}

export interface AssessmentAttempt {
  id: string;
  user_id: string;
  template_id?: string | null;
  test_type: "Practice" | "Exam" | "Company";
  mode: "Timed" | "Untimed";
  started_at: string;
  completed_at?: string | null;
  is_completed: boolean;
}

export interface AssessmentAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string | null;
  answer_text?: string | null;
  is_correct: boolean;
  time_spent_seconds: number;
  marked_for_review?: boolean;
}

export interface AssessmentResult {
  attempt_id: string;
  score_percentage: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  time_taken_seconds: number;
  passed: boolean;
  guess_rate?: number;
  confidence_score?: number;
  xp_gained: number;
}

export interface AssessmentTopicProgress {
  user_id: string;
  topic_id: string;
  questions_solved: number;
  correct_answers: number;
  accuracy_percentage: number;
  mastery_level: "Mastered" | "Moderate" | "Needs Improvement";
  last_updated: string;
  
  // Joined Fields
  topic_name?: string;
  category_slug?: string;
}

export interface AssessmentAIFeedback {
  id: string;
  attempt_id: string;
  feedback_text: string;
  weak_concepts: string[];
  practice_recommendations: string[];
  estimated_readiness_percentage: number;
  created_at: string;
}

// ==========================================
// OFFLINE PRESET SEED ARRAYS
// ==========================================

export const PRESET_CATEGORIES: AssessmentCategory[] = [
  { id: "c1", name: "Quantitative Aptitude", slug: "aptitude", description: "Mathematics and numerical puzzle solutions." },
  { id: "c2", name: "Logical Reasoning", slug: "logical", description: "Deductive arguments and pattern matching." },
  { id: "c3", name: "Verbal Ability", slug: "verbal", description: "Grammar, syntax, and sentence correct checks." },
  { id: "c4", name: "SQL Assessments", slug: "sql", description: "Query aggregations and join statements." },
  { id: "c5", name: "Coding Assessments", slug: "coding", description: "Data structures and algorithm optimizations." }
];

export const PRESET_TOPICS: AssessmentTopic[] = [
  { id: "t1", category_slug: "aptitude", name: "Compound Interest", slug: "apt-compound-interest" },
  { id: "t2", category_slug: "aptitude", name: "Time Speed Distance", slug: "apt-time-speed-distance" },
  { id: "t3", category_slug: "logical", name: "Blood Relations", slug: "log-blood-relations" },
  { id: "t4", category_slug: "verbal", name: "Sentence Correction", slug: "verb-sentence-correction" },
  { id: "t5", category_slug: "sql", name: "Window Functions", slug: "sql-window-functions" },
  { id: "t6", category_slug: "coding", name: "Arrays", slug: "code-arrays" }
];

export const PRESET_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    topic_id: "t1",
    question_text: "A sum of money at compound interest doubles itself in 15 years. It will become eight times of itself in how many years?",
    correct_answer_text: "45 Years",
    explanation: "If sum doubles (2x) in 15 years, it reaches 8x (2^3) in 15 * 3 = 45 years.",
    difficulty: "Medium",
    expected_time_seconds: 90,
    marks: 4,
    negative_marks: 1,
    company_tags: ["TCS", "Infosys"],
    role_tags: ["SDE", "Analyst"],
    options: [
      { option_text: "30 Years", is_correct: false },
      { option_text: "40 Years", is_correct: false },
      { option_text: "45 Years", is_correct: true },
      { option_text: "60 Years", is_correct: false }
    ],
    topic_name: "Compound Interest",
    category_slug: "aptitude"
  },
  {
    id: "q2",
    topic_id: "t5",
    question_text: "Which SQL clause aggregates row values after a GROUP BY statement is processed?",
    correct_answer_text: "HAVING",
    explanation: "The HAVING clause filters aggregated results, while WHERE filters source rows prior to aggregation.",
    difficulty: "Easy",
    expected_time_seconds: 60,
    marks: 4,
    negative_marks: 1,
    company_tags: ["Amazon", "Google"],
    role_tags: ["Data Analyst", "SDE"],
    options: [
      { option_text: "WHERE", is_correct: false },
      { option_text: "HAVING", is_correct: true },
      { option_text: "FILTER", is_correct: false },
      { option_text: "LIMIT", is_correct: false }
    ],
    topic_name: "Window Functions",
    category_slug: "sql"
  },
  {
    id: "q3",
    topic_id: "t6",
    question_text: "Given an integer array nums and a target integer, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    correct_answer_text: "twoSum solution",
    explanation: "Using a Hash Map allows us to find the complement in O(N) time complexity.",
    difficulty: "Easy",
    expected_time_seconds: 120,
    marks: 4,
    negative_marks: 1,
    company_tags: ["Amazon", "Google", "Microsoft"],
    role_tags: ["SDE"],
    type: "Coding",
    constraints: "-10^9 <= nums[i] <= 10^9\n2 <= nums.length <= 10^4",
    input_format: "Target on first line. Space-separated array values on second line.",
    output_format: "Space-separated index pair.",
    sample_test_cases: [
      { input: "9\n2 7 11 15", expected_output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "6\n3 2 4", expected_output: "1 2" }
    ],
    starter_codes: {
      javascript: "function twoSum(nums, target) {\n    // Write your code here\n}\n\n// Boilerplate execution logic\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim().split('\\n');\nif (input.length >= 2) {\n    const target = parseInt(input[0]);\n    const nums = input[1].split(' ').map(Number);\n    const result = twoSum(nums, target);\n    console.log(result.join(' '));\n}",
      python: "def twoSum(nums, target):\n    # Write your code here\n    pass\n\nimport sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    target = int(lines[0])\n    nums = list(map(int, lines[1].split()))\n    result = twoSum(nums, target)\n    print(\" \".join(map(str, result)))",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    for(int i=0; i<nums.size(); i++) {\n        for(int j=i+1; j<nums.size(); j++) {\n            if(nums[i] + nums[j] == target) return {i, j};\n        }\n    }\n    return {};\n}\nint main() {\n    int target, val;\n    if (cin >> target) {\n        vector<int> nums;\n        while (cin >> val) nums.push_back(val);\n        vector<int> r = twoSum(nums, target);\n        if(r.size() == 2) cout << r[0] << \" \" << r[1];\n    }\n    return 0;\n}"
    },
    topic_name: "Arrays",
    category_slug: "coding"
  },
  {
    id: "q4",
    topic_id: "t5",
    question_text: "Write an SQL query to find employees who have the highest salary in each of the departments.",
    correct_answer_text: "SELECT d.Name AS Department, e.Name AS Employee, e.Salary FROM Employee e JOIN Department d ON e.DepartmentId = d.Id WHERE e.Salary = (SELECT MAX(Salary) FROM Employee WHERE DepartmentId = d.Id);",
    explanation: "A correlated subquery compares each employee's salary with the max salary in their respective department.",
    difficulty: "Medium",
    expected_time_seconds: 180,
    marks: 4,
    negative_marks: 1,
    company_tags: ["Google", "Amazon", "Deloitte"],
    role_tags: ["Data Analyst", "SDE"],
    type: "SQL",
    sql_schema_seed: "CREATE TABLE Department (Id INT, Name VARCHAR(50));\nCREATE TABLE Employee (Id INT, Name VARCHAR(50), Salary INT, DepartmentId INT);\nINSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');\nINSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1);",
    topic_name: "Window Functions",
    category_slug: "sql"
  }
];

export const PRESET_COMPANY_TESTS: AssessmentCompanyTest[] = [
  {
    id: "temp-1",
    title: "Deloitte Data Analyst OA",
    company: "Deloitte",
    role: "Data Analyst",
    duration_minutes: 90,
    passing_percentage: 65,
    instructions: "Answer all questions. Calculators allowed. Section-locked timer.",
    visibility: "Premium",
    status: "Active",
    sections: [
      { name: "Quantitative Aptitude", duration_minutes: 30, question_count: 15 },
      { name: "SQL & Analytics", duration_minutes: 60, question_count: 25 }
    ],
    questions: ["q1", "q2"]
  },
  {
    id: "temp-2",
    title: "TCS NQT Advanced Mock",
    company: "TCS",
    role: "System Engineer",
    duration_minutes: 60,
    passing_percentage: 60,
    instructions: "No negative marking. Locked browser simulator.",
    visibility: "Free",
    status: "Active",
    sections: [
      { name: "Aptitude & Verbal", duration_minutes: 40, question_count: 20 },
      { name: "Coding Logic", duration_minutes: 20, question_count: 2 }
    ],
    questions: ["q1", "q3"]
  }
];

// ==========================================
// DATA RETRIEVAL HELPERS
// ==========================================

async function getDb(supabaseClient?: any) {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== "undefined") {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      return createClient();
    } catch {
      return supabase;
    }
  }
  return supabase;
}

function getActiveUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && parsed.user && parsed.user.id) {
            return parsed.user.id;
          }
        }
      }
    }
  } catch {}
  return null;
}

function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const userId = getActiveUserId();
    const scopedKey = userId ? `${key}_${userId}` : `${key}_guest`;
    const stored = localStorage.getItem(scopedKey) || localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveLocalData<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    const userId = getActiveUserId();
    const scopedKey = userId ? `${key}_${userId}` : `${key}_guest`;
    localStorage.setItem(scopedKey, JSON.stringify(value));
  } catch (err) {
    console.error("LocalStorage write failed:", err);
  }
}

// ==========================================
// CORE DATA INTERFACES (GET/SET)
// ==========================================

export async function getCategories(supabaseClient?: any): Promise<AssessmentCategory[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db.from("assessment_categories").select("*");
    if (error || !data || data.length === 0) throw new Error("Fallback categories");
    return data;
  } catch {
    return PRESET_CATEGORIES;
  }
}

export async function getTopics(supabaseClient?: any): Promise<AssessmentTopic[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db.from("assessment_topics").select("*");
    if (error || !data || data.length === 0) throw new Error("Fallback topics");
    return data;
  } catch {
    return PRESET_TOPICS;
  }
}

export async function getQuestions(
  filters?: { categorySlug?: string; topicId?: string; difficulty?: string },
  supabaseClient?: any
): Promise<AssessmentQuestion[]> {
  try {
    const db = await getDb(supabaseClient);
    
    // Select questions joined with their options and topic information
    let query = db.from("assessment_questions").select(`
      *,
      options:assessment_options(*),
      topic:assessment_topics(name, category_slug)
    `);

    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }
    if (filters?.topicId) {
      query = query.eq("topic_id", filters.topicId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) throw new Error("Fallback questions");

    // Map properties for frontend use
    return data.map((q: any) => ({
      ...q,
      topic_name: q.topic?.name,
      category_slug: q.topic?.category_slug
    })).filter((q: any) => {
      if (filters?.categorySlug && q.category_slug !== filters.categorySlug) return false;
      return true;
    });
  } catch {
    let pool = getLocalData<AssessmentQuestion[]>("bb_custom_questions", PRESET_QUESTIONS);
    if (filters?.difficulty) pool = pool.filter(q => q.difficulty === filters.difficulty);
    if (filters?.topicId) pool = pool.filter(q => q.topic_id === filters.topicId);
    if (filters?.categorySlug) pool = pool.filter(q => q.category_slug === filters.categorySlug);
    return pool;
  }
}

export async function getCompanyTests(supabaseClient?: any): Promise<AssessmentCompanyTest[]> {
  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db.from("assessment_company_templates").select(`
      *,
      sections:assessment_sections(*)
    `).eq("status", "Active");

    if (error || !data || data.length === 0) throw new Error("Fallback templates");
    return data;
  } catch {
    return getLocalData<AssessmentCompanyTest[]>("bb_custom_templates", PRESET_COMPANY_TESTS);
  }
}

// ==========================================
// SESSION SOLVING MOTIFS (ATTEMPTS)
// ==========================================

export async function createAttempt(
  userId: string,
  testType: "Practice" | "Exam" | "Company",
  details: {
    templateId?: string | null;
    mode: "Timed" | "Untimed";
  },
  supabaseClient?: any
): Promise<AssessmentAttempt> {
  const isGuest = !userId || userId === "guest-user";
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isTemplateUuid = details.templateId && UUID_REGEX.test(details.templateId);

  const payload: AssessmentAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    user_id: userId || "guest-user",
    template_id: isTemplateUuid ? details.templateId : null,
    test_type: testType,
    mode: details.mode,
    started_at: new Date().toISOString(),
    is_completed: false
  };

  if (isGuest) {
    const list = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
    list.push(payload);
    saveLocalData("bb_attempts", list);
    return payload;
  }

  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db.from("assessment_attempts").insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Database attempt insert failed, enqueuing locally:", err);
    const list = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
    list.push(payload);
    saveLocalData("bb_attempts", list);
    
    executeWrite("assessment_attempts", "insert", payload).catch(e => console.error(e));
    return payload;
  }
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  answerDetails: {
    selectedOptionId?: string | null;
    answerText?: string | null;
    isCorrect: boolean;
    timeSpentSeconds: number;
    markedForReview?: boolean;
  },
  userId: string,
  supabaseClient?: any
): Promise<void> {
  const isGuest = !userId || userId === "guest-user";
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isQuestionUuid = UUID_REGEX.test(questionId);
  const cleanOptionId = answerDetails.selectedOptionId && UUID_REGEX.test(answerDetails.selectedOptionId)
    ? answerDetails.selectedOptionId
    : null;

  const payload: AssessmentAnswer = {
    attempt_id: attemptId,
    question_id: questionId,
    selected_option_id: cleanOptionId,
    answer_text: answerDetails.answerText || null,
    is_correct: answerDetails.isCorrect,
    time_spent_seconds: answerDetails.timeSpentSeconds,
    marked_for_review: answerDetails.markedForReview || false
  };

  // If the question is a static preset (non-UUID), cache it locally and skip Supabase insert
  if (isGuest || !isQuestionUuid) {
    const list = getLocalData<AssessmentAnswer[]>("bb_answers", []);
    list.push(payload);
    saveLocalData("bb_answers", list);
    return;
  }

  try {
    const db = await getDb(supabaseClient);
    const { error } = await db.from("assessment_answers").insert(payload);
    if (error) throw error;
  } catch (err) {
    console.error("Database answer insert failed, caching locally:", err);
    const list = getLocalData<AssessmentAnswer[]>("bb_answers", []);
    list.push(payload);
    saveLocalData("bb_answers", list);

    executeWrite("assessment_answers", "insert", payload).catch(e => console.error(e));
  }

  // Trigger assessment completion XP and update PRI
  import("./missions").then(async ({ awardActivityXP }) => {
    await awardActivityXP(userId, "assessment_completed", supabaseClient);
    const { calculatePRIScore } = await import("./placement-readiness");
    await calculatePRIScore(userId, undefined, supabaseClient);
  }).catch(e => console.error("Assessment XP award failed:", e));
}

export async function completeAttempt(
  attemptId: string,
  details: {
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    timeTakenSeconds: number;
    scorePercentage: number;
    passed: boolean;
  },
  userId: string,
  supabaseClient?: any
): Promise<{ attempt: AssessmentAttempt; result: AssessmentResult; xpGained: number }> {
  const isGuest = !userId || userId === "guest-user";
  
  // A. Load attempt
  let attempt: AssessmentAttempt | undefined;
  if (isGuest) {
    const list = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
    attempt = list.find(a => a.id === attemptId);
  } else {
    try {
      const db = await getDb(supabaseClient);
      const { data } = await db.from("assessment_attempts").select("*").eq("id", attemptId).eq("user_id", userId).single();
      if (data) attempt = data;
    } catch {}
  }

  if (!attempt) {
    attempt = {
      id: attemptId,
      user_id: userId || "guest-user",
      test_type: "Practice",
      mode: "Timed",
      started_at: new Date().toISOString(),
      is_completed: false
    };
  }

  attempt.completed_at = new Date().toISOString();
  attempt.is_completed = true;

  // B. Compute XP
  let xpReward = 20; // Practice Mode XP
  if (attempt.test_type === "Company") xpReward = 100;
  else if (attempt.test_type === "Exam") xpReward = 50;
  if (details.passed) xpReward += Math.round(xpReward * 0.5); // 50% pass bonus

  const result: AssessmentResult = {
    attempt_id: attemptId,
    score_percentage: details.scorePercentage,
    correct_count: details.correctCount,
    incorrect_count: details.incorrectCount,
    skipped_count: details.skippedCount,
    time_taken_seconds: details.timeTakenSeconds,
    passed: details.passed,
    guess_rate: Math.round((details.incorrectCount / (details.correctCount + details.incorrectCount || 1)) * 30),
    confidence_score: Math.max(100 - (details.skippedCount * 5), 40),
    xp_gained: xpReward
  };

  // Save updated attempt + result
  if (isGuest) {
    const list = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
    const idx = list.findIndex(a => a.id === attemptId);
    if (idx !== -1) list[idx] = attempt;
    saveLocalData("bb_attempts", list);

    const resList = getLocalData<AssessmentResult[]>("bb_results", []);
    resList.push(result);
    saveLocalData("bb_results", resList);

    // Save Guest XP
    const guestXp = getLocalData<any>("buggedbrain_guest_xp", { total_xp: 0, current_level: 1 });
    guestXp.total_xp = (guestXp.total_xp || 0) + xpReward;
    const { calculateLevel } = await import("./missions");
    guestXp.current_level = calculateLevel(guestXp.total_xp);
    saveLocalData("buggedbrain_guest_xp", guestXp);

    const { addLedgerEntry } = await import("./ledger");
    addLedgerEntry("guest-user", `Completed Assessment: ${attempt.test_type}`, xpReward, 0).catch(e => console.error(e));
  } else {
    try {
      const db = await getDb(supabaseClient);
      
      // Update Attempt
      await executeWrite("assessment_attempts", "update", {
        completed_at: attempt.completed_at,
        is_completed: true
      }, { id: attemptId }, db);

      // Insert Result
      await executeWrite("assessment_results", "insert", result, {}, db);

      // Update XP Record
      const { data: xpRecord } = await db.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle();
      if (xpRecord) {
        const newXp = (xpRecord.total_xp || 0) + xpReward;
        const { calculateLevel } = await import("./missions");
        const newLevel = calculateLevel(newXp);
        await executeWrite("user_xp", "update", {
          total_xp: newXp,
          current_level: newLevel,
          updated_at: new Date().toISOString()
        }, { user_id: userId }, db);

        const { addLedgerEntry } = await import("./ledger");
        addLedgerEntry(userId, `Completed Assessment: ${attempt.test_type}`, xpReward, 0, null, db).catch(e => console.error(e));
      }
    } catch (err) {
      console.error("Database completeAttempt sync failed, running backup writes:", err);
      // Fallback local write
      const resList = getLocalData<AssessmentResult[]>("bb_results", []);
      resList.push(result);
      saveLocalData("bb_results", resList);

      executeWrite("assessment_attempts", "update", { completed_at: attempt.completed_at, is_completed: true }, { id: attemptId }).catch(e => console.error(e));
      executeWrite("assessment_results", "insert", result).catch(e => console.error(e));
    }
  }

  // C. Update topic metrics dynamically
  // To avoid query overhead, we extract topics answered in this attempt
  const answersList = getLocalData<AssessmentAnswer[]>("bb_answers", []).filter(a => a.attempt_id === attemptId);
  for (const ans of answersList) {
    const qInfo = PRESET_QUESTIONS.find(pq => pq.id === ans.question_id);
    if (qInfo) {
      await updateTopicProgress(userId, qInfo.topic_id, ans.is_correct ? 1 : 0, 1, supabaseClient);
    }
  }

  // D. Recalculate PRI Readiness Index
  await calculatePRIScore(userId, undefined, supabaseClient);

  // E. Trigger Onboarding/Placement Missions
  if (userId && !isGuest) {
    const { triggerMissionProgress } = await import("./missions");
    triggerMissionProgress(userId, "learning", 1, undefined, supabaseClient).catch(e => console.error(e));
  }

  return { attempt, result, xpGained: xpReward };
}

async function updateTopicProgress(
  userId: string,
  topicId: string,
  correct: number,
  solved: number,
  supabaseClient?: any
): Promise<void> {
  const isGuest = !userId || userId === "guest-user";
  let existing: AssessmentTopicProgress | undefined;

  if (isGuest) {
    const list = getLocalData<AssessmentTopicProgress[]>("bb_progress", []);
    existing = list.find(p => p.user_id === "guest-user" && p.topic_id === topicId);
  } else {
    try {
      const db = await getDb(supabaseClient);
      const { data } = await db.from("assessment_progress").select("*").eq("user_id", userId).eq("topic_id", topicId).maybeSingle();
      if (data) existing = data;
    } catch {}
  }

  const prevSolved = existing?.questions_solved || 0;
  const prevCorrect = existing?.correct_answers || 0;

  const newSolved = prevSolved + solved;
  const newCorrect = prevCorrect + correct;
  const newAccuracy = Number(((newCorrect / newSolved) * 100).toFixed(2));

  let mastery: "Mastered" | "Moderate" | "Needs Improvement" = "Needs Improvement";
  if (newAccuracy >= 85 && newSolved >= 5) mastery = "Mastered";
  else if (newAccuracy >= 60 && newSolved >= 3) mastery = "Moderate";

  const payload: AssessmentTopicProgress = {
    user_id: userId || "guest-user",
    topic_id: topicId,
    questions_solved: newSolved,
    correct_answers: newCorrect,
    accuracy_percentage: newAccuracy,
    mastery_level: mastery,
    last_updated: new Date().toISOString()
  };

  if (isGuest) {
    const list = getLocalData<AssessmentTopicProgress[]>("bb_progress", []);
    const idx = list.findIndex(p => p.user_id === "guest-user" && p.topic_id === topicId);
    if (idx !== -1) list[idx] = payload;
    else list.push(payload);
    saveLocalData("bb_progress", list);
  } else {
    try {
      const db = await getDb(supabaseClient);
      await executeWrite("assessment_progress", "upsert", payload, { user_id: userId, topic_id: topicId }, db);
    } catch {
      const list = getLocalData<AssessmentTopicProgress[]>("bb_progress", []);
      const idx = list.findIndex(p => p.user_id === userId && p.topic_id === topicId);
      if (idx !== -1) list[idx] = payload;
      else list.push(payload);
      saveLocalData("bb_progress", list);

      executeWrite("assessment_progress", "upsert", payload, { user_id: userId, topic_id: topicId }).catch(e => console.error(e));
    }
  }
}

// ==========================================
// ANALYTICS & COMPANY READINESS SCORERS
// ==========================================

export async function getUserTopicProgress(
  userId: string,
  supabaseClient?: any
): Promise<AssessmentTopicProgress[]> {
  const isGuest = !userId || userId === "guest-user";
  if (isGuest) {
    const progressList = getLocalData<AssessmentTopicProgress[]>("bb_progress", []);
    return progressList.map(p => {
      const t = PRESET_TOPICS.find(pt => pt.id === p.topic_id);
      return {
        ...p,
        topic_name: t?.name,
        category_slug: t?.category_slug
      };
    });
  }

  try {
    const db = await getDb(supabaseClient);
    const { data, error } = await db.from("assessment_progress").select(`
      *,
      topic:assessment_topics(name, category_slug)
    `).eq("user_id", userId);

    if (error || !data) throw error;
    return data.map((d: any) => ({
      ...d,
      topic_name: d.topic?.name,
      category_slug: d.topic?.category_slug
    }));
  } catch {
    const progressList = getLocalData<AssessmentTopicProgress[]>("bb_progress", []);
    return progressList.map(p => {
      const t = PRESET_TOPICS.find(pt => pt.id === p.topic_id);
      return {
        ...p,
        topic_name: t?.name,
        category_slug: t?.category_slug
      };
    });
  }
}

export async function getUserAssessmentAnalytics(
  userId: string,
  supabaseClient?: any
): Promise<{
  readinessScore: number;
  overallAccuracy: number;
  questionsAttempted: number;
  mockTestsCompleted: number;
  strongestTopic: string;
  weakestTopic: string;
  difficultySolved: { easy: number; medium: number; hard: number };
  accuracyHistory: { name: string; score: number }[];
  companyReadiness: Record<string, number>;
}> {
  const isGuest = !userId || userId === "guest-user";
  let attempts: AssessmentAttempt[] = [];
  let results: AssessmentResult[] = [];
  let progress: AssessmentTopicProgress[] = [];

  if (isGuest) {
    attempts = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
    results = getLocalData<AssessmentResult[]>("bb_results", []);
    progress = await getUserTopicProgress("guest-user");
  } else {
    try {
      const db = await getDb(supabaseClient);
      const { data: attData } = await db.from("assessment_attempts").select("*").eq("user_id", userId).eq("is_completed", true);
      attempts = attData || [];

      if (attempts.length > 0) {
        const { data: resData } = await db.from("assessment_results").select("*").in("attempt_id", attempts.map(a => a.id));
        results = resData || [];
      }
      progress = await getUserTopicProgress(userId);
    } catch {
      attempts = getLocalData<AssessmentAttempt[]>("bb_attempts", []);
      results = getLocalData<AssessmentResult[]>("bb_results", []);
      progress = await getUserTopicProgress(userId);
    }
  }

  const questionsAttempted = progress.reduce((acc: number, curr) => acc + curr.questions_solved, 0);
  const mockTestsCompleted = attempts.filter(a => a.test_type === "Company" || a.test_type === "Exam").length;

  const totalCorrect = progress.reduce((acc: number, curr) => acc + curr.correct_answers, 0);
  const overallAccuracy = questionsAttempted > 0 ? Math.round((totalCorrect / questionsAttempted) * 100) : 0;

  // Strongest/Weakest
  let strongestTopic = "No data yet";
  let weakestTopic = "No data yet";
  if (progress.length > 0) {
    const sorted = [...progress].sort((a, b) => b.accuracy_percentage - a.accuracy_percentage);
    strongestTopic = `${sorted[0].topic_name} (${Math.round(sorted[0].accuracy_percentage)}%)`;
    weakestTopic = `${sorted[sorted.length - 1].topic_name} (${Math.round(sorted[sorted.length - 1].accuracy_percentage)}%)`;
  }

  // Difficulty Split Mock
  let easy = 0, medium = 0, hard = 0;
  progress.forEach(p => {
    easy += Math.round(p.questions_solved * 0.5);
    medium += Math.round(p.questions_solved * 0.3);
    hard += p.questions_solved - Math.round(p.questions_solved * 0.5) - Math.round(p.questions_solved * 0.3);
  });

  // History Trend
  const accuracyHistory = results.slice(-6).map((r, i) => ({
    name: `Test ${i + 1}`,
    score: Math.round(r.score_percentage)
  }));
  if (accuracyHistory.length === 0) {
    accuracyHistory.push({ name: "Start", score: 0 });
  }

  // Company Readiness Scorecards (Google, Amazon, Microsoft, TCS, Infosys)
  const baseScore = Math.max(overallAccuracy, 45);
  const companyReadiness = {
    Google: Math.min(Math.round(baseScore * 0.82), 100),
    Amazon: Math.min(Math.round(baseScore * 0.88), 100),
    Microsoft: Math.min(Math.round(baseScore * 0.85), 100),
    TCS: Math.min(Math.round(baseScore * 1.15), 100),
    Infosys: Math.min(Math.round(baseScore * 1.12), 100)
  };

  const readinessScore = overallAccuracy;

  return {
    readinessScore,
    overallAccuracy,
    questionsAttempted,
    mockTestsCompleted,
    strongestTopic,
    weakestTopic,
    difficultySolved: { easy, medium, hard },
    accuracyHistory,
    companyReadiness
  };
}

// ==========================================
// DEVELOPER ADMIN STUDIO UTILITIES
// ==========================================

export async function getAdminAssessmentStats(supabaseClient?: any): Promise<{
  averageClassScore: number;
  totalMocksCompleted: number;
  totalQuestionsActive: number;
  popularTest: string;
}> {
  try {
    const db = await getDb(supabaseClient);
    
    // Average score from results table
    const { data: resData } = await db.from("assessment_results").select("score_percentage");
    const totalMocks = resData?.length || 0;
    const avgScore = totalMocks > 0
      ? Math.round(resData.reduce((acc: number, curr: any) => acc + Number(curr.score_percentage), 0) / totalMocks)
      : 72;

    const { count: qCount } = await db.from("assessment_questions").select("id", { count: "exact", head: true });

    return {
      averageClassScore: avgScore,
      totalMocksCompleted: totalMocks || 142,
      totalQuestionsActive: qCount || PRESET_QUESTIONS.length,
      popularTest: "TCS NQT Advanced Mock"
    };
  } catch {
    return {
      averageClassScore: 74,
      totalMocksCompleted: 142,
      totalQuestionsActive: PRESET_QUESTIONS.length,
      popularTest: "TCS NQT Advanced Mock"
    };
  }
}

export async function adminCreateQuestion(
  question: Omit<AssessmentQuestion, "id">,
  supabaseClient?: any
): Promise<boolean> {
  const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const qPayload = {
    id,
    topic_id: question.topic_id,
    question_text: question.question_text,
    correct_answer_text: question.correct_answer_text,
    explanation: question.explanation || "",
    hints: question.hints || [],
    solution_code: question.solution_code || "",
    difficulty: question.difficulty,
    expected_time_seconds: question.expected_time_seconds || 120,
    marks: question.marks || 4,
    negative_marks: question.negative_marks || 1,
    company_tags: question.company_tags || [],
    role_tags: question.role_tags || [],
    is_published: true
  };

  try {
    const db = await getDb(supabaseClient);
    
    // Insert Question
    const { error: qError } = await db.from("assessment_questions").insert(qPayload);
    if (qError) throw qError;

    // Insert options mapping
    if (question.options && question.options.length > 0) {
      const optPayloads = question.options.map(opt => ({
        question_id: id,
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }));
      const { error: optError } = await db.from("assessment_options").insert(optPayloads);
      if (optError) throw optError;
    }

    return true;
  } catch (err) {
    console.error("Admin Insert Question SQL failed, writing to client storage:", err);
    // Write local backup
    const list = getLocalData<AssessmentQuestion[]>("bb_custom_questions", PRESET_QUESTIONS);
    const newQ: AssessmentQuestion = {
      ...qPayload,
      options: question.options?.map((o, idx) => ({ ...o, id: `o-${idx}` })) || [],
      topic_name: "Compound Interest",
      category_slug: "aptitude"
    };
    list.push(newQ);
    saveLocalData("bb_custom_questions", list);
    return true;
  }
}

export async function adminCreateCompanyTest(
  test: Omit<AssessmentCompanyTest, "id">,
  supabaseClient?: any
): Promise<boolean> {
  const id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const tempPayload = {
    id,
    title: test.title,
    company: test.company,
    role: test.role,
    duration_minutes: test.duration_minutes,
    passing_percentage: test.passing_percentage,
    instructions: test.instructions || "",
    randomize_questions: test.randomize_questions || false,
    shuffle_options: test.shuffle_options || false,
    visibility: test.visibility,
    attempt_limit: test.attempt_limit || 3,
    status: "Active" as const
  };

  try {
    const db = await getDb(supabaseClient);
    const { error } = await db.from("assessment_company_templates").insert(tempPayload);
    if (error) throw error;

    // Insert sections
    if (test.sections && test.sections.length > 0) {
      const sectionPayloads = test.sections.map(s => ({
        template_id: id,
        name: s.name,
        duration_minutes: s.duration_minutes,
        question_count: s.question_count
      }));
      const { error: sError } = await db.from("assessment_sections").insert(sectionPayloads);
      if (sError) throw sError;
    }

    return true;
  } catch (err) {
    console.error("Admin Create Template SQL failed, writing local backup:", err);
    const list = getLocalData<AssessmentCompanyTest[]>("bb_custom_templates", PRESET_COMPANY_TESTS);
    const newTest: AssessmentCompanyTest = {
      ...tempPayload,
      sections: test.sections?.map((s, idx) => ({ ...s, id: `s-${idx}` })) || [],
      questions: test.questions || []
    };
    list.push(newTest);
    saveLocalData("bb_custom_templates", list);
    return true;
  }
}

export async function adminBulkImportCSV(
  csvText: string,
  supabaseClient?: any
): Promise<{ success: boolean; importedCount: number }> {
  // Parse rows (simple client-side CSV parser)
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");
  let importedCount = 0;

  const topics = await getTopics(supabaseClient);
  const defaultTopicId = topics[0]?.id || "t1";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Format: CategorySlug,TopicName,Difficulty,QuestionText,Option1,Option2,Option3,Option4,CorrectAnswer,Explanation
    const cells = line.split(",").map(c => c.replace(/(^"|"$)/g, "").trim());
    if (cells.length < 9) continue;

    const topicName = cells[1];
    const matchTopic = topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
    const topicId = matchTopic ? matchTopic.id : defaultTopicId;

    const questionText = cells[3];
    const optionTexts = [cells[4], cells[5], cells[6], cells[7]];
    const correctAnswer = cells[8];
    const explanation = cells[9] || "";
    const difficultyVal = cells[2] as any;

    const optionsList = optionTexts.map(ot => ({
      option_text: ot,
      is_correct: ot.toLowerCase() === correctAnswer.toLowerCase()
    }));

    await adminCreateQuestion({
      topic_id: topicId,
      question_text: questionText,
      correct_answer_text: correctAnswer,
      explanation,
      difficulty: ["Easy", "Medium", "Hard"].includes(difficultyVal) ? difficultyVal : "Medium",
      options: optionsList,
      hints: ["Read the parameters carefully"],
      company_tags: ["Deloitte"],
      role_tags: ["Analyst"]
    }, supabaseClient);

    importedCount++;
  }

  return { success: true, importedCount };
}

export async function adminAIGenerateQuestion(
  topicId: string,
  difficulty: "Easy" | "Medium" | "Hard"
): Promise<Omit<AssessmentQuestion, "id">> {
  // Mock LLM generation delay
  await new Promise(r => setTimeout(r, 1500));

  const topics = PRESET_TOPICS;
  const match = topics.find(t => t.id === topicId) || topics[0];

  let text = `Given a scenario matching ${match.name}, identify the correct parameter output.`;
  let opts = [
    { option_text: "Linear increase output", is_correct: false },
    { option_text: "Constant aggregate result", is_correct: true },
    { option_text: "Null mismatch value", is_correct: false },
    { option_text: "None of the above", is_correct: false }
  ];
  let answer = "Constant aggregate result";
  let explanation = `The standard properties of ${match.name} under ${difficulty} conditions yield a constant value representation.`;

  if (match.category_slug === "sql") {
    text = `Write a relational SQL query to select employees whose salary exceeds their department average.`;
    opts = [
      { option_text: "SELECT * FROM Emp e WHERE Salary > (SELECT Avg(Salary) FROM Emp WHERE Dept = e.Dept);", is_correct: true },
      { option_text: "SELECT e.* FROM Emp e JOIN Dept d ON e.Salary > Avg(d.Salary);", is_correct: false },
      { option_text: "SELECT Avg(Salary) FROM Emp GROUP BY Dept HAVING Salary > Avg(Salary);", is_correct: false },
      { option_text: "None of these query configurations", is_correct: false }
    ];
    answer = "SELECT * FROM Emp e WHERE Salary > (SELECT Avg(Salary) FROM Emp WHERE Dept = e.Dept);";
    explanation = "A correlated subquery compares the employee's salary against their specific department's aggregate average salary.";
  }

  return {
    topic_id: topicId,
    question_text: text,
    correct_answer_text: answer,
    explanation,
    hints: ["Identify correlated references", "Revise aggregation bounds"],
    solution_code: "SELECT * FROM Emp;",
    difficulty,
    expected_time_seconds: 120,
    marks: 4,
    negative_marks: 1,
    company_tags: ["Google", "Amazon"],
    role_tags: ["SDE"],
    options: opts
  };
}
