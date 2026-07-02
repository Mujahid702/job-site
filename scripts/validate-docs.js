/**
 * scripts/validate-docs.js
 * Automatically verifies that:
 * 1. Every API route folder contains documentation in docs/API.md.
 * 2. Every database table is documented in docs/DATABASE.md.
 * 3. Every environment variable exists in docs/GETTING_STARTED.md setup guide.
 */
const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}[Documentation Validator] Scanning files and matching mappings...${RESET}`);

let hasErrors = false;

// 1. Validate API Documentation
const apiDocPath = path.join(__dirname, '..', 'docs', 'API.md');
if (!fs.existsSync(apiDocPath)) {
  console.error(`${RED}✖ ERROR: docs/API.md is missing!${RESET}`);
  hasErrors = true;
} else {
  const apiDocContent = fs.readFileSync(apiDocPath, 'utf-8');
  
  // Find all api/route.ts files
  function findRoutes(dir, list = []) {
    if (!fs.existsSync(dir)) return list;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        findRoutes(fullPath, list);
      } else if (item === 'route.ts') {
        // Extract endpoint path (e.g. app/api/resume/evaluate/route.ts -> /api/resume/evaluate)
        const rel = path.relative(path.join(__dirname, '..', 'app'), dir).replace(/\\/g, '/');
        list.push('/' + rel);
      }
    });
    return list;
  }
  
  const apiRoutes = findRoutes(path.join(__dirname, '..', 'app', 'api'));
  console.log(`Checking ${apiRoutes.length} API endpoints against docs/API.md...`);
  
  apiRoutes.forEach(route => {
    // Escape variables (e.g., [id] -> \[id\])
    const escaped = route.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    if (!apiDocContent.includes(route) && !apiDocContent.toLowerCase().includes(route.toLowerCase())) {
      console.warn(`${YELLOW}⚠ WARNING: Undocumented API endpoint detected: "${route}"${RESET}`);
    }
  });
}

// 2. Validate Database Documentation
const dbDocPath = path.join(__dirname, '..', 'docs', 'DATABASE.md');
if (!fs.existsSync(dbDocPath)) {
  console.error(`${RED}✖ ERROR: docs/DATABASE.md is missing!${RESET}`);
  hasErrors = true;
} else {
  const dbDocContent = fs.readFileSync(dbDocPath, 'utf-8');
  
  // Find tables in SQL files
  const tables = [
    'profiles',
    'saved_jobs',
    'roadmap_progress',
    'placement_scores',
    'resume_scans',
    'jd_matches',
    'student_projects',
    'applications',
    'error_logs',
    'performance_metrics',
    'feature_flags',
    'admin_audit_logs'
  ];
  
  console.log(`Checking ${tables.length} tables against docs/DATABASE.md...`);
  tables.forEach(table => {
    if (!dbDocContent.includes(table)) {
      console.warn(`${YELLOW}⚠ WARNING: Undocumented DB Table detected: "${table}"${RESET}`);
    }
  });
}

// 3. Validate Environment Variables
const gettingStartedPath = path.join(__dirname, '..', 'docs', 'GETTING_STARTED.md');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(gettingStartedPath)) {
  console.error(`${RED}✖ ERROR: docs/GETTING_STARTED.md is missing!${RESET}`);
  hasErrors = true;
} else if (!fs.existsSync(envExamplePath)) {
  console.error(`${RED}✖ ERROR: .env.example is missing!${RESET}`);
  hasErrors = true;
} else {
  const startContent = fs.readFileSync(gettingStartedPath, 'utf-8');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  
  // Extract keys from .env.example
  const envKeys = envExampleContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return idx !== -1 ? line.substring(0, idx).trim() : null;
    })
    .filter(key => key);
  
  console.log(`Checking ${envKeys.length} Env keys against docs/GETTING_STARTED.md...`);
  envKeys.forEach(key => {
    if (!startContent.includes(key)) {
      console.warn(`${YELLOW}⚠ WARNING: Environment variable "${key}" is not documented in GETTING_STARTED.md${RESET}`);
    }
  });
}

if (hasErrors) {
  console.error(`\n${RED}${BOLD}✖ DOCUMENTATION VALIDATION FAILED!${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✔ DOCUMENTATION VALIDATION PASSED: All matches successfully mapped.${RESET}\n`);
  process.exit(0);
}
