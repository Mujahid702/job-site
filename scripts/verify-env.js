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
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BOLD = '\x1b[1m';

// Parse CLI flags (e.g. --tenant=dev | --tenant=stage | --tenant=prod)
let targetTenant = null;
process.argv.forEach(arg => {
  if (arg.startsWith('--tenant=')) {
    targetTenant = arg.split('=')[1].toLowerCase();
  }
});

// Helper to load variables from a file
function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const cleaned = line.trim();
    if (!cleaned || cleaned.startsWith('#')) return;
    
    const equalIdx = cleaned.indexOf('=');
    if (equalIdx === -1) return;
    
    const key = cleaned.substring(0, equalIdx).trim();
    let val = cleaned.substring(equalIdx + 1).trim();
    
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    
    if (key) vars[key] = val;
  });
  return vars;
}

// Load env files
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envLocalVars = parseEnvFile(envLocalPath);
const mergedEnv = { ...process.env, ...envLocalVars };

// Resolve active tenant
const activeTenant = targetTenant || 
  (mergedEnv.NEXT_PUBLIC_APP_ENV || mergedEnv.APP_ENV || (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')).toLowerCase();

const tenantLabels = {
  dev: `${YELLOW}${BOLD}[DEV TENANT - Unit Testing & Dev]${RESET}`,
  stage: `${MAGENTA}${BOLD}[STAGE TENANT - User Acceptance Testing (UAT)]${RESET}`,
  prod: `${GREEN}${BOLD}[PROD TENANT - Live Production]${RESET}`
};

console.log(`\n${BOLD}==================================================================${RESET}`);
console.log(`${BOLD}[Tenant Environment Verifier] Active: ${tenantLabels[activeTenant] || activeTenant}${RESET}`);
console.log(`${BOLD}==================================================================${RESET}`);

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

const missingRequired = [];
const placeholderVars = [];
const missingRecommended = [];

REQUIRED_VARS.forEach(v => {
  const val = mergedEnv[v];
  if (!val) {
    missingRequired.push(v);
  } else if (val.includes('[ref]') || val.includes('eyJhbGciOi...') || val === 'AIzaSy...') {
    placeholderVars.push(v);
  }
});

RECOMMENDED_VARS.forEach(v => {
  const val = mergedEnv[v];
  if (!val) {
    missingRecommended.push(v);
  } else if (val.includes('[ref]') || val.includes('gsk_...')) {
    placeholderVars.push(v);
  }
});

// Tenant-Specific Validation Rules
const isCI = Boolean(process.env.VERCEL || process.env.CI || process.env.GITHUB_ACTIONS);

if (activeTenant === 'prod' && !isCI) {
  if (placeholderVars.length > 0) {
    console.error(`\n${RED}${BOLD}✖ PRODUCTION TENANT ERROR: Placeholder credentials detected in Production!${RESET}`);
    placeholderVars.forEach(v => console.error(`  - ${RED}${v}${RESET}`));
    console.error(`${RED}Production deployments require live, non-placeholder credentials.${RESET}\n`);
    process.exit(1);
  }

  if (mergedEnv.RAZORPAY_KEY_ID && mergedEnv.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    console.warn(`\n${YELLOW}⚠ PRODUCTION WARNING: Test Razorpay key detected in Production mode.${RESET}`);
  }
}

if (missingRequired.length > 0) {
  if (isCI) {
    console.warn(`\n${YELLOW}${BOLD}⚠ CI/VERCEL BUILD NOTICE: Running on CI/Vercel with partial env vars.${RESET}`);
    missingRequired.forEach(v => console.warn(`  - ${v}`));
  } else {
    console.error(`\n${RED}${BOLD}✖ ENVIRONMENT ERROR: Missing Required Variables for [${activeTenant.toUpperCase()}]!${RESET}`);
    missingRequired.forEach(v => console.error(`  - ${BOLD}${v}${RESET}`));
    console.error(`\n${YELLOW}Refer to .env.${activeTenant}.example to configure your credentials.${RESET}\n`);
    process.exit(1);
  }
} else {
  console.log(`\n${GREEN}✔ TENANT VALIDATION SUCCESS: Required variables verified for [${activeTenant.toUpperCase()}].${RESET}\n`);
}

if (missingRecommended.length > 0 && activeTenant !== 'dev') {
  console.warn(`${YELLOW}⚠ Recommended keys missing for [${activeTenant.toUpperCase()}]: ${missingRecommended.join(', ')}${RESET}\n`);
}
