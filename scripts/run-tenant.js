/**
 * scripts/run-tenant.js
 * Cross-platform tenant development launcher for Dev, Stage, and Prod profiles.
 * Usage: node scripts/run-tenant.js [dev|stage|prod] [command]
 */

const { spawn } = require('child_process');

const tenant = (process.argv[2] || 'dev').toLowerCase();
const action = process.argv[3] || 'dev'; // 'dev' | 'build' | 'start'

if (!['dev', 'stage', 'prod'].includes(tenant)) {
  console.error(`Invalid tenant: "${tenant}". Must be one of: dev, stage, prod`);
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🚀 Launching BuggedBrain in [${tenant.toUpperCase()} TENANT] mode...`);
console.log(`Command: next ${action}`);
console.log(`======================================================\n`);

const env = {
  ...process.env,
  NEXT_PUBLIC_APP_ENV: tenant,
  APP_ENV: tenant
};

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['next', action], {
  env,
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
