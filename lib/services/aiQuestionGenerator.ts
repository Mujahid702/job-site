import { generateResponse } from "@/lib/ai/router";
import { createClient } from "@/lib/supabase/server";
import { ExecutionProvider } from "@/lib/compiler/ExecutionProvider";
import { SqlSandbox } from "@/lib/compiler/SqlSandbox";

export interface AIGeneratedQuestionJSON {
  question_text: string;
  correct_answer_text: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "MCQ" | "Coding" | "SQL";
  options?: { option_text: string; is_correct: boolean }[];
  starter_codes?: Record<string, string>;
  sample_test_cases?: { input: string; expected_output: string; explanation?: string }[];
  solution_code?: string;
  constraints?: string;
  input_format?: string;
  output_format?: string;
  sql_schema_seed?: string;
  correct_query?: string;
}

export interface ValidationLog {
  correctAnswerExists: boolean;
  optionsUnique: boolean;
  explanationValid: boolean;
  notMalformed: boolean;
  noPromptInjection: boolean;
  noOffensiveContent: boolean;
  noDuplicates: boolean;
  compilesOrValidates: boolean;
  passedAll: boolean;
  reason?: string;
}

export class AIQuestionGeneratorService {
  private static PROMPT_VERSION = "v2.1";
  private static MODEL_NAME = "gemini-3.5-flash";

  /**
   * Generates a recruitment-quality question under a specific topic slug and difficulty.
   */
  static async generate(
    topicId: string,
    topicName: string,
    categorySlug: string,
    difficulty: "Easy" | "Medium" | "Hard",
    questionType: "MCQ" | "Coding" | "SQL"
  ): Promise<{ success: boolean; questionId?: string; validation: ValidationLog }> {
    const supabase = await createClient();

    // 1. Build prompt
    const systemPrompt = `You are a professional recruitment examiner compiling pre-employment screening questions.
Generate a high-quality ${difficulty}-level ${questionType} question on the topic of "${topicName}".
Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown blocks.

JSON Schema:
{
  "question_text": "Detailed question description",
  "correct_answer_text": "Option text or expected code solution description",
  "explanation": "Step by step logical reasoning of solution",
  "difficulty": "${difficulty}",
  "type": "${questionType}",
  // For MCQ
  "options": [
    {"option_text": "Choice A", "is_correct": false},
    {"option_text": "Choice B", "is_correct": true}
  ],
  // For Coding
  "starter_codes": {"python": "def solution():\\n    pass"},
  "sample_test_cases": [{"input": "5", "expected_output": "10", "explanation": "multiplied by 2"}],
  "solution_code": "def solution():\\n    return 5 * 2",
  "constraints": "1 <= N <= 100",
  "input_format": "Integer N",
  "output_format": "Integer output",
  // For SQL
  "sql_schema_seed": "CREATE TABLE users(id INT, score INT); INSERT INTO users VALUES (1, 90);",
  "correct_query": "SELECT MAX(score) FROM users;"
}`;

    const userPrompt = `Generate one ${difficulty} ${questionType} question for ${topicName}. Make it realistic and challenging. Ensure all fields are filled.`;

    // 2. Query LLM Gateway
    const response = await generateResponse({
      provider: "gemini",
      model: this.MODEL_NAME,
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      taskType: "assessments_generator"
    });

    if (!response.success || !response.text) {
      return {
        success: false,
        validation: {
          correctAnswerExists: false,
          optionsUnique: false,
          explanationValid: false,
          notMalformed: false,
          noPromptInjection: false,
          noOffensiveContent: false,
          noDuplicates: false,
          compilesOrValidates: false,
          passedAll: false,
          reason: `LLM generation failure: ${response.error || "empty response"}`
        }
      };
    }

    // 3. Parse JSON
    let parsed: AIGeneratedQuestionJSON;
    try {
      parsed = JSON.parse(response.text.trim());
    } catch (err: any) {
      return {
        success: false,
        validation: {
          correctAnswerExists: false,
          optionsUnique: false,
          explanationValid: false,
          notMalformed: false,
          noPromptInjection: false,
          noOffensiveContent: false,
          noDuplicates: false,
          compilesOrValidates: false,
          passedAll: false,
          reason: `JSON parse failed: ${err.message}. Text returned: ${response.text}`
        }
      };
    }

    // 4. Run Deterministic Validation Checklist
    const validation = await this.validateQuestion(parsed, supabase);
    if (!validation.passedAll) {
      return { success: false, validation };
    }

    // 5. Insert base question as DRAFT (is_published = false)
    const { data: q, error: qErr } = await supabase
      .from("assessment_questions")
      .insert({
        topic_id: topicId,
        question_text: parsed.question_text,
        correct_answer_text: parsed.correct_answer_text || "",
        explanation: parsed.explanation,
        difficulty: parsed.difficulty,
        is_published: false, // DRAFT status first
        type: parsed.type,
        marks: 4,
        negative_marks: 1.0
      })
      .select()
      .single();

    if (qErr || !q) {
      return {
        success: false,
        validation: {
          ...validation,
          passedAll: false,
          reason: `Database insert failure: ${qErr?.message || "unknown"}`
        }
      };
    }

    // 6. Insert Type-specific details
    if (parsed.type === "MCQ" && parsed.options) {
      const opts = parsed.options.map(o => ({
        question_id: q.id,
        option_text: o.option_text,
        is_correct: o.is_correct
      }));
      await supabase.from("assessment_options").insert(opts);
    } else if (parsed.type === "Coding") {
      await supabase.from("coding_problems").insert({
        question_id: q.id,
        starter_codes: parsed.starter_codes || {},
        sample_test_cases: parsed.sample_test_cases || [],
        time_limit_ms: 5000,
        memory_limit_mb: 256,
        constraints: parsed.constraints,
        input_format: parsed.input_format,
        output_format: parsed.output_format
      });
    } else if (parsed.type === "SQL") {
      await supabase.from("sql_problems").insert({
        question_id: q.id,
        sql_schema_seed: parsed.sql_schema_seed,
        correct_query: parsed.correct_query || ""
      });
    }

    // 7. Track AI logs metadata
    await supabase.from("ai_generated_questions").insert({
      question_id: q.id,
      generation_model: this.MODEL_NAME,
      prompt_version: this.PROMPT_VERSION,
      validation_result: validation,
      admin_approved: false
    });

    return {
      success: true,
      questionId: q.id,
      validation
    };
  }

  /**
   * Deterministic Validation Rules Engine
   */
  private static async validateQuestion(q: AIGeneratedQuestionJSON, supabase: any): Promise<ValidationLog> {
    const log: ValidationLog = {
      correctAnswerExists: false,
      optionsUnique: true,
      explanationValid: false,
      notMalformed: false,
      noPromptInjection: true,
      noOffensiveContent: true,
      noDuplicates: true,
      compilesOrValidates: false,
      passedAll: false
    };

    // 1. Not malformed check
    if (!q.question_text || !q.explanation || !q.difficulty || !q.type) {
      log.reason = "Missing required fields (question_text, explanation, difficulty, type).";
      return log;
    }
    log.notMalformed = true;

    // 2. Explanation consistency check
    if (q.explanation.length < 15) {
      log.reason = "Explanation is too brief or logically inconsistent.";
      return log;
    }
    log.explanationValid = true;

    // 3. Profanity & Prompt injection check
    const rawText = (q.question_text + " " + q.explanation).toLowerCase();
    const injectionKeywords = ["ignore previous", "system prompt", "you are an assistant", "ignore rules"];
    const offensiveKeywords = ["offensive", "insult", "slur", "profanity"];

    for (const key of injectionKeywords) {
      if (rawText.includes(key)) {
        log.noPromptInjection = false;
        log.reason = "Potential prompt injection keywords identified.";
        return log;
      }
    }

    for (const key of offensiveKeywords) {
      if (rawText.includes(key)) {
        log.noOffensiveContent = false;
        log.reason = "Offensive/irrelevant keywords identified.";
        return log;
      }
    }

    // 4. Duplicate checks
    const { data: dups } = await supabase
      .from("assessment_questions")
      .select("id")
      .ilike("question_text", q.question_text.trim())
      .limit(1);
    if (dups && dups.length > 0) {
      log.noDuplicates = false;
      log.reason = "Duplicate question body text already exists in database.";
      return log;
    }

    // 5. MCQ specific checks
    if (q.type === "MCQ") {
      if (!q.options || q.options.length < 2) {
        log.reason = "MCQ questions must contain at least 2 options choice.";
        return log;
      }

      // Check correct answer exists
      const correctOpts = q.options.filter(o => o.is_correct === true);
      if (correctOpts.length !== 1) {
        log.reason = `MCQs must have exactly 1 correct answer (found ${correctOpts.length}).`;
        return log;
      }
      log.correctAnswerExists = true;

      // Unique options check
      const optionTexts = q.options.map(o => o.option_text.trim().toLowerCase());
      const uniqueTexts = new Set(optionTexts);
      if (optionTexts.length !== uniqueTexts.size) {
        log.optionsUnique = false;
        log.reason = "MCQ contains duplicate option choice values.";
        return log;
      }

      log.compilesOrValidates = true; // MCQs compile trivially
    }

    // 6. Coding compile evaluation check
    if (q.type === "Coding") {
      if (!q.solution_code || !q.sample_test_cases || q.sample_test_cases.length === 0) {
        log.reason = "Coding questions require solution_code and sample test cases.";
        return log;
      }
      log.correctAnswerExists = true;

      const tc = q.sample_test_cases[0];
      try {
        const runRes = await ExecutionProvider.execute({
          sourceCode: q.solution_code,
          language: "python",
          stdin: tc.input,
          expectedOutput: tc.expected_output
        });

        if (runRes.status !== "Accepted") {
          log.reason = `Coding verification compile run output was not accepted: ${runRes.status} (stderr: ${runRes.stderr})`;
          return log;
        }
        log.compilesOrValidates = true;
      } catch (err: any) {
        log.reason = `Coding validation exception: ${err.message}`;
        return log;
      }
    }

    // 7. SQL run evaluation check
    if (q.type === "SQL") {
      if (!q.sql_schema_seed || !q.correct_query) {
        log.reason = "SQL questions require sql_schema_seed and correct_query.";
        return log;
      }
      log.correctAnswerExists = true;

      try {
        const runRes = await SqlSandbox.execute(
          q.sql_schema_seed,
          q.correct_query,
          q.correct_query
        );

        if (!runRes.success) {
          log.reason = `SQL verification execution error: ${runRes.error}`;
          return log;
        }
        log.compilesOrValidates = true;
      } catch (err: any) {
        log.reason = `SQL validation exception: ${err.message}`;
        return log;
      }
    }

    // All checks passed!
    log.passedAll = true;
    return log;
  }
}
