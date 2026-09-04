import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment.");
  process.exit(1);
}

async function runTest() {
  console.log("🚀 Starting Copilot RAG 2.0 Integration verification tests...\n");

  try {
    // 1. Verify that the Copilot API Route Handler code compiles and can be imported
    console.log("📦 Test 1: Verification of route handler module imports...");
    const routeModule = await import("../app/api/placement/copilot/route");
    if (typeof routeModule.POST !== "function") {
      throw new Error("API Route is missing POST handler exports!");
    }
    console.log("✅ Route module imports verified successfully.");

    // 2. Verify RAG 2.0 retrieval inside the Copilot pipeline context
    console.log("\n🔍 Test 2: Simulating RAG 2.0 query vector retrieval matching...");
    const { retrieveKnowledgeV2 } = await import("../lib/ai/rag-v2");

    // We use a mock query representing a student asking for interview prep
    const query = "Google interview prep guide";
    const filters = {
      company: "Google",
      role: "Software Engineer"
    };

    const results = await retrieveKnowledgeV2(query, filters, 3, -1.0); // minSimilarity = -1 to bypass offline constraints
    
    if (!results || results.length === 0) {
      throw new Error("RAG 2.0 query returned 0 documents! Seed database first.");
    }

    console.log(`✅ Retrieved ${results.length} matching document(s).`);
    console.log(`   Best match title: "${results[0].title}"`);
    console.log(`   Similarity score: ${results[0].similarity}`);

    if (!results.some(r => r.title.toLowerCase().includes("google"))) {
      throw new Error(`Verification warning: Expected at least one Google document in matches, but got: [${results.map(r => r.title).join(", ")}]`);
    }

    console.log("\n🏆 AI Placement Copilot RAG 2.0 Integration verified successfully!");
    process.exit(0);

  } catch (err: any) {
    console.error("\n❌ Integration test failed:", err.message);
    process.exit(1);
  }
}

runTest();
