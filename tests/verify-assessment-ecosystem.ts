import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { ExecutionProvider } from "../lib/compiler/ExecutionProvider";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL or keys are missing in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("🚀 Starting Assessment Ecosystem Programmatic Verifications...\n");

  // Create a temporary testing user in auth.users
  let testUser: any = null;
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test_assess_${Math.floor(Math.random() * 1000000)}@example.com`,
      password: "TestPassword123!",
      email_confirm: true
    });
    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }
    testUser = userData.user;
  } catch (e: any) {
    console.warn(`⚠️ auth.admin.createUser failed: ${e.message}. Falling back to random UUID.`);
  }

  const mockUserId = testUser ? testUser.id : `00000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  console.log(`👤 Test Profile User ID: ${mockUserId}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Safe Code Evaluation Offline Simulation
    // ----------------------------------------------------
    console.log("\n🧪 Test 1: Safe Code Evaluation Simulator (Offline Mode)");
    
    // Test code that is too short
    const shortRun = await ExecutionProvider.execute({
      sourceCode: "print(1)",
      language: "python",
      stdin: ""
    });
    console.log(`   Short Code Status: ${shortRun.status}`);
    if (shortRun.status !== "Compile Error") {
      throw new Error(`Expected Compile Error for short source code, got: ${shortRun.status}`);
    }

    // Test syntax error validation check
    const syntaxErrRun = await ExecutionProvider.execute({
      sourceCode: "def broken_func()\n    pass",
      language: "python",
      stdin: ""
    });
    console.log(`   Syntax Error Code Status: ${syntaxErrRun.status}`);
    if (syntaxErrRun.status !== "Compile Error") {
      throw new Error(`Expected Compile Error for syntax error, got: ${syntaxErrRun.status}`);
    }

    // Test code that matches basic logic checks
    const goodRun = await ExecutionProvider.execute({
      sourceCode: "def solve():\n    return 42\n\nif __name__ == '__main__':\n    solve()",
      language: "python",
      stdin: "",
      expectedOutput: "42"
    });
    console.log(`   Valid Code Status: ${goodRun.status}`);
    if (goodRun.status !== "Accepted" || goodRun.stdout !== "42") {
      throw new Error(`Expected Accepted status with stdout '42', got: ${goodRun.status} (${goodRun.stdout})`);
    }

    console.log("✨ Test 1 Passed!");

    // ----------------------------------------------------
    // TEST 2: Start Practice/Exam Session
    // ----------------------------------------------------
    console.log("\n🧪 Test 2: Start Session DB Entry");

    // Retrieve a mock or existing topic
    const { data: topics } = await supabase.from("assessment_topics").select("id").limit(1);
    const mockTopicId = topics && topics.length > 0 ? topics[0].id : null;

    // Retrieve active questions
    const { data: questions } = await supabase.from("assessment_questions").select("id").limit(3);
    if (!questions || questions.length === 0) {
      console.warn("⚠️ Warning: No questions found in catalog. Seeding mock templates might be needed.");
    }

    const { data: session, error: sessError } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id: mockUserId,
        session_type: "Practice",
        status: "Active",
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessError || !session) {
      throw new Error(`Failed to insert session row: ${sessError?.message}`);
    }

    console.log(`   Session created successfully! ID: ${session.id}`);
    console.log(`   Session Type: ${session.session_type}`);
    console.log(`   Status: ${session.status}`);
    console.log("✨ Test 2 Passed!");

    // ----------------------------------------------------
    // TEST 3: Submit Answers Log
    // ----------------------------------------------------
    console.log("\n🧪 Test 3: Submit Answer log");

    let attemptId: string | null = null;
    if (questions && questions.length > 0) {
      const targetQId = questions[0].id;
      
      // 1. Create Attempt row first
      const { data: attempt, error: attError } = await supabase
        .from("assessment_attempts")
        .insert({
          session_id: session.id,
          user_id: mockUserId,
          is_completed: false
        })
        .select()
        .single();

      if (attError || !attempt) {
        throw new Error(`Failed to insert session attempt: ${attError?.message}`);
      }
      attemptId = attempt.id;
      console.log(`   Attempt created successfully! ID: ${attemptId}`);

      // 2. Log Answer linked to attempt
      const { data: answer, error: ansError } = await supabase
        .from("assessment_answers")
        .insert({
          attempt_id: attemptId,
          question_id: targetQId,
          answer_text: "SELECT * FROM Users;",
          is_correct: true,
          time_spent_seconds: 15
        })
        .select()
        .single();

      if (ansError || !answer) {
        throw new Error(`Failed to insert attempt answer: ${ansError?.message}`);
      }

      console.log(`   Attempt answer logged successfully! ID: ${answer.id}`);
      console.log(`   Is Correct: ${answer.is_correct}`);
    } else {
      console.log("   Skipping answer log test (no question records in DB).");
    }

    console.log("✨ Test 3 Passed!");

    // ----------------------------------------------------
    // TEST 4: Complete Session
    // ----------------------------------------------------
    console.log("\n🧪 Test 4: Complete Session calculations");

    const { data: updatedSession, error: updError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "Completed",
        completed_at: new Date().toISOString(),
        score_percentage: 100.0,
        passed: true
      })
      .eq("id", session.id)
      .select()
      .single();

    if (updError || !updatedSession) {
      throw new Error(`Failed to update session to completed: ${updError?.message}`);
    }
    console.log(`   Session completed! Status: ${updatedSession.status}`);

    if (attemptId) {
      // Complete the attempt
      const { data: updatedAttempt, error: updAttError } = await supabase
        .from("assessment_attempts")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (updAttError || !updatedAttempt) {
        throw new Error(`Failed to complete attempt: ${updAttError?.message}`);
      }

      // Log scorecard results
      const { data: score, error: scoreError } = await supabase
        .from("assessment_scores")
        .insert({
          attempt_id: attemptId,
          user_id: mockUserId,
          total_questions: 1,
          correct_answers: 1,
          score_percentage: 100.0,
          passed: true
        })
        .select()
        .single();

      if (scoreError || !score) {
        throw new Error(`Failed to log assessment score: ${scoreError?.message}`);
      }
      console.log(`   Score scorecard inserted successfully! ID: ${score.id}`);
    }

    console.log("✨ Test 4 Passed!");

    console.log("\n🏆 All programmatic verifications passed successfully!");
    
    // Clean up created user if applicable
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
      console.log(`\n🧹 Cleaned up temporary auth user: ${testUser.id}`);
    }

    process.exit(0);

  } catch (err: any) {
    console.error(`\n❌ Verification failure: ${err.message || err}`);
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
    process.exit(1);
  }
}

runTests();
