import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTest() {
  console.log("🚀 Starting RAG 2.0 Vector Search & Telemetry regression tests...\n");

  try {
    const { retrieveKnowledgeV2 } = await import("../lib/ai/rag-v2");
    // 1. Run Search Query
    console.log("🔍 Test 1: Querying 'FAANG Coding' with company filter 'Google'...");
    const results = await retrieveKnowledgeV2("FAANG Coding", {
      category: "guide",
      company: "Google"
    }, 4, -1.0);

    if (!results || results.length === 0) {
      throw new Error("No RAG results returned from vector search! Make sure database is seeded.");
    }

    console.log(`✅ Results found: ${results.length} document(s).`);
    const bestMatch = results[0];
    console.log(`   Best match title: "${bestMatch.title}"`);
    console.log(`   Category: "${bestMatch.category}" | Company: "${bestMatch.company || "General"}"`);
    console.log(`   Similarity Score: ${bestMatch.similarity}`);

    if (!bestMatch.title.includes("Google FAANG Coding")) {
      throw new Error("Verification failed: Did not retrieve the expected Google interview guide.");
    }
    console.log("✨ Test 1 Passed!");

    // 2. Verify Telemetry Logging
    console.log("\n📊 Test 2: Verifying RAG Telemetry logging in 'rag_retrieval_logs'...");
    const { data: logs, error: logError } = await supabase
      .from("rag_retrieval_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (logError) {
      throw new Error(`Failed to query telemetry logs: ${logError.message}`);
    }

    if (!logs || logs.length === 0) {
      throw new Error("No telemetry log found! Telemetry table is empty.");
    }

    const latestLog = logs[0];
    console.log("   Latest retrieval log recorded:");
    console.log(`   - Query: "${latestLog.query}"`);
    console.log(`   - Results count: ${latestLog.results_count}`);
    console.log(`   - Latency: ${latestLog.latency_ms}ms`);
    console.log(`   - Average Similarity: ${latestLog.average_similarity}`);
    console.log(`   - Grounding Quality: ${latestLog.grounding_quality}`);

    if (latestLog.query !== "FAANG Coding") {
      throw new Error(`Verification failed: Expected logged query 'FAANG Coding', but got '${latestLog.query}'`);
    }
    console.log("✨ Test 2 Passed!");

    console.log("\n🏆 RAG 2.0 Hybrid Search and Telemetry logs verified successfully!");
    process.exit(0);

  } catch (err: any) {
    console.error("\n❌ Regression test failed:", err.message);
    process.exit(1);
  }
}

runTest();
