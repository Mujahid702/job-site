const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log("⚡ Connecting to Supabase RPC migrations channel...");
  
  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "015_recruitment_assessment_schema.sql");
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file 015 not found.");
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  console.log("📖 Loaded migration SQL block. Length:", sql.length, "characters.");

  try {
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });
    
    if (error) {
      console.error("❌ RPC execution error:");
      console.error(error);
      process.exit(1);
    }

    console.log("✅ Migration 015 successfully applied to remote database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Exception occurred during migration execute:", err);
    process.exit(1);
  }
}

applyMigrations();
