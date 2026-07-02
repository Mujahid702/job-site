/**
 * scripts/verify-env.js
 * Automatically verifies that all required environment variables are set up inside process.env or .env.local.
 * Runs on predev and prebuild to protect developers from launching misconfigured environments.
 */
const fs = require('fs');
const path = require('path');

// Colors for terminal formatting
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];

const RECOMMENDED_VARS = [
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'NEXTAUTH_SECRET'
];

console.log(`${BOLD}[Environment Verifier] Starting environment checks...${RESET}`);

// Helper to load variables from a file
function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    // Strip comments
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith('#')) return;
    
    const equalIdx = cleaned.indexOf('=');
    if (equalIdx === -1) return;
    
    const key = cleaned.substring(0, equalIdx).trim();
    let val = cleaned.substring(equalIdx + 1).trim();
    
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    
    if (key) vars[key] = val;
  });
  return vars;
}

// Load env.local and merge with process.env
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envLocalVars = parseEnvFile(envLocalPath);
const mergedEnv = { ...process.env, ...envLocalVars };

const missingRequired = [];
const missingRecommended = [];

REQUIRED_VARS.forEach(v => {
  if (!mergedEnv[v] || mergedEnv[v].includes('[ref]') || mergedEnv[v].includes('eyJhbGciOi')) {
    missingRequired.push(v);
  }
});

RECOMMENDED_VARS.forEach(v => {
  if (!mergedEnv[v] || mergedEnv[v].includes('[ref]') || mergedEnv[v].includes('gsk_')) {
    missingRecommended.push(v);
  }
});

if (missingRequired.length > 0) {
  const isCI = process.env.VERCEL || process.env.CI || process.env.GITHUB_ACTIONS;
  if (isCI) {
    console.warn(`\n${YELLOW}${BOLD}⚠ CI ENVIRONMENT WARNING: Missing or Placeholder Required Variables detected, bypassing strict exit for CI build.${RESET}`);
    missingRequired.forEach(v => {
      console.warn(`  - ${v}`);
    });
  } else {
    console.error(`\n${RED}${BOLD}✖ ENVIRONMENT ERROR: Missing Required Variables!${RESET}`);
    console.error(`${RED}The following variables must be configured in your .env.local file to run BuggedBrain:${RESET}`);
    missingRequired.forEach(v => {
      console.error(`  - ${BOLD}${v}${RESET}`);
    });
    console.error(`\n${YELLOW}Please copy .env.example to .env.local and fill in valid API keys/database credentials.${RESET}`);
    console.error(`${RED}${BOLD}Startup aborted.${RESET}\n`);
    process.exit(1);
  }
}

if (missingRecommended.length > 0) {
  console.warn(`\n${YELLOW}${BOLD}⚠ ENVIRONMENT WARNING: Missing Recommended Variables!${RESET}`);
  console.warn(`${YELLOW}Some optional integrations/admin capabilities will be disabled without these keys:${RESET}`);
  missingRecommended.forEach(v => {
    console.warn(`  - ${v}`);
  });
  console.warn(`${YELLOW}Tip: Fill these in .env.local when testing advanced copilot features or DB sync triggers.${RESET}\n`);
} else {
  console.log(`\n${GREEN}✔ ENVIRONMENT SANITY SUCCESS: All required and recommended keys detected.${RESET}\n`);
}
