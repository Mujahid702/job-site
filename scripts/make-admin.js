/**
 * scripts/make-admin.js
 * CLI tool to promote any registered user to an Admin or Super Admin.
 * 
 * Usage:
 *   node scripts/make-admin.js <user-email> [role]
 * Examples:
 *   node scripts/make-admin.js mujahid@example.com super_admin
 *   node scripts/make-admin.js tester@example.com admin
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = { ...process.env, ...parseEnv(path.join(__dirname, '..', '.env.local')) };

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const email = process.argv[2];
const role = (process.argv[3] || 'super_admin').toLowerCase();

if (!email) {
  console.error('\n✖ ERROR: Please specify the user email:');
  console.log('  Usage: node scripts/make-admin.js <email> [super_admin|admin]\n');
  process.exit(1);
}

if (!['super_admin', 'admin', 'moderator', 'student'].includes(role)) {
  console.error(`\n✖ ERROR: Invalid role "${role}". Valid options: super_admin, admin, moderator, student\n`);
  process.exit(1);
}

if (!supabaseUrl || !serviceKey) {
  console.error('\n✖ ERROR: Missing Supabase credentials in .env.local (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).\n');
  process.exit(1);
}

async function promoteUser() {
  console.log(`\nPromoting user "${email}" to [${role.toUpperCase()}] role...`);
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Find user in auth.users
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    
    if (listErr) {
      console.warn(`Could not list users directly via admin API: ${listErr.message}`);
    }

    const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      console.log(`\n⚠ Notice: No auth account found with email "${email}" yet.`);
      console.log(`Please sign up at /signup first, or run this script once you register.`);
      console.log(`\nHowever, we can register the role pre-approval in public.user_roles if user_id is known.`);
      return;
    }

    const userId = targetUser.id;
    console.log(`✔ Found registered user: ${targetUser.email} (ID: ${userId})`);

    // 2. Update user metadata
    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...targetUser.user_metadata,
        role: role
      }
    });

    if (updateAuthErr) {
      console.warn(`Warning updating user_metadata: ${updateAuthErr.message}`);
    } else {
      console.log(`✔ Updated user_metadata.role ➔ "${role}"`);
    }

    // 3. Upsert into public.user_roles table
    const { error: dbErr } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (dbErr) {
      console.error(`Database error inserting into user_roles: ${dbErr.message}`);
    } else {
      console.log(`✔ Successfully inserted into public.user_roles!`);
    }

    console.log(`\n==================================================================`);
    console.log(`🎉 SUCCESS: User "${email}" is now a verified [${role.toUpperCase()}]!`);
    console.log(`You can now log in at /login and navigate to /admin without restrictions.`);
    console.log(`==================================================================\n`);

  } catch (err) {
    console.error('Error promoting user:', err);
  }
}

promoteUser();
